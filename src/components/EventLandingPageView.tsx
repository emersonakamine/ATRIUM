import React from 'react';
import { 
  EventData, 
  EventLandingPageConfig, 
  EventScheduleItem, 
  Guest, 
  TicketCategory,
  AuditActionType
} from '../types';
import { getGuestInviteUrl, getEventLandingUrl, getPublicBaseUrl } from '../utils/urlHelper';
import { 
  Globe, 
  Clock, 
  Utensils, 
  MapPin, 
  CheckCircle2, 
  Plus, 
  Trash2, 
  ExternalLink, 
  Copy, 
  Eye, 
  Smartphone, 
  Monitor, 
  Sparkles, 
  Share2, 
  ShieldCheck, 
  Info,
  Car,
  Shirt,
  Calendar,
  Save,
  MessageCircle,
  Wine,
  Coffee,
  Check
} from 'lucide-react';

interface EventLandingPageViewProps {
  event: EventData;
  categories: TicketCategory[];
  sampleGuest?: Guest;
  onSaveLandingConfig: (updatedConfig: EventLandingPageConfig) => void;
  onOpenPublicLanding: (guestId?: string) => void;
  onLogAudit: (action: AuditActionType, details: string, guestId?: string, guestName?: string, severity?: 'info' | 'success' | 'warning' | 'error') => void;
}

