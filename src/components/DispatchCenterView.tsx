import React from 'react';
import { Guest, EventData, TicketCategory, AuditActionType } from '../types';
import { generateQrDataUrl } from '../utils/qr';
import { generateGuestCardImage } from '../utils/cardGenerator';
import { getInviteBackgroundStyles } from '../utils/inviteStyles';
import { getGuestInviteUrl, getPublicBaseUrl, getEventLandingUrl } from '../utils/urlHelper';
import { toPng } from 'html-to-image';
import { 
  Send, 
  Phone, 
  Mail, 
  MessageSquare, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Copy, 
  ExternalLink,
  Sparkles,
  Users,
  RefreshCw,
  Image as ImageIcon,
  FileText,
  Smartphone,
  Download,
  Settings2,
  Zap,
  Check,
  QrCode,
  Laptop,
  Globe,
  Radio,
  Sliders,
  Eye,
  Layers,
  Calendar,
  MapPin,
  Loader2,
  AlertTriangle
} from 'lucide-react';

interface DispatchCenterViewProps {
  guests: Guest[];
  event: EventData;
  categories: TicketCategory[];
  onUpdateGuestStatus: (guestId: string, updates: Partial<Guest>) => void;
  onLogAudit: (action: AuditActionType, details: string, guestId?: string, guestName?: string) => void;
}

type ContentMode = 'designed_card' | 'simple_text';
type WhatsappSendMethod = 'desktop_app' | 'web_browser' | 'zernio' | 'api_gateway';

