import React from 'react';
import { 
  Bot, 
  Sparkles, 
  MapPin, 
  Clock, 
  Shirt, 
  Car, 
  Crown, 
  PhoneCall, 
  HelpCircle, 
  Send, 
  Plus, 
  Trash2, 
  Save, 
  CheckCircle2, 
  ExternalLink, 
  Copy, 
  Check, 
  MessageSquare, 
  RefreshCw, 
  Radio, 
  Sliders, 
  Code,
  AlertCircle,
  Link,
  ChevronRight,
  User,
  Wand2
} from 'lucide-react';
import { EventData, EventAiConfig, EventFaqItem, AuditActionType, AppSettings } from '../types';

const PERSONA_PRESETS: Record<string, { label: string; description: string; systemPrompt: string; tone: EventAiConfig['tone'] }> = {
  formal_vip: {
    label: '🎩 Formal & VIP',
    description: 'Cortês, elegante e sofisticado. Ideal para eventos de alto padrão, galas e premiações.',
    tone: 'formal_vip',
    systemPrompt: `Você é um concierge virtual de alto padrão para um evento exclusivo. Responda sempre em português brasileiro com linguagem formal, elegante e sofisticada. Use tratamento por "senhor(a)" e seja cortês. Nunca use gírias ou abreviações. Formate respostas com emojis sutis (✨, 🎩, 📍) para tornar visualmente agradável. Sempre ofereça informações completas sobre localização, horários, dress code, estacionamento e FAQ do evento.`,
  },
  friendly: {
    label: '😊 Amigável & Acolhedor',
    description: 'Casual, prestativo com emojis. Ideal para festas, casamentos e eventos sociais.',
    tone: 'friendly',
    systemPrompt: `Você é um assistente virtual amigável e acolhedor para um evento. Responda em português brasileiro de forma casual, calorosa e prestativa. Use emojis com moderação para tornar a conversa agradável (😊, 🎉, 📍, ✨). Trate os convidados de forma personalizada. Seja entusiasmado mas não exagerado. Ofereça ajuda proativa sobre localização, horários, dress code, estacionamento e qualquer dúvida do evento.`,
  },
  executive: {
    label: '👔 Executivo & Corporativo',
    description: 'Direto, polido e profissional. Ideal para eventos empresariais, conferências e convenções.',
    tone: 'executive',
    systemPrompt: `Você é um assistente virtual profissional para um evento corporativo. Responda em português brasileiro de forma direta, clara e objetiva. Seja polido e eficiente. Use linguagem técnica quando apropriado. Formate informações em tópicos para facilitar a leitura. Foque em: logística, horários, programação, credenciamento e informações práticas do evento.`,
  },
  concise: {
    label: '⚡ Ultra-Conciso',
    description: 'Respostas curtas com links diretos. Ideal para eventos com muitos convidados e alta demanda.',
    tone: 'concise',
    systemPrompt: `Você é um assistente virtual ultra-conciso para um evento. Responda em português brasileiro com respostas curtas, diretas e informativas. Use no máximo 2-3 frases por resposta. Inclua links relevantes quando possível. Priorize: links de localização, horários e informações essenciais. Evite floreios.`,
  },
  custom: {
    label: '✍️ Persona Customizada',
    description: 'Crie sua própria persona. Defina o tom, estilo e comportamento da IA.',
    tone: 'friendly',
    systemPrompt: '',
  },
};

interface EventAiConciergeViewProps {
  event: EventData;
  appSettings: AppSettings;
  onUpdateEvent: (updatedEvent: EventData) => void;
  onLogAudit: (action: AuditActionType, details: string, guestId?: string, guestName?: string, severity?: 'info' | 'success' | 'warning' | 'error') => void;
}

