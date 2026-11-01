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
  Zap,
  Radio
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
  const [zernioTestStatus, setZernioTestStatus] = React.useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [zernioTestMessage, setZernioTestMessage] = React.useState('');
  const [showZernioKey, setShowZernioKey] = React.useState(false);
  const [sandboxStatus, setSandboxStatus] = React.useState<'idle' | 'checking' | 'pending' | 'active' | 'error'>('idle');
  const [sandboxPhone, setSandboxPhone] = React.useState('');
  const [sandboxMessage, setSandboxMessage] = React.useState('');
  const [sandboxTestStatus, setSandboxTestStatus] = React.useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [sandboxTestMessage, setSandboxTestMessage] = React.useState('');
  const [lucyTestStatus, setLucyTestStatus] = React.useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [lucyTestMessage, setLucyTestMessage] = React.useState('');

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

  const zernioConfig = (localSettings as any).zernioConfig || {
    apiKey: '',
    profileId: '',
    accountId: '',
    templateName: 'bp_confirmacao_registro',
    templateLanguage: 'pt_BR',
  };

  React.useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleSave = () => {
    onUpdateSettings(localSettings);
    localStorage.setItem('bp_zernio_config', JSON.stringify(zernioConfig));
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

  const handleTestLucyConnection = async () => {
    console.log('handleTestLucyConnection called');
    console.log('lucyApiUrl:', localSettings.lucyApiUrl);
    
    if (!localSettings.lucyApiUrl.trim()) {
      setLucyTestStatus('error');
      setLucyTestMessage('Insira a URL da API Lucy primeiro.');
      return;
    }

    setLucyTestStatus('testing');
    setLucyTestMessage('Testando conexão com Lucy Concierge...');

    try {
      console.log('Fetching:', localSettings.lucyApiUrl);
      const res = await fetch(localSettings.lucyApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: 'Teste de conexão. Responda apenas: OK',
          session_id: 'test-connection',
        }),
      });

      console.log('Response status:', res.status);
      
      if (res.ok) {
        const data = await res.json();
        console.log('Response data:', data);
        setLucyTestStatus('success');
        setLucyTestMessage('Conexão OK! Lucy Concierge funcionando.');
      } else {
        const err = await res.json().catch(() => ({}));
        console.log('Error:', err);
        setLucyTestStatus('error');
        setLucyTestMessage(`Erro ${res.status}: ${err.message || 'Falha na conexão com Lucy'}`);
      }
    } catch (e) {
      console.error('Fetch error:', e);
      setLucyTestStatus('error');
      setLucyTestMessage('Erro de conexão. Verifique a URL e sua internet.');
    }
  };

  const handleTestBaileys = async () => {
    setBaileysTestStatus('testing');
    setBaileysTestMessage('Verificando servidor Baileys...');

    try {
      const sessionName = channelConfig.whatsapp?.sessionName || 'mi-sesion';
      
      // Usa proxy do servidor Node (/api/baileys/...)
      const res = await fetch(`/api/baileys/sessions/${sessionName}/status`);
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

  const handleTestZernio = async () => {
    if (!zernioConfig.apiKey.trim()) {
      setZernioTestStatus('error');
      setZernioTestMessage('Insira a API Key da Zernio primeiro.');
      return;
    }
    setZernioTestStatus('testing');
    setZernioTestMessage('Verificando conexão com Zernio...');

    try {
      const res = await fetch(`/api/zernio/accounts?apiKey=${encodeURIComponent(zernioConfig.apiKey)}`);
      const data = await res.json();

      if (data.success && data.accounts?.length > 0) {
        const waAccount = data.accounts.find((a: any) => a.platform === 'whatsapp');
        if (waAccount) {
          setZernioTestStatus('success');
          setZernioTestMessage(`Conectado! Conta WhatsApp: ${waAccount.username || waAccount._id}`);
        } else {
          setZernioTestStatus('error');
          setZernioTestMessage('API Key válida, mas nenhuma conta WhatsApp conectada. Conecte no dashboard da Zernio.');
        }
      } else if (data.success) {
        setZernioTestStatus('error');
        setZernioTestMessage('API Key válida, mas sem contas. Conecte sua conta WhatsApp no dashboard da Zernio.');
      } else {
        setZernioTestStatus('error');
        setZernioTestMessage(data.error || 'Erro ao verificar API Key.');
      }
    } catch {
      setZernioTestStatus('error');
      setZernioTestMessage('Erro de conexão. Verifique sua internet.');
    }
  };

  const updateZernio = (field: string, value: string) => {
    setLocalSettings(prev => ({
      ...prev,
      zernioConfig: {
        ...zernioConfig,
        [field]: value,
      },
    }));
  };

  const handleCheckSandbox = async () => {
    if (!zernioConfig.apiKey.trim()) {
      setSandboxStatus('error');
      setSandboxMessage('Insira a API Key da Zernio primeiro.');
      return;
    }
    setSandboxStatus('checking');
    setSandboxMessage('Verificando sandbox...');
    try {
      const res = await fetch(`/api/zernio/sandbox/status?apiKey=${encodeURIComponent(zernioConfig.apiKey)}`);
      const data = await res.json();
      if (data.success && data.sessions?.length > 0) {
        const session = data.sessions[0];
        if (session.status === 'active') {
          setSandboxStatus('active');
          setSandboxMessage(`Sandbox ativo! Tel: ${session.phoneE164}`);
        } else {
          setSandboxStatus('pending');
          setSandboxMessage(`Pendente. Responda a mensagem no WhatsApp de ${data.sandboxNumber} para ativar.`);
        }
      } else {
        setSandboxStatus('idle');
        setSandboxMessage('Nenhum sandbox ativo. Ative um abaixo.');
      }
    } catch {
      setSandboxStatus('error');
      setSandboxMessage('Erro ao verificar sandbox.');
    }
  };

  const handleActivateSandbox = async () => {
    if (!zernioConfig.apiKey.trim()) {
      setSandboxStatus('error');
      setSandboxMessage('Insira a API Key da Zernio primeiro.');
      return;
    }
    if (!sandboxPhone.trim()) {
      setSandboxStatus('error');
      setSandboxMessage('Insira um telefone para ativar o sandbox.');
      return;
    }
    setSandboxStatus('checking');
    setSandboxMessage('Ativando sandbox...');
    try {
      const res = await fetch('/api/zernio/sandbox/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: zernioConfig.apiKey, phone: sandboxPhone }),
      });
      const data = await res.json();
      if (data.success && data.session) {
        setSandboxStatus('pending');
        setSandboxMessage(`Sandbox criado! Responda a mensagem no WhatsApp para ativar. Expira: ${new Date(data.session.expiresAt).toLocaleString('pt-BR')}`);
      } else {
        setSandboxStatus('error');
        setSandboxMessage(data.error || 'Erro ao ativar sandbox.');
      }
    } catch {
      setSandboxStatus('error');
      setSandboxMessage('Erro de conexão.');
    }
  };

  const handleSandboxSend = async () => {
    if (!zernioConfig.apiKey.trim() || !sandboxPhone.trim() || !sandboxMessage.trim()) {
      setSandboxTestStatus('error');
      setSandboxTestMessage('Preencha API Key, telefone e mensagem.');
      return;
    }
    setSandboxTestStatus('sending');
    setSandboxTestMessage('Enviando...');
    try {
      const res = await fetch('/api/zernio/sandbox/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: zernioConfig.apiKey,
          phone: sandboxPhone,
          message: sandboxMessage,
          templateName: zernioConfig.templateName || 'bp_confirmacao_registro',
          templateLanguage: zernioConfig.templateLanguage || 'pt_BR',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSandboxTestStatus('success');
        setSandboxTestMessage('Mensagem enviada via sandbox!');
      } else {
        setSandboxTestStatus('error');
        setSandboxTestMessage(data.error || 'Erro ao enviar.');
      }
    } catch {
      setSandboxTestStatus('error');
      setSandboxTestMessage('Erro de conexão.');
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

      {/* Lucy Concierge Configuration */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-violet-50 to-purple-50">
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-violet-600" />
            <h3 className="text-sm font-bold text-slate-900">Lucy Concierge (Alternativa)</h3>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Configure a Lucy Concierge como alternativa à Groq para o assistente virtual do evento.
          </p>
        </div>

        <div className="p-5 space-y-4">
          {/* Toggle */}
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${localSettings.lucyEnabled ? 'bg-violet-500' : 'bg-slate-300'}`} />
              <span className="text-xs font-semibold text-slate-700">
                {localSettings.lucyEnabled ? 'Lucy Concierge Ativada' : 'Lucy Concierge Desativada'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setLocalSettings(prev => ({ ...prev, lucyEnabled: !prev.lucyEnabled }))}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                localSettings.lucyEnabled ? 'bg-violet-600' : 'bg-slate-300'
              }`}
            >
              <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                localSettings.lucyEnabled ? 'translate-x-4.5' : 'translate-x-0.5'
              }`} />
            </button>
          </div>

          {/* API URL */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">URL da API Lucy</label>
            <input
              type="text"
              value={localSettings.lucyApiUrl}
              onChange={(e) => setLocalSettings(prev => ({ ...prev, lucyApiUrl: e.target.value }))}
              placeholder="https://ea.tailc7276e.ts.net/api/agent/concierge/process"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-mono"
            />
            <p className="text-[10px] text-slate-400 mt-1">Endpoint da API da Lucy Concierge</p>
          </div>

          {/* Test Connection */}
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handleTestLucyConnection}
              disabled={lucyTestStatus === 'testing'}
              className="px-4 py-2 bg-violet-600 hover:bg-violet-700 disabled:bg-violet-400 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              {lucyTestStatus === 'testing' ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Testando...</span>
                </>
              ) : (
                <>
                  <Bot className="w-3.5 h-3.5" />
                  <span>Testar Lucy</span>
                </>
              )}
            </button>

            {lucyTestStatus !== 'idle' && lucyTestStatus !== 'testing' && (
              <div className={`flex items-center gap-1.5 text-[11px] font-semibold ${
                lucyTestStatus === 'success' ? 'text-emerald-600' : 'text-red-600'
              }`}>
                {lucyTestStatus === 'success' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                <span>{lucyTestMessage}</span>
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

      {/* Zernio WhatsApp API Configuration */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-green-50 to-emerald-50">
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-green-600" />
            <h3 className="text-sm font-bold text-slate-900">WhatsApp via Zernio (API Oficial - Gratuito)</h3>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            API oficial do WhatsApp via Meta. Gratuito para as primeiras 2 contas e 1.000 conversas/mês.
            Cadastre-se em <a href="https://zernio.com" target="_blank" rel="noopener" className="text-green-600 underline font-semibold">zernio.com</a>
          </p>
        </div>

        <div className="p-5 space-y-4">
          {/* API Key */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-green-600" />
              Zernio API Key
            </label>
            <div className="relative">
              <input
                type={showZernioKey ? 'text' : 'password'}
                value={zernioConfig.apiKey}
                onChange={(e) => updateZernio('apiKey', e.target.value)}
                placeholder="sk_..."
                className="w-full p-2.5 pr-10 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-mono text-[11px]"
              />
              <button
                type="button"
                onClick={() => setShowZernioKey(!showZernioKey)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showZernioKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Profile ID + Account ID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Profile ID</label>
              <input
                type="text"
                value={zernioConfig.profileId}
                onChange={(e) => updateZernio('profileId', e.target.value)}
                placeholder="prof_123..."
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-mono"
              />
              <p className="text-[10px] text-slate-400 mt-1">ID do perfil no Zernio (obtido após criar perfil)</p>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">WhatsApp Account ID</label>
              <input
                type="text"
                value={zernioConfig.accountId}
                onChange={(e) => updateZernio('accountId', e.target.value)}
                placeholder="wa_account_..."
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-mono"
              />
              <p className="text-[10px] text-slate-400 mt-1">ID da conta WhatsApp conectada no Zernio</p>
            </div>
          </div>

          {/* Template Config */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Template Name</label>
              <input
                type="text"
                value={zernioConfig.templateName}
                onChange={(e) => updateZernio('templateName', e.target.value)}
                placeholder="bp_confirmacao_registro"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-mono"
              />
              <p className="text-[10px] text-slate-400 mt-1">Nome do template aprovado pelo Meta</p>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Idioma</label>
              <select
                value={zernioConfig.templateLanguage}
                onChange={(e) => updateZernio('templateLanguage', e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px]"
              >
                <option value="pt_BR">Português (BR)</option>
                <option value="en">English</option>
                <option value="es">Español</option>
              </select>
            </div>
          </div>

          {/* Instructions */}
          <div className="p-3 bg-green-50 border border-green-200 rounded-xl">
            <p className="text-[10px] text-green-700">
              <strong>Como configurar:</strong><br/>
              1. Crie conta gratuita em <a href="https://zernio.com" target="_blank" className="underline font-semibold">zernio.com</a><br/>
              2. Vá em Connections → WhatsApp → + Connect<br/>
              3. Conecte sua WhatsApp Business Account via Meta Embedded Signup<br/>
              4. Crie um template em Templates → Create (ex: "bp_confirmacao_registro" com corpo: {"{{1}}"})<br/>
              5. Aguarde aprovação do Meta (~24h)<br/>
              6. Copie API Key, Profile ID e Account ID para os campos acima
            </p>
          </div>

          {/* Test Button */}
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handleTestZernio}
              disabled={zernioTestStatus === 'testing'}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              {zernioTestStatus === 'testing' ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Verificando...</span>
                </>
              ) : (
                <>
                  <Radio className="w-3.5 h-3.5" />
                  <span>Testar Zernio</span>
                </>
              )}
            </button>

            {zernioTestStatus !== 'idle' && zernioTestStatus !== 'testing' && (
              <div className={`flex items-center gap-1.5 text-[11px] font-semibold ${
                zernioTestStatus === 'success' ? 'text-emerald-600' : 'text-red-600'
              }`}>
                {zernioTestStatus === 'success' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                <span>{zernioTestMessage}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sandbox Testing Section */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-amber-50 to-orange-50">
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-amber-600" />
            <h3 className="text-sm font-bold text-slate-900">Testar Envio (Sandbox)</h3>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Sandbox usa o número compartilhado +1 202 908 7457. Limite de 5 contatos. Para testar, primeiro ative o sandbox respondendo a mensagem no WhatsApp.
          </p>
        </div>

        <div className="p-5 space-y-4">
          {/* Phone + Check Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Telefone (com DDD)</label>
              <input
                type="text"
                value={sandboxPhone}
                onChange={(e) => setSandboxPhone(e.target.value)}
                placeholder="44999956011"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-mono"
              />
            </div>
            <div className="flex items-end gap-2">
              <button
                onClick={handleCheckSandbox}
                className="px-3 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-xl text-[11px] font-bold cursor-pointer transition-colors"
              >
                Verificar Status
              </button>
              <button
                onClick={handleActivateSandbox}
                className="px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-[11px] font-bold cursor-pointer transition-colors"
              >
                Ativar Sandbox
              </button>
            </div>
          </div>

          {/* Sandbox Status */}
          {sandboxStatus !== 'idle' && sandboxStatus !== 'checking' && (
            <div className={`p-3 rounded-xl text-[11px] font-semibold ${
              sandboxStatus === 'active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
              sandboxStatus === 'pending' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
              'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {sandboxMessage}
            </div>
          )}

          {/* Send Test Message */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Mensagem de Teste</label>
            <textarea
              value={sandboxMessage}
              onChange={(e) => setSandboxMessage(e.target.value)}
              placeholder="Olá! Esta é uma mensagem de teste do BP Eventos."
              rows={3}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px]"
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSandboxSend}
              disabled={sandboxTestStatus === 'sending'}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              {sandboxTestStatus === 'sending' ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Enviando...</span>
                </>
              ) : (
                <>
                  <Radio className="w-3.5 h-3.5" />
                  <span>Enviar Teste</span>
                </>
              )}
            </button>

            {sandboxTestStatus !== 'idle' && sandboxTestStatus !== 'sending' && (
              <div className={`flex items-center gap-1.5 text-[11px] font-semibold ${
                sandboxTestStatus === 'success' ? 'text-emerald-600' : 'text-red-600'
              }`}>
                {sandboxTestStatus === 'success' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                <span>{sandboxTestMessage}</span>
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