export const EventLandingPageView: React.FC<EventLandingPageViewProps> = ({
  event,
  categories,
  sampleGuest,
  onSaveLandingConfig,
  onOpenPublicLanding,
  onLogAudit,
}) => {
  const [activeTab, setActiveTab] = React.useState<'schedule' | 'menu' | 'location' | 'general' | 'rsvp'>('schedule');
  const [previewDevice, setPreviewDevice] = React.useState<'mobile' | 'desktop'>('mobile');
  const [copiedLink, setCopiedLink] = React.useState(false);
  const [saveSuccess, setSaveSuccess] = React.useState(false);

  // Initial config with smart defaults based on event data
  const initialConfig: EventLandingPageConfig = React.useMemo(() => {
    return {
      enabled: event.landingPageConfig?.enabled ?? true,
      heroTagline: event.landingPageConfig?.heroTagline || event.subtitle || 'Você é nosso convidado de honra para esta celebração exclusiva.',
      welcomeMessage: event.landingPageConfig?.welcomeMessage || 'Apresente seu QR Code digital na recepção para credenciamento expresso.',
      bannerImageUrl: event.landingPageConfig?.bannerImageUrl || event.coverUrl || '',
      
      // Horários & Cronograma
      entryTime: event.landingPageConfig?.entryTime || event.startTime || '19h30',
      startTime: event.landingPageConfig?.startTime || '20h30',
      endTime: event.landingPageConfig?.endTime || event.endTime || '02h00',
      scheduleItems: event.landingPageConfig?.scheduleItems || [
        { id: '1', time: '19h30', title: 'Abertura das Portas & Welcome Drink', description: 'Recepção dos convidados, coquetel de boas-vindas e credenciamento ágil com QR Code.' },
        { id: '2', time: '20h30', title: 'Cerimônia Oficial & Discursos', description: 'Apresentação institucional, homenagens e homenageados especiais da noite.' },
        { id: '3', time: '21h30', title: 'Jantar Gastronômico & Lounge', description: 'Serviço do menu requintado assinado pelo chef e apresentações musicais.' },
        { id: '4', time: '02h00', title: 'Encerramento do Evento', description: 'Café de despedida e serviço de valet.' },
      ],
      
      // Cardápio
      menuEnabled: event.landingPageConfig?.menuEnabled ?? true,
      menuTitle: event.landingPageConfig?.menuTitle || 'Menu Gastronômico & Coquetelaria',
      welcomeDrinks: event.landingPageConfig?.welcomeDrinks || 'Champagne Brut, Gin Tônica Artesanal com especiarias, Coquetéis autorais e Águas aromatizadas.',
      starters: event.landingPageConfig?.starters || 'Tartar de salmão com raspas de limão siciliano, Crocante de brie com geleia de damasco e Bruschettas rústicas.',
      mainCourses: event.landingPageConfig?.mainCourses || 'Tornedor de Filé Mignon ao molho poivre com risoto trufado / Opção Vegetariana: Ravióli de burrata ao molho de tomates rústicos e manjericão fresco.',
      desserts: event.landingPageConfig?.desserts || 'Mousse de chocolate belga com praliné de avelãs e Torta fina de maçã com sorvete artesanal de baunilha.',
      beverages: event.landingPageConfig?.beverages || 'Vinhos selecionados (Tinto e Branco), Cervejas Premium, Refrigerantes, Sucos naturais e Estação de Café expresso.',
      dietaryNotice: event.landingPageConfig?.dietaryNotice || 'Opções sem glúten, veganas e kosher disponíveis mediante solicitação com o concierge ou garçom.',
      
      // Localização
      venueName: event.landingPageConfig?.venueName || event.locationName || 'Belmond Copacabana Palace',
      address: event.landingPageConfig?.address || event.address || 'Av. Atlântica, 1702 - Copacabana',
      cityState: event.landingPageConfig?.cityState || event.cityState || 'Rio de Janeiro - RJ',
      googleMapsUrl: event.landingPageConfig?.googleMapsUrl || `https://maps.google.com/?q=${encodeURIComponent((event.locationName || '') + ' ' + (event.address || ''))}`,
      wazeUrl: event.landingPageConfig?.wazeUrl || `https://waze.com/ul?q=${encodeURIComponent((event.locationName || '') + ' ' + (event.address || ''))}`,
      parkingInfo: event.landingPageConfig?.parkingInfo || 'Serviço de Valet cortesia e estacionamento coberto no local com segurança privativa.',
      dressCode: event.landingPageConfig?.dressCode || 'Passeio Completo / Gala (Traje Social Fino).',
      
      // RSVP
      allowRsvp: event.landingPageConfig?.allowRsvp ?? true,
      rsvpDeadline: event.landingPageConfig?.rsvpDeadline || event.startDate || 'Até 48h antes do evento',
      contactWhatsapp: event.landingPageConfig?.contactWhatsapp || '5541999999999',
      importantNotices: event.landingPageConfig?.importantNotices || [
        'O QR Code é pessoal e intransferível. Tenha-o na tela do celular ao chegar.',
        'Haverá serviço de valet gratuito na entrada principal.',
        'Em caso de dúvidas sobre restrições alimentares, fale com nossa equipe.',
      ],
    };
  }, [event]);

  const [config, setConfig] = React.useState<EventLandingPageConfig>(initialConfig);

  // Sync if event changes
  React.useEffect(() => {
    setConfig(initialConfig);
  }, [initialConfig]);

  const handleUpdateField = <K extends keyof EventLandingPageConfig>(key: K, value: EventLandingPageConfig[K]) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    onSaveLandingConfig(config);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
    onLogAudit('guest_updated', `Configurações da Landing Page do evento "${event.title}" foram salvas`, undefined, undefined, 'success');
  };

  // Schedule list helpers
  const handleAddScheduleItem = () => {
    const newItem: EventScheduleItem = {
      id: `sch_${Date.now()}`,
      time: '22h00',
      title: 'Nova Atração / Momento',
      description: 'Descrição detalhada do que acontecerá neste horário.',
    };
    setConfig(prev => ({
      ...prev,
      scheduleItems: [...(prev.scheduleItems || []), newItem],
    }));
  };

  const handleRemoveScheduleItem = (id: string) => {
    setConfig(prev => ({
      ...prev,
      scheduleItems: (prev.scheduleItems || []).filter(item => item.id !== id),
    }));
  };

  const handleUpdateScheduleItem = (id: string, updates: Partial<EventScheduleItem>) => {
    setConfig(prev => ({
      ...prev,
      scheduleItems: (prev.scheduleItems || []).map(item => item.id === id ? { ...item, ...updates } : item),
    }));
  };

  const publicGuestUrl = getGuestInviteUrl(sampleGuest?.publicCode || 'convidado');
  const publicGeneralUrl = getEventLandingUrl(event.code);

  const [copiedType, setCopiedType] = React.useState<'general' | 'guest' | null>(null);

  const handleCopyGeneralLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(publicGeneralUrl);
      setCopiedType('general');
      setTimeout(() => setCopiedType(null), 2000);
    }
  };

  const handleCopyGuestLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(publicGuestUrl);
      setCopiedType('guest');
      setTimeout(() => setCopiedType(null), 2000);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
              <Globe className="w-5 h-5" />
            </span>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Página do Convidado (Landing Page do Evento)
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-emerald-50 text-emerald-700 border border-emerald-200">
                Público
              </span>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 max-w-3xl leading-relaxed">
            Esta é a página web que o convidado abre ao clicar no link. Ela exibe o <strong>Convite Digital com QR Code</strong>, os <strong>Horários de Entrada e Saída</strong>, o <strong>Cardápio Gastronômico</strong>, a <strong>Localização com GPS (Waze/Google Maps)</strong> e o <strong>Traje Recomendado</strong>.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleCopyGeneralLink}
            className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-2 transition-all cursor-pointer border border-slate-200"
            title="Copiar link geral do evento (com formulário de busca de convite)"
          >
            {copiedType === 'general' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-500" />}
            <span>{copiedType === 'general' ? 'Link Geral Copiado!' : 'Copiar Link Geral do Evento'}</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenPublicLanding(sampleGuest?.id)}
            className="px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs flex items-center gap-2 transition-all cursor-pointer shadow-xs"
          >
            <Eye className="w-4 h-4" />
            <span>Visualizar Como Convidado</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 transition-all cursor-pointer shadow-md shadow-blue-500/20"
          >
            <Save className="w-4 h-4" />
            <span>{saveSuccess ? 'Salvo com Sucesso!' : 'Salvar Alterações'}</span>
          </button>
        </div>
      </div>

      {/* URL Banner & Info */}
      <div className="bg-blue-50/80 border border-blue-200/80 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-start gap-2.5">
          <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-bold text-blue-950">Links Públicos Disponíveis para o Evento</span>
            <p className="text-blue-800 text-[11px] leading-relaxed">
              Você pode enviar o <strong>Link Geral do Evento</strong> (onde o convidado busca seu nome/código) ou o <strong>Link Individual</strong> já com o QR Code pronto. Ambos são 100% públicos e abrem direto no celular sem pedir login.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
          <button
            type="button"
            onClick={handleCopyGeneralLink}
            className="flex-1 sm:flex-none px-3 py-1.5 bg-white hover:bg-blue-50 text-blue-700 border border-blue-300 font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>{copiedType === 'general' ? 'Copiado!' : 'Copiar Link Geral'}</span>
          </button>
          <a
            href={publicGeneralUrl}
            target="_blank"
            rel="noreferrer"
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs inline-flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Testar Página</span>
          </a>
        </div>
      </div>

      {/* Main Two-Column Layout (Config Editor + Live Preview) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Config Form (7 Cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Navigation Tabs */}
          <div className="bg-slate-200/70 p-1 rounded-2xl flex items-center gap-1 overflow-x-auto text-xs font-bold text-slate-600">
            <button
              type="button"
              onClick={() => setActiveTab('schedule')}
              className={`flex-1 py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'schedule'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>Horários & Programação</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('menu')}
              className={`flex-1 py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'menu'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Utensils className="w-4 h-4" />
              <span>Cardápio & Bebidas</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('location')}
              className={`flex-1 py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'location'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <MapPin className="w-4 h-4" />
              <span>Endereço & Traje</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('general')}
              className={`flex-1 py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'general'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>Apresentação & Banner</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('rsvp')}
              className={`flex-1 py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'rsvp'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>RSVP & Avisos</span>
            </button>
          </div>

          {/* Tab 1: Horários & Programação */}
          {activeTab === 'schedule' && (
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-600" />
                  <span>Horários de Entrada, Cerimônia e Saída</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Configure os horários principais para que o convidado se programe com facilidade.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Horário de Entrada (Portas)</label>
                  <input
                    type="text"
                    value={config.entryTime || ''}
                    onChange={(e) => handleUpdateField('entryTime', e.target.value)}
                    placeholder="Ex: 19h30"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:border-blue-500 focus:outline-hidden"
                  />
                  <span className="text-[10px] text-slate-400">Welcome Drink e Abertura</span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Início da Cerimônia / Jantar</label>
                  <input
                    type="text"
                    value={config.startTime || ''}
                    onChange={(e) => handleUpdateField('startTime', e.target.value)}
                    placeholder="Ex: 20h30"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:border-blue-500 focus:outline-hidden"
                  />
                  <span className="text-[10px] text-slate-400">Início das apresentações</span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Horário de Encerramento (Saída)</label>
                  <input
                    type="text"
                    value={config.endTime || ''}
                    onChange={(e) => handleUpdateField('endTime', e.target.value)}
                    placeholder="Ex: 02h00"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:border-blue-500 focus:outline-hidden"
                  />
                  <span className="text-[10px] text-slate-400">Previsão de término</span>
                </div>
              </div>

              {/* Cronograma Detalhado (Timeline) */}
              <div className="pt-4 border-t border-slate-100 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Cronograma Detalhado do Evento
                    </h4>
                    <p className="text-[11px] text-slate-500">Momentos do evento que aparecem em formato de linha do tempo</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddScheduleItem}
                    className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer border border-blue-200"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Adicionar Horário</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {(config.scheduleItems || []).map((item, index) => (
                    <div key={item.id} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-[11px] flex items-center justify-center shrink-0">
                          {index + 1}
                        </span>
                        <input
                          type="text"
                          value={item.time}
                          onChange={(e) => handleUpdateScheduleItem(item.id, { time: e.target.value })}
                          placeholder="Horário (ex: 19h30)"
                          className="w-24 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold focus:border-blue-500 focus:outline-hidden"
                        />
                        <input
                          type="text"
                          value={item.title}
                          onChange={(e) => handleUpdateScheduleItem(item.id, { title: e.target.value })}
                          placeholder="Título do Momento (ex: Abertura das Portas)"
                          className="flex-1 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold focus:border-blue-500 focus:outline-hidden"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveScheduleItem(item.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          title="Remover horário"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <textarea
                        rows={2}
                        value={item.description}
                        onChange={(e) => handleUpdateScheduleItem(item.id, { description: e.target.value })}
                        placeholder="Detalhes adicionais para o convidado..."
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 focus:border-blue-500 focus:outline-hidden resize-none"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Cardápio & Gastronomia */}
          {activeTab === 'menu' && (
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                    <Utensils className="w-5 h-5 text-blue-600" />
                    <span>Cardápio Gastronômico & Bebidas</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Apresente a experiência culinária que aguarda seus convidados.
                  </p>
                </div>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.menuEnabled}
                    onChange={(e) => handleUpdateField('menuEnabled', e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="text-xs font-bold text-slate-700">Exibir Cardápio</span>
                </label>
              </div>

              {config.menuEnabled && (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Título da Seção de Gastronomia</label>
                    <input
                      type="text"
                      value={config.menuTitle || ''}
                      onChange={(e) => handleUpdateField('menuTitle', e.target.value)}
                      placeholder="Ex: Menu Gastronômico Imperial & Coquetelaria"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:border-blue-500 focus:outline-hidden"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Wine className="w-3.5 h-3.5 text-amber-600" />
                      <span>Welcome Drinks & Coquetelaria de Entrada</span>
                    </label>
                    <textarea
                      rows={2}
                      value={config.welcomeDrinks || ''}
                      onChange={(e) => handleUpdateField('welcomeDrinks', e.target.value)}
                      placeholder="Ex: Champagne Brut, Gin Tônica Artesanal, Coquetéis autorais e Águas aromatizadas"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-hidden resize-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <span>🥗 Entradas e Canapés Volantes</span>
                    </label>
                    <textarea
                      rows={2}
                      value={config.starters || ''}
                      onChange={(e) => handleUpdateField('starters', e.target.value)}
                      placeholder="Ex: Tartar de salmão com raspas de limão siciliano, Crocante de brie com geleia de damasco..."
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-hidden resize-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <span>🥩 Pratos Principais</span>
                    </label>
                    <textarea
                      rows={2}
                      value={config.mainCourses || ''}
                      onChange={(e) => handleUpdateField('mainCourses', e.target.value)}
                      placeholder="Ex: Tornedor de Filé Mignon ao molho poivre com risoto trufado / Opção Vegetariana: Ravióli de burrata..."
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-hidden resize-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <span>🍰 Sobremesas</span>
                    </label>
                    <textarea
                      rows={2}
                      value={config.desserts || ''}
                      onChange={(e) => handleUpdateField('desserts', e.target.value)}
                      placeholder="Ex: Mousse de chocolate belga com praliné de avelãs e Torta fina de maçã..."
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-hidden resize-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Coffee className="w-3.5 h-3.5 text-amber-800" />
                      <span>Carta de Bebidas, Vinhos & Café</span>
                    </label>
                    <textarea
                      rows={2}
                      value={config.beverages || ''}
                      onChange={(e) => handleUpdateField('beverages', e.target.value)}
                      placeholder="Ex: Vinhos selecionados (Tinto e Branco), Cervejas Premium, Sucos e Café expresso com petit fours."
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-hidden resize-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-amber-800 flex items-center gap-1.5">
                      <Info className="w-3.5 h-3.5" />
                      <span>Aviso de Restrições Alimentares (Glúten, Vegano, Alergias)</span>
                    </label>
                    <input
                      type="text"
                      value={config.dietaryNotice || ''}
                      onChange={(e) => handleUpdateField('dietaryNotice', e.target.value)}
                      placeholder="Ex: Opções veganas, vegetarianas e sem glúten disponíveis mediante solicitação."
                      className="w-full px-3.5 py-2.5 bg-amber-50/60 border border-amber-200 rounded-xl text-xs text-amber-950 focus:bg-white focus:border-amber-400 focus:outline-hidden"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Endereço, Traje & Valet */}
          {activeTab === 'location' && (
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-5">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-blue-600" />
                  <span>Localização, GPS (Waze / Google Maps) e Traje</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Facilite a chegada dos convidados com botões de rota direta no celular e orientações de traje.
                </p>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Nome do Local / Salão</label>
                    <input
                      type="text"
                      value={config.venueName || ''}
                      onChange={(e) => handleUpdateField('venueName', e.target.value)}
                      placeholder="Ex: Belmond Copacabana Palace - Salão Nobre"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:border-blue-500 focus:outline-hidden"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Cidade e Estado</label>
                    <input
                      type="text"
                      value={config.cityState || ''}
                      onChange={(e) => handleUpdateField('cityState', e.target.value)}
                      placeholder="Ex: Rio de Janeiro - RJ"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:border-blue-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Endereço Completo</label>
                  <input
                    type="text"
                    value={config.address || ''}
                    onChange={(e) => handleUpdateField('address', e.target.value)}
                    placeholder="Ex: Av. Atlântica, 1702 - Copacabana"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:border-blue-500 focus:outline-hidden"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <span>🗺️ Link do Google Maps</span>
                    </label>
                    <input
                      type="text"
                      value={config.googleMapsUrl || ''}
                      onChange={(e) => handleUpdateField('googleMapsUrl', e.target.value)}
                      placeholder="https://maps.google.com/..."
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:bg-white focus:border-blue-500 focus:outline-hidden"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <span>🚗 Link do Waze</span>
                    </label>
                    <input
                      type="text"
                      value={config.wazeUrl || ''}
                      onChange={(e) => handleUpdateField('wazeUrl', e.target.value)}
                      placeholder="https://waze.com/ul?q=..."
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:bg-white focus:border-blue-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Car className="w-3.5 h-3.5 text-blue-600" />
                      <span>Estacionamento / Serviço de Valet</span>
                    </label>
                    <textarea
                      rows={2}
                      value={config.parkingInfo || ''}
                      onChange={(e) => handleUpdateField('parkingInfo', e.target.value)}
                      placeholder="Ex: Serviço de Valet gratuito na entrada principal com equipe de segurança."
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-hidden resize-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Shirt className="w-3.5 h-3.5 text-purple-600" />
                      <span>Dress Code (Traje Sugerido)</span>
                    </label>
                    <textarea
                      rows={2}
                      value={config.dressCode || ''}
                      onChange={(e) => handleUpdateField('dressCode', e.target.value)}
                      placeholder="Ex: Passeio Completo / Gala (Terno escuro ou smoking / Vestido longo)."
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-hidden resize-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 4: Apresentação & Banner */}
          {activeTab === 'general' && (
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-5">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-blue-600" />
                  <span>Apresentação & Banner Principal</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Textos de boas-vindas e identidade visual da página.
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Frase de Impacto / Tagline de Boas-Vindas</label>
                  <input
                    type="text"
                    value={config.heroTagline || ''}
                    onChange={(e) => handleUpdateField('heroTagline', e.target.value)}
                    placeholder="Ex: Você é nosso convidado de honra para esta celebração inesquecível."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:border-blue-500 focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Instrução Inicial para o Convidado</label>
                  <input
                    type="text"
                    value={config.welcomeMessage || ''}
                    onChange={(e) => handleUpdateField('welcomeMessage', e.target.value)}
                    placeholder="Ex: Apresente seu QR Code digital na recepção para credenciamento expresso."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:border-blue-500 focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">URL da Imagem de Fundo / Capa do Evento</label>
                  <input
                    type="text"
                    value={config.bannerImageUrl || ''}
                    onChange={(e) => handleUpdateField('bannerImageUrl', e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:bg-white focus:border-blue-500 focus:outline-hidden"
                  />
                  <span className="text-[10px] text-slate-400">Deixe em branco para usar o tema do convite</span>
                </div>
              </div>
            </div>
          )}

          {/* Tab 5: RSVP & Avisos */}
          {activeTab === 'rsvp' && (
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-5">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-blue-600" />
                  <span>Confirmação de Presença (RSVP) & Contato</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Permita que os convidados confirmem presença com 1 clique direto na página.
                </p>
              </div>

              <div className="space-y-4">
                <label className="flex items-center gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.allowRsvp}
                    onChange={(e) => handleUpdateField('allowRsvp', e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">Habilitar Botão de Confirmação de Presença (RSVP)</span>
                    <span className="text-[11px] text-slate-500">O convidado pode clicar em "Confirmar Presença" e o status atualiza instantaneamente no seu painel.</span>
                  </div>
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Prazo Limite de Confirmação</label>
                    <input
                      type="text"
                      value={config.rsvpDeadline || ''}
                      onChange={(e) => handleUpdateField('rsvpDeadline', e.target.value)}
                      placeholder="Ex: Até 48h antes do evento"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:border-blue-500 focus:outline-hidden"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                      <span>WhatsApp de Suporte / Dúvidas</span>
                    </label>
                    <input
                      type="text"
                      value={config.contactWhatsapp || ''}
                      onChange={(e) => handleUpdateField('contactWhatsapp', e.target.value)}
                      placeholder="Ex: 5541999999999"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:bg-white focus:border-blue-500 focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Live Interactive Preview (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Preview Header & Controls */}
          <div className="bg-slate-900 text-white rounded-3xl p-5 shadow-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Pré-visualização da Página
              </span>
            </div>

            <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setPreviewDevice('mobile')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  previewDevice === 'mobile' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
                title="Modo Mobile (Celular)"
              >
                <Smartphone className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setPreviewDevice('desktop')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  previewDevice === 'desktop' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
                title="Modo Desktop (Computador)"
              >
                <Monitor className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Device Mockup Frame */}
          <div className={`mx-auto bg-slate-900 rounded-[36px] p-3 shadow-2xl border-4 border-slate-800 transition-all ${
            previewDevice === 'mobile' ? 'max-w-[360px]' : 'max-w-full'
          }`}>
            {/* Screen Content */}
            <div className="bg-slate-950 rounded-[28px] overflow-hidden text-slate-100 max-h-[620px] overflow-y-auto p-4 space-y-4 text-xs">
              {/* Event Badge Header */}
              <div className="text-center py-2 border-b border-slate-800/80">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-400 block">
                  {event.title}
                </span>
                <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">
                  {config.heroTagline}
                </p>
              </div>

              {/* Guest Card Mockup */}
              <div className="bg-gradient-to-br from-slate-900 to-slate-850 p-4 rounded-2xl border border-slate-700/80 text-center space-y-2.5 shadow-md">
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                  Convite Digital & QR Code
                </span>
                <div className="bg-white p-3 rounded-2xl inline-block shadow-inner">
                  <div className="w-24 h-24 bg-slate-100 rounded-xl flex items-center justify-center text-slate-900 font-mono text-[9px] font-bold">
                    [QR CODE]
                  </div>
                </div>
                <div className="font-extrabold text-sm text-white">
                  {sampleGuest?.name || 'Emerson Marcio Akamine'}
                </div>
                <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {categories[0]?.name || 'Convidado de Gala'}
                </span>
              </div>

              {/* Schedule Preview Section */}
              <div className="bg-slate-900/90 p-3.5 rounded-2xl border border-slate-800 space-y-2.5">
                <div className="flex items-center gap-1.5 text-blue-400 font-extrabold text-[11px]">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Horários do Evento</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div className="bg-slate-950/80 p-2 rounded-xl border border-slate-800">
                    <span className="text-slate-400 block">Abertura:</span>
                    <strong className="text-white text-xs">{config.entryTime}</strong>
                  </div>
                  <div className="bg-slate-950/80 p-2 rounded-xl border border-slate-800">
                    <span className="text-slate-400 block">Encerramento:</span>
                    <strong className="text-white text-xs">{config.endTime}</strong>
                  </div>
                </div>
              </div>

              {/* Menu Preview Section */}
              {config.menuEnabled && (
                <div className="bg-slate-900/90 p-3.5 rounded-2xl border border-slate-800 space-y-2">
                  <div className="flex items-center gap-1.5 text-amber-400 font-extrabold text-[11px]">
                    <Utensils className="w-3.5 h-3.5" />
                    <span>Cardápio Gastronômico</span>
                  </div>
                  <p className="text-[10px] text-slate-300 line-clamp-3 leading-relaxed">
                    {config.mainCourses || config.starters}
                  </p>
                </div>
              )}

              {/* Location Preview Section */}
              <div className="bg-slate-900/90 p-3.5 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center gap-1.5 text-emerald-400 font-extrabold text-[11px]">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Localização & GPS</span>
                </div>
                <div className="text-[10px] text-slate-300">
                  <strong>{config.venueName}</strong>
                  <p className="text-slate-400 text-[9px]">{config.address}</p>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <span className="flex-1 py-1.5 bg-blue-600/30 text-blue-300 rounded-lg text-center font-bold text-[9px] border border-blue-500/30">
                    Google Maps
                  </span>
                  <span className="flex-1 py-1.5 bg-sky-600/30 text-sky-300 rounded-lg text-center font-bold text-[9px] border border-sky-500/30">
                    Waze
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
