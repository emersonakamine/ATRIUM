import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { getMessageService } from './server/message-service';
import { ChannelConfig } from './server/types';
import { admin } from './server/supabase';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3002;

  // JSON middleware with large limit for Base64 QR Code images
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // CORS: permite o frontend no Cloudflare Pages chamar a API na VPS
  // CORS_ORIGINS="https://bp-eventos.pages.dev,https://seu-dominio.com" (ou "*")
  const corsOrigins = (process.env.CORS_ORIGINS || '*')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    const allow =
      corsOrigins.includes('*') ||
      (origin && corsOrigins.includes(origin));
    if (allow && origin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Vary', 'Origin');
      res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
      res.setHeader('Access-Control-Max-Age', '86400');
    }
    if (req.method === 'OPTIONS') {
      res.status(204).end();
      return;
    }
    next();
  });

  // Initialize Gemini AI Client (Lazy / Safe)
  let genAiClient: GoogleGenAI | null = null;
  const getGenAi = () => {
    if (!genAiClient) {
      const key = process.env.GEMINI_API_KEY;
      if (key) {
        genAiClient = new GoogleGenAI({ apiKey: key });
      } else {
        genAiClient = new GoogleGenAI({});
      }
    }
    return genAiClient;
  };

  // 1. Health Endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // 2. Gemini AI Concierge API Endpoint
  app.post('/api/gemini/concierge', async (req, res) => {
    try {
      const { eventTitle, eventLocation, aiConfig, userMessage, chatHistory } = req.body;

      if (!userMessage) {
        return res.status(400).json({ error: 'Mensagem do usuário é obrigatória.' });
      }

      // Build rich system instruction from the event's training data
      const systemInstruction = `
Você é o Concierge Virtual e Assistente Oficial de IA do evento "${eventTitle || 'BP Eventos'}".
Seu nome é "${aiConfig?.botName || 'Concierge BP'}".
Seu tom de voz deve ser: ${aiConfig?.tone || 'formal_vip'}.

BASE DE CONHECIMENTO DO EVENTO:
- Localização & Espaço: ${eventLocation || ''}
- Endereço Completo: ${aiConfig?.venueAddress || ''}
- Link direto no Google Maps: ${aiConfig?.googleMapsUrl || ''}
- Link no Waze: ${aiConfig?.wazeUrl || ''}
- Traje / Dress Code: ${aiConfig?.dressCode || 'Esporte Fino'}
- Estacionamento / Valet: ${aiConfig?.parkingInfo || 'Estacionamento conveniado no local.'}
- Cronograma e Horários: ${aiConfig?.scheduleDetails || ''}
- Benefícios VIP: ${aiConfig?.vipPerks || ''}
- Alimentação & Bebidas: ${aiConfig?.foodAndDrinksInfo || ''}
- Contato de Suporte / Emergência: ${aiConfig?.emergencyContact || ''}
- Instruções Especiais / QR Code: ${aiConfig?.customKnowledgeBase || 'Apresente seu QR Code na tela do celular ao chegar na portaria.'}

PERGUNTAS E RESPOSTAS FREQUENTES (FAQS):
${(aiConfig?.faqs || [])
  .map((f: any) => `P: ${f.question}\nR: ${f.answer}`)
  .join('\n\n')}

DIRETRIZES DE RESPOSTA:
1. Responda em Português do Brasil com excelente cortesia, formatação limpa no estilo WhatsApp (use *negrito* para termos-chave e emojis amigáveis).
2. Se o usuário perguntar onde fica, COMO CHEGAR, ou pedir localização, SEMPRE forneça o endereço completo e o link do Google Maps: ${aiConfig?.googleMapsUrl || ''}.
3. Se o usuário perguntar sobre QR Code ou entrada, explique que basta abrir o link no celular e apresentar na portaria.
4. Seja conciso, claro e objetivo. Nunca invente dados que não constem na base. Se não souber, oriente a procurar a recepção.
`;

      try {
        const ai = getGenAi();
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: userMessage,
          config: {
            systemInstruction,
            temperature: 0.3,
            maxOutputTokens: 500,
          },
        });

        const replyText = response.text || 'Olá! Como posso ajudar com as informações do evento?';
        return res.json({ reply: replyText });
      } catch (geminiErr: any) {
        console.warn('Gemini API call warning, using knowledge fallback:', geminiErr?.message);
        
        // Contextual Fallback Response
        const p = (userMessage || '').toLowerCase();
        let fallback = `Olá! Sou o assistente do *${eventTitle}*. `;
        if (p.includes('onde') || p.includes('local') || p.includes('endereço') || p.includes('maps')) {
          fallback = `📍 O *${eventTitle}* será em:\n\n🏢 *${eventLocation}*\n📮 ${aiConfig?.venueAddress}\n\n🗺️ *Google Maps:* ${aiConfig?.googleMapsUrl}\n🚗 *Waze:* ${aiConfig?.wazeUrl || ''}`;
        } else if (p.includes('estacionamento') || p.includes('valet')) {
          fallback = `🚗 *Estacionamento:*\n${aiConfig?.parkingInfo || 'Serviço de valet disponível na entrada principal.'}`;
        } else if (p.includes('traje') || p.includes('roupa')) {
          fallback = `👔 *Traje Recomendado:*\n${aiConfig?.dressCode || 'Esporte Fino / Social.'}`;
        } else if (p.includes('qr') || p.includes('entrada') || p.includes('ingresso')) {
          fallback = `🎫 *Entrada no Evento:*\nApresente o QR Code do seu convite no celular diretamente na portaria.`;
        } else {
          fallback += aiConfig?.customKnowledgeBase || 'Estamos à disposição na recepção para esclarecer qualquer dúvida!';
        }

        return res.json({ reply: fallback });
      }
    } catch (error: any) {
      console.error('Concierge endpoint error:', error);
      res.status(500).json({ error: error.message || 'Erro interno no assistente' });
    }
  });

  // 3. Robust WhatsApp Dispatch Proxy Endpoint (Handles Z-API and Evolution API)
  app.post('/api/dispatch/whatsapp', async (req, res) => {
    try {
      const {
        gatewayUrl,
        gatewayToken,
        gatewayInstance,
        zapiInstanceId,
        zapiToken,
        zapiClientToken,
        phone,
        message,
        imageDataUrl,
        format
      } = req.body;

      // Fallback: usa Evolution API do .env quando o body não traz config
      const envEvolutionUrl = process.env.EVOLUTION_URL || '';
      const envEvolutionInstance = process.env.EVOLUTION_INSTANCE || 'bp-eventos';
      const envEvolutionKey = process.env.EVOLUTION_API_KEY || '';
      const effGatewayUrl = gatewayUrl || (envEvolutionUrl ? `${envEvolutionUrl}/message/sendText` : '');
      const effGatewayToken = gatewayToken || envEvolutionKey;
      const effGatewayInstance = gatewayInstance || envEvolutionInstance;

      if (!effGatewayUrl && (!zapiInstanceId || !zapiToken)) {
        return res.status(400).json({ success: false, error: 'Configuração do Gateway não informada. Preencha os campos da Z-API ou Evolution API.' });
      }
      if (!phone) {
        return res.status(400).json({ success: false, error: 'Telefone do destinatário não informado' });
      }

      // Format clean phone with DDI 55 if needed
      let cleanPhone = String(phone).replace(/\D/g, '');
      if (cleanPhone.length === 10 || cleanPhone.length === 11) {
        cleanPhone = `55${cleanPhone}`;
      }

      const isImage = format === 'card_image' && !!imageDataUrl;

      // Check if it's Z-API
      const isZApi = !!(zapiInstanceId && zapiToken) || (effGatewayUrl && effGatewayUrl.includes('z-api.io'));
      const isEvolution = !isZApi && (effGatewayUrl && (effGatewayUrl.includes('/message/') || effGatewayUrl.includes('evolution') || effGatewayUrl.includes('8081') || !effGatewayUrl.includes('send-')));

      if (isZApi) {
        let instanceId = (zapiInstanceId || '').trim();
        let token = (zapiToken || '').trim();
        let clientToken = (zapiClientToken || effGatewayToken || '').trim();

        // If instanceId or token were not provided separately, parse from gatewayUrl
        if ((!instanceId || !token) && effGatewayUrl) {
          const match = effGatewayUrl.match(/\/instances\/([^\/]+)\/token\/([^\/]+)/);
          if (match) {
            instanceId = instanceId || match[1];
            token = token || match[2];
          }
        }

        if (!instanceId || !token) {
          return res.status(400).json({
            success: false,
            error: 'ID da Instância e Token da Instância da Z-API são obrigatórios.',
          });
        }

        const endpoint = isImage ? 'send-image' : 'send-text';
        const targetUrl = `https://api.z-api.io/instances/${instanceId}/token/${token}/${endpoint}`;

        let payload: any = {};
        if (isImage) {
          payload = {
            phone: cleanPhone,
            image: imageDataUrl,
            caption: message || '',
          };
        } else {
          payload = {
            phone: cleanPhone,
            message: message || '',
          };
        }

        let headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };

        if (clientToken && clientToken.length > 3) {
          headers['Client-Token'] = clientToken;
        }

        let apiRes = await fetch(targetUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
        });

        let resText = await apiRes.text();

        // Se retornar erro de client-token e enviamos um header, tenta uma vez sem header
        if (!apiRes.ok && headers['Client-Token'] && resText.includes('client-token is not configured')) {
          delete headers['Client-Token'];
          apiRes = await fetch(targetUrl, {
            method: 'POST',
            headers,
            body: JSON.stringify(payload),
          });
          resText = await apiRes.text();
        }

        // Se o envio de imagem falhar na Z-API (por restrição de plano, payload base64 ou timeout), faz fallback automático para texto puro
        if (!apiRes.ok && isImage) {
          console.warn('Envio de imagem falhou na Z-API, realizando fallback automático para texto puro...');
          const fallbackTextUrl = `https://api.z-api.io/instances/${instanceId}/token/${token}/send-text`;
          const fallbackPayload = {
            phone: cleanPhone,
            message: message || '',
          };
          const fallbackRes = await fetch(fallbackTextUrl, {
            method: 'POST',
            headers,
            body: JSON.stringify(fallbackPayload),
          });
          if (fallbackRes.ok) {
            apiRes = fallbackRes;
            resText = await fallbackRes.text();
          }
        }

        if (!apiRes.ok) {
          let errorMsg = `Erro na Z-API (${apiRes.status}): ${resText.substring(0, 200)}`;
          if (resText.includes('client-token is not configured')) {
            errorMsg = `A sua conta da Z-API exige o "Client-Token" de segurança. No painel da Z-API, acesse o menu de Segurança (ou clique no seu perfil > Segurança), copie o "Token de Segurança da Conta (Client-Token)" e cole no campo "Client-Token".`;
          } else if (resText.includes('invalid token') || resText.includes('Instance not found')) {
            errorMsg = `Instância ou Token não encontrados na Z-API (${resText.trim()}). Verifique o ID da Instância e Token no painel da Z-API.`;
          } else if (resText.includes('expired') || resText.includes('subscription') || resText.includes('plano')) {
            errorMsg = `A licença/assinatura da instância Z-API expirou ou não está ativa no painel da Z-API (${resText.trim()}).`;
          }
          return res.status(apiRes.status).json({
            success: false,
            error: errorMsg,
          });
        }

        let resJson = {};
        try {
          resJson = JSON.parse(resText);
        } catch {
          resJson = { status: 'sent', raw: resText };
        }

        return res.json({ success: true, data: resJson });
      } else if (isEvolution) {
        let targetUrl = (effGatewayUrl || '').trim();
        const cleanBase = targetUrl.replace(/\/message\/(sendText|sendMedia)(\/.*)?$/, '').replace(/\/+$/, '');
        const instance = (effGatewayInstance || 'default').trim();
        const apiKey = (effGatewayToken || '').replace(/^Bearer\s+/i, '').trim();

        let headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };

        if (apiKey) {
          headers['apikey'] = apiKey;
        }

        let payload: any = {};
        if (isImage) {
          targetUrl = `${cleanBase}/message/sendMedia/${instance}`;
          // Evolution API aceita URL ou base64 puro (sem prefixo data:)
          const mediaBase64 = (imageDataUrl || '').replace(/^data:image\/[a-z]+;base64,/, '');
          payload = {
            number: cleanPhone,
            media: mediaBase64,
            mediatype: 'image',
            caption: message || '',
            options: {
              delay: 1200,
              presence: 'composing',
            },
          };
        } else {
          targetUrl = `${cleanBase}/message/sendText/${instance}`;
          payload = {
            number: cleanPhone,
            text: message || '',
            options: {
              delay: 1200,
              presence: 'composing',
              linkPreview: true,
            },
          };
        }

        const apiRes = await fetch(targetUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
        });

        const resText = await apiRes.text();
        if (!apiRes.ok) {
          return res.status(apiRes.status).json({
            success: false,
            error: `Erro na Evolution API (${apiRes.status}): ${resText.substring(0, 200)}`,
          });
        }

        let resJson = {};
        try {
          resJson = JSON.parse(resText);
        } catch {
          resJson = { status: 'sent', raw: resText };
        }

        return res.json({ success: true, data: resJson });
      } else {
        // Generic Webhook POST
        let targetUrl = (effGatewayUrl || '').trim();
        let headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };

        if (effGatewayToken) {
          headers['Authorization'] = effGatewayToken.startsWith('Bearer ') ? effGatewayToken : `Bearer ${effGatewayToken}`;
          headers['apikey'] = effGatewayToken;
        }

        const payload = {
          phone: cleanPhone,
          number: cleanPhone,
          message: message || '',
          text: message || '',
          image: imageDataUrl || undefined,
          media: imageDataUrl || undefined,
        };

        const apiRes = await fetch(targetUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
        });

        const resText = await apiRes.text();
        if (!apiRes.ok) {
          return res.status(apiRes.status).json({
            success: false,
            error: `Erro no Gateway (${apiRes.status}): ${resText.substring(0, 200)}`,
          });
        }

        return res.json({ success: true, data: { status: 'sent', raw: resText } });
      }
    } catch (err: any) {
      console.error('Dispatch error:', err);
      return res.status(500).json({
        success: false,
        error: err.message || 'Falha interna ao disparar mensagem',
      });
    }
  });

  // 4. Proxy para Baileys (evita CORS)
  app.all('/api/baileys/*', async (req, res) => {
    try {
      const service = getMessageService();
      const serverUrl = (service as any).channelConfig?.whatsapp?.serverUrl || 'http://localhost:3000';
      const baileysPath = req.path.replace('/api/baileys', '');
      const url = `${serverUrl}${baileysPath}`;
      
      const fetchOptions: any = {
        method: req.method,
        headers: { 'Content-Type': 'application/json' },
      };
      
      if (req.method !== 'GET' && req.method !== 'HEAD') {
        fetchOptions.body = JSON.stringify(req.body);
      }

      const response = await fetch(url, fetchOptions);
      const data = await response.json();
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // 5. Canais de Envio - WhatsApp Baileys
  app.get('/api/channels', (req, res) => {
    try {
      const service = getMessageService();
      res.json({ 
        success: true, 
        channels: [{
          id: 'whatsapp',
          name: 'WhatsApp (Baileys)',
          configured: service.isConfigured(),
        }]
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/channels/config', (req, res) => {
    try {
      const service = getMessageService();
      service.updateConfig(req.body);
      res.json({ success: true, message: 'Configuração atualizada' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/channels/test', async (req, res) => {
    try {
      const service = getMessageService();
      const status = await service.checkBaileysStatus();
      res.json({ success: status.online, error: status.error });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 6. Broadcasts
  app.post('/api/broadcasts', async (req, res) => {
    try {
      const service = getMessageService();
      const broadcastId = await service.createBroadcast(req.body);
      res.json({ success: true, broadcastId });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/broadcasts/:id/start', async (req, res) => {
    try {
      const service = getMessageService();
      await service.startBroadcast(req.params.id);
      res.json({ success: true, message: 'Broadcast iniciado' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/broadcasts/:id/pause', async (req, res) => {
    try {
      const service = getMessageService();
      service.pauseBroadcast(req.params.id);
      res.json({ success: true, message: 'Broadcast pausado' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/broadcasts/:id/resume', async (req, res) => {
    try {
      const service = getMessageService();
      service.resumeBroadcast(req.params.id);
      res.json({ success: true, message: 'Broadcast retomado' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/broadcasts/:id/cancel', async (req, res) => {
    try {
      const service = getMessageService();
      service.cancelBroadcast(req.params.id);
      res.json({ success: true, message: 'Broadcast cancelado' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 7. SSE para progresso em tempo real
  app.get('/api/broadcasts/:id/stream', (req, res) => {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    });

    const service = getMessageService();

    const onProgress = (data: any) => {
      if (data.broadcastId === req.params.id) {
        res.write(`data: ${JSON.stringify({ type: 'progress', data })}\n\n`);
      }
    };

    const onAlert = (data: any) => {
      if (data.broadcastId === req.params.id) {
        res.write(`data: ${JSON.stringify({ type: 'alert', data })}\n\n`);
      }
    };

    const onComplete = () => {
      res.write(`data: ${JSON.stringify({ type: 'complete' })}\n\n`);
      res.end();
    };

    service.on('progress', onProgress);
    service.on('alert', onAlert);
    service.on('complete', onComplete);

    req.on('close', () => {
      service.off('progress', onProgress);
      service.off('alert', onAlert);
      service.off('complete', onComplete);
    });
  });

  // Initialize MessageService (Evolution API self-hosted)
  const defaultConfig: ChannelConfig = {
    whatsapp: {
      enabled: true,
      serverUrl:
        process.env.EVOLUTION_URL ||
        process.env.BAILEYS_SERVER_URL ||
        'http://localhost:8080',
      sessionName:
        process.env.EVOLUTION_INSTANCE ||
        process.env.BAILEYS_SESSION ||
        'bp-eventos',
      delayMin: 15,
      delayMax: 45,
      maxRetries: 3,
    },
  };

  getMessageService(defaultConfig);
  console.log('✅ MessageService (Evolution API) initialized');

  // 9. Auth: definir senha via token de convite/reset (1º acesso ou "esqueci")
  //    O token é a prova do convite; cria/atualiza o usuário no Supabase Auth.
  app.post('/api/auth/set-password', async (req, res) => {
    try {
      const { token, password } = req.body || {};
      if (!token || typeof token !== 'string' || !password || typeof password !== 'string' || password.length < 6) {
        return res.status(400).json({ success: false, error: 'Token e senha (mínimo 6 caracteres) são obrigatórios.' });
      }

      let lookup = await admin.from('users').select('*').eq('inviteToken', token).limit(1);
      if (!lookup.error && (!lookup.data || lookup.data.length === 0)) {
        lookup = await admin.from('users').select('*').eq('resetToken', token).limit(1);
      }
      if (lookup.error) throw new Error(lookup.error.message);
      const userRow = lookup.data && lookup.data[0];
      if (!userRow) {
        return res.status(404).json({ success: false, error: 'Link inválido ou expirado. Solicite um novo link ao administrador.' });
      }

      const email = String(userRow.email || '').toLowerCase();
      const list = await admin.auth.admin.listUsers(1, 100);
      if (list.error) throw new Error(list.error.message);
      const authUser = (list.data?.users || []).find((u: any) => (u.email || '').toLowerCase() === email);

      if (authUser) {
        const upd = await admin.auth.admin.updateUserById(authUser.id, { password, email_confirm: true });
        if (upd.error) throw new Error(upd.error.message);
      } else {
        const created = await admin.auth.admin.createUser({ email, password, email_confirm: true });
        if (created.error) throw new Error(created.error.message);
      }

      const now = new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR');
      const rowUpd = await admin
        .from('users')
        .update({ status: 'active', inviteToken: null, resetToken: null, passwordCreatedAt: now })
        .eq('id', userRow.id);
      if (rowUpd.error) throw new Error(rowUpd.error.message);

      res.json({ success: true });
    } catch (err: any) {
      console.error('set-password error:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Vite middleware for development vs static build in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`GuestGate QR Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
