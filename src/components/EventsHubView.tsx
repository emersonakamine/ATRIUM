import React from 'react';
import { EventData, Guest, TicketCategory } from '../types';
import { 
  Plus, 
  Calendar, 
  MapPin, 
  Clock, 
  Users, 
  QrCode, 
  ArrowRight, 
  Edit3, 
  Copy, 
  Trash2, 
  Search, 
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Filter
} from 'lucide-react';

interface EventsHubViewProps {
  events: EventData[];
  currentEventId: string;
  guests: Guest[];
  categories: TicketCategory[];
  onSelectEvent: (eventId: string) => void;
  onOpenCreateModal: () => void;
  onOpenEditModal: (event: EventData) => void;
  onDuplicateEvent: (event: EventData) => void;
  onDeleteEvent: (eventId: string) => void;
  onNavigateToDashboard: () => void;
  onNavigateToScanner: () => void;
}

export const EventsHubView: React.FC<EventsHubViewProps> = ({
  events,
  currentEventId,
  guests,
  categories,
  onSelectEvent,
  onOpenCreateModal,
  onOpenEditModal,
  onDuplicateEvent,
  onDeleteEvent,
  onNavigateToDashboard,
  onNavigateToScanner,
}) => {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<'all' | 'published' | 'draft' | 'closed'>('all');

  // Stats calculation across all events
  const totalEvents = events.length;
  const publishedEvents = events.filter(e => e.status === 'published').length;
  const totalAllGuests = guests.length;
  const totalAllCheckIns = guests.filter(g => g.isCheckedIn).length;

  const filteredEvents = events.filter(event => {
    const matchesSearch = 
      event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.locationName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.cityState.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.code.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || event.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: EventData['status']) => {
    switch (status) {
      case 'published':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Publicado & Ativo
          </span>
        );
      case 'draft':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-600 border border-amber-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            Rascunho
          </span>
        );
      case 'closed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-500/10 text-slate-600 border border-slate-500/20">
            Encerrado
          </span>
        );
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        {/* Background ambient elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 right-1/3 w-64 h-64 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold border border-blue-400/30">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Arquitetura Multi-Evento com IDs Isolados</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Meus Eventos & Portarias
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Crie quantos eventos desejar. Cada evento conta com seu próprio **ID exclusivo**, lista isolada de convidados, personalização visual de convites e scanner QR antifraude para a portaria.
            </p>
          </div>

          <button
            onClick={onOpenCreateModal}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg shadow-blue-600/30 transition-all active:scale-95 cursor-pointer shrink-0"
            id="btn-create-new-event-hub"
          >
            <Plus className="w-5 h-5" />
            <span>Criar Novo Evento</span>
          </button>
        </div>
      </div>

      {/* Global KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total de Eventos</div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">{totalEvents}</div>
          <div className="text-[11px] text-blue-600 font-medium mt-0.5">{publishedEvents} eventos em andamento</div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total de Convidados</div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">{totalAllGuests}</div>
          <div className="text-[11px] text-slate-500 font-medium mt-0.5">Em todos os eventos</div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Check-ins Realizados</div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 mt-1">{totalAllCheckIns}</div>
          <div className="text-[11px] text-emerald-600 font-medium mt-0.5">
            {totalAllGuests > 0 ? Math.round((totalAllCheckIns / totalAllGuests) * 100) : 0}% de presença global
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Segurança Antifraude</div>
          <div className="text-2xl sm:text-3xl font-extrabold text-indigo-600 mt-1">100%</div>
          <div className="text-[11px] text-slate-500 font-medium mt-0.5">Tokens únicos criptografados</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar evento por nome, local ou código..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Todos ({events.length})
          </button>
          <button
            onClick={() => setStatusFilter('published')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              statusFilter === 'published'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Publicados ({events.filter(e => e.status === 'published').length})
          </button>
          <button
            onClick={() => setStatusFilter('draft')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              statusFilter === 'draft'
                ? 'bg-amber-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Rascunhos ({events.filter(e => e.status === 'draft').length})
          </button>
          <button
            onClick={() => setStatusFilter('closed')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              statusFilter === 'closed'
                ? 'bg-slate-700 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Encerrados ({events.filter(e => e.status === 'closed').length})
          </button>
        </div>
      </div>

      {/* Grid of Events */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEvents.map((evt) => {
          const isActive = evt.id === currentEventId;
          const eventGuests = guests.filter(g => (g.eventId || 'evt_bp30') === evt.id);
          const eventCheckedIn = eventGuests.filter(g => g.isCheckedIn).length;
          const checkInPercentage = eventGuests.length > 0 
            ? Math.round((eventCheckedIn / eventGuests.length) * 100) 
            : 0;

          return (
            <div
              key={evt.id}
              className={`bg-white rounded-2xl border transition-all overflow-hidden flex flex-col shadow-xs hover:shadow-md ${
                isActive 
                  ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-blue-500/10' 
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              {/* Event Cover Banner */}
              <div className="relative h-40 w-full overflow-hidden bg-slate-900">
                <img
                  src={evt.coverUrl || 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=1200&auto=format&fit=crop&q=80'}
                  alt={evt.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/30 to-transparent"></div>

                {/* Top badges */}
                <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
                  {getStatusBadge(evt.status)}

                  {isActive ? (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-600 text-white shadow-sm flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      EVENTO ATIVO
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded bg-black/60 backdrop-blur-sm text-slate-300 text-[10px] font-mono">
                      ID: {evt.id.substring(0, 12)}
                    </span>
                  )}
                </div>

                {/* Bottom title info over image */}
                <div className="absolute bottom-3 left-3 right-3">
                  <h3 className="text-base font-bold text-white leading-tight drop-shadow-sm truncate">
                    {evt.title}
                  </h3>
                  <p className="text-xs text-slate-300 truncate mt-0.5">
                    {evt.subtitle || evt.description}
                  </p>
                </div>
              </div>

              {/* Event Details Content */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2.5 text-xs text-slate-600">
                  <div className="flex items-center gap-2 text-slate-700 font-medium">
                    <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>{evt.startDate}</span>
                    <span className="text-slate-300">•</span>
                    <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{evt.startTime} às {evt.endTime}</span>
                  </div>

                  <div className="flex items-center gap-2 text-slate-500">
                    <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="truncate">{evt.locationName}, {evt.cityState}</span>
                  </div>

                  <div className="flex items-center gap-2 text-slate-500">
                    <Users className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>Capacidade: <strong>{evt.maxCapacity}</strong> convidados</span>
                  </div>
                </div>

                {/* Guest & Check-in Progress */}
                <div className="pt-3 border-t border-slate-100 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Inscritos / Check-in:</span>
                    <span className="font-bold text-slate-800">
                      {eventCheckedIn} / {eventGuests.length} ({checkInPercentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, checkInPercentage)}%` }}
                    ></div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onOpenEditModal(evt)}
                      title="Editar evento"
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDuplicateEvent(evt)}
                      title="Duplicar evento"
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDeleteEvent(evt.id)}
                      title="Excluir evento"
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        onSelectEvent(evt.id);
                        onNavigateToScanner();
                      }}
                      title="Abrir Scanner de Portaria para este evento"
                      className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg border border-emerald-200 transition-colors cursor-pointer"
                    >
                      <QrCode className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => {
                        onSelectEvent(evt.id);
                        onNavigateToDashboard();
                      }}
                      className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                        isActive
                          ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
                          : 'bg-slate-900 hover:bg-slate-800 text-white'
                      }`}
                    >
                      <span>{isActive ? 'Gerenciar' : 'Selecionar'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredEvents.length === 0 && (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-300 p-8">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <Calendar className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800 mb-1">Nenhum evento encontrado</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
            Nenhum evento corresponde aos filtros pesquisados.
          </p>
          <button
            onClick={() => {
              setSearchTerm('');
              setStatusFilter('all');
            }}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
          >
            Limpar Filtros
          </button>
        </div>
      )}
    </div>
  );
};