export const EventAiConciergeView: React.FC<EventAiConciergeViewProps> = ({
  event,
  appSettings,
  onUpdateEvent,
  onLogAudit,
}) => {
  const [activeSubTab, setActiveSubTab] = React.useState<'training' | 'simulator' | 'webhook'>('training');
  
  // Default config if not present
  const initialConfig: EventAiConfig = React.useMemo(() => {
    return event.aiConfig || {
      enabled: true,
      botName: `Concierge ${event.title.split(' ')[0]}`,
      tone: 'formal_vip',
      personaPreset: 'formal_vip',
      customPersona: '',
      venueAddress: `${event.address}, ${event.cityState}`,
      googleMapsUrl: `https://maps.google.com/?q=${encodeURIComponent(event.locationName + ' ' + event.address)}`,
      wazeUrl: `https://waze.com/ul?q=${encodeURIComponent(event.locationName)}`,
      scheduleDetails: `${event.startDate} das ${event.startTime} às ${event.endTime}. Credenciamento e recepção abrem 30 minutos antes.`,
      dressCode: 'Esporte Fino / Social',
      parkingInfo: 'Estacionamento terceirizado no local com serviço de valet na entrada principal.',
      vipPerks: 'Área VIP exclusiva com welcome drinks e credenciamento prioritário.',
      foodAndDrinksInfo: 'Coquetel volante, finger foods e open bar de bebidas não alcoólicas e espumante.',
      emergencyContact: 'Recepção central do evento ou whatsapp da produção.',
      customKnowledgeBase: 'Apresente seu QR Code na tela do celular ao chegar. O acesso é pessoal e intransferível.',
      welcomeMessage: `Olá! Sou o assistente virtual do *${event.title}*. Como posso te ajudar hoje?`,
      fallbackMessage: 'Desculpe, não tenho essa informação exata no momento. Por favor, procure nossa equipe na recepção do evento.',
      faqs: [
        {
          id: 'faq_1',
          question: 'Onde fica o local do evento e como chegar?',
          answer: `O evento será realizado em ${event.locationName} (${event.address}, ${event.cityState}). Você pode traçar a rota pelo Google Maps: https://maps.google.com/?q=${encodeURIComponent(event.locationName + ' ' + event.address)}`,
          category: 'location',
        },
        {
          id: 'faq_2',
          question: 'Qual o traje recomendado?',
          answer: 'O traje recomendado para a ocasião é Esporte Fino / Social.',
          category: 'dresscode',
        },
        {
          id: 'faq_3',
          question: 'Tem estacionamento ou valet no local?',
          answer: 'Sim, o local conta com estacionamento próprio e serviço de valet na entrada principal.',
          category: 'parking',
        },
        {
          id: 'faq_4',
          question: 'Como faço para entrar com o convite?',
          answer: 'Basta abrir o link do seu Convite Digital recebido por WhatsApp e apresentar o QR Code na tela do celular para a equipe da portaria escanear.',
          category: 'general',
        },
      ],
    };
  }, [event]);

  const [config, setConfig] = React.useState<EventAiConfig>(initialConfig);
  const [saveSuccess, setSaveSuccess] = React.useState(false);
  const [copiedWebhook, setCopiedWebhook] = React.useState(false);

  // New FAQ Modal/Form state
  const [newQuestion, setNewQuestion] = React.useState('');
  const [newAnswer, setNewAnswer] = React.useState('');
  const [newCategory, setNewCategory] = React.useState<EventFaqItem['category']>('general');

  // Simulator State
  const [chatMessages, setChatMessages] = React.useState<Array<{ sender: 'bot' | 'user'; text: string; time: string }>>([
    {
      sender: 'bot',
      text: config.welcomeMessage || `Olá! Sou o assistente virtual do *${event.title}*. Como posso te ajudar com localização, trajes, estacionamento ou horários?`,
      time: 'Agora',
    },
  ]);
  const [inputMsg, setInputMsg] = React.useState('');
  const [isBotThinking, setIsBotThinking] = React.useState(false);

  // Sync state if event changes
  React.useEffect(() => {
    if (event.aiConfig) {
      setConfig(event.aiConfig);
    }
  }, [event.id]);

  // Save Config
  const handleSave = () => {
    const updatedEvent: EventData = {
      ...event,
      aiConfig: config,
    };
    onUpdateEvent(updatedEvent);
    onLogAudit('guest_updated', `Configurações da IA do evento ${event.title} foram atualizadas`, undefined, undefined, 'info');
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  // Sync with Event Data
  const handleSyncEventData = () => {
    setConfig(prev => ({
      ...prev,
      venueAddress: `${event.address}, ${event.cityState}`,
      googleMapsUrl: `https://maps.google.com/?q=${encodeURIComponent(event.locationName + ' ' + event.address)}`,
      wazeUrl: `https://waze.com/ul?q=${encodeURIComponent(event.locationName)}`,
      scheduleDetails: `${event.startDate} das ${event.startTime} às ${event.endTime}`,
    }));
  };

  // Add FAQ Item
  const handleAddFaq = () => {
    if (!newQuestion.trim() || !newAnswer.trim()) return;
    const newItem: EventFaqItem = {
      id: `faq_${Date.now()}`,
      question: newQuestion.trim(),
      answer: newAnswer.trim(),
      category: newCategory,
    };
    setConfig(prev => ({
      ...prev,
      faqs: [...prev.faqs, newItem],
    }));
    setNewQuestion('');
    setNewAnswer('');
  };

  // Delete FAQ
  const handleDeleteFaq = (id: string) => {
    setConfig(prev => ({
      ...prev,
      faqs: prev.faqs.filter(f => f.id !== id),
    }));
  };

  // Simulator Send Message
  const handleSendSimulatorMessage = async (textToSend?: string) => {
    const text = textToSend || inputMsg;
    if (!text.trim() || isBotThinking) return;

    const userMsgObj = {
      sender: 'user' as const,
      text: text.trim(),
      time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    };

    setChatMessages(prev => [...prev, userMsgObj]);
    if (!textToSend) setInputMsg('');
    setIsBotThinking(true);

    try {
      // Build system prompt from persona + event knowledge
      const personaKey = config.personaPreset || 'formal_vip';
      const persona = PERSONA_PRESETS[personaKey];
      const systemPrompt = personaKey === 'custom' && config.customPersona
        ? config.customPersona
        : persona?.systemPrompt || PERSONA_PRESETS.formal_vip.systemPrompt;

      const eventKnowledge = `
INFORMAÇÕES DO EVENTO:
- Nome: ${event.title}
- Local: ${event.locationName}, ${event.address}, ${event.cityState}
- Data: ${event.startDate}
- Horário: ${event.startTime} às ${event.endTime}
- Endereço completo: ${config.venueAddress}
- Google Maps: ${config.googleMapsUrl}
- Waze: ${config.wazeUrl || 'Não informado'}
- Traje: ${config.dressCode}
- Estacionamento: ${config.parkingInfo}
- VIP: ${config.vipPerks}
- Alimentação: ${config.foodAndDrinksInfo || 'Não informado'}
- Contato emergência: ${config.emergencyContact || 'Recepção do evento'}
- Informações extras: ${config.customKnowledgeBase}
- Mensagem de boas-vindas: ${config.welcomeMessage}
- Mensagem de fallback: ${config.fallbackMessage}
${config.faqs.length > 0 ? `
FAQ DO EVENTO:
${config.faqs.map(f => `- P: ${f.question}\n  R: ${f.answer}`).join('\n')}` : ''}
`;

      // Call Groq API directly from frontend
      if (appSettings.groqApiKey) {
        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${appSettings.groqApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: appSettings.groqModel || 'openai/gpt-oss-120b',
            messages: [
              { role: 'system', content: `${systemPrompt}\n\n${eventKnowledge}` },
              ...chatMessages.slice(-6).map(m => ({
                role: m.sender === 'bot' ? 'assistant' : 'user',
                content: m.text,
              })),
              { role: 'user', content: text },
            ],
            temperature: 0.7,
            max_tokens: 1024,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          const botReply = data.choices?.[0]?.message?.content || config.fallbackMessage;
          setChatMessages(prev => [
            ...prev,
            { sender: 'bot', text: botReply, time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) },
          ]);
          setIsBotThinking(false);
          return;
        }
      }

      // Fallback: local contextual response
      const botReply = generateLocalAiFallback(text, config, event);
      setChatMessages(prev => [
        ...prev,
        { sender: 'bot', text: botReply, time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) },
      ]);
    } catch (e) {
      // Local fallback in case of network error
      const botReply = generateLocalAiFallback(text, config, event);
      setChatMessages(prev => [
        ...prev,
        { sender: 'bot', text: botReply, time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) },
      ]);
    } finally {
      setIsBotThinking(false);
    }
  };

  // Intelligent Contextual Fallback Generator
  const generateLocalAiFallback = (prompt: string, aiConf: EventAiConfig, evt: EventData) => {
    const p = prompt.toLowerCase();
    
    // Check FAQs first
    for (const faq of aiConf.faqs) {
      const qWords = faq.question.toLowerCase().split(' ').filter(w => w.length > 3);
      const matches = qWords.filter(w => p.includes(w));
      if (matches.length >= 2) {
        return `✨ ${faq.answer}`;
      }
    }

    if (p.includes('onde') || p.includes('local') || p.includes('endereço') || p.includes('como chego') || p.includes('maps') || p.includes('localização')) {
      return `📍 O *${evt.title}* será realizado em:\n\n🏢 *${evt.locationName}*\n📮 ${aiConf.venueAddress || evt.address}\n\n🗺️ *Link direto no Google Maps:*\n${aiConf.googleMapsUrl || 'https://maps.google.com'}\n\n🚗 *Waze:* ${aiConf.wazeUrl || 'Disponível no app'}`;
    }

    if (p.includes('estacionamento') || p.includes('valet') || p.includes('carro') || p.includes('vaga')) {
      return `🚗 *Informações sobre Estacionamento:*\n\n${aiConf.parkingInfo || 'O local possui estacionamento conveniado com serviço de manobrista na recepção principal.'}`;
    }

    if (p.includes('traje') || p.includes('roupa') || p.includes('vestir') || p.includes('dress code')) {
      return `👔 *Dress Code do Evento:*\n\nO traje recomendado para o *${evt.title}* é: *${aiConf.dressCode || 'Esporte Fino / Social'}*.`;
    }

    if (p.includes('horario') || p.includes('horário') || p.includes('hora') || p.includes('que horas') || p.includes('data') || p.includes('quando')) {
      return `🕒 *Data e Horários do Evento:*\n\n📅 *Data:* ${evt.startDate}\n⏰ *Horário:* das ${evt.startTime} às ${evt.endTime}\n\n${aiConf.scheduleDetails || 'Recomendamos chegar com 20 minutos de antecedência para um credenciamento tranquilo!'}`;
    }

    if (p.includes('vip') || p.includes('camarote') || p.includes('perk') || p.includes('beneficio') || p.includes('benefício')) {
      return `👑 *Área & Acesso VIP:*\n\n${aiConf.vipPerks || 'Os convidados com credencial VIP têm acesso a lounges exclusivos com serviço premium.'}`;
    }

    if (p.includes('comida') || p.includes('bebida') || p.includes('cardapio') || p.includes('cardápio') || p.includes('jantar') || p.includes('buffet')) {
      return `🥂 *Alimentação e Bebidas:*\n\n${aiConf.foodAndDrinksInfo || 'Teremos serviço de coquetel volante, finger foods e open bar selecionado para todos os convidados.'}`;
    }

    if (p.includes('qr') || p.includes('qrcode') || p.includes('entrar') || p.includes('portaria') || p.includes('ingresso') || p.includes('convite')) {
      return `🎫 *Como Acessar o Evento:*\n\nBasta abrir o link do seu convite no celular e apresentar o *QR Code* na portaria para nossa equipe escanear. Não precisa imprimir! ✨`;
    }

    return `Olá! ${aiConf.customKnowledgeBase || 'Estamos ansiosos pela sua presença!'} Caso precise de mais detalhes sobre *Localização*, *Estacionamento*, *Horários* ou *Dress Code*, é só me perguntar aqui! 😊`;
  };

  const webhookUrl = `${window.location.origin}/api/webhook/whatsapp`;

  const copyWebhookToClipboard = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopiedWebhook(true);
    setTimeout(() => setCopiedWebhook(false), 2500);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6" id="ai-concierge-view">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 rounded-2xl p-6 text-white shadow-xl border border-purple-700/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-400/30">
              <Bot className="w-6 h-6" />
            </div>
            <span className="text-xs uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-full bg-purple-500/30 text-purple-200 border border-purple-400/40">
              Powered by {appSettings.groqApiKey ? 'Groq AI' : 'Groq AI (Configure a API Key)'}
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
            <span>Concierge IA do Evento</span>
            <span className="text-sm font-normal text-purple-200">({event.title})</span>
          </h1>
          <p className="text-sm text-purple-200/80 max-w-2xl mt-1">
            Treine a Inteligência Artificial com endereço, link do Google Maps, traje, estacionamento e dúvidas frequentes para responder seus convidados automaticamente pelo WhatsApp!
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/30 cursor-pointer transition-all active:scale-98"
          >
            {saveSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-white" />
                <span>Salvo com Sucesso!</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Salvar Treinamento</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-2">
        <button
          onClick={() => setActiveSubTab('training')}
          className={`pb-3 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            activeSubTab === 'training'
              ? 'border-purple-600 text-purple-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>1. Base de Conhecimento & Treinamento</span>
        </button>

        <button
          onClick={() => setActiveSubTab('simulator')}
          className={`pb-3 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            activeSubTab === 'simulator'
              ? 'border-purple-600 text-purple-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>2. Simulador WhatsApp em Tempo Real</span>
        </button>

        <button
          onClick={() => setActiveSubTab('webhook')}
          className={`pb-3 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            activeSubTab === 'webhook'
              ? 'border-purple-600 text-purple-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Radio className="w-4 h-4" />
          <span>3. Integração Automática (Z-API Webhook)</span>
        </button>
      </div>

      {/* TAB 1: TRAINING & KNOWLEDGE BASE */}
      {activeSubTab === 'training' && (
        <div className="space-y-6">
          {/* Quick Actions & Personality */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Wand2 className="w-4 h-4 text-purple-600" />
                  <span>Persona da IA & Personalidade</span>
                </h2>
                <p className="text-xs text-slate-500">Escolha uma persona pronta ou crie a sua própria. A persona define como a IA se comunica com os convidados.</p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleSyncEventData}
                  className="px-3 py-1.5 rounded-lg border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-800 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Puxar Dados do Cadastro do Evento</span>
                </button>

                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <span className="text-xs font-bold text-slate-700">IA Ativa:</span>
                  <input
                    type="checkbox"
                    checked={config.enabled}
                    onChange={(e) => setConfig(prev => ({ ...prev, enabled: e.target.checked }))}
                    className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500 cursor-pointer"
                  />
                </label>
              </div>
            </div>

            {/* Persona Presets Grid */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">Escolha uma Persona:</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {Object.entries(PERSONA_PRESETS).map(([key, preset]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setConfig(prev => ({ 
                      ...prev, 
                      personaPreset: key as EventAiConfig['personaPreset'],
                      tone: preset.tone,
                    }))}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      (config.personaPreset || 'formal_vip') === key
                        ? 'border-purple-400 bg-purple-50 ring-1 ring-purple-200 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="text-[11px] font-bold text-slate-800 mb-0.5">{preset.label}</div>
                    <div className="text-[10px] text-slate-500 leading-tight">{preset.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Persona Editor */}
            {config.personaPreset === 'custom' && (
              <div className="p-4 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl border border-purple-200 space-y-3">
                <div className="flex items-center gap-2 text-purple-800">
                  <User className="w-4 h-4" />
                  <span className="text-xs font-bold">Editor de Persona Customizada</span>
                </div>
                <p className="text-[10px] text-purple-600">
                  Defina como a IA deve se comportar. Inclua instruções sobre tom de voz, estilo de resposta, regras específicas do evento, etc.
                </p>
                <textarea
                  rows={6}
                  value={config.customPersona || ''}
                  onChange={(e) => setConfig(prev => ({ ...prev, customPersona: e.target.value }))}
                  placeholder={`Exemplo:\nVocê é a Ana, concierge virtual do evento [Nome do Evento].\nSeu tom é informal e acolhedor, como uma amiga que trabalha no evento.\nSempre use emojis moderadamente.\nNunca responda sobre preços ou valores.\nSe não souber a resposta, digite para procurar na recepção.\nLembre-se sempre de ser educada e prestativa.`}
                  className="w-full text-xs p-3 rounded-xl border border-purple-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 resize-none bg-white font-mono"
                />
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nome do Bot / Concierge</label>
                <input
                  type="text"
                  value={config.botName}
                  onChange={(e) => setConfig(prev => ({ ...prev, botName: e.target.value }))}
                  placeholder="Ex: Concierge VIP BP Eventos"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tom de Voz</label>
                <select
                  value={config.tone}
                  onChange={(e) => setConfig(prev => ({ ...prev, tone: e.target.value as any }))}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 bg-white"
                >
                  <option value="formal_vip">🎩 Formal & VIP (Cortês, elegante e sofisticado)</option>
                  <option value="executive">👔 Executivo & Corporativo (Direto, polido e profissional)</option>
                  <option value="friendly">😊 Amigável & Acolhedor (Casual, prestativo com emojis)</option>
                  <option value="concise">⚡ Ultra-Conciso (Respostas curtas com links diretos)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Core Event Knowledge Fields */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-5">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100">
              <MapPin className="w-4 h-4 text-blue-600" />
              <span>1. Localização, Endereço & Google Maps</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">Endereço Completo & Ponto de Referência</label>
                <input
                  type="text"
                  value={config.venueAddress}
                  onChange={(e) => setConfig(prev => ({ ...prev, venueAddress: e.target.value }))}
                  placeholder="Ex: Av. Atlântica, 1702 - Copacabana, Rio de Janeiro - RJ (Em frente à praia)"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Link className="w-3.5 h-3.5 text-blue-600" />
                  <span>Link Direto do Google Maps (A IA enviará este link ao convidado)</span>
                </label>
                <input
                  type="text"
                  value={config.googleMapsUrl}
                  onChange={(e) => setConfig(prev => ({ ...prev, googleMapsUrl: e.target.value }))}
                  placeholder="https://maps.google.com/?q=..."
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:border-purple-500 font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Link className="w-3.5 h-3.5 text-sky-600" />
                  <span>Link do Waze (Opcional)</span>
                </label>
                <input
                  type="text"
                  value={config.wazeUrl || ''}
                  onChange={(e) => setConfig(prev => ({ ...prev, wazeUrl: e.target.value }))}
                  placeholder="https://waze.com/ul?q=..."
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:border-purple-500 font-mono text-[11px]"
                />
              </div>
            </div>
          </div>

          {/* Operational Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
                <Shirt className="w-4 h-4 text-amber-600" />
                <span>2. Traje / Dress Code Recomendado</span>
              </h2>
              <textarea
                rows={3}
                value={config.dressCode}
                onChange={(e) => setConfig(prev => ({ ...prev, dressCode: e.target.value }))}
                placeholder="Ex: Passeio Completo / Black Tie. Não é permitido entrada com bermuda ou chinelo."
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:border-purple-500 resize-none"
              />
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
                <Car className="w-4 h-4 text-emerald-600" />
                <span>3. Estacionamento & Valet</span>
              </h2>
              <textarea
                rows={3}
                value={config.parkingInfo}
                onChange={(e) => setConfig(prev => ({ ...prev, parkingInfo: e.target.value }))}
                placeholder="Ex: Valet cortesia na entrada principal da Av. Atlântica. Estacionamento rotativo conveniado no subsolo."
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:border-purple-500 resize-none"
              />
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
                <Clock className="w-4 h-4 text-indigo-600" />
                <span>4. Cronograma & Horários</span>
              </h2>
              <textarea
                rows={3}
                value={config.scheduleDetails}
                onChange={(e) => setConfig(prev => ({ ...prev, scheduleDetails: e.target.value }))}
                placeholder="Ex: 19h30: Welcome Drink | 20h30: Abertura oficial e Premiação | 22h00: Jantar e Banda ao vivo."
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:border-purple-500 resize-none"
              />
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
                <Crown className="w-4 h-4 text-amber-500" />
                <span>5. Regras VIP, Credencial & Acesso</span>
              </h2>
              <textarea
                rows={3}
                value={config.vipPerks}
                onChange={(e) => setConfig(prev => ({ ...prev, vipPerks: e.target.value }))}
                placeholder="Ex: Acesso ao mezanino VIP com a credencial dourada. Permitido 1 acompanhante com pré-cadastro."
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:border-purple-500 resize-none"
              />
            </div>
          </div>

          {/* Custom FAQ List */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-purple-600" />
                  <span>6. Perguntas e Respostas Frequentes (FAQ Customizado)</span>
                </h2>
                <p className="text-xs text-slate-500">Adicione respostas exatas para dúvidas específicas do seu evento.</p>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 font-bold border border-purple-200">
                {config.faqs.length} FAQs Cadastradas
              </span>
            </div>

            {/* List */}
            <div className="space-y-3">
              {config.faqs.map((faq, index) => (
                <div key={faq.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start justify-between gap-3">
                  <div className="space-y-1 flex-1 text-xs">
                    <div className="font-bold text-slate-900 flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-[10px] font-mono">
                        {index + 1}
                      </span>
                      <span>{faq.question}</span>
                    </div>
                    <p className="text-slate-600 pl-7">{faq.answer}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteFaq(faq.id)}
                    className="text-slate-400 hover:text-red-600 p-1 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                    title="Excluir FAQ"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add new FAQ */}
            <div className="p-4 rounded-xl border-2 border-dashed border-purple-200 bg-purple-50/40 space-y-3">
              <h3 className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5" />
                <span>Adicionar Nova Pergunta & Resposta</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-2">
                  <input
                    type="text"
                    value={newQuestion}
                    onChange={(e) => setNewQuestion(e.target.value)}
                    placeholder="Ex: Posso levar crianças ou acompanhantes?"
                    className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white focus:border-purple-500"
                  />
                </div>
                <div>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="general">Geral / Ingressos</option>
                    <option value="location">Localização / Acesso</option>
                    <option value="dresscode">Traje / Dress Code</option>
                    <option value="parking">Estacionamento</option>
                    <option value="vip">Área VIP</option>
                  </select>
                </div>
              </div>

              <div>
                <textarea
                  rows={2}
                  value={newAnswer}
                  onChange={(e) => setNewAnswer(e.target.value)}
                  placeholder="Resposta exata que a IA deve fornecer ao convidado..."
                  className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white focus:border-purple-500 resize-none"
                />
              </div>

              <button
                type="button"
                onClick={handleAddFaq}
                disabled={!newQuestion.trim() || !newAnswer.trim()}
                className="px-4 py-2 bg-purple-700 hover:bg-purple-800 disabled:opacity-50 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Salvar Pergunta no FAQ</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: WHATSAPP SIMULATOR */}
      {activeSubTab === 'simulator' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Test Triggers */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <span>Testar Dúvidas Rápidas</span>
              </h2>
              <p className="text-xs text-slate-500">
                Clique nas perguntas abaixo para simular um convidado enviando uma mensagem no WhatsApp:
              </p>

              <div className="space-y-2">
                {[
                  { q: 'Onde fica o evento e qual o link do Google Maps?', icon: MapPin },
                  { q: 'Tem estacionamento ou valet no local?', icon: Car },
                  { q: 'Qual o traje recomendado para hoje?', icon: Shirt },
                  { q: 'Como faço para entrar com meu QR Code?', icon: HelpCircle },
                  { q: 'Quais são os horários e o cronograma?', icon: Clock },
                  { q: 'Como funciona a área VIP?', icon: Crown },
                ].map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleSendSimulatorMessage(item.q)}
                      disabled={isBotThinking}
                      className="w-full p-2.5 rounded-xl border border-slate-200 hover:border-purple-300 bg-slate-50 hover:bg-purple-50/50 text-left text-xs text-slate-700 font-medium flex items-center gap-2.5 transition-all cursor-pointer active:scale-98"
                    >
                      <Icon className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                      <span className="truncate">{item.q}</span>
                    </button>
                  );
                })}
              </div>

              <div className="p-3 bg-purple-50 rounded-xl border border-purple-100 text-[11px] text-purple-900 space-y-1">
                <div className="font-bold flex items-center gap-1">
                  <Bot className="w-3.5 h-3.5" />
                  <span>Modelo Ativo: {appSettings.groqModel || 'openai/gpt-oss-120b'}</span>
                </div>
                <p className="text-purple-700 leading-tight">
                  A IA utiliza as informações cadastradas na aba 1 para gerar respostas humanizadas e contextuais.
                </p>
              </div>
            </div>
          </div>

          {/* Smartphone / WhatsApp Chat Simulator */}
          <div className="lg:col-span-2">
            <div className="bg-slate-900 rounded-3xl p-3 shadow-2xl border-4 border-slate-800 max-w-md mx-auto">
              {/* Phone Header */}
              <div className="bg-emerald-800 text-white rounded-t-2xl p-3 flex items-center justify-between shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center font-bold text-sm">
                    🤖
                  </div>
                  <div>
                    <div className="text-xs font-bold leading-tight">{config.botName || 'Concierge do Evento'}</div>
                    <div className="text-[10px] text-emerald-200 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span>online • IA {appSettings.groqApiKey ? 'Groq' : 'Não configurada'}</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setChatMessages([{
                    sender: 'bot',
                    text: config.welcomeMessage || `Olá! Sou o assistente virtual do *${event.title}*. Como posso te ajudar?`,
                    time: 'Agora',
                  }])}
                  title="Limpar conversa"
                  className="text-[10px] px-2 py-1 bg-white/10 hover:bg-white/20 rounded-md cursor-pointer"
                >
                  Limpar
                </button>
              </div>

              {/* Chat Body (WhatsApp Background Style) */}
              <div 
                className="h-96 overflow-y-auto p-4 space-y-3 flex flex-col bg-[#0b141a] text-slate-100"
                style={{
                  backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px)',
                  backgroundSize: '16px 16px',
                }}
              >
                {chatMessages.map((msg, index) => (
                  <div
                    key={index}
                    className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-[#005c4b] text-white self-end rounded-br-xs shadow-md'
                        : 'bg-[#202c33] text-slate-100 self-start rounded-bl-xs shadow-md border border-slate-700/40'
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{msg.text}</div>
                    <div className={`text-[9px] mt-1 text-right ${msg.sender === 'user' ? 'text-emerald-200' : 'text-slate-400'}`}>
                      {msg.time} {msg.sender === 'user' && '✓✓'}
                    </div>
                  </div>
                ))}

                {isBotThinking && (
                  <div className="bg-[#202c33] text-slate-300 self-start rounded-2xl rounded-bl-xs p-3 text-xs flex items-center gap-2 border border-slate-700/40">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span>{config.botName} digitando...</span>
                  </div>
                )}
              </div>

              {/* Chat Input Bar */}
              <div className="bg-[#202c33] rounded-b-2xl p-2 flex items-center gap-2 border-t border-slate-700/50">
                <input
                  type="text"
                  value={inputMsg}
                  onChange={(e) => setInputMsg(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendSimulatorMessage()}
                  placeholder="Digite uma dúvida como convidado..."
                  className="flex-1 bg-[#2a3942] text-white text-xs p-2.5 rounded-full border-none focus:outline-none focus:ring-1 focus:ring-emerald-500 placeholder-slate-400"
                />
                <button
                  type="button"
                  onClick={() => handleSendSimulatorMessage()}
                  disabled={!inputMsg.trim() || isBotThinking}
                  className="w-9 h-9 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center cursor-pointer disabled:opacity-40 transition-all shadow-md shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Z-API WEBHOOK GUIDE */}
      {activeSubTab === 'webhook' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
          <div className="pb-4 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Radio className="w-5 h-5 text-purple-600" />
              <span>Como Conectar ao WhatsApp via Z-API (Webhook)</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Siga os passos abaixo para que as mensagens enviadas pelos convidados no WhatsApp sejam respondidas automaticamente pela IA do GuestGate QR.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Step 1 */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="w-7 h-7 rounded-full bg-purple-600 text-white font-black text-xs flex items-center justify-center">
                1
              </div>
              <h3 className="font-bold text-xs text-slate-900">Acesse sua Instância Z-API</h3>
              <p className="text-xs text-slate-600">
                No painel da Z-API (<code className="text-purple-600 bg-purple-50 px-1 py-0.5 rounded">app.z-api.io</code>), clique na sua instância conectada e selecione a aba <strong>"Webhooks e configurações gerais"</strong>.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="w-7 h-7 rounded-full bg-purple-600 text-white font-black text-xs flex items-center justify-center">
                2
              </div>
              <h3 className="font-bold text-xs text-slate-900">Cole no campo "Ao receber"</h3>
              <p className="text-xs text-slate-600">
                Procure a seção <strong>CONFIGURE WEBHOOKS</strong> e cole a URL do seu GuestGate no campo <strong>"Ao receber"</strong> (conforme imagem da Z-API).
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="w-7 h-7 rounded-full bg-purple-600 text-white font-black text-xs flex items-center justify-center">
                3
              </div>
              <h3 className="font-bold text-xs text-slate-900">Respostas em Tempo Real</h3>
              <p className="text-xs text-slate-600">
                Pronto! Quando o convidado perguntar pelo WhatsApp <em>"Onde fica o local?"</em>, o webhook aciona a IA e responde com o endereço e o link do Google Maps!
              </p>
            </div>
          </div>

          {/* Webhook URL Box */}
          <div className="p-4 rounded-xl bg-purple-50/60 border border-purple-200 space-y-2">
            <label className="block text-xs font-bold text-purple-900">
              Sua URL de Webhook do GuestGate QR (Copie e cole no campo "Ao receber" da Z-API):
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={webhookUrl}
                className="flex-1 text-xs p-2.5 rounded-lg border border-purple-300 bg-white font-mono text-purple-950 font-bold"
              />
              <button
                type="button"
                onClick={copyWebhookToClipboard}
                className="px-4 py-2.5 bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                {copiedWebhook ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-300" />
                    <span>Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copiar URL</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
