import { EventEmitter } from 'events';
import { db } from '../src/services/firebase';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs,
  onSnapshot,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';

export type MessageStatus = 'queued' | 'sending' | 'sent' | 'failed' | 'paused' | 'cancelled';

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
  createdAt: any;
  sentAt?: any;
}

export interface BroadcastProgress {
  broadcastId: string;
  status: 'pending' | 'running' | 'paused' | 'completed' | 'cancelled';
  total: number;
  sent: number;
  failed: number;
  currentGuest?: string;
  startedAt?: any;
  completedAt?: any;
}

/**
 * Fila de mensagens usando Firestore (gratuito, sem Redis)
 * 
 * - Jobs ficam na coleção 'messageQueue'
 * - Progresso fica em 'broadcasts'
 * - Delay configurável por mensagem
 * - Retry automático em caso de falha
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
   * Criar broadcast no Firestore
   */
  async createBroadcast(params: {
    eventId: string;
    eventName: string;
    title: string;
    guests: { id: string; name: string; phone: string; publicCode: string }[];
    messageTemplate: string;
    createdBy: string;
  }): Promise<string> {
    const broadcastRef = await addDoc(collection(db, 'broadcasts'), {
      eventId: params.eventId,
      eventName: params.eventName,
      title: params.title,
      status: 'pending',
      totalGuests: params.guests.length,
      sentCount: 0,
      failedCount: 0,
      delayMin: this.delayMin / 1000,
      delayMax: this.delayMax / 1000,
      messageTemplate: params.messageTemplate,
      createdAt: serverTimestamp(),
      createdBy: params.createdBy,
    });

    const broadcastId = broadcastRef.id;

    // Criar jobs para cada convidado
    for (let i = 0; i < params.guests.length; i++) {
      const guest = params.guests[i];
      const message = params.messageTemplate
        .replace(/\{\{nome\}\}/g, guest.name)
        .replace(/\{\{evento\}\}/g, params.eventName)
        .replace(/\{\{codigo\}\}/g, guest.publicCode);

      await addDoc(collection(db, 'messageQueue'), {
        broadcastId,
        guestId: guest.id,
        guestName: guest.name,
        phone: guest.phone,
        publicCode: guest.publicCode,
        message,
        status: 'queued',
        attempts: 0,
        maxAttempts: 3,
        createdAt: serverTimestamp(),
        order: i, // Para manter a ordem
      });
    }

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
        const q = query(
          collection(db, 'messageQueue'),
          where('status', '==', 'queued'),
          orderBy('order'),
          limit(1)
        );

        const snapshot = await getDocs(q);
        if (snapshot.empty) {
          // Verificar se broadcast terminou
          this.checkCompletion();
          return;
        }

        const jobDoc = snapshot.docs[0];
        const job = { id: jobDoc.id, ...jobDoc.data() } as MessageJob;

        // Verificar delay desde último envio
        const lastSent = await this.getLastSentTime(job.broadcastId);
        const timeSinceLastSent = Date.now() - lastSent;
        if (timeSinceLastSent < this.delayMin) {
          return; // Ainda não pode enviar
        }

        // Marcar como sending
        await updateDoc(doc(db, 'messageQueue', job.id), { status: 'sending' });
        this.emit('progress', { broadcastId: job.broadcastId, currentGuest: job.guestName });

        // Enviar
        const result = await sendFn(job);

        if (result.success) {
          await updateDoc(doc(db, 'messageQueue', job.id), { 
            status: 'sent',
            sentAt: serverTimestamp()
          });
          await this.incrementCounter(job.broadcastId, 'sent');
        } else {
          job.attempts++;
          if (job.attempts >= job.maxAttempts) {
            await updateDoc(doc(db, 'messageQueue', job.id), { 
              status: 'failed',
              lastError: result.error 
            });
            await this.incrementCounter(job.broadcastId, 'failed');
            this.emit('job_failed', { ...job, error: result.error });
          } else {
            await updateDoc(doc(db, 'messageQueue', job.id), { 
              status: 'queued',
              attempts: job.attempts,
              lastError: result.error
            });
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
      const q = query(
        collection(db, 'messageQueue'),
        where('broadcastId', '==', broadcastId),
        where('status', '==', 'queued')
      );
      const snapshot = await getDocs(q);
      for (const docSnap of snapshot.docs) {
        await updateDoc(doc(db, 'messageQueue', docSnap.id), { status: 'paused' });
      }
      await updateDoc(doc(db, 'broadcasts', broadcastId), { status: 'paused' });
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
      const q = query(
        collection(db, 'messageQueue'),
        where('broadcastId', '==', broadcastId),
        where('status', '==', 'paused')
      );
      const snapshot = await getDocs(q);
      for (const docSnap of snapshot.docs) {
        await updateDoc(doc(db, 'messageQueue', docSnap.id), { status: 'queued' });
      }
      await updateDoc(doc(db, 'broadcasts', broadcastId), { status: 'running' });
    } else {
      this.paused = false;
    }
    this.emit('queue_resumed', { broadcastId });
  }

  /**
   * Cancelar broadcast
   */
  async cancel(broadcastId: string): Promise<void> {
    const q = query(
      collection(db, 'messageQueue'),
      where('broadcastId', '==', broadcastId),
      where('status', 'in', ['queued', 'paused'])
    );
    const snapshot = await getDocs(q);
    for (const docSnap of snapshot.docs) {
      await updateDoc(doc(db, 'messageQueue', docSnap.id), { status: 'cancelled' });
    }
    await updateDoc(doc(db, 'broadcasts', broadcastId), { status: 'cancelled' });
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
    const q = query(
      collection(db, 'messageQueue'),
      where('broadcastId', '==', broadcastId),
      where('status', '==', 'sent'),
      orderBy('sentAt', 'desc'),
      limit(1)
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) return 0;
    
    const lastSent = snapshot.docs[0].data().sentAt;
    if (lastSent?.toDate) {
      return lastSent.toDate().getTime();
    }
    return 0;
  }

  private async incrementCounter(broadcastId: string, field: 'sent' | 'failed'): Promise<void> {
    const broadcastRef = doc(db, 'broadcasts', broadcastId);
    const broadcastSnap = await getDocs(query(collection(db, 'broadcasts'), where('__name__', '==', broadcastId)));
    
    if (!broadcastSnap.empty) {
      const current = broadcastSnap.docs[0].data();
      const update: any = {};
      update[field === 'sent' ? 'sentCount' : 'failedCount'] = (current[field === 'sent' ? 'sentCount' : 'failedCount'] || 0) + 1;
      await updateDoc(broadcastRef, update);
    }
  }

  private async checkCompletion(): Promise<void> {
    const q = query(
      collection(db, 'messageQueue'),
      where('status', 'in', ['queued', 'sending'])
    );
    const snapshot = await getDocs(q);
    
    if (snapshot.empty && this.processing) {
      // Todos os jobs processados
      this.emit('all_complete');
    }
  }
}

export const messageQueue = new MessageQueue();
