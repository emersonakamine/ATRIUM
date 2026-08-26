import { EventEmitter } from 'events';
import { ChannelConfig, Broadcast } from '../types';
import { messageQueue, MessageJob } from './queue';

/**
 * MessageService simplificado - apenas Baileys (WhatsApp grátis)
 * 
 * - Fila no Firestore (sem Redis)
 * - Delay configurável
 * - Retry automático
 * - Alertas ao organizador em caso de falha
 */
export class MessageService extends EventEmitter {
  private channelConfig: ChannelConfig;
  private broadcasts: Map<string, Broadcast> = new Map();

  constructor(config: ChannelConfig) {
    super();
    this.channelConfig = config;
    
    // Escutar eventos da fila
    messageQueue.on('job_failed', (data) => this.emit('alert', data));
    messageQueue.on('progress', (data) => this.emit('progress', data));
    messageQueue.on('all_complete', () => this.emit('complete'));
  }

  /**
   * Atualizar configuração
   */
  updateConfig(newConfig: Partial<ChannelConfig>): void {
    this.channelConfig = { ...this.channelConfig, ...newConfig };
    
    if (newConfig.whatsapp) {
      messageQueue.setDelay(
        newConfig.whatsapp.delayMin,
        newConfig.whatsapp.delayMax
      );
    }
  }

  /**
   * Verificar se Baileys está configurado
   */
  isConfigured(): boolean {
    return !!this.channelConfig.whatsapp?.serverUrl;
  }

  /**
   * Criar broadcast
   */
  async createBroadcast(params: {
    eventId: string;
    eventName: string;
    title: string;
    guests: { id: string; name: string; phone: string; publicCode: string }[];
    messageTemplate: string;
    createdBy: string;
  }): Promise<string> {
    const broadcastId = await messageQueue.createBroadcast(params);
    
    this.broadcasts.set(broadcastId, {
      id: broadcastId,
      eventId: params.eventId,
      eventName: params.eventName,
      title: params.title,
      status: 'pending',
      channel: 'whatsapp',
      totalGuests: params.guests.length,
      sentCount: 0,
      failedCount: 0,
      delayMin: this.channelConfig.whatsapp?.delayMin || 15,
      delayMax: this.channelConfig.whatsapp?.delayMax || 45,
      messageTemplate: params.messageTemplate,
      createdAt: new Date().toISOString(),
      createdBy: params.createdBy,
    });

    return broadcastId;
  }

  /**
   * Iniciar envio
   */
  async startBroadcast(broadcastId: string): Promise<void> {
    const broadcast = this.broadcasts.get(broadcastId);
    if (!broadcast) throw new Error('Broadcast não encontrado');

    if (!this.isConfigured()) {
      throw new Error('Servidor Baileys não configurado. Configure em Configurações > Canais.');
    }

    broadcast.status = 'running';
    this.broadcasts.set(broadcastId, broadcast);

    await messageQueue.startProcessing(async (job) => {
      return await this.sendViaBaileys(job);
    });
  }

  /**
   * Enviar mensagem via Baileys Server Pro
   */
  private async sendViaBaileys(job: MessageJob): Promise<{ success: boolean; error?: string }> {
    const serverUrl = this.channelConfig.whatsapp?.serverUrl;
    const sessionName = this.channelConfig.whatsapp?.sessionName || 'default';

    try {
      // Usa proxy interno (servidor Node → Baileys)
      const response = await fetch(`${serverUrl}/api/sessions/${sessionName}/send-message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          number: job.phone,
          message: job.message,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        return { success: true, messageId: data.key?.id };
      }

      return { 
        success: false, 
        error: data.message || `Erro HTTP ${response.status}` 
      };
    } catch (err: any) {
      return { 
        success: false, 
        error: `Servidor Baileys indisponível: ${err.message}` 
      };
    }
  }

  /**
   * Pausar broadcast
   */
  pauseBroadcast(broadcastId: string): void {
    messageQueue.pause(broadcastId);
    const broadcast = this.broadcasts.get(broadcastId);
    if (broadcast) {
      broadcast.status = 'paused';
      this.broadcasts.set(broadcastId, broadcast);
    }
  }

  /**
   * Retomar broadcast
   */
  resumeBroadcast(broadcastId: string): void {
    messageQueue.resume(broadcastId);
    const broadcast = this.broadcasts.get(broadcastId);
    if (broadcast) {
      broadcast.status = 'running';
      this.broadcasts.set(broadcastId, broadcast);
    }
  }

  /**
   * Cancelar broadcast
   */
  cancelBroadcast(broadcastId: string): void {
    messageQueue.cancel(broadcastId);
    const broadcast = this.broadcasts.get(broadcastId);
    if (broadcast) {
      broadcast.status = 'cancelled';
      this.broadcasts.set(broadcastId, broadcast);
    }
  }

  /**
   * Verificar status do servidor Baileys
   */
  async checkBaileysStatus(): Promise<{ online: boolean; error?: string }> {
    const serverUrl = this.channelConfig.whatsapp?.serverUrl;
    if (!serverUrl) return { online: false, error: 'URL do servidor não configurada' };

    try {
      const response = await fetch(`${serverUrl}/api/sessions/${this.channelConfig.whatsapp?.sessionName || 'default'}/status`);
      if (response.ok) {
        const data = await response.json();
        return { online: data.status === 'open' };
      }
      return { online: false, error: `Servidor retornou ${response.status}` };
    } catch (err: any) {
      return { online: false, error: `Não foi possível conectar: ${err.message}` };
    }
  }
}

// Singleton
let messageService: MessageService | null = null;

export function getMessageService(config?: ChannelConfig): MessageService {
  if (!messageService && config) {
    messageService = new MessageService(config);
  }
  if (!messageService) {
    throw new Error('MessageService não inicializado.');
  }
  return messageService;
}
