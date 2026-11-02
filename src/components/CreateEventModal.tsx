import React from 'react';
import { EventData, InviteThemePreset } from '../types';
import { 
  X, 
  Sparkles, 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  Image as ImageIcon,
  CheckCircle2,
  FileText
} from 'lucide-react';

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveEvent: (event: EventData) => void;
  editingEvent?: EventData | null;
}

const COVER_PRESETS = [
  {
    label: 'Executivo / Convenção',
    url: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=1200&auto=format&fit=crop&q=80',
  },
  {
    label: 'Gala / Premiação Noturna',
    url: 'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?w=1200&auto=format&fit=crop&q=80',
  },
  {
    label: 'Tecnologia / Summit',
    url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&auto=format&fit=crop&q=80',
  },
  {
    label: 'Coquetel & Networking',
    url: 'https://images.unsplash.com/photo-1528605248644-14dd04022da1?w=1200&auto=format&fit=crop&q=80',
  },
  {
    label: 'Show & Entretenimento',
    url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1200&auto=format&fit=crop&q=80',
  },
];

export const CreateEventModal: React.FC<CreateEventModalProps> = ({
  isOpen,
  onClose,
  onSaveEvent,
  editingEvent,
}) => {
  const [title, setTitle] = React.useState('');
  const [subtitle, setSubtitle] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [startDate, setStartDate] = React.useState('');
  const [endDate, setEndDate] = React.useState('');
  const [startTime, setStartTime] = React.useState('');
  const [endTime, setEndTime] = React.useState('');
  const [locationName, setLocationName] = React.useState('');
  const [address, setAddress] = React.useState('');
  const [cityState, setCityState] = React.useState('');
  const [maxCapacity, setMaxCapacity] = React.useState(150);
  const [status, setStatus] = React.useState<'published' | 'draft' | 'closed'>('published');
  const [coverUrl, setCoverUrl] = React.useState(COVER_PRESETS[0].url);
  const [themePreset, setThemePreset] = React.useState<InviteThemePreset>('dark');

  React.useEffect(() => {
    if (editingEvent) {
      setTitle(editingEvent.title);
      setSubtitle(editingEvent.subtitle);
      setDescription(editingEvent.description);
      setStartDate(editingEvent.startDate);
      setEndDate(editingEvent.endDate);
      setStartTime(editingEvent.startTime);
      setEndTime(editingEvent.endTime);
      setLocationName(editingEvent.locationName);
      setAddress(editingEvent.address);
      setCityState(editingEvent.cityState);
      setMaxCapacity(editingEvent.maxCapacity);
      setStatus(editingEvent.status);
      setCoverUrl(editingEvent.coverUrl);
      setThemePreset(editingEvent.inviteLayout?.bgTheme || 'dark');
    } else {
      // Reset defaults for a new event
      const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
      setTitle('');
      setSubtitle('Encontro e Credenciamento Exclusivo');
      setDescription('Evento corporativo com credenciamento e validação de QR Code em tempo real.');
      setStartDate('25 de outubro de 2026');
      setEndDate('25 de outubro de 2026');
      setStartTime('18h00m');
      setEndTime('23h00m');
      setLocationName('Espaço Villa Bisutti');
      setAddress('Rua Casa do Ator, 642 - Vila Olímpia');
      setCityState('São Paulo - SP');
      setMaxCapacity(200);
      setStatus('published');
      setCoverUrl(COVER_PRESETS[0].url);
      setThemePreset('dark');
    }
  }, [editingEvent, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const eventId = editingEvent?.id || `evt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const eventCode = editingEvent?.code || `EVZ-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const updatedEvent: EventData = {
      id: eventId,
      code: eventCode,
      title: title.trim(),
      subtitle: subtitle.trim(),
      description: description.trim(),
      startDate: startDate.trim(),
      endDate: endDate.trim(),
      startTime: startTime.trim(),
      endTime: endTime.trim(),
      locationName: locationName.trim(),
      address: address.trim(),
      cityState: cityState.trim(),
      maxCapacity: Number(maxCapacity) || 100,
      status,
      coverUrl,
      inviteLayout: editingEvent?.inviteLayout || {
        bgTheme: themePreset,
        logoUrl: 'https://api.iconify.design/lucide:sparkles.svg?color=%2338bdf8',
        title: 'CONVITE & CREDENCIAL',
        subtitle: title.toUpperCase(),
        instructions: 'Apresente este QR Code na portaria para acesso imediato ao evento.',
        showQr: true,
        showName: true,
        showCategory: true,
        showLocation: true,
        showTime: true,
        showDoc: true,
        showCompanions: true,
        accentColor: '#2563eb',
        textColor: '#ffffff',
        cardStyle: 'modern',
      },
    };

    onSaveEvent(updatedEvent);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-sm">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {editingEvent ? 'Editar Detalhes do Evento' : 'Criar Novo Evento'}
              </h2>
              <p className="text-xs text-slate-500">
                Cada evento possui ID único, lista de convidados independente e leitor de QR próprio.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
          {/* Section 1: Informações Principais */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              <span>Identificação do Evento</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nome do Evento / Título *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Convenção Anual de Parceiros 2026"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Subtítulo / Slogan
                </label>
                <input
                  type="text"
                  placeholder="Ex: Encontro Executivo & Networking"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Status de Publicação
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                >
                  <option value="published">🟢 Publicado & Ativo</option>
                  <option value="draft">🟡 Rascunho / Em Preparação</option>
                  <option value="closed">🔴 Encerrado / Finalizado</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Descrição Curta
                </label>
                <textarea
                  rows={2}
                  placeholder="Descrição sobre o objetivo do evento, público-alvo ou orientações aos participantes..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Data, Horário e Capacidade */}
          <div className="space-y-4 pt-3 border-t border-slate-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>Data, Horário & Lotação</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Data de Início
                </label>
                <input
                  type="text"
                  placeholder="Ex: 25 de outubro de 2026"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Data de Término
                </label>
                <input
                  type="text"
                  placeholder="Ex: 25 de outubro de 2026"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Horário de Início
                </label>
                <input
                  type="text"
                  placeholder="Ex: 14h00m"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Horário de Término
                </label>
                <input
                  type="text"
                  placeholder="Ex: 20h00m"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Capacidade Máxima de Convidados (Quota Total)</span>
                  <span className="text-blue-600 font-bold">{maxCapacity} pessoas</span>
                </label>
                <input
                  type="number"
                  min={1}
                  max={10000}
                  value={maxCapacity}
                  onChange={(e) => setMaxCapacity(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs font-bold"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Localização */}
          <div className="space-y-4 pt-3 border-t border-slate-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" />
              <span>Localização & Endereço</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nome do Local / Espaço
                </label>
                <input
                  type="text"
                  placeholder="Ex: Centro de Convenções Grand Royal"
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Endereço Completo
                </label>
                <input
                  type="text"
                  placeholder="Ex: Av. das Nações Unidas, 14.401"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Cidade / UF
                </label>
                <input
                  type="text"
                  placeholder="Ex: São Paulo - SP"
                  value={cityState}
                  onChange={(e) => setCityState(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Banner de Capa */}
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <label className="block text-xs font-semibold text-slate-700 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-slate-400" />
                <span>Imagem de Capa do Evento</span>
              </span>
              <span className="text-[9px] text-slate-400 font-normal">Recomendado: 1200×630px</span>
            </label>

            {/* Presets */}
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {COVER_PRESETS.map((preset, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => setCoverUrl(preset.url)}
                  className={`relative rounded-lg overflow-hidden border-2 h-14 group text-left transition-all ${
                    coverUrl === preset.url ? 'border-blue-600 ring-2 ring-blue-500/30' : 'border-transparent hover:border-slate-300'
                  }`}
                >
                  <img src={preset.url} alt={preset.label} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 p-1 flex items-end">
                    <span className="text-[9px] text-white font-medium truncate leading-tight">{preset.label}</span>
                  </div>
                  {coverUrl === preset.url && (
                    <div className="absolute top-1 right-1 bg-blue-600 text-white rounded-full p-0.5">
                      <CheckCircle2 className="w-3 h-3" />
                    </div>
                  )}
                </button>
              ))}
            </div>

            {/* Upload + Remove */}
            <div className="flex gap-2">
              <label className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-dashed border-slate-300 rounded-lg text-[11px] text-slate-600 hover:bg-slate-100 hover:border-blue-400 transition-colors cursor-pointer">
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Enviar do computador</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    if (file.size > 2 * 1024 * 1024) {
                      alert('Imagem muito grande. Máximo 2MB.');
                      return;
                    }
                    const reader = new FileReader();
                    reader.onload = () => setCoverUrl(reader.result as string);
                    reader.readAsDataURL(file);
                  }}
                />
              </label>
              {coverUrl && (
                <button
                  type="button"
                  onClick={() => setCoverUrl('')}
                  className="px-3 py-1.5 bg-red-50 border border-red-200 rounded-lg text-[11px] text-red-600 hover:bg-red-100 transition-colors cursor-pointer"
                >
                  Remover
                </button>
              )}
            </div>

            <input
              type="text"
              placeholder="Ou cole o link direto de uma imagem (URL)..."
              value={coverUrl}
              onChange={(e) => setCoverUrl(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 text-[11px] focus:outline-none focus:ring-1 focus:ring-blue-500"
            />

            {/* Preview */}
            {coverUrl && (
              <div className="relative rounded-lg overflow-hidden border border-slate-200 h-24">
                <img src={coverUrl} alt="Preview da capa" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-95 rounded-lg shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{editingEvent ? 'Salvar Alterações' : 'Criar e Ativar Evento'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
