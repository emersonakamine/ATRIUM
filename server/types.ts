// Tipos do backend (server/)

export interface ChannelConfig {
  whatsapp: {
    enabled: boolean;
    serverUrl: string;
    sessionName: string;
    delayMin: number;
    delayMax: number;
    maxRetries: number;
  };
}

export interface Broadcast {
  id: string;
  eventId: string;
  eventName: string;
  title: string;
  status: 'pending' | 'running' | 'paused' | 'completed' | 'cancelled';
  channel: string;
  totalGuests: number;
  sentCount: number;
  failedCount: number;
  delayMin: number;
  delayMax: number;
  messageTemplate: string;
  createdAt: string;
  createdBy: string;
}
