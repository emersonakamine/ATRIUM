import { EventEmitter } from 'events';
import { admin } from './supabase';

export type MessageStatus =
  | 'queued'
  | 'sending'
  | 'sent'
  | 'failed'
  | 'paused'
  | 'cancelled';

export interface MessageJob {
  id: string;
  broadcastId: string;
  guestId: string;
  guestName: string;
  phone: string;
  message: string;
  publicCode: string;
  status: MessageStatus;
  attempts: number;
  maxAttempts: number;
  lastError?: string;
  createdAt: string;
  sentAt?: string;
  seq?: number;
}

export interface BroadcastProgress {
  broadcastId: string;
  status: 'pending' | 'running' | 'paused' | 'completed' | 'cancelled';
  total: number;
  sent: number;
  failed: number;
  currentGuest?: string;
  startedAt?: string;
  completedAt?: string;
}

type SupabaseResult<T> = { data: T | null; error: { message?: string } | null };

function must<T>(res: SupabaseResult<T>, ctx: string): T {
  if (res.error) {
    throw new Error(`${ctx}: ${res.error.message || JSON.stringify(res.error)}`);
  }
  return res.data as T;
}

/**
 * Fila de mensagens usando Supabase (Postgres)
 *
 * - Jobs ficam na tabela 'message_queue'
 * - Progresso fica em 'broadcasts'
 * - Delay configurável por mensagem
 * - Retry automático em caso de falha
 * - Acesso APENAS via service_role (backend) — RLS não expõe nada ao cliente
 */
export class MessageQueue extends EventEmitter {
  private processing = false;
  private paused = false;
  private processingInterval: NodeJS.Timeout | null = null;
  private delayMin = 15000; // 15s padrão
  private delayMax = 45000; // 45s padrão

  constructor() {
    super();
  }

  setDelay(minSec: number, maxSec: number) {
    this.delayMin = minSec * 1000;
    this.delayMax = maxSec * 1000;
  }

  /**
   * Criar broadcast no Supabase
   */
  async createBroadcast(params: {
    eventId: string;
    eventName: string;
    title: string;
    guests: { id: string; name: string; phone: string; publicCode: string }[];
    messageTemplate: string;
    createdBy: string;
  }): Promise<string> {
    const broadcast = must(
      await admin
        .from('broadcasts')
        .insert({
          eventId: params.eventId,
          eventName: params.eventName,
          title: params.title,
          status: 'pending',
          totalGuests: params.guests.length,
          sentCount: 0,
          failedCount: 0,
          delayMin: Math.round(this.delayMin / 1000),
          delayMax: Math.round(this.delayMax / 1000),
          messageTemplate: params.messageTemplate,
          createdAt: new Date().toISOString(),
          createdBy: params.createdBy,
        })
        .select('id')
        .single(),
      'createBroadcast'
    ) as { id: string };

    const broadcastId = broadcast.id;

    // Criar jobs para cada convidado
    const jobs = params.guests.map((guest, i) => {
      const message = params.messageTemplate
        .replace(/\{\{nome\}\}/g, guest.name)
        .replace(/\{\{evento\}\}/g, params.eventName)
        .replace(/\{\{codigo\}\}/g, guest.publicCode);

      return {
        broadcastId,
        guestId: guest.id,
        guestName: guest.name,
        phone: guest.phone,
        publicCode: guest.publicCode,
        message,
        status: 'queued',
        attempts: 0,
        maxAttempts: 3,
        createdAt: new Date().toISOString(),
        seq: i, // Para manter a ordem
      };
    });

    must(
      await admin.from('message_queue').insert(jobs),
      'createBroadcast/jobs'
    );

    return broadcastId;
  }