export const DispatchCenterView: React.FC<DispatchCenterViewProps> = ({
  guests,
  event,
  categories,
  onUpdateGuestStatus,
  onLogAudit,
}) => {
  const [activeTab, setActiveTab] = React.useState<'whatsapp' | 'email' | 'gateway_settings'>('whatsapp');
  const [contentMode, setContentMode] = React.useState<ContentMode>('designed_card');
  const [sendMethod, setSendMethod] = React.useState<WhatsappSendMethod>(() => {
    const saved = localStorage.getItem('guestgate_send_method');
    if (saved === 'web_browser' || saved === 'desktop_app' || saved === 'zernio' || saved === 'api_gateway') {
      return saved as WhatsappSendMethod;
    }
    const hasZernio = (() => { try { const c = JSON.parse(localStorage.getItem('bp_zernio_config') || 'null'); return c?.apiKey && c?.profileId && c?.accountId; } catch { return false; } })();
    return hasZernio ? 'zernio' : 'desktop_app';
  });
  
  // Selected guest for interactive live preview
  const [selectedGuestId, setSelectedGuestId] = React.useState<string>(guests[0]?.id || '');
  const [copiedGuestId, setCopiedGuestId] = React.useState<string | null>(null);
  const [copiedLinkId, setCopiedLinkId] = React.useState<string | null>(null);
  
  // Custom templates
  const [cardTemplate, setCardTemplate] = React.useState(
    `Olá, *{nome}*! ✨\n\nVocê está convidado(a) com honras para o *{evento}*.\n\n🎟️ *Credencial:* {tipo_ingresso}\n📅 *Data:* {data} às {horario}\n📍 *Local:* {local}\n\n📲 *Acesse seu Convite Digital com QR Code de Acesso aqui:*\n{link_convite}\n\n_Apresente este QR Code na portaria principal no dia do evento._`
  );

  const [simpleTextTemplate, setSimpleTextTemplate] = React.useState(
    `Olá, {nome}! Segue seu convite para o evento {evento}.\nData: {data} às {horario} | Local: {local}\nIngresso: {tipo_ingresso} | Código: {codigo_publico}\nApresente seu QR Code pelo link: {link_convite}`
  );

  // Email subject & state
  const [emailSubject, setEmailSubject] = React.useState(`Seu convite exclusivo com QR Code para ${event.title}`);
  const [isBulkSending, setIsBulkSending] = React.useState(false);
  const [bulkProgress, setBulkProgress] = React.useState(0);
  const [bulkStatusText, setBulkStatusText] = React.useState('');

  // API Gateway Settings with localStorage persistence
  const [gatewayType, setGatewayType] = React.useState<'zapi' | 'evolution'>(() => {
    const saved = localStorage.getItem('guestgate_gateway_type') || '';
    if (saved) return saved as 'zapi' | 'evolution';
    const savedUrl = localStorage.getItem('guestgate_gateway_url') || '';
    return savedUrl.includes('evolution') ? 'evolution' : 'zapi';
  });
  const [zapiInstanceId, setZapiInstanceId] = React.useState(() => localStorage.getItem('guestgate_zapi_instance_id') || '');
  const [zapiToken, setZapiToken] = React.useState(() => localStorage.getItem('guestgate_zapi_token') || '');
  const [zapiClientToken, setZapiClientToken] = React.useState(() => localStorage.getItem('guestgate_zapi_client_token') || '');

  const [gatewayUrl, setGatewayUrl] = React.useState(() => localStorage.getItem('guestgate_gateway_url') || '');
  const [gatewayToken, setGatewayToken] = React.useState(() => localStorage.getItem('guestgate_gateway_token') || '');
  const [gatewayInstance, setGatewayInstance] = React.useState(() => localStorage.getItem('guestgate_gateway_instance') || 'bp_eventos');
  const [apiDispatchFormat, setApiDispatchFormat] = React.useState<'card_image' | 'text_only'>(() => {
    return (localStorage.getItem('guestgate_api_format') as any) || 'card_image';
  });
  const [testPhone, setTestPhone] = React.useState('');
  const [isTestingApi, setIsTestingApi] = React.useState(false);
  const [testApiResult, setTestApiResult] = React.useState<{ success: boolean; message: string } | null>(null);
  const [showDockerGuide, setShowDockerGuide] = React.useState(false);
  const [sendingGuestId, setSendingGuestId] = React.useState<string | null>(null);
  const [sentSuccessGuestId, setSentSuccessGuestId] = React.useState<string | null>(null);
  const [sendErrorMsg, setSendErrorMsg] = React.useState<string | null>(null);
  const [guestSearchQuery, setGuestSearchQuery] = React.useState('');

  // Auto-save gateway settings to localStorage
  React.useEffect(() => {
    localStorage.setItem('guestgate_send_method', sendMethod);
    localStorage.setItem('guestgate_gateway_type', gatewayType);
    if (zapiInstanceId) localStorage.setItem('guestgate_zapi_instance_id', zapiInstanceId);
    if (zapiToken) localStorage.setItem('guestgate_zapi_token', zapiToken);
    localStorage.setItem('guestgate_zapi_client_token', zapiClientToken);
    if (gatewayUrl) localStorage.setItem('guestgate_gateway_url', gatewayUrl);
    if (gatewayToken) localStorage.setItem('guestgate_gateway_token', gatewayToken);
    if (gatewayInstance) localStorage.setItem('guestgate_gateway_instance', gatewayInstance);
    localStorage.setItem('guestgate_api_format', apiDispatchFormat);
  }, [sendMethod, gatewayType, zapiInstanceId, zapiToken, zapiClientToken, gatewayUrl, gatewayToken, gatewayInstance, apiDispatchFormat]);

  // QR Code Cache for preview
  const [previewQrUrl, setPreviewQrUrl] = React.useState<string>('');
  const [isDownloadingImage, setIsDownloadingImage] = React.useState(false);
  const [isCopyingImage, setIsCopyingImage] = React.useState(false);
  const [copiedImageSuccess, setCopiedImageSuccess] = React.useState(false);
  const cardPreviewRef = React.useRef<HTMLDivElement>(null);

  const currentGuest = guests.find(g => g.id === selectedGuestId) || guests[0] || {
    id: 'preview',
    publicCode: 'EVZ-PREVIEW',
    qrPayloadToken: 'EVZ-PREVIEW-001',
    name: 'Participante de Teste',
    phone: '5541999999999',
    email: 'teste@empresa.com.br',
    ticketCategoryId: categories[0]?.id || '',
    status: 'confirmed',
    isCheckedIn: false,
    emailStatus: 'not_sent',
    whatsappStatus: 'not_sent',
    companions: 0,
    createdAt: 'Hoje',
  };

  const currentCategory = categories.find(c => c.id === currentGuest.ticketCategoryId) || categories[0] || {
    id: 'cat_default',
    name: 'Geral / Convidado',
    color: '#3b82f6',
    badgeBg: 'bg-blue-50 text-blue-700',
    badgeText: 'text-blue-700',
    quota: 100,
    accessZone: 'Principal',
    validTime: 'Integral',
  };

  // Generate QR for preview
  React.useEffect(() => {
    if (currentGuest?.qrPayloadToken) {
      generateQrDataUrl(currentGuest.qrPayloadToken).then(setPreviewQrUrl);
    }
  }, [currentGuest?.qrPayloadToken]);

  // Keep selectedGuestId valid
  React.useEffect(() => {
    if (guests.length > 0 && !guests.some(g => g.id === selectedGuestId)) {
      setSelectedGuestId(guests[0].id);
    }
  }, [guests, selectedGuestId]);

  const pendingWhatsapp = guests.filter(g => g.whatsappStatus === 'not_sent');
  const deliveredWhatsapp = guests.filter(g => g.whatsappStatus === 'delivered');
  const pendingEmail = guests.filter(g => g.emailStatus === 'not_sent');

  const filteredQueueGuests = guests.filter(g => {
    if (!guestSearchQuery.trim()) return true;
    const q = guestSearchQuery.toLowerCase();
    return (
      g.name.toLowerCase().includes(q) ||
      g.phone.includes(q) ||
      g.email.toLowerCase().includes(q) ||
      g.publicCode.toLowerCase().includes(q)
    );
  });

  // Build message based on chosen content mode
  const buildMessage = (guest: Guest) => {
    const category = categories.find(c => c.id === guest.ticketCategoryId)?.name || 'Convidado';
    const link = getGuestInviteUrl(guest.publicCode);
    const baseTemplate = contentMode === 'designed_card' ? cardTemplate : simpleTextTemplate;

    return baseTemplate
      .replace(/{nome}/g, guest.name)
      .replace(/{evento}/g, event.title)
      .replace(/{tipo_ingresso}/g, category)
      .replace(/{codigo_publico}/g, guest.publicCode)
      .replace(/{data}/g, event.startDate)
      .replace(/{horario}/g, event.startTime)
      .replace(/{local}/g, event.locationName)
      .replace(/{link_convite}/g, link);
  };

  const handleCopyMessage = (guest: Guest) => {
    const msg = buildMessage(guest);
    navigator.clipboard.writeText(msg);
    setCopiedGuestId(guest.id);
    setTimeout(() => setCopiedGuestId(null), 2000);
  };

  const handleCopyLink = (guest: Guest) => {
    const link = getGuestInviteUrl(guest.publicCode);
    navigator.clipboard.writeText(link);
    setCopiedLinkId(guest.id);
    setTimeout(() => setCopiedLinkId(null), 2000);
  };

  // API Gateway Dispatch Helper
  const sendThroughApiGateway = async (phone: string, textMsg: string, imageDataUrl?: string) => {
    // If Z-API is selected and we have separate fields
    const effectiveZapiId = zapiInstanceId.trim();
    const effectiveZapiToken = zapiToken.trim();
    const effectiveUrl = gatewayUrl.trim() || (effectiveZapiId && effectiveZapiToken ? `https://api.z-api.io/instances/${effectiveZapiId}/token/${effectiveZapiToken}/send-text` : '');

    if (gatewayType === 'zapi') {
      if (!effectiveZapiId && !gatewayUrl) {
        return { success: false, error: 'Preencha o ID da Instância e o Token da Z-API.' };
      }
    } else if (!gatewayUrl) {
      return { success: false, error: 'URL do Gateway não configurada' };
    }
    
    // Check for dummy / placeholder values
    if (
      effectiveUrl.includes('SUA_INSTANCIA') ||
      effectiveUrl.includes('SEU_TOKEN') ||
      effectiveUrl.includes('seudominio.com') ||
      effectiveUrl.includes('meuservidor.com')
    ) {
      return {
        success: false,
        error: 'A configuração contém dados de exemplo ("SUA_INSTANCIA" / "SEU_TOKEN"). É necessário substituir pelos dados reais da sua instância Z-API ou Evolution API.',
      };
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000); // 20s timeout

      // Disparo resiliente através do backend proxy interno
      const response = await fetch('/api/dispatch/whatsapp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
        body: JSON.stringify({
          gatewayUrl: effectiveUrl,
          gatewayToken: (gatewayToken || '').trim(),
          gatewayInstance: (gatewayInstance || '').trim(),
          zapiInstanceId: effectiveZapiId,
          zapiToken: effectiveZapiToken,
          zapiClientToken: (zapiClientToken || '').trim(),
          phone: phone,
          message: textMsg,
          imageDataUrl: imageDataUrl,
          format: apiDispatchFormat,
        }),
      });

      clearTimeout(timeoutId);
      const resData = await response.json().catch(() => null);

      if (!response.ok || !resData?.success) {
        const errorMsg = resData?.error || `Erro no gateway (Status ${response.status})`;
        return { success: false, error: errorMsg };
      }

      return { success: true, data: resData.data };
    } catch (err: any) {
      console.error('Dispatch proxy error:', err);
      if (err.name === 'AbortError') {
        return {
          success: false,
          error: 'Tempo limite esgotado ao conectar no servidor de envio (Timeout 20s). Verifique se sua Z-API está conectada no WhatsApp.',
        };
      }
      return {
        success: false,
        error: err?.message || 'Falha ao conectar no servidor de envio. Verifique a URL e conexão.',
      };
    }
  };

  // Test API Gateway
  const handleTestApiGateway = async () => {
    const target = testPhone || currentGuest.phone;
    if (!target) {
      setTestApiResult({ success: false, message: 'Digite um número de telefone com DDD para o teste' });
      return;
    }
    setIsTestingApi(true);
    setTestApiResult(null);

    const testMessage = `🧪 *Teste de Conexão GuestGate QR*\n\n✅ Sua Evolution API está integrada e operando com sucesso!\n📅 Data: ${new Date().toLocaleString('pt-BR')}`;
    const result = await sendThroughApiGateway(target, testMessage);

    setIsTestingApi(false);
    if (result.success) {
      setTestApiResult({ success: true, message: `Mensagem de teste enviada com sucesso para ${target}!` });
      onLogAudit('gateway_tested', `Teste de envio via Evolution API concluído para ${target}`, undefined, undefined, 'success');
    } else {
      setTestApiResult({ success: false, message: `Erro ao disparar: ${result.error}` });
    }
  };

  // Trigger WhatsApp Send depending on selected method
  const handleSendSingleWhatsapp = async (guest: Guest) => {
    // Synchronize preview selection to this guest immediately
    setSelectedGuestId(guest.id);

    const cleanPhone = guest.phone.replace(/\D/g, '');
    const msg = buildMessage(guest);

    setSendingGuestId(guest.id);
    setSendErrorMsg(null);

    if (sendMethod === 'desktop_app' || sendMethod === 'web_browser') {
      // Generate card image and download
      try {
        const guestCategory = categories.find(c => c.id === guest.ticketCategoryId);
        const cardPngDataUrl = generateGuestCardImage(guest, event, guestCategory);
        
        // Download image automatically
        const link = document.createElement('a');
        link.download = `convite-${guest.name.replace(/\s+/g, '_')}.png`;
        link.href = cardPngDataUrl;
        link.click();
      } catch (err) {
        console.warn('Failed to generate/download card image:', err);
      }

      // Open WhatsApp
      if (sendMethod === 'desktop_app') {
        const nativeUrl = `whatsapp://send?phone=${cleanPhone}&text=${encodeURIComponent(msg)}`;
        window.location.href = nativeUrl;
      } else {
        const waUrl = `https://web.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(msg)}`;
        window.open(waUrl, '_blank');
      }
      
      setSendingGuestId(null);
      setSentSuccessGuestId(guest.id);
      setSendErrorMsg('📷 Imagem baixada! Anexe no WhatsApp clicando no ícone 📎.');
      setTimeout(() => {
        setSentSuccessGuestId(null);
        setSendErrorMsg(null);
      }, 6000);
    } else if (sendMethod === 'zernio') {
      // Zernio API - official WhatsApp API
      const zernio = (() => { try { return JSON.parse(localStorage.getItem('bp_zernio_config') || 'null'); } catch { return null; } })();
      if (!zernio?.apiKey || !zernio?.profileId || !zernio?.accountId) {
        setSendErrorMsg('Zernio não configurado. Vá em Configurações e preencha API Key, Profile ID e Account ID.');
        setTimeout(() => setSendErrorMsg(null), 9000);
        return;
      }
      const result = await fetch('/api/zernio/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: zernio.apiKey,
          profileId: zernio.profileId,
          accountId: zernio.accountId,
          phone: cleanPhone,
          message: msg,
          templateName: zernio.templateName || 'bp_confirmacao_registro',
          templateLanguage: zernio.templateLanguage || 'pt_BR',
        }),
      }).then(r => r.json()).catch(e => ({ success: false, error: e.message }));

      setSendingGuestId(null);
      if (result.success) {
        setSentSuccessGuestId(guest.id);
        setTimeout(() => setSentSuccessGuestId(null), 3000);
      } else {
        setSendErrorMsg(`Erro ao enviar para ${guest.name}: ${result.error}`);
        setTimeout(() => setSendErrorMsg(null), 9000);
        return;
      }
    } else if (sendMethod === 'api_gateway') {
      // API Gateway background dispatch with guaranteed per-guest QR Code card PNG
      let cardPngDataUrl: string | undefined = undefined;
      if (apiDispatchFormat === 'card_image') {
        try {
          const guestCategory = categories.find(c => c.id === guest.ticketCategoryId);
          cardPngDataUrl = generateGuestCardImage(guest, event, guestCategory);
        } catch (err) {
          console.warn('Failed to generate guest card image, falling back to text:', err);
        }
      }

      const result = await sendThroughApiGateway(cleanPhone, msg, cardPngDataUrl);
      setSendingGuestId(null);
      if (result.success) {
        setSentSuccessGuestId(guest.id);
        setTimeout(() => setSentSuccessGuestId(null), 3000);
      } else {
        setSendErrorMsg(`Erro ao enviar para ${guest.name}: ${result.error}`);
        setTimeout(() => setSendErrorMsg(null), 9000);
        return; // Do not mark delivered if it failed
      }
    }

    onUpdateGuestStatus(guest.id, {
      whatsappStatus: 'delivered',
      sentAt: new Date().toLocaleString('pt-BR'),
    });
    onLogAudit('whatsapp_sent', `Convite via WhatsApp enviado para ${guest.name} (${cleanPhone})`, guest.id, guest.name, 'success');
  };

  // Reset WhatsApp Status for testing
  const handleResetWhatsappStatus = () => {
    guests.forEach(g => {
      onUpdateGuestStatus(g.id, {
        whatsappStatus: 'pending',
      });
    });
    onLogAudit('status_reset', 'Status de envio de convites WhatsApp resetados para Pendente', undefined, undefined, 'info');
  };

  // Bulk WhatsApp Dispatch (Automatic without tabs)
  const handleBulkDispatchWhatsapp = () => {
    const targets = guests.filter(g => g.whatsappStatus !== 'delivered');
    const dispatchList = targets.length > 0 ? targets : guests; // If all delivered, allow sending to all
    if (dispatchList.length === 0) return;

    setIsBulkSending(true);
    setBulkProgress(0);
    setBulkStatusText(`Iniciando disparo em lote de ${dispatchList.length} convites...`);

    let current = 0;
    const interval = setInterval(async () => {
      if (current >= dispatchList.length) {
        clearInterval(interval);
        setIsBulkSending(false);
        setBulkProgress(100);
        setBulkStatusText('Disparo em lote concluído com sucesso!');
        return;
      }

      const target = dispatchList[current];
      setSelectedGuestId(target.id);
      const cleanPhone = target.phone.replace(/\D/g, '');
      const msg = buildMessage(target);

      if (sendMethod === 'api_gateway') {
        let cardPng: string | undefined = undefined;
        if (apiDispatchFormat === 'card_image') {
          try {
            const targetCategory = categories.find(c => c.id === target.ticketCategoryId);
            cardPng = generateGuestCardImage(target, event, targetCategory);
          } catch (err) {
            console.warn('Error generating card for batch target:', err);
          }
        }
        await sendThroughApiGateway(cleanPhone, msg, cardPng);
      } else if (sendMethod === 'zernio') {
        const zernio = (() => { try { return JSON.parse(localStorage.getItem('bp_zernio_config') || 'null'); } catch { return null; } })();
        if (zernio?.apiKey && zernio?.profileId && zernio?.accountId) {
          await fetch('/api/zernio/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              apiKey: zernio.apiKey,
              profileId: zernio.profileId,
              accountId: zernio.accountId,
              phone: cleanPhone,
              message: msg,
              templateName: zernio.templateName || 'bp_confirmacao_registro',
              templateLanguage: zernio.templateLanguage || 'pt_BR',
            }),
          }).catch(() => {});
        }
      } else if (sendMethod === 'desktop_app' || sendMethod === 'web_browser') {
        // Generate and download card image
        try {
          const targetCategory = categories.find(c => c.id === target.ticketCategoryId);
          const cardPng = generateGuestCardImage(target, event, targetCategory);
          const link = document.createElement('a');
          link.download = `convite-${target.name.replace(/\s+/g, '_')}.png`;
          link.href = cardPng;
          link.click();
        } catch (err) {
          console.warn('Failed to download card image:', err);
        }

        // Open WhatsApp
        if (sendMethod === 'desktop_app') {
          const nativeUrl = `whatsapp://send?phone=${cleanPhone}&text=${encodeURIComponent(msg)}`;
          window.location.href = nativeUrl;
        } else {
          const waUrl = `https://web.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(msg)}`;
          window.open(waUrl, '_blank');
        }
        await new Promise(r => setTimeout(r, 3000));
      }

      onUpdateGuestStatus(target.id, {
        whatsappStatus: 'delivered',
        sentAt: new Date().toLocaleString('pt-BR'),
      });
      onLogAudit('whatsapp_sent', `Convite em lote entregue para ${target.name}`, target.id, target.name, 'success');

      current++;
      setBulkProgress(Math.round((current / dispatchList.length) * 100));
      setBulkStatusText(`Enviando ${current}/${dispatchList.length}: ${target.name}...`);
    }, 800);
  };

  // Copy Card as PNG directly to Clipboard (allows Ctrl+V in WhatsApp)
  const handleCopyCardImage = async () => {
    setIsCopyingImage(true);
    try {
      const dataUrl = generateGuestCardImage(currentGuest, event, currentCategory);
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      if ((window as any).ClipboardItem && navigator.clipboard?.write) {
        await navigator.clipboard.write([
          new (window as any).ClipboardItem({ 'image/png': blob }),
        ]);
        setCopiedImageSuccess(true);
        setTimeout(() => setCopiedImageSuccess(false), 3000);
      } else {
        // Fallback to download
        handleDownloadCardImage();
      }
    } catch (err) {
      console.error('Error copying card image:', err);
      handleDownloadCardImage();
    } finally {
      setIsCopyingImage(false);
    }
  };

  // Download Card as PNG Image
  const handleDownloadCardImage = () => {
    setIsDownloadingImage(true);
    try {
      const dataUrl = generateGuestCardImage(currentGuest, event, currentCategory);
      const link = document.createElement('a');
      link.download = `convite_${currentGuest.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Error generating card image:', err);
    } finally {
      setIsDownloadingImage(false);
    }
  };

  // Background style from the event's inviteLayout
  const layout = event.inviteLayout;
  const bgStyles = getInviteBackgroundStyles(layout);
  const isLight = bgStyles.isLight;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Send className="w-5 h-5 text-blue-600" />
              <span>Central de Disparo de Convites</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Escolha entre o <strong>Convite Digital Desenhado</strong> ou mensagem em texto simples, com opções de envio direto no App ou Gateway automático.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{deliveredWhatsapp.length}/{guests.length} Entregues</span>
            </span>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 mt-5 border-b border-slate-100 pb-2">
          <button
            onClick={() => setActiveTab('whatsapp')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              activeTab === 'whatsapp'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-xs'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <MessageSquare className="w-4 h-4 text-emerald-600" />
            <span>Disparo por WhatsApp ({deliveredWhatsapp.length}/{guests.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('email')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              activeTab === 'email'
                ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-xs'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Mail className="w-4 h-4 text-blue-600" />
            <span>Disparo por E-mail</span>
          </button>

          <button
            onClick={() => setActiveTab('gateway_settings')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              activeTab === 'gateway_settings'
                ? 'bg-purple-50 text-purple-700 border border-purple-200 shadow-xs'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Settings2 className="w-4 h-4 text-purple-600" />
            <span>Configurar API & Gateway WhatsApp</span>
          </button>
        </div>
      </div>

      {/* Bulk Progress Bar */}
      {isBulkSending && (
        <div className="bg-white rounded-2xl border border-blue-200 p-5 shadow-md space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-800 flex items-center gap-2">
              <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
              <span>{bulkStatusText}</span>
            </span>
            <span className="font-mono font-bold text-blue-600">{bulkProgress}%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden border border-slate-200">
            <div 
              className="bg-blue-600 h-3 rounded-full transition-all duration-300"
              style={{ width: `${bulkProgress}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* WhatsApp Tab View */}
      {activeTab === 'whatsapp' && (
        <div className="space-y-6">
          {/* Controls Bar: Content Type & Send Protocol */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Control 1: Tipo de Conteúdo do Convite */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>1. Tipo de Conteúdo do Convite</span>
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setContentMode('designed_card')}
                  className={`p-3 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                    contentMode === 'designed_card'
                      ? 'border-emerald-500 bg-emerald-50/50 text-emerald-950 font-bold shadow-xs'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <ImageIcon className="w-4 h-4 text-emerald-600" />
                    <span>Card Visual Desenhado</span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-normal">
                    Leva o link interativo que abre a credencial visual com o tema e fundo desenhado.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setContentMode('simple_text')}
                  className={`p-3 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                    contentMode === 'simple_text'
                      ? 'border-emerald-500 bg-emerald-50/50 text-emerald-950 font-bold shadow-xs'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <span>Texto Simples / Direto</span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-normal">
                    Mensagem textual objetiva sem formatações complexas.
                  </p>
                </button>
              </div>
            </div>

            {/* Control 2: Método de Envio no WhatsApp */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-blue-600" />
                <span>2. Qual das 3 opções de WhatsApp usar?</span>
              </span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setSendMethod('desktop_app')}
                  className={`p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer relative ${
                    sendMethod === 'desktop_app'
                      ? 'border-blue-500 bg-blue-50/50 text-blue-950 font-bold shadow-xs'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-1 mb-1">
                    <Laptop className="w-3.5 h-3.5 text-blue-600" />
                    <span>App Desktop</span>
                  </div>
                  <p className="text-[10px] text-slate-500 font-normal leading-tight">
                    Abre direto no app do WhatsApp (Windows/Mac/Celular).
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setSendMethod('web_browser')}
                  className={`p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer relative ${
                    sendMethod === 'web_browser'
                      ? 'border-emerald-500 bg-emerald-50/50 text-emerald-950 font-bold shadow-xs'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-1 mb-1">
                    <Globe className="w-3.5 h-3.5 text-emerald-600" />
                    <span>WhatsApp Web</span>
                  </div>
                  <p className="text-[10px] text-slate-500 font-normal leading-tight">
                    Abre em uma nova aba do navegador.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setSendMethod('zernio')}
                  className={`p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer relative ${
                    sendMethod === 'zernio'
                      ? 'border-green-500 bg-green-50/50 text-green-950 font-bold shadow-xs'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-1 mb-1">
                    <Radio className="w-3.5 h-3.5 text-green-600" />
                    <span>Zernio API</span>
                  </div>
                  <span className="inline-block text-[9px] font-bold px-1.5 py-0.5 bg-green-100 text-green-700 rounded mb-1">
                    🚀 Automático
                  </span>
                  <p className="text-[10px] text-slate-500 font-normal leading-tight">
                    API oficial do WhatsApp. 100% automático e com formatação.
                  </p>
                </button>
              </div>
            </div>
          </div>

          {/* Explanation Tip Box */}
          <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-3.5 text-xs text-amber-900 flex items-start gap-3">
            <div className="p-1.5 bg-amber-100 text-amber-800 rounded-lg shrink-0 mt-0.5">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="space-y-1">
              <div className="font-bold text-amber-950 flex items-center gap-2">
                <span>Por que o WhatsApp Web abre com texto e link?</span>
              </div>
              <p className="text-[11px] leading-relaxed text-amber-900/90">
                Por regras de segurança do WhatsApp, links da web não podem injetar arquivos de imagem automaticamente sem autorização. Ao enviar a mensagem, o participante recebe o <strong>link direto do Convite Digital</strong>, onde ele abre o card desenhado interativo completo no celular.
                <br />
                📸 <strong>Quer colar a foto do convite na conversa?</strong> Use o botão <strong>"Copiar Imagem"</strong> abaixo e aperte <kbd className="px-1 py-0.5 bg-white border border-amber-300 rounded text-[10px] font-mono font-bold">Ctrl + V</kbd> no chat do WhatsApp!
              </p>
            </div>
          </div>

          {/* Main 3-Column Work Area */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Column 1: Live Card / Smartphone Preview (4 cols) */}
            <div className="lg:col-span-4 space-y-4">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Smartphone className="w-4 h-4 text-blue-600" />
                    <span>Card Desenhado ({currentGuest.name})</span>
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handleCopyCardImage}
                      disabled={isCopyingImage}
                      className={`px-2 py-1 text-[11px] font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                        copiedImageSuccess
                          ? 'bg-emerald-600 text-white'
                          : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
                      }`}
                      title="Copiar imagem para colar com Ctrl+V no WhatsApp"
                    >
                      {copiedImageSuccess ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedImageSuccess ? 'Copiada!' : 'Copiar Imagem'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleDownloadCardImage}
                      disabled={isDownloadingImage}
                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                      title="Baixar imagem PNG do convite"
                    >
                      <Download className="w-3 h-3 text-slate-600" />
                      <span>PNG</span>
                    </button>
                  </div>
                </div>

                {copiedImageSuccess && (
                  <div className="p-2 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-[11px] font-medium text-center animate-in fade-in">
                    ✓ <strong>Imagem copiada!</strong> Vá na conversa do WhatsApp e aperte <strong>Ctrl + V</strong> para colar a foto.
                  </div>
                )}

                {/* Designed Card Container (matches InviteEditor theme) */}
                <div className="flex justify-center">
                  <div 
                    ref={cardPreviewRef}
                    className={`w-full max-w-[280px] rounded-2xl p-4 shadow-xl overflow-hidden relative border text-center transition-all ${bgStyles.className}`}
                    style={bgStyles.style}
                  >
                    {/* Background Image if configured */}
                    {layout.bgImageUrl && (
                      <div 
                        className="absolute inset-0 bg-cover bg-center pointer-events-none"
                        style={{
                          backgroundImage: `url(${layout.bgImageUrl})`,
                          filter: layout.bgBlur ? `blur(${layout.bgBlur}px)` : 'none',
                        }}
                      />
                    )}

                    {/* Overlay */}
                    {layout.bgImageUrl && (
                      <div 
                        className="absolute inset-0 pointer-events-none"
                        style={{
                          backgroundColor: isLight ? '#ffffff' : '#000000',
                          opacity: (layout.bgOverlayOpacity ?? 50) / 100,
                        }}
                      />
                    )}

                    <div className="relative z-10 space-y-2">
                      <span 
                        className="text-[9px] font-extrabold uppercase tracking-widest block"
                        style={{ color: layout.accentColor }}
                      >
                        {layout.title || 'CONVITE EXCLUSIVO'}
                      </span>
                      <h4 
                        className="text-sm font-black tracking-tight leading-tight"
                        style={{ color: layout.textColor }}
                      >
                        {event.title}
                      </h4>

                      {/* QR Box */}
                      <div className="bg-white p-2.5 rounded-xl shadow-md border-2 border-slate-900/30 inline-block my-1">
                        {previewQrUrl ? (
                          <img src={previewQrUrl} alt="QR Code" className="w-28 h-28 mx-auto" />
                        ) : (
                          <div className="w-28 h-28 flex items-center justify-center text-slate-400 text-xs">QR</div>
                        )}
                        <div className="font-mono text-[8px] font-bold text-slate-800 mt-0.5">
                          {currentGuest.publicCode}
                        </div>
                      </div>

                      {/* Guest Details */}
                      <div>
                        <div 
                          className="font-bold text-xs"
                          style={{ color: layout.textColor }}
                        >
                          {currentGuest.name}
                        </div>
                        <div className="inline-block mt-0.5 px-2 py-0.5 rounded-full text-[9px] font-bold bg-white/90 text-slate-900 border border-slate-200 shadow-2xs">
                          {currentCategory.name}
                        </div>
                      </div>

                      <div 
                        className="text-[9px] opacity-75 pt-1 border-t border-white/15"
                        style={{ color: layout.textColor }}
                      >
                        <div>{event.startDate} • {event.startTime}</div>
                        <div className="truncate">{event.locationName}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600 space-y-1.5">
                  <div className="font-bold text-slate-800 flex items-center justify-between">
                    <span>Link do Convidado Atual:</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleCopyLink(currentGuest)}
                        className="text-blue-600 hover:text-blue-700 text-[10px] font-bold cursor-pointer"
                      >
                        {copiedLinkId === currentGuest.id ? '✓ Link Copiado' : 'Copiar Link'}
                      </button>
                      <a
                        href={getGuestInviteUrl(currentGuest.publicCode)}
                        target="_blank"
                        rel="noreferrer"
                        className="text-emerald-600 hover:text-emerald-700 text-[10px] font-bold inline-flex items-center gap-0.5"
                      >
                        Testar <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>
                  </div>
                  <div className="font-mono text-[10px] text-slate-500 truncate bg-white p-1.5 rounded border border-slate-100">
                    {getGuestInviteUrl(currentGuest.publicCode)}
                  </div>
                </div>
              </div>
            </div>

            {/* Column 2: Template Editor (4 cols) */}
            <div className="lg:col-span-4 space-y-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4 text-xs">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 flex items-center gap-1.5">
                    <MessageSquare className="w-4 h-4 text-emerald-600" />
                    <span>Texto da Mensagem</span>
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                    {contentMode === 'designed_card' ? 'Modo Card Desenhado' : 'Modo Texto'}
                  </span>
                </div>

                {contentMode === 'designed_card' ? (
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      Template com Link do Card Desenhado:
                    </label>
                    <textarea
                      rows={10}
                      value={cardTemplate}
                      onChange={(e) => setCardTemplate(e.target.value)}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 font-sans"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      Template de Texto Simples:
                    </label>
                    <textarea
                      rows={10}
                      value={simpleTextTemplate}
                      onChange={(e) => setSimpleTextTemplate(e.target.value)}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 font-sans"
                    />
                  </div>
                )}

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                  <span className="font-bold text-slate-700 block text-[11px]">Variáveis Dinâmicas:</span>
                  <div className="flex flex-wrap gap-1 font-mono text-[10px]">
                    <span className="px-1.5 py-0.5 bg-white rounded border border-slate-200 text-slate-700">{`{nome}`}</span>
                    <span className="px-1.5 py-0.5 bg-white rounded border border-slate-200 text-slate-700">{`{evento}`}</span>
                    <span className="px-1.5 py-0.5 bg-white rounded border border-slate-200 text-slate-700">{`{tipo_ingresso}`}</span>
                    <span className="px-1.5 py-0.5 bg-white rounded border border-slate-200 text-slate-700">{`{data}`}</span>
                    <span className="px-1.5 py-0.5 bg-white rounded border border-slate-200 text-slate-700">{`{horario}`}</span>
                    <span className="px-1.5 py-0.5 bg-white rounded border border-slate-200 text-slate-700">{`{local}`}</span>
                    <span className="px-1.5 py-0.5 bg-white rounded border border-emerald-300 text-emerald-700 font-bold">{`{link_convite}`}</span>
                  </div>
                </div>

                {/* Bulk Dispatch Button & Reset */}
                <div className="pt-2 space-y-2">
                  <button
                    type="button"
                    disabled={isBulkSending || guests.length === 0}
                    onClick={handleBulkDispatchWhatsapp}
                    className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md ${
                      !isBulkSending && guests.length > 0
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20 cursor-pointer active:scale-98'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                    }`}
                  >
                    <Zap className="w-4 h-4" />
                    <span>
                      {pendingWhatsapp.length > 0
                        ? `Disparar Todos os ${pendingWhatsapp.length} Pendentes em Lote`
                        : `Reenviar para Todos os ${guests.length} Participantes em Lote`}
                    </span>
                  </button>

                  {sendErrorMsg && (
                    <div className="p-2.5 bg-red-50 text-red-800 border border-red-200 rounded-xl text-xs flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                      <span className="text-[11px] leading-tight">{sendErrorMsg}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Column 3: Guest Queue List (4 cols) */}
            <div className="lg:col-span-4 space-y-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-blue-600" />
                    <span>Fila de Participantes ({guests.length})</span>
                  </h3>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleResetWhatsappStatus}
                      title="Resetar status para Pendente para testar novos disparos"
                      className="text-[10px] text-slate-500 hover:text-blue-600 underline cursor-pointer"
                    >
                      Resetar status
                    </button>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                      {pendingWhatsapp.length} pendentes
                    </span>
                  </div>
                </div>

                {/* Search in Queue */}
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Filtrar fila por nome ou telefone..."
                    value={guestSearchQuery}
                    onChange={(e) => setGuestSearchQuery(e.target.value)}
                    className="w-full pl-3 pr-8 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500/20"
                  />
                  {guestSearchQuery && (
                    <button
                      onClick={() => setGuestSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                    >
                      ×
                    </button>
                  )}
                </div>

                <div className="divide-y divide-slate-100 max-h-[460px] overflow-y-auto pr-1">
                  {filteredQueueGuests.length === 0 ? (
                    <div className="py-8 text-center text-slate-400 text-xs space-y-1">
                      <p className="font-semibold text-slate-600">Nenhum convidado encontrado na fila</p>
                      <p className="text-[11px] text-slate-400">Verifique o termo buscado ou cadastre na aba Participantes.</p>
                    </div>
                  ) : (
                    filteredQueueGuests.map((guest) => {
                    const category = categories.find(c => c.id === guest.ticketCategoryId);
                    const isSelected = guest.id === selectedGuestId;
                    const isSendingThis = sendingGuestId === guest.id;
                    const isSuccessThis = sentSuccessGuestId === guest.id;

                    return (
                      <div 
                        key={guest.id} 
                        onClick={() => setSelectedGuestId(guest.id)}
                        className={`py-3 px-2 rounded-xl transition-all cursor-pointer space-y-2 ${
                          isSelected ? 'bg-blue-50/70 border border-blue-200 shadow-xs' : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 text-xs">
                          <div>
                            <div className="font-bold text-slate-900 flex items-center gap-1.5">
                              <span>{guest.name}</span>
                              <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${category?.badgeBg || 'bg-slate-100'}`}>
                                {category?.name || 'Geral'}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono">
                              {guest.phone || 'Sem telefone'}
                            </div>
                          </div>

                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                            guest.whatsappStatus === 'delivered'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}>
                            {guest.whatsappStatus === 'delivered' ? '✓ Enviado' : 'Pendente'}
                          </span>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-1.5 pt-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopyMessage(guest);
                            }}
                            className="flex-1 py-1.5 px-2 bg-white hover:bg-slate-100 text-slate-700 rounded-lg text-[11px] font-semibold border border-slate-200 flex items-center justify-center gap-1 cursor-pointer transition-colors"
                          >
                            <Copy className="w-3 h-3 text-slate-500" />
                            <span>{copiedGuestId === guest.id ? 'Copiado!' : 'Copiar'}</span>
                          </button>

                          <button
                            type="button"
                            disabled={isSendingThis}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSendSingleWhatsapp(guest);
                            }}
                            className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer shadow-xs ${
                              isSendingThis
                                ? 'bg-amber-100 text-amber-800 cursor-wait'
                                : isSuccessThis
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : guest.whatsappStatus === 'delivered'
                                ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                                : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
                            }`}
                          >
                            {isSendingThis ? (
                              <>
                                <Loader2 className="w-3 h-3 animate-spin" />
                                <span>Enviando...</span>
                              </>
                            ) : isSuccessThis ? (
                              <>
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>Enviado!</span>
                              </>
                            ) : (
                              <>
                                <Phone className="w-3 h-3" />
                                <span>{guest.whatsappStatus === 'delivered' ? 'Reenviar' : 'Enviar'}</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Email Tab View */}
      {activeTab === 'email' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6 text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Disparo Transacional em Massa por E-mail</h3>
              <p className="text-xs text-slate-500">Envie e-mails com HTML responsivo contendo o QR Code em anexo e link do convite</p>
            </div>

            <button
              disabled={isBulkSending || pendingEmail.length === 0}
              onClick={() => {
                setIsBulkSending(true);
                setBulkProgress(0);
                const pending = guests.filter(g => g.emailStatus !== 'delivered');
                let current = 0;
                const interval = setInterval(() => {
                  if (current >= pending.length) {
                    clearInterval(interval);
                    setIsBulkSending(false);
                    setBulkProgress(100);
                    return;
                  }
                  const target = pending[current];
                  onUpdateGuestStatus(target.id, {
                    emailStatus: 'delivered',
                    sentAt: new Date().toLocaleString('pt-BR'),
                  });
                  onLogAudit('email_sent', `E-mail transacional com QR Code entregue para ${target.email}`, target.id, target.name, 'success');
                  current++;
                  setBulkProgress(Math.round((current / pending.length) * 100));
                }, 300);
              }}
              className={`px-4 py-2 rounded-xl font-bold text-white shadow-xs flex items-center gap-2 ${
                pendingEmail.length > 0 && !isBulkSending
                  ? 'bg-blue-600 hover:bg-blue-700 cursor-pointer shadow-blue-600/20'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <Send className="w-4 h-4" />
              <span>Disparar E-mails ({pendingEmail.length} pendentes)</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Assunto do E-mail</label>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-600 space-y-1">
                <span className="font-bold text-slate-800 block text-xs">HTML Automático com Antifraude</span>
                <p className="text-[11px]">
                  O servidor gera o layout de alta fidelidade do evento, insere o QR Code criptografado em Base64 e anexa o botão direto para o Smartphone Pass.
                </p>
              </div>
            </div>

            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-2">
              <span className="font-bold text-slate-800 block">Prévia da Lista de Destinatários</span>
              <div className="divide-y divide-slate-200/60 max-h-48 overflow-y-auto">
                {guests.map(g => (
                  <div key={g.id} className="py-2 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-slate-800">{g.name}</div>
                      <div className="text-[11px] text-slate-500">{g.email || 'Sem e-mail'}</div>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      g.emailStatus === 'delivered' ? 'bg-blue-100 text-blue-800' : 'bg-slate-200 text-slate-600'
                    }`}>
                      {g.emailStatus === 'delivered' ? 'Entregue' : 'Pendente'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Gateway Settings Tab View */}
      {activeTab === 'gateway_settings' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6 text-xs">
          <div className="pb-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Settings2 className="w-5 h-5 text-purple-600" />
                <span>Configuração de Disparos Automáticos via WhatsApp (API)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Envie os convites e QR Codes em segundo plano diretamente para o WhatsApp dos participantes sem precisar abrir abas manuais.
              </p>
            </div>

            {/* Quick Presets */}
            <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => {
                  setGatewayType('zapi');
                  if (!gatewayUrl || gatewayUrl.includes('evolution')) {
                    setGatewayUrl('https://api.z-api.io/instances/SUA_INSTANCIA/token/SEU_TOKEN/send-text');
                  }
                }}
                className={`px-3 py-1.5 font-bold rounded-lg text-xs cursor-pointer transition-all ${
                  gatewayType === 'zapi'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                ⚡ Z-API (Mais Fácil / Plug & Play)
              </button>
              <button
                type="button"
                onClick={() => {
                  setGatewayType('evolution');
                  if (!gatewayUrl || gatewayUrl.includes('z-api')) {
                    setGatewayUrl('https://evolution.seudominio.com.br');
                  }
                }}
                className={`px-3 py-1.5 font-bold rounded-lg text-xs cursor-pointer transition-all ${
                  gatewayType === 'evolution'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                🐳 Evolution API v2 (Docker/VPS)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Form Column (6 cols) */}
            <div className="lg:col-span-6 space-y-4">
              {gatewayType === 'zapi' ? (
                /* Z-API Specific Form Fields */
                <>
                  <div className="p-3.5 bg-blue-50/80 border border-blue-200 rounded-xl space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-bold text-blue-900 text-xs">
                        <Zap className="w-4 h-4 text-blue-600" />
                        <span>Configuração Z-API (3 Campos)</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab('whatsapp');
                          setSendMethod('desktop_app');
                        }}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[11px] cursor-pointer transition-colors shadow-xs"
                      >
                        👉 Prefiro Disparo sem API (WhatsApp Web/App)
                      </button>
                    </div>
                    <p className="text-[11px] text-blue-800 leading-relaxed">
                      Para disparo 100% em segundo plano, preencha os 3 dados abaixo do seu painel Z-API:
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1 text-xs">
                        1. ID da Instância:
                      </label>
                      <input
                        type="text"
                        placeholder="ex: 3F7B4A1B64AB7169CD2D627646EA55D4"
                        value={zapiInstanceId}
                        onChange={(e) => {
                          let val = e.target.value.trim();
                          if (val.includes('/instances/')) {
                            const match = val.match(/\/instances\/([^\/]+)\/token\/([^\/]+)/);
                            if (match) {
                              setZapiInstanceId(match[1]);
                              setZapiToken(match[2]);
                              setGatewayUrl(val);
                              return;
                            }
                          }
                          setZapiInstanceId(val);
                          if (val && zapiToken) {
                            setGatewayUrl(`https://api.z-api.io/instances/${val}/token/${zapiToken}/send-text`);
                          }
                        }}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1 text-xs flex items-center justify-between">
                        <span>2. Token da Instância:</span>
                        <span className="text-[10px] text-blue-600 font-bold">Aba "Dados da instância"</span>
                      </label>
                      <input
                        type="text"
                        placeholder="ex: 0F43A5365B0E844A3C8F16DE"
                        value={zapiToken}
                        onChange={(e) => {
                          let val = e.target.value.trim();
                          if (val.includes('/instances/')) {
                            const match = val.match(/\/instances\/([^\/]+)\/token\/([^\/]+)/);
                            if (match) {
                              setZapiInstanceId(match[1]);
                              setZapiToken(match[2]);
                              setGatewayUrl(val);
                              return;
                            }
                          }
                          setZapiToken(val);
                          if (zapiInstanceId && val) {
                            setGatewayUrl(`https://api.z-api.io/instances/${zapiInstanceId}/token/${val}/send-text`);
                          }
                        }}
                        className={`w-full p-2.5 bg-slate-50 border rounded-xl text-xs font-mono text-slate-800 focus:bg-white focus:ring-2 ${
                          zapiInstanceId && zapiToken && zapiInstanceId === zapiToken
                            ? 'border-red-400 bg-red-50 text-red-900 focus:ring-red-500/20'
                            : 'border-slate-200 focus:ring-blue-500/20'
                        }`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1 text-xs flex items-center justify-between">
                      <span className="text-blue-900 font-bold">3. Client-Token da Z-API (Chave de Segurança da Conta):</span>
                      <span className="text-[10px] text-purple-700 font-bold">Obrigatório na Z-API</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Cole aqui o Token de Segurança da sua conta Z-API"
                      value={zapiClientToken}
                      onChange={(e) => setZapiClientToken(e.target.value.trim())}
                      className="w-full p-2.5 bg-white border-2 border-blue-300 rounded-xl text-xs font-mono text-slate-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20"
                    />
                    <div className="mt-1.5 p-2 bg-blue-50/60 rounded-lg text-[11px] text-blue-900 leading-tight space-y-1">
                      <p>
                        🔍 <strong>Como pegar o Client-Token em 10 segundos:</strong>
                      </p>
                      <p className="text-slate-600">
                        1. No painel da Z-API, clique no menu lateral <strong>"Segurança"</strong> (ou no seu nome <strong>Emerson Akamine</strong> no topo direito &gt; <strong>Segurança</strong>).
                      </p>
                      <p className="text-slate-600">
                        2. No módulo <strong>"Token de Segurança da Conta"</strong>, clique em <strong>"Configurar agora" / "Ativar token"</strong>, copie o código e cole no campo acima!
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                /* Evolution API Form Fields */
                <>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      1. URL Base da sua Evolution API:
                    </label>
                    <input
                      type="text"
                      placeholder="https://evolution.seudominio.com.br"
                      value={gatewayUrl}
                      onChange={(e) => setGatewayUrl(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:bg-white focus:ring-2 focus:ring-purple-500/20"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      2. API Key Global (AUTHENTICATION_API_KEY):
                    </label>
                    <input
                      type="password"
                      placeholder="Chave secreta configurada no .env da Evolution API"
                      value={gatewayToken}
                      onChange={(e) => setGatewayToken(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:bg-white focus:ring-2 focus:ring-purple-500/20"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      3. Nome da Instância no WhatsApp:
                    </label>
                    <input
                      type="text"
                      placeholder="ex: bp_eventos"
                      value={gatewayInstance}
                      onChange={(e) => setGatewayInstance(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:bg-white focus:ring-2 focus:ring-purple-500/20"
                    />
                  </div>
                </>
              )}

              {/* Format Selector */}
              <div className="p-3.5 bg-purple-50/50 border border-purple-200 rounded-2xl space-y-2">
                <label className="font-bold text-purple-950 block text-xs">
                  {gatewayType === 'zapi' ? '3. Formato do Disparo no WhatsApp:' : '4. Formato do Disparo no WhatsApp:'}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setApiDispatchFormat('card_image')}
                    className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                      apiDispatchFormat === 'card_image'
                        ? 'border-purple-600 bg-purple-600 text-white font-bold shadow-xs'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-purple-300'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-xs">
                      <span>🖼️ Card com QR Code</span>
                    </div>
                    <p className={`text-[10px] mt-0.5 ${apiDispatchFormat === 'card_image' ? 'text-purple-100' : 'text-slate-500'}`}>
                      Envia a imagem PNG do convite com o QR Code e legenda.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setApiDispatchFormat('text_only')}
                    className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                      apiDispatchFormat === 'text_only'
                        ? 'border-purple-600 bg-purple-600 text-white font-bold shadow-xs'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-purple-300'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-xs">
                      <span>📝 Apenas Texto + Link</span>
                    </div>
                    <p className={`text-[10px] mt-0.5 ${apiDispatchFormat === 'text_only' ? 'text-purple-100' : 'text-slate-500'}`}>
                      Envia mensagem de texto com link direto para o convite.
                    </p>
                  </button>
                </div>
              </div>

              {/* Test Connection Box */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                    <span>Testar Conexão e Enviar Mensagem Real</span>
                  </span>
                  <span className="text-[10px] text-slate-400">Disparo real</span>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Seu número com DDD (ex: 5541999999999)"
                    value={testPhone}
                    onChange={(e) => setTestPhone(e.target.value)}
                    className="flex-1 p-2 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-800"
                  />
                  <button
                    type="button"
                    disabled={isTestingApi || !gatewayUrl}
                    onClick={handleTestApiGateway}
                    className={`px-3.5 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs shrink-0 ${
                      isTestingApi || !gatewayUrl
                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
                    }`}
                  >
                    {isTestingApi ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    <span>{isTestingApi ? 'Enviando...' : 'Enviar Teste'}</span>
                  </button>
                </div>

                {testApiResult && (
                  <div
                    className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${
                      testApiResult.success
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-red-50 text-red-800 border-red-200'
                    }`}
                  >
                    {testApiResult.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    )}
                    <div className="space-y-0.5">
                      <p className="font-bold">{testApiResult.success ? 'Sucesso no Envio!' : 'Falha no Disparo'}</p>
                      <span className="text-[11px] leading-relaxed block">{testApiResult.message}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Helper Column (6 cols) */}
            <div className="lg:col-span-6 space-y-4">
              {gatewayType === 'zapi' ? (
                <div className="bg-blue-50/70 rounded-2xl border border-blue-200 p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-blue-950 text-sm">
                      <CheckCircle2 className="w-5 h-5 text-blue-600" />
                      <span>Como Funciona o Disparo Z-API</span>
                    </div>
                  </div>

                  <div className="space-y-3 text-[11px] text-blue-900/90 leading-relaxed">
                    <div className="bg-white p-3.5 rounded-xl border border-blue-200 space-y-1.5 shadow-xs">
                      <div className="font-bold text-blue-950 flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold">1</span>
                        <span>Credenciais da Instância (Campos 1 e 2)</span>
                      </div>
                      <p className="text-slate-600 leading-relaxed">
                        No painel da Z-API, na aba <strong>"Dados da instância web"</strong>:
                      </p>
                      <ul className="list-disc list-inside text-slate-700 space-y-0.5 font-mono text-[10px] pl-1">
                        <li><strong>ID da instância:</strong> <code className="bg-slate-100 px-1 py-0.5 rounded">3F7B4A1B64AB7169CD2D627646EA55D4</code></li>
                        <li><strong>Token da instância:</strong> <code className="bg-slate-100 px-1 py-0.5 rounded">0F43A5365B0E844A3C8F16DE</code></li>
                      </ul>
                    </div>

                    <div className="bg-white p-3.5 rounded-xl border border-blue-200 space-y-1.5 shadow-xs">
                      <div className="font-bold text-blue-950 flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold">2</span>
                        <span>Client-Token (Campo 3) — O motivo do aviso</span>
                      </div>
                      <p className="text-slate-600 leading-relaxed">
                        A Z-API exige um <strong>Token de Segurança da Conta</strong> para autorizar disparos.
                      </p>
                      <div className="bg-blue-50 p-2.5 rounded-lg border border-blue-200 text-blue-950 text-[11px] space-y-1">
                        <p>👉 No topo direito do painel da Z-API, clique no seu nome <strong>Emerson Akamine</strong> (ou menu lateral <strong>Segurança</strong>).</p>
                        <p>👉 Ative o <strong>Token de Segurança</strong>, copie e cole no campo <strong>3. Client-Token</strong>!</p>
                      </div>
                    </div>

                    {/* Direct alternative banner */}
                    <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-4 rounded-xl border border-emerald-300 space-y-2">
                      <div className="font-bold text-emerald-950 text-xs flex items-center gap-1.5">
                        <span>🚀 Quer enviar agora sem configurar nenhuma chave?</span>
                      </div>
                      <p className="text-emerald-800 text-[11px] leading-relaxed">
                        Você não precisa pagar nem configurar a Z-API se não quiser. O GuestGate QR possui o <strong>Modo Disparo Direto</strong>: você clica no convidado e ele abre seu WhatsApp Desktop ou Web já com o texto pronto!
                      </p>
                      <button
                        type="button"
                        onClick={() => setActiveTab('whatsapp_desktop')}
                        className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-all"
                      >
                        <Smartphone className="w-4 h-4" />
                        <span>Abrir Disparo Direto (WhatsApp Web / Desktop)</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-purple-50/70 rounded-2xl border border-purple-200 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-purple-950 flex items-center gap-1.5">
                      <Laptop className="w-4 h-4 text-purple-700" />
                      <span>Guia Rápido: Como Subir a Evolution API (Docker)</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowDockerGuide(!showDockerGuide)}
                      className="text-purple-700 font-bold text-[11px] hover:underline cursor-pointer"
                    >
                      {showDockerGuide ? 'Ocultar' : 'Ver Passo a Passo'}
                    </button>
                  </div>

                  {showDockerGuide && (
                    <div className="space-y-3 text-[11px] text-purple-900/90 leading-relaxed">
                      <div className="space-y-1">
                        <div className="font-bold text-purple-950">Passo 1: Criar arquivo <code className="bg-white/80 px-1 rounded font-mono">docker-compose.yml</code> no seu servidor:</div>
                        <pre className="bg-slate-900 text-slate-100 p-2.5 rounded-xl font-mono text-[10px] overflow-x-auto leading-tight">
{`version: '3.7'
services:
  evolution-api:
    image: atendai/evolution-api:v2.1.2
    container_name: evolution_api
    restart: always
    ports:
      - "8080:8080"
    environment:
      - SERVER_URL=https://evolution.seudominio.com.br
      - AUTHENTICATION_API_KEY=sua_chave_secreta_aqui
      - DATABASE_ENABLED=false
      - REDIS_ENABLED=false`}
                        </pre>
                      </div>

                      <div className="space-y-1">
                        <div className="font-bold text-purple-950">Passo 2: Iniciar o container</div>
                        <div className="bg-white p-2 rounded-lg font-mono text-[10px] text-slate-800 border border-purple-200">
                          docker compose up -d
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="font-bold text-purple-950">Passo 3: Criar a Instância e Conectar o WhatsApp</div>
                        <p className="text-[10px]">
                          Acesse a interface ou use o endpoint <code className="font-mono bg-white px-1 rounded">/instance/create</code> com nome <code className="font-mono bg-white px-1 rounded">bp_eventos</code> e escaneie o QR Code com o aplicativo WhatsApp do seu celular.
                        </p>
                      </div>

                      <div className="space-y-1">
                        <div className="font-bold text-purple-950">Passo 4: Integrar no GuestGate QR</div>
                        <p className="text-[10px]">
                          Cole a URL, sua chave secreta e o nome da instância nos campos ao lado e clique em <strong>"Enviar Teste"</strong>!
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
