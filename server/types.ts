// Simplified types - only Baileys WhatsApp

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