  /**
   * Iniciar processamento da fila
   */
  async startProcessing(
    sendFn: (job: MessageJob) => Promise<{ success: boolean; error?: string }>
  ): Promise<void> {
    if (this.processing) return;

    this.processing = true;
    this.paused = false;

    // Processar a cada 2 segundos
    this.processingInterval = setInterval(async () => {
      if (this.paused) return;

      try {
        // Buscar próximo job pendente
        const rows = must(
          await admin
            .from('message_queue')
            .select('*')
            .eq('status', 'queued')
            .order('seq', { ascending: true })
            .limit(1),
          'queue/next'
        );

        if (!rows || rows.length === 0) {
          // Verificar se broadcast terminou
          this.checkCompletion();
          return;
        }

        const job = rows[0] as MessageJob;

        // Verificar delay desde último envio
        const lastSent = await this.getLastSentTime(job.broadcastId);
        const timeSinceLastSent = Date.now() - lastSent;
        if (timeSinceLastSent < this.delayMin) {
          return; // Ainda não pode enviar
        }

        // Marcar como sending
        must(
          await admin
            .from('message_queue')
            .update({ status: 'sending' })
            .eq('id', job.id),
          'queue/mark-sending'
        );
        this.emit('progress', {
          broadcastId: job.broadcastId,
          currentGuest: job.guestName,
        });

        // Enviar
        const result = await sendFn(job);

        if (result.success) {
          must(
            await admin
              .from('message_queue')
              .update({ status: 'sent', sentAt: new Date().toISOString() })
              .eq('id', job.id),
            'queue/mark-sent'
          );
          await this.incrementCounter(job.broadcastId, 'sent');
        } else {
          job.attempts++;
          if (job.attempts >= job.maxAttempts) {
            must(
              await admin
                .from('message_queue')
                .update({ status: 'failed', lastError: result.error })
                .eq('id', job.id),
              'queue/mark-failed'
            );
            await this.incrementCounter(job.broadcastId, 'failed');
            this.emit('job_failed', { ...job, error: result.error });
          } else {
            must(
              await admin
                .from('message_queue')
                .update({
                  status: 'queued',
                  attempts: job.attempts,
                  lastError: result.error,
                })
                .eq('id', job.id),
              'queue/requeue'
            );
          }
        }
      } catch (err: any) {
        console.error('Queue processing error:', err);
      }
    }, 2000);
  }

  /**
   * Pausar fila
   */
  async pause(broadcastId?: string): Promise<void> {
    if (broadcastId) {
      must(
        await admin
          .from('message_queue')
          .update({ status: 'paused' })
          .eq('broadcastId', broadcastId)
          .eq('status', 'queued'),
        'queue/pause-jobs'
      );
      must(
        await admin
          .from('broadcasts')
          .update({ status: 'paused' })
          .eq('id', broadcastId),
        'queue/pause-broadcast'
      );
    } else {
      this.paused = true;
    }
    this.emit('queue_paused', { broadcastId });
  }

  /**
   * Retomar fila
   */
  async resume(broadcastId?: string): Promise<void> {
    if (broadcastId) {
      must(
        await admin
          .from('message_queue')
          .update({ status: 'queued' })
          .eq('broadcastId', broadcastId)
          .eq('status', 'paused'),
        'queue/resume-jobs'
      );
      must(
        await admin
          .from('broadcasts')
          .update({ status: 'running' })
          .eq('id', broadcastId),
        'queue/resume-broadcast'
      );
    } else {
      this.paused = false;
    }
    this.emit('queue_resumed', { broadcastId });
  }

  /**
   * Cancelar broadcast
   */
  async cancel(broadcastId: string): Promise<void> {
    must(
      await admin
        .from('message_queue')
        .update({ status: 'cancelled' })
        .eq('broadcastId', broadcastId)
        .in('status', ['queued', 'paused']),
      'queue/cancel-jobs'
    );
    must(
      await admin
        .from('broadcasts')
        .update({ status: 'cancelled' })
        .eq('id', broadcastId),
      'queue/cancel-broadcast'
    );
    this.emit('broadcast_cancelled', { broadcastId });
  }

  /**
   * Parar processamento
   */
  stop(): void {
    this.processing = false;
    this.paused = false;
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
  }

  // ─── Helpers ─────────────────────────────────────────────

  private async getLastSentTime(broadcastId: string): Promise<number> {
    const rows = must(
      await admin
        .from('message_queue')
        .select('sentAt')
        .eq('broadcastId', broadcastId)
        .eq('status', 'sent')
        .order('sentAt', { ascending: false })
        .limit(1),
      'queue/last-sent'
    );

    if (!rows || rows.length === 0) return 0;

    const sentAt = rows[0].sentAt;
    if (!sentAt) return 0;
    const parsed = Date.parse(String(sentAt));
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  private async incrementCounter(
    broadcastId: string,
    field: 'sent' | 'failed'
  ): Promise<void> {
    const column = field === 'sent' ? 'sentCount' : 'failedCount';

    const current = await admin
      .from('broadcasts')
      .select(column)
      .eq('id', broadcastId)
      .maybeSingle();

    if (current.error || !current.data) return;

    const nextValue = ((current.data[column] as number) || 0) + 1;

    must(
      await admin
        .from('broadcasts')
        .update({ [column]: nextValue })
        .eq('id', broadcastId),
      `queue/increment-${field}`
    );
  }

  private async checkCompletion(): Promise<void> {
    const rows = must(
      await admin
        .from('message_queue')
        .select('id')
        .in('status', ['queued', 'sending'])
        .limit(1),
      'queue/completion-check'
    );

    if ((!rows || rows.length === 0) && this.processing) {
      // Todos os jobs processados
      this.emit('all_complete');
    }
  }
}

export const messageQueue = new MessageQueue();
