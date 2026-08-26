import React from 'react';
import { EventData, Guest, TicketCategory, AuditLog } from '../types';
import { CheckInProgressBar } from './CheckInProgressBar';
import { 
  CheckCircle2, 
  XCircle, 
  Ticket, 
  ExternalLink, 
  QrCode, 
  Copy, 
  Edit3, 
  Share2,
  Users,
  ShieldCheck,
  TrendingUp,
  Clock,
  Radio,
  Calendar,
  AlertTriangle,
  ArrowUpRight
} from 'lucide-react';

interface DashboardViewProps {
  event: EventData;
  guests: Guest[];
  categories: TicketCategory[];
  auditLogs: AuditLog[];
  onOpenInviteModal: () => void;
  onOpenScanner: () => void;
  onNavigateToGuests: () => void;
  onNavigateToDispatch: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  event,
  guests,
  categories,
  auditLogs,
  onOpenInviteModal,
  onOpenScanner,
  onNavigateToGuests,
  onNavigateToDispatch,
}) => {
  const [selectedCategory, setSelectedCategory] = React.useState('all');
  const [copiedLink, setCopiedLink] = React.useState(false);

  const totalGuests = guests.length;
  const approvedGuests = guests.filter(g => g.status !== 'cancelled' && g.status !== 'blocked').length;
  const cancelledGuests = guests.filter(g => g.status === 'cancelled' || g.status === 'blocked').length;
  const checkedInGuests = guests.filter(g => g.isCheckedIn).length;
  const remainingSlots = Math.max(0, event.maxCapacity - approvedGuests);
  const duplicateBlockedCount = auditLogs.filter(l => l.action === 'checkin_duplicate_attempt').length;

  const publicEventUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/convite/${guests[0]?.publicCode || 'demo'}`
    : `https://sistema.eventiza.com.br/evento/${event.code}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicEventUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Check-in Progress Bar */}
      <CheckInProgressBar
        guests={guests}
        categories={categories}
        selectedCategoryId={selectedCategory}
        onSelectCategory={setSelectedCategory}
      />

      {/* Row of Metric Cards (matching screenshot 3) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Ingressos Aprovados */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
              <span>Ingressos Aprovados</span>
              <span className="text-slate-400 font-normal">ⓘ</span>
            </div>
            <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {approvedGuests}
            </div>
            <div className="text-[11px] text-emerald-600 font-medium mt-1">
              Capacidade: {event.maxCapacity} convidados
            </div>
          </div>
          <div className="w-12 h-12 rounded-full bg-sky-50 text-sky-500 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2: Ingressos Cancelados */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Ingressos Cancelados
            </div>
            <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {cancelledGuests}
            </div>
            <div className="text-[11px] text-slate-400 font-medium mt-1">
              Bloqueados ou revogados
            </div>
          </div>
          <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center">
            <XCircle className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3: Ingressos Restantes */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Ingressos Restantes
            </div>
            <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {remainingSlots}
            </div>
            <div className="text-[11px] text-slate-400 font-medium mt-1">
              Vagas disponíveis na lista
            </div>
          </div>
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center">
            <Ticket className="w-6 h-6" />
          </div>
        </div>

        {/* Card 4: Operação Portaria & Antifraude */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Check-in no Local
            </div>
            <div className="text-3xl font-extrabold text-blue-600 tracking-tight flex items-baseline gap-2">
              <span>{checkedInGuests}</span>
              <span className="text-xs font-semibold text-slate-400 font-normal">
                ({approvedGuests > 0 ? Math.round((checkedInGuests / approvedGuests) * 100) : 0}%)
              </span>
            </div>
            <div className="text-[11px] text-amber-600 font-medium mt-1 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{duplicateBlockedCount} fraudes barradas</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
            <QrCode className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Informações Gerais Card (matching screenshot 3) */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <h3 className="text-base font-bold text-slate-800 mb-5">
          Informações gerais
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Col 1: Status & Link */}
          <div className="space-y-4">
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Situação do Evento</div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                  ✓ Publicado
                </span>
                <button className="text-xs text-blue-600 hover:underline cursor-pointer">
                  (Desativar)
                </button>
              </div>
            </div>

            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Link de Acesso à Página do Evento
              </div>
              <div className="text-xs text-blue-600 truncate font-mono bg-slate-50 p-2 rounded border border-slate-200">
                {publicEventUrl}
              </div>
              <button
                onClick={handleCopyLink}
                className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded text-xs font-semibold border border-blue-200 transition-colors cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>{copiedLink ? 'Link Copiado!' : 'Compartilhar Link'}</span>
              </button>
            </div>
          </div>

          {/* Col 2: Views & Outras Opções */}
          <div className="space-y-4">
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Visualização da Página</div>
              <div className="text-2xl font-extrabold text-slate-800 mt-1">142</div>
              <p className="text-xs text-slate-400">Acessos registrados de convidados</p>
            </div>

            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Outras Opções do Evento</div>
              <div className="flex flex-wrap gap-2 mt-2">
                <button
                  onClick={onOpenInviteModal}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-semibold border border-slate-200 transition-colors cursor-pointer"
                >
                  <QrCode className="w-3.5 h-3.5 text-blue-600" />
                  <span>Ver QR Code</span>
                </button>
                <button
                  onClick={() => alert('Evento duplicado com sucesso em Rascunho!')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-semibold border border-slate-200 transition-colors cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5 text-slate-600" />
                  <span>Duplicar Evento</span>
                </button>
              </div>
            </div>
          </div>

          {/* Col 3: Actions & Details */}
          <div className="space-y-4">
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Informações do Evento (Detalhes, Localização & etc.)</div>
              <p className="text-xs text-slate-600 mt-1">
                <strong>{event.locationName}</strong><br />
                {event.address}
              </p>
              <button
                onClick={onOpenInviteModal}
                className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Editar Evento</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Gráficos de Operação (matching screenshot 3: Cadastros por dia e check-ins por hora) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico 1: Cadastros/Ingressos por dia */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-sm font-bold text-slate-800">
                Cadastro de convidados por dia
              </h4>
              <p className="text-xs text-slate-400">Distribuição nos últimos 14 dias</p>
            </div>
            <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">Últimos 14 dias</span>
          </div>

          {/* Clean Bar Chart Visualizer */}
          <div className="h-44 flex items-end justify-between gap-1 pt-6 pb-2 px-2 border-b border-slate-100">
            {[
              { day: '02/08', count: 0 },
              { day: '03/08', count: 0 },
              { day: '04/08', count: 0 },
              { day: '05/08', count: 0 },
              { day: '06/08', count: 0 },
              { day: '07/08', count: 0 },
              { day: '08/08', count: 0 },
              { day: '09/08', count: 0 },
              { day: '10/08', count: 0 },
              { day: '11/08', count: 0 },
              { day: '12/08', count: 0 },
              { day: '13/08', count: 0 },
              { day: '14/08', count: 1 },
              { day: '15/08', count: totalGuests },
            ].map((item, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-1 group">
                <div 
                  className={`w-full max-w-[28px] rounded-t-sm transition-all duration-300 ${
                    item.count > 0 
                      ? 'bg-sky-500 hover:bg-sky-600' 
                      : 'bg-slate-100 h-1'
                  }`}
                  style={{ height: item.count > 0 ? `${Math.max(item.count * 24, 20)}px` : '4px' }}
                  title={`${item.day}: ${item.count} convidados`}
                ></div>
                <span className="text-[9px] text-slate-400 font-mono scale-90">{item.day}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-center gap-4 mt-3 text-[11px] text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-sky-500"></span>
              Convidados adicionados na lista
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-blue-600"></span>
              Check-ins confirmados
            </span>
          </div>
        </div>

        {/* Gráfico 2: Distribuição por Tipo de Convite */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-sm font-bold text-slate-800">
                Distribuição por Categoria de Acesso
              </h4>
              <p className="text-xs text-slate-400">Total cadastrado vs. Check-in na portaria</p>
            </div>
            <button 
              onClick={onNavigateToGuests}
              className="text-xs font-semibold text-blue-600 hover:underline cursor-pointer flex items-center gap-1"
            >
              Ver Lista Completa <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {categories.map((cat) => {
              const inCategory = guests.filter(g => g.ticketCategoryId === cat.id);
              const checkedInCategory = inCategory.filter(g => g.isCheckedIn).length;
              const catPercent = inCategory.length > 0 ? Math.round((checkedInCategory / inCategory.length) * 100) : 0;

              return (
                <div key={cat.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200/80">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }}></span>
                      <strong className="font-bold text-slate-800">{cat.name}</strong>
                      <span className="text-slate-400">({cat.accessZone})</span>
                    </div>
                    <div className="font-mono text-slate-700 font-semibold">
                      {checkedInCategory} / {inCategory.length} ({catPercent}%)
                    </div>
                  </div>
                  <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-300"
                      style={{ 
                        width: `${catPercent}%`,
                        backgroundColor: cat.color 
                      }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
