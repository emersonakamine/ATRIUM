import React from 'react';
import { AppSettings, ChannelConfig } from '../types';
import { 
  Settings, 
  Key, 
  Save, 
  CheckCircle2, 
  Eye, 
  EyeOff, 
  Bot, 
  AlertCircle,
  Sparkles,
  MessageSquare,
  Zap
} from 'lucide-react';

interface AdminSettingsViewProps {
  settings: AppSettings;
  onUpdateSettings: (settings: AppSettings) => void;
}

const GROQ_MODELS = [
  { id: 'openai/gpt-oss-120b', name: 'GPT OSS 120B (Recomendado)', description: 'Modelo open-weight da OpenAI, 120B params, excelente qualidade' },
  { id: 'openai/gpt-oss-20b', name: 'GPT OSS 20B (Ultra-rápido)', description: '1000 t/s, ideal para respostas rápidas e alta demanda' },
];

export const AdminSettingsView: React.FC<AdminSettingsViewProps> = ({
  settings,
  onUpdateSettings,
}) => {
  const [localSettings, setLocalSettings] = React.useState<AppSettings>(settings);
  const [showApiKey, setShowApiKey] = React.useState(false);
  const [saveSuccess, setSaveSuccess] = React.useState(false);
  const [testStatus, setTestStatus] = React.useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = React.useState('');
  const [baileysTestStatus, setBaileysTestStatus] = React.useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [baileysTestMessage, setBaileysTestMessage] = React.useState('');

  // Ensure channelConfig exists with defaults
  const channelConfig = localSettings.channelConfig || {
    whatsapp: {
      enabled: true,
      serverUrl: 'http://localhost:3001',
      sessionName: 'default',
      delayMin: 15,
      delayMax: 45,
      maxRetries: 3,
    },
  };

  React.useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleSave = () => {
    onUpdateSettings(localSettings);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const updateChannel = (field: string, value: any) => {
    setLocalSettings(prev => ({
      ...prev,
      channelConfig: {
        ...channelConfig,
        whatsapp: {
          ...channelConfig.whatsapp,
          [field]: value,
        },
      },
    }));
  };

  const handleTestConnection = async () => {
    if (!localSettings.groqApiKey.trim()) {
      setTestStatus('error');
      setTestMessage('Insira uma API Key válida primeiro.');
      return;
    }

    setTestStatus('testing');
    setTestMessage('Testando conexão com Groq...');

    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localSettings.groqApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: localSettings.groqModel || 'openai/gpt-oss-120b',
          messages: [{ role: 'user', content: 'Responda apenas: OK' }],
          max_tokens: 10,
        }),
      });

      if (res.ok) {
        setTestStatus('success');
        setTestMessage('Conexão OK! API Key válida e modelo funcionando.');
      } else {
        const err = await res.json().catch(() => ({}));
        setTestStatus('error');
        setTestMessage(`Erro ${res.status}: ${err.error?.message || 'API Key inválida ou modelo não disponível'}`);
      }
    } catch {
      setTestStatus('error');
      setTestMessage('Erro de conexão. Verifique sua internet.');
    }
  };

  const handleTestBaileys = async () => {
    setBaileysTestStatus('testing');
    setBaileysTestMessage('Verificando servidor Baileys...');

    try {
      const sessionName = channelConfig.whatsapp?.sessionName || 'mi-sesion';
      
      // Usa proxy do servidor Node (/api/baileys/...)
      const res = await fetch(`/api/baileys/api/sessions/${sessionName}/status`);
      const data = await res.json();
      
      if (data.success && data.status === 'open') {
        setBaileysTestStatus('success');
        setBaileysTestMessage('WhatsApp conectado e funcionando!');
      } else if (data.success && (data.status === 'connecting' || data.status === 'qr')) {
        setBaileysTestStatus('error');
        setBaileysTestMessage('Servidor online, mas WhatsApp ainda conectando. Escaneie o QR Code.');
      } else {
        setBaileysTestStatus('error');
        setBaileysTestMessage(data.message || 'Sessão não encontrada.');
      }
    } catch {
      setBaileysTestStatus('error');
      setBaileysTestMessage('Servidor offline. Rode: node dist/server.cjs');
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6 text-xs">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-xl bg-slate-800 text-white">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">Configurações Gerais do Sistema</h2>
            <p className="text-xs text-slate-500">Configure a API de IA, chaves de acesso e preferências globais.</p>
          </div>
        </div>
      </div>

      {/* Groq API Configuration */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-indigo-50 to-purple-50">
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">Configuração da IA Concierge (Groq)</h3>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            A API da Groq é usada para o Concierge IA responder seus convidados automaticamente. 
            Obtenha sua chave em <a href="https://console.groq.com" target="_blank" rel="noopener" className="text-indigo-600 underline font-semibold">console.groq.com</a>
          </p>
        </div>

        <div className="p-5 space-y-5">
          {/* API Key */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-indigo-600" />
              <span>Groq API Key</span>
            </label>
            <div className="relative">
              <input
                type={showApiKey ? 'text' : 'password'}
                value={localSettings.groqApiKey}
                onChange={(e) => setLocalSettings(prev => ({ ...prev, groqApiKey: e.target.value }))}
                placeholder="gsk_..."
                className="w-full p-2.5 pr-10 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-mono text-[11px] focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Nunca compartilhe esta chave. Ela fica salva apenas no navegador do administrador.</p>
          </div>

          {/* Model Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
              <span>Modelo de IA</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {GROQ_MODELS.map((model) => (
                <label
                  key={model.id}
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    localSettings.groqModel === model.id
                      ? 'border-indigo-400 bg-indigo-50 ring-1 ring-indigo-200'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <input
                    type="radio"
                    name="groq-model"
                    value={model.id}
                    checked={localSettings.groqModel === model.id}
                    onChange={(e) => setLocalSettings(prev => ({ ...prev, groqModel: e.target.value }))}
                    className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
                  />
                  <div>
                    <div className="text-[11px] font-bold text-slate-800">{model.name}</div>
                    <div className="text-[10px] text-slate-500">{model.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Test Connection */}
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handleTestConnection}
              disabled={testStatus === 'testing'}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              {testStatus === 'testing' ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Testando...</span>
                </>
              ) : (
                <>
                  <Bot className="w-3.5 h-3.5" />
                  <span>Testar Conexão</span>
                </>
              )}
            </button>

            {testStatus !== 'idle' && testStatus !== 'testing' && (
              <div className={`flex items-center gap-1.5 text-[11px] font-semibold ${
                testStatus === 'success' ? 'text-emerald-600' : 'text-red-600'
              }`}>
                {testStatus === 'success' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                <span>{testMessage}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Channel Configuration - WhatsApp Baileys */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-emerald-50 to-teal-50">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900">WhatsApp via Baileys (Gratuito)</h3>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Envie convites e mensagens gratuitamente via WhatsApp. Requer servidor Baileys rodando em Docker.
          </p>
        </div>

        <div className="p-5 space-y-4">
          {/* Status */}
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
            <div className={`w-3 h-3 rounded-full ${channelConfig.whatsapp?.enabled ? 'bg-emerald-500' : 'bg-slate-300'}`} />
            <span className="text-xs font-semibold text-slate-700">
              {channelConfig.whatsapp?.enabled ? 'Ativado' : 'Desativado'}
            </span>
          </div>

          {/* Config Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">URL do Servidor Baileys</label>
              <input
                type="text"
                value={channelConfig.whatsapp?.serverUrl || ''}
                onChange={(e) => updateChannel('serverUrl', e.target.value)}
                placeholder="http://localhost:3001"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-mono"
              />
              <p className="text-[10px] text-slate-400 mt-1">URL do servidor Docker Baileys</p>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Nome da Sessão</label>
              <input
                type="text"
                value={channelConfig.whatsapp?.sessionName || 'default'}
                onChange={(e) => updateChannel('sessionName', e.target.value)}
                placeholder="default"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-mono"
              />
              <p className="text-[10px] text-slate-400 mt-1">Identificador da sessão WhatsApp</p>
            </div>
          </div>

          {/* Delay Config */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Delay Mínimo (segundos)</label>
              <input
                type="number"
                value={channelConfig.whatsapp?.delayMin || 15}
                onChange={(e) => updateChannel('delayMin', Number(e.target.value))}
                min={5}
                max={120}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Delay Máximo (segundos)</label>
              <input
                type="number"
                value={channelConfig.whatsapp?.delayMax || 45}
                onChange={(e) => updateChannel('delayMax', Number(e.target.value))}
                min={10}
                max={300}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px]"
              />
            </div>
          </div>

          {/* Warning */}
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
            <p className="text-[10px] text-amber-700">
              <strong>⚠️ Importante:</strong> Use contas auxiliares, não a conta principal. 
              O servidor Baileys deve estar rodando em Docker para enviar mensagens.
              Recomendado: 15-45 segundos entre mensagens para evitar banimento.
            </p>
          </div>

          {/* Test Button */}
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handleTestBaileys}
              disabled={baileysTestStatus === 'testing'}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              {baileysTestStatus === 'testing' ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Verificando...</span>
                </>
              ) : (
                <>
                  <Zap className="w-3.5 h-3.5" />
                  <span>Testar Conexão</span>
                </>
              )}
            </button>

            {baileysTestStatus !== 'idle' && baileysTestStatus !== 'testing' && (
              <div className={`flex items-center gap-1.5 text-[11px] font-semibold ${
                baileysTestStatus === 'success' ? 'text-emerald-600' : 'text-red-600'
              }`}>
                {baileysTestStatus === 'success' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                <span>{baileysTestMessage}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs flex items-center gap-2 shadow-lg cursor-pointer transition-all active:scale-98"
        >
          {saveSuccess ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Salvo com Sucesso!</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Salvar Configurações</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
