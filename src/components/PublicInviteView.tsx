import React from 'react';
import { 
  EventData, 
  Guest, 
  TicketCategory, 
  InvitePatternStyle 
} from '../types';
import { generateQrDataUrl } from '../utils/qr';
import { getInviteBackgroundStyles } from '../utils/inviteStyles';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  ShieldCheck, 
  Download, 
  Share2, 
  CheckCircle2, 
  ArrowLeft,
  Sparkles,
  Users,
  Utensils,
  Car,
  Shirt,
  Wine,
  Coffee,
  MessageCircle,
  ExternalLink,
  Check,
  X,
  Navigation,
  Info,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { toPng } from 'html-to-image';

interface PublicInviteViewProps {
  event: EventData;
  guest?: Guest | null;
  category?: TicketCategory | null;
  onUpdateRsvp?: (guestId: string, isConfirmed: boolean) => void;
}

export const PublicInviteView: React.FC<PublicInviteViewProps> = ({
  event,
  guest,
  category,
  onUpdateRsvp,
}) => {
  const [qrUrl, setQrUrl] = React.useState<string>('');
  const [isDownloading, setIsDownloading] = React.useState(false);
  const [rsvpStatus, setRsvpStatus] = React.useState<'confirmed' | 'cancelled' | 'pending'>(
    guest?.status === 'confirmed' ? 'confirmed' : guest?.status === 'cancelled' ? 'cancelled' : 'pending'
  );
  const [rsvpFeedback, setRsvpFeedback] = React.useState<string | null>(null);
  const [showFullMenu, setShowFullMenu] = React.useState(true);

  const inviteCardRef = React.useRef<HTMLDivElement>(null);

  const layout = event.inviteLayout || {
    bgTheme: 'dark',
    accentColor: '#3b82f6',
    textColor: '#ffffff',
    title: 'CONVITE EXCLUSIVO',
    subtitle: event.subtitle || event.title,
    instructions: 'Apresente este QR Code na portaria principal.',
    showQr: true,
    showName: true,
    showCategory: true,
    showLocation: true,
    showTime: true,
    showDoc: true,
    showCompanions: true,
    cardStyle: 'modern',
  };

  const landing = event.landingPageConfig || {
    enabled: true,
    heroTagline: event.subtitle || 'Você é nosso convidado de honra para esta celebração exclusiva.',
    welcomeMessage: 'Apresente seu QR Code digital na recepção para credenciamento expresso.',
    bannerImageUrl: event.coverUrl || '',
    entryTime: event.startTime || '19h30',
    startTime: '20h30',
    endTime: event.endTime || '02h00',
    scheduleItems: [
      { id: '1', time: '19h30', title: 'Abertura das Portas & Welcome Drink', description: 'Recepção dos convidados, coquetel de boas-vindas e credenciamento ágil com QR Code.' },
      { id: '2', time: '20h30', title: 'Cerimônia Oficial & Discursos', description: 'Apresentação institucional, homenagens e homenageados especiais da noite.' },
      { id: '3', time: '21h30', title: 'Jantar Gastronômico & Lounge', description: 'Serviço do menu requintado assinado pelo chef e apresentações musicais.' },
      { id: '4', time: '02h00', title: 'Encerramento do Evento', description: 'Café de despedida e serviço de valet.' },
    ],
    menuEnabled: true,
    menuTitle: 'Menu Gastronômico & Coquetelaria',
    welcomeDrinks: 'Champagne Brut, Gin Tônica Artesanal com especiarias, Coquetéis autorais e Águas aromatizadas.',
    starters: 'Tartar de salmão com raspas de limão siciliano, Crocante de brie com geleia de damasco e Bruschettas rústicas.',
    mainCourses: 'Tornedor de Filé Mignon ao molho poivre com risoto trufado / Opção Vegetariana: Ravióli de burrata ao molho de tomates rústicos e manjericão fresco.',
    desserts: 'Mousse de chocolate belga com praliné de avelãs e Torta fina de maçã com sorvete artesanal de baunilha.',
    beverages: 'Vinhos selecionados (Tinto e Branco), Cervejas Premium, Refrigerantes, Sucos naturais e Estação de Café expresso.',
    dietaryNotice: 'Opções sem glúten, veganas e vegetarianas disponíveis mediante solicitação ao garçom.',
    venueName: event.locationName || 'Belmond Copacabana Palace',
    address: event.address || 'Av. Atlântica, 1702 - Copacabana',
    cityState: event.cityState || 'Rio de Janeiro - RJ',
    googleMapsUrl: `https://maps.google.com/?q=${encodeURIComponent((event.locationName || '') + ' ' + (event.address || ''))}`,
    wazeUrl: `https://waze.com/ul?q=${encodeURIComponent((event.locationName || '') + ' ' + (event.address || ''))}`,
    parkingInfo: 'Serviço de Valet cortesia e estacionamento coberto no local com segurança privativa.',
    dressCode: 'Passeio Completo / Gala (Traje Social Fino).',
    allowRsvp: true,
    rsvpDeadline: event.startDate || 'Até 48h antes do evento',
    contactWhatsapp: '5541999999999',
    importantNotices: [
      'O QR Code é pessoal e intransferível. Tenha-o na tela do celular ao chegar.',
      'Haverá serviço de valet gratuito na entrada principal.',
      'Em caso de dúvidas sobre restrições alimentares, fale com nossa equipe.',
    ],
  };

  const bgStyles = getInviteBackgroundStyles(layout);
  const isLight = bgStyles.isLight;

  React.useEffect(() => {
    if (guest?.qrPayloadToken) {
      generateQrDataUrl(guest.qrPayloadToken).then(setQrUrl);
    }
  }, [guest?.qrPayloadToken]);

  // Download digital pass image
  const handleDownloadPass = async () => {
    if (!inviteCardRef.current || !guest) return;
    try {
      setIsDownloading(true);
      const dataUrl = await toPng(inviteCardRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: '#090d16',
      });
      const link = document.createElement('a');
      link.download = `Convite-${guest.name.replace(/\s+/g, '-')}-${event.code}.png`;
      link.href = dataUrl;
      link.click();
    } catch (e) {
      console.error('Download pass error', e);
    } finally {
      setIsDownloading(false);
    }
  };

  // Google Calendar Link generator
  const handleAddToCalendar = () => {
    const title = encodeURIComponent(event.title);
    const details = encodeURIComponent(`${event.subtitle}\n\nLocal: ${landing.venueName} - ${landing.address}\nEntrada: ${landing.entryTime}${guest ? `\nSeu Código de Acesso: ${guest.publicCode}` : ''}`);
    const location = encodeURIComponent(`${landing.venueName}, ${landing.address}, ${landing.cityState}`);
    const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&location=${location}`;
    window.open(googleCalendarUrl, '_blank');
  };

  // RSVP Trigger
  const handleConfirmRsvp = (confirmed: boolean) => {
    if (!guest) return;
    const newStatus = confirmed ? 'confirmed' : 'cancelled';
    setRsvpStatus(newStatus);
    setRsvpFeedback(confirmed ? '🎉 Presença confirmada com sucesso! Aguardamos você.' : 'Informamos que não poderá comparecer.');
    if (onUpdateRsvp) {
      onUpdateRsvp(guest.id, confirmed);
    }
    setTimeout(() => setRsvpFeedback(null), 4000);
  };

  const isEventExpired = event.status === 'completed' || event.status === 'archived';
  const mapsUrl = landing.googleMapsUrl || `https://maps.google.com/?q=${encodeURIComponent(landing.venueName + ' ' + landing.address)}`;
  const wazeUrl = landing.wazeUrl || `https://waze.com/ul?q=${encodeURIComponent(landing.venueName + ' ' + landing.address)}`;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased selection:bg-blue-600 selection:text-white pb-16">
      {/* Event Expired Notice if applicable */}
      {isEventExpired && (
        <div className="bg-amber-500/20 border-b border-amber-500/30 px-4 py-3 text-center text-xs font-bold text-amber-300 flex items-center justify-center gap-2">
          <Info className="w-4 h-4 text-amber-400" />
          <span>Este evento já foi realizado com sucesso em {event.startDate}. Agradecemos a presença de todos os convidados!</span>
        </div>
      )}

      {/* Hero Header Section with Event Branding */}
      <header className="relative bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 pt-10 pb-8 px-4 sm:px-6 overflow-hidden border-b border-slate-800/80">
        {/* Ambient Glows */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-64 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-10 right-1/4 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-3xl mx-auto text-center relative z-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/90 border border-slate-700 text-[11px] font-bold text-slate-300 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>{guest ? 'CONVITE DIGITAL OFICIAL' : 'PÁGINA OFICIAL DO EVENTO'}</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight">
            {event.title}
          </h1>

          <p className="text-xs sm:text-base text-slate-300 max-w-xl mx-auto font-medium leading-relaxed">
            {landing.heroTagline}
          </p>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-3 text-xs text-slate-300">
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/80 border border-slate-800">
              <Calendar className="w-3.5 h-3.5 text-blue-400" />
              <span>{event.startDate}</span>
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/80 border border-slate-800">
              <Clock className="w-3.5 h-3.5 text-blue-400" />
              <span>Entrada às {landing.entryTime}</span>
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/80 border border-slate-800">
              <MapPin className="w-3.5 h-3.5 text-blue-400" />
              <span>{landing.venueName}</span>
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-6 space-y-8">
        {/* 1. DIGITAL PASS CARD (Se houver convidado selecionado) */}
        {guest && (
          <section className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-400" />
                <span>Seu Passe de Entrada</span>
              </h2>
              <span className="text-[11px] text-slate-400">
                Código: <strong className="font-mono text-slate-200">{guest.publicCode}</strong>
              </span>
            </div>

            <div 
              ref={inviteCardRef}
              className={`w-full rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden relative border ${bgStyles.className}`}
              style={bgStyles.style}
            >
              {/* Readability Overlay */}
              {layout.bgImageUrl && (
                <div 
                  className="absolute inset-0 bg-cover bg-center pointer-events-none"
                  style={{
                    backgroundImage: `url(${layout.bgImageUrl})`,
                    filter: layout.bgBlur ? `blur(${layout.bgBlur}px)` : 'none',
                    transform: layout.bgBlur ? 'scale(1.08)' : 'none',
                  }}
                />
              )}

              {/* Content inside card */}
              <div className="relative z-10 space-y-5">
                {/* Card Top Title */}
                <div 
                  className="text-center pb-4 border-b"
                  style={{ borderColor: isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.15)' }}
                >
                  <span 
                    className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-widest block"
                    style={{ color: layout.accentColor }}
                  >
                    {layout.title || 'CONVITE EXCLUSIVO'}
                  </span>
                  <h3 
                    className="text-xl sm:text-2xl font-black tracking-tight mt-0.5"
                    style={{ color: layout.textColor }}
                  >
                    {event.title}
                  </h3>
                  <p 
                    className="text-xs mt-0.5 opacity-85"
                    style={{ color: layout.textColor }}
                  >
                    {layout.subtitle || event.subtitle}
                  </p>
                </div>

                {/* QR Code Container */}
                <div className="flex flex-col items-center justify-center py-2">
                  <div className="bg-white p-4 rounded-3xl shadow-2xl border-4 border-slate-900/40 inline-block text-center">
                    {qrUrl ? (
                      <img src={qrUrl} alt="QR Code de Acesso" className="w-48 h-48 sm:w-56 sm:h-56 mx-auto" />
                    ) : (
                      <div className="w-48 h-48 flex items-center justify-center text-slate-400">Gerando QR...</div>
                    )}
                    <div className="font-mono text-[10px] font-bold text-slate-800 mt-2 tracking-wider">
                      {guest.qrPayloadToken}
                    </div>
                  </div>

                  <div 
                    className="mt-3 flex items-center gap-1.5 text-xs font-semibold px-3.5 py-1 rounded-full border shadow-xs"
                    style={{
                      backgroundColor: isLight ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.4)',
                      borderColor: isLight ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.2)',
                      color: layout.textColor,
                    }}
                  >
                    <ShieldCheck className="w-4 h-4" style={{ color: layout.accentColor }} />
                    <span>QR Code Individual & Antifraude</span>
                  </div>
                </div>

                {/* Guest Details */}
                <div 
                  className="rounded-2xl p-4 border text-xs space-y-2.5 shadow-xs"
                  style={{
                    backgroundColor: isLight ? 'rgba(255,255,255,0.7)' : 'rgba(15,23,42,0.65)',
                    borderColor: isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.15)',
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="opacity-70" style={{ color: layout.textColor }}>Nome do Convidado:</span>
                    <strong className="text-sm font-black" style={{ color: layout.textColor }}>{guest.name}</strong>
                  </div>

                  {category && (
                    <div className="flex items-center justify-between">
                      <span className="opacity-70" style={{ color: layout.textColor }}>Categoria:</span>
                      <span className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] ${category.badgeBg || 'bg-blue-100 text-blue-800'}`}>
                        {category.name}
                      </span>
                    </div>
                  )}

                  {guest.companions > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="opacity-70" style={{ color: layout.textColor }}>Acompanhantes:</span>
                      <strong className="font-bold flex items-center gap-1" style={{ color: layout.accentColor }}>
                        <Users className="w-3.5 h-3.5" />
                        +{guest.companions} convidados inclusos
                      </strong>
                    </div>
                  )}

                  <div 
                    className="pt-2 border-t flex items-center justify-between"
                    style={{ borderColor: isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.15)' }}
                  >
                    <span className="opacity-70" style={{ color: layout.textColor }}>Status de Entrada:</span>
                    {guest.isCheckedIn ? (
                      <span className="text-emerald-500 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Check-in Realizado
                      </span>
                    ) : (
                      <span className="text-amber-400 font-bold">Válido para Acesso na Portaria</span>
                    )}
                  </div>
                </div>

                {/* Instructions */}
                <p 
                  className="text-center text-[11px] leading-relaxed p-3 rounded-xl border shadow-inner"
                  style={{
                    backgroundColor: isLight ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.3)',
                    borderColor: isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.12)',
                    color: layout.textColor,
                    opacity: 0.9,
                  }}
                >
                  {layout.instructions || 'Apresente este QR Code na portaria principal no dia do evento para liberação de sua credencial.'}
                </p>
              </div>
            </div>

            {/* Action Buttons for Guest */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={handleDownloadPass}
                disabled={isDownloading}
                className="py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-2 border border-slate-700 shadow-md cursor-pointer transition-all active:scale-98"
              >
                <Download className="w-4 h-4 text-blue-400" />
                <span>{isDownloading ? 'Gerando Imagem...' : 'Salvar Imagem do Convite (PNG)'}</span>
              </button>

              <button
                type="button"
                onClick={handleAddToCalendar}
                className="py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-2 border border-slate-700 shadow-md cursor-pointer transition-all active:scale-98"
              >
                <Calendar className="w-4 h-4 text-amber-400" />
                <span>Adicionar ao Google Agenda</span>
              </button>
            </div>
          </section>
        )}

        {/* 2. CONFIRMAÇÃO DE PRESENÇA (RSVP) */}
        {landing.allowRsvp && guest && (
          <section className="bg-gradient-to-r from-blue-950/40 via-slate-900 to-indigo-950/40 rounded-3xl p-5 sm:p-6 border border-blue-900/40 shadow-lg space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400">
                  <CheckCircle2 className="w-4 h-4" />
                </span>
                <h3 className="text-sm font-extrabold text-white">
                  Confirmação de Presença (RSVP)
                </h3>
              </div>
              <span className="text-[10px] text-slate-400 font-medium">
                {landing.rsvpDeadline}
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Por favor, confirme se você comparecerá ao evento para garantirmos seu lugar e prepararmos a melhor recepção gastronômica.
            </p>

            {rsvpFeedback && (
              <div className="p-3 bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 font-bold flex items-center gap-2">
                <Check className="w-4 h-4 shrink-0" />
                <span>{rsvpFeedback}</span>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => handleConfirmRsvp(true)}
                className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  rsvpStatus === 'confirmed'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 border border-emerald-500'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                }`}
              >
                <Check className="w-4 h-4 text-emerald-400" />
                <span>{rsvpStatus === 'confirmed' ? '✓ Presença Confirmada!' : 'Confirmar Minha Presença'}</span>
              </button>

              <button
                type="button"
                onClick={() => handleConfirmRsvp(false)}
                className={`py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  rsvpStatus === 'cancelled'
                    ? 'bg-red-950/80 text-red-300 border border-red-800'
                    : 'bg-slate-850 hover:bg-slate-800 text-slate-400 border border-slate-800'
                }`}
              >
                <X className="w-4 h-4 text-red-400" />
                <span>Não Poderei Ir</span>
              </button>
            </div>
          </section>
        )}

        {/* 3. HORÁRIOS & CRONOGRAMA DO EVENTO */}
        <section className="bg-slate-900/80 rounded-3xl p-6 border border-slate-800 shadow-lg space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
                <Clock className="w-4 h-4" />
              </span>
              <div>
                <h3 className="text-sm font-extrabold text-white">
                  Horários & Programação do Evento
                </h3>
                <p className="text-[11px] text-slate-400">Entrada, Cerimônia, Jantar e Encerramento</p>
              </div>
            </div>
          </div>

          {/* Quick Schedule Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Entrada & Welcome Drink
              </span>
              <strong className="text-base font-black text-blue-400">{landing.entryTime}</strong>
              <p className="text-[10px] text-slate-400">Abertura das portas e recepção</p>
            </div>

            <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Início Oficial
              </span>
              <strong className="text-base font-black text-amber-400">{landing.startTime}</strong>
              <p className="text-[10px] text-slate-400">Apresentações e cerimônia</p>
            </div>

            <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Encerramento
              </span>
              <strong className="text-base font-black text-slate-300">{landing.endTime}</strong>
              <p className="text-[10px] text-slate-400">Término do evento</p>
            </div>
          </div>

          {/* Timeline list */}
          {landing.scheduleItems && landing.scheduleItems.length > 0 && (
            <div className="pt-3 border-t border-slate-800/80 space-y-3">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 block">
                Cronograma Detalhado
              </span>
              <div className="space-y-2.5">
                {landing.scheduleItems.map((item, idx) => (
                  <div key={item.id || idx} className="flex items-start gap-3 p-3 bg-slate-950/60 rounded-2xl border border-slate-800/60">
                    <span className="px-2.5 py-1 rounded-lg bg-blue-600/20 text-blue-300 font-mono text-xs font-bold shrink-0 border border-blue-500/30">
                      {item.time}
                    </span>
                    <div className="space-y-0.5">
                      <h4 className="text-xs font-bold text-white">{item.title}</h4>
                      <p className="text-[11px] text-slate-400 leading-relaxed">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* 4. CARDÁPIO GASTRONÔMICO & BEBIDAS */}
        {landing.menuEnabled && (
          <section className="bg-slate-900/80 rounded-3xl p-6 border border-slate-800 shadow-lg space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <Utensils className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-sm font-extrabold text-white">
                    {landing.menuTitle || 'Cardápio Gastronômico & Bebidas'}
                  </h3>
                  <p className="text-[11px] text-slate-400">Experiência gastronômica selecionada</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowFullMenu(!showFullMenu)}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
              >
                <span>{showFullMenu ? 'Recolher' : 'Expandir'}</span>
                {showFullMenu ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>

            {showFullMenu && (
              <div className="space-y-4">
                {/* Welcome Drinks */}
                {landing.welcomeDrinks && (
                  <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-1.5">
                    <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                      <Wine className="w-4 h-4" />
                      <span>Welcome Drinks & Coquetelaria</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">{landing.welcomeDrinks}</p>
                  </div>
                )}

                {/* Starters */}
                {landing.starters && (
                  <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-1.5">
                    <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                      <span>🥗 Entradas & Canapés</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">{landing.starters}</p>
                  </div>
                )}

                {/* Main Courses */}
                {landing.mainCourses && (
                  <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-1.5">
                    <div className="flex items-center gap-2 text-blue-400 font-bold text-xs">
                      <span>🥩 Pratos Principais</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">{landing.mainCourses}</p>
                  </div>
                )}

                {/* Desserts */}
                {landing.desserts && (
                  <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-1.5">
                    <div className="flex items-center gap-2 text-pink-400 font-bold text-xs">
                      <span>🍰 Sobremesas</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">{landing.desserts}</p>
                  </div>
                )}

                {/* Beverages */}
                {landing.beverages && (
                  <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-1.5">
                    <div className="flex items-center gap-2 text-amber-300 font-bold text-xs">
                      <Coffee className="w-4 h-4" />
                      <span>Carta de Vinhos, Bebidas & Cafeteria</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">{landing.beverages}</p>
                  </div>
                )}

                {/* Dietary notice */}
                {landing.dietaryNotice && (
                  <div className="p-3 bg-amber-950/30 rounded-xl border border-amber-800/50 text-[11px] text-amber-200 flex items-start gap-2">
                    <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <span>{landing.dietaryNotice}</span>
                  </div>
                )}
              </div>
            )}
          </section>
        )}

        {/* 5. LOCALIZAÇÃO, GPS & DRESS CODE */}
        <section className="bg-slate-900/80 rounded-3xl p-6 border border-slate-800 shadow-lg space-y-5">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <MapPin className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-sm font-extrabold text-white">
                Como Chegar & Localização
              </h3>
              <p className="text-[11px] text-slate-400">{landing.venueName}</p>
            </div>
          </div>

          <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-2">
            <div className="text-xs text-slate-200 font-bold">
              {landing.venueName}
            </div>
            <p className="text-xs text-slate-400">
              {landing.address} — {landing.cityState}
            </p>

            {/* GPS Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2.5 px-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm"
              >
                <Navigation className="w-4 h-4" />
                <span>Traçar Rota no Google Maps</span>
              </a>

              <a
                href={wazeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2.5 px-3.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm"
              >
                <Car className="w-4 h-4" />
                <span>Abrir Rota no Waze</span>
              </a>
            </div>
          </div>

          {/* Valet & Dress Code details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {landing.parkingInfo && (
              <div className="p-3.5 bg-slate-950/60 rounded-2xl border border-slate-800 space-y-1">
                <div className="flex items-center gap-1.5 text-blue-400 font-bold text-xs">
                  <Car className="w-3.5 h-3.5" />
                  <span>Estacionamento / Valet</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">{landing.parkingInfo}</p>
              </div>
            )}

            {landing.dressCode && (
              <div className="p-3.5 bg-slate-950/60 rounded-2xl border border-slate-800 space-y-1">
                <div className="flex items-center gap-1.5 text-purple-400 font-bold text-xs">
                  <Shirt className="w-3.5 h-3.5" />
                  <span>Dress Code (Traje)</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">{landing.dressCode}</p>
              </div>
            )}
          </div>
        </section>

        {/* 6. AVISOS & CONTATO DA ORGANIZAÇÃO */}
        <footer className="text-center space-y-4 pt-4 border-t border-slate-800/80">
          {landing.contactWhatsapp && (
            <a
              href={`https://wa.me/${landing.contactWhatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(`Olá! Gostaria de tirar uma dúvida sobre o evento ${event.title}.`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-emerald-950/70 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-800 text-xs font-bold transition-all cursor-pointer"
            >
              <MessageCircle className="w-4 h-4 text-emerald-400" />
              <span>Dúvidas? Fale com a Organização no WhatsApp</span>
            </a>
          )}

          <p className="text-[11px] text-slate-400 font-mono">
            {event.title} • Gestão de Convidados & Acessos
          </p>
        </footer>
      </main>
    </div>
  );
};
