import React from 'react';
import { 
  ShieldAlert, 
  Trash2, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle2, 
  Layers, 
  Building2, 
  Lock,
  Database,
  ChevronDown,
  Calendar,
  MapPin,
  Users
} from 'lucide-react';
import { EventData, UserProfile } from '../types';

interface SystemDangerZoneProps {
  currentEvent: EventData;
  allEvents: EventData[];
  currentUser: UserProfile;
  onDeleteCurrentEvent: (eventId: string) => void;
  onSystemResetForNewTenant: () => Promise<void>;
  cloudConnected?: boolean;
}

export const SystemDangerZone: React.FC<SystemDangerZoneProps> = ({
  currentEvent,
  allEvents,
  currentUser,
  onDeleteCurrentEvent,
  onSystemResetForNewTenant,
  cloudConnected = true,
}) => {
  // Selected event in dropdown for deletion
  const [selectedEventIdToDelete, setSelectedEventIdToDelete] = React.useState<string>(currentEvent.id);

  // Sync if currentEvent changes and selected isn't set
  React.useEffect(() => {
    if (!allEvents.some(e => e.id === selectedEventIdToDelete) && allEvents.length > 0) {
      setSelectedEventIdToDelete(allEvents[0].id);
    }
  }, [allEvents, selectedEventIdToDelete]);

  const targetEventToDelete = allEvents.find(e => e.id === selectedEventIdToDelete) || currentEvent;

  // Event Deletion modal state
  const [showDeleteEventModal, setShowDeleteEventModal] = React.useState(false);
  const [confirmEventTitle, setConfirmEventTitle] = React.useState('');
  const [isDeletingEvent, setIsDeletingEvent] = React.useState(false);

  // Tenant / Full System Reset state
  const [showSystemResetModal, setShowSystemResetModal] = React.useState(false);
  const [confirmResetText, setConfirmResetText] = React.useState('');
  const [isResettingSystem, setIsResettingSystem] = React.useState(false);
  const [resetSuccess, setResetSuccess] = React.useState(false);

  const isAdmin = currentUser.role === 'admin';

  const handleDeleteEvent = () => {
    if (confirmEventTitle.trim().toLowerCase() !== targetEventToDelete.title.trim().toLowerCase()) {
      return;
    }
    setIsDeletingEvent(true);
    setTimeout(() => {
      onDeleteCurrentEvent(targetEventToDelete.id);
      setIsDeletingEvent(false);
      setShowDeleteEventModal(false);
      setConfirmEventTitle('');
      // Update selected to first remaining event if available
      const remaining = allEvents.filter(e => e.id !== targetEventToDelete.id);
      if (remaining.length > 0) {
        setSelectedEventIdToDelete(remaining[0].id);
      }
    }, 400);
  };

  const handleExecuteSystemReset = async () => {
    if (confirmResetText !== 'RESETAR-PLATAFORMA') return;
    try {
      setIsResettingSystem(true);
      await onSystemResetForNewTenant();
      setIsResettingSystem(false);
      setResetSuccess(true);
      setTimeout(() => {
        setResetSuccess(false);
        setShowSystemResetModal(false);
        setConfirmResetText('');
      }, 2500);
    } catch (e) {
      console.error(e);
      setIsResettingSystem(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-red-200 shadow-sm p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-red-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center font-bold">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <span>Zona de Controle Avançado & Gestão de Dados</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200">
                Apenas Administradores
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Selecione eventos específicos para exclusão segura via lista suspensa ou execute o reset geral para novos clientes.
            </p>
          </div>
        </div>

        {/* Real-time Cloud status badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
          <Database className="w-4 h-4 text-blue-600" />
          <span className="text-slate-600 font-medium">Banco na Nuvem:</span>
          <span className="inline-flex items-center gap-1 font-bold text-emerald-600">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Firestore Conectado
          </span>
        </div>
      </div>

      {!isAdmin ? (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-3">
          <Lock className="w-4 h-4 shrink-0 text-amber-600" />
          <span>
            Seu perfil atual é <strong>{currentUser.role.toUpperCase()}</strong>. Apenas usuários com perfil <strong>ADMINISTRADOR</strong> possuem permissão para apagar eventos ou executar o reset geral da plataforma.
          </span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Apagar Evento com Lista Suspensa (Dropdown) */}
          <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 hover:border-red-300 transition-colors flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                  <Layers className="w-4 h-4 text-red-500" />
                  <span>Apagar Evento Específico ou Teste</span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-mono">
                  {allEvents.length} {allEvents.length === 1 ? 'evento' : 'eventos'}
                </span>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Selecione na lista suspensa o evento que deseja excluir permanentemente:
              </p>

              {/* Lista Suspensa (Dropdown de Eventos) */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                  <span>Escolha o Evento na Lista Suspensa:</span>
                </label>
                <div className="relative">
                  <select
                    value={selectedEventIdToDelete}
                    onChange={(e) => setSelectedEventIdToDelete(e.target.value)}
                    className="w-full appearance-none pl-3.5 pr-10 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 shadow-xs cursor-pointer"
                    id="select-event-to-delete"
                  >
                    {allEvents.map((evt) => (
                      <option key={evt.id} value={evt.id}>
                        {evt.code} - {evt.title} ({evt.startDate}) {evt.id === currentEvent.id ? ' [Evento Ativo]' : ''}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Preview card of selected event */}
              {targetEventToDelete && (
                <div className="p-3 bg-white rounded-xl border border-red-100 shadow-xs space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 truncate">
                      {targetEventToDelete.title}
                    </span>
                    <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-50 text-red-700 border border-red-200">
                      {targetEventToDelete.code}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      {targetEventToDelete.startDate}
                    </span>
                    <span className="flex items-center gap-1 truncate max-w-[180px]">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      {targetEventToDelete.locationName || targetEventToDelete.cityState || 'Local não informado'}
                    </span>
                  </div>
                </div>
              )}

              <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-800 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                <span>
                  A exclusão remove os convidados vinculados, categorias e formulário deste evento específico.
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                setConfirmEventTitle('');
                setShowDeleteEventModal(true);
              }}
              className="w-full py-2.5 px-4 bg-white hover:bg-red-50 text-red-600 hover:text-red-700 border border-red-300 hover:border-red-400 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 shadow-xs mt-2"
              id="btn-delete-event-trigger"
            >
              <Trash2 className="w-4 h-4" />
              <span>Apagar "{targetEventToDelete.title.slice(0, 22)}..."</span>
            </button>
          </div>

          {/* Card 2: Reset Geral para Nova Empresa / Cessão da Plataforma */}
          <div className="p-5 rounded-xl bg-gradient-to-br from-red-50/50 to-orange-50/50 border border-red-200 hover:border-red-400 transition-colors flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-red-950 font-extrabold text-sm">
                  <Building2 className="w-4 h-4 text-red-600" />
                  <span>Reset Geral da Plataforma (Cessão a Nova Empresa)</span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-200 text-red-800 uppercase tracking-wider">
                  Master Clean
                </span>
              </div>
              <p className="text-xs text-slate-700 mt-2 leading-relaxed">
                Utilize esta opção caso queira <strong>zerar todos os dados</strong> (todos os eventos, listas de convidados antigos, formulários e logs de auditoria) para entregar a plataforma limpa e configurada para uma <strong>nova empresa ou cliente</strong>.
              </p>
              <div className="mt-3 p-2.5 rounded-lg bg-red-100/70 border border-red-200 text-[11px] text-red-900 flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
                <span>
                  O banco de dados na nuvem será recriado do zero com uma estrutura limpa e apenas o seu usuário Administrador cadastrado.
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                setConfirmResetText('');
                setShowSystemResetModal(true);
              }}
              className="w-full py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-red-600/20 active:scale-98"
              id="btn-system-reset-trigger"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Executar Reset Geral da Plataforma</span>
            </button>
          </div>
        </div>
      )}

      {/* MODAL 1: Confirm Delete Event with Dropdown selection */}
      {showDeleteEventModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h4 className="text-base font-bold text-slate-900">Confirmar Exclusão de Evento</h4>
              <p className="text-xs text-slate-500 mt-1">
                Verifique o evento selecionado na lista suspensa antes de confirmar a exclusão permanente:
              </p>
            </div>

            {/* Dropdown in Modal as well */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600">Evento Selecionado:</label>
              <div className="relative">
                <select
                  value={selectedEventIdToDelete}
                  onChange={(e) => {
                    setSelectedEventIdToDelete(e.target.value);
                    setConfirmEventTitle('');
                  }}
                  className="w-full appearance-none pl-3 pr-8 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500 cursor-pointer"
                >
                  {allEvents.map((evt) => (
                    <option key={evt.id} value={evt.id}>
                      {evt.code} - {evt.title} ({evt.startDate})
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 space-y-1">
              <div>Para confirmar a exclusão, digite exatamente o nome do evento:</div>
              <div className="font-bold font-mono mt-1 text-slate-900 bg-white p-1.5 rounded border border-red-200 select-all text-[11px]">
                {targetEventToDelete.title}
              </div>
            </div>

            <input
              type="text"
              placeholder="Digite o nome do evento para confirmar..."
              value={confirmEventTitle}
              onChange={(e) => setConfirmEventTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500"
              autoFocus
            />

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteEventModal(false)}
                className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDeleteEvent}
                disabled={confirmEventTitle.trim().toLowerCase() !== targetEventToDelete.title.trim().toLowerCase() || isDeletingEvent}
                className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-red-600/20 cursor-pointer flex items-center justify-center gap-2"
                id="btn-confirm-delete-event"
              >
                {isDeletingEvent ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Apagando...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Sim, Apagar Evento</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Confirm Total System Reset */}
      {showSystemResetModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-red-300 space-y-5 animate-in fade-in zoom-in-95">
            <div className="w-14 h-14 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto shadow-inner">
              <ShieldAlert className="w-7 h-7" />
            </div>

            <div className="text-center space-y-1">
              <h4 className="text-lg font-black text-slate-900">Reset Geral da Plataforma</h4>
              <p className="text-xs text-slate-600">
                Limpeza completa de banco de dados para entrega a nova empresa
              </p>
            </div>

            {resetSuccess ? (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                <div className="font-bold text-emerald-900 text-sm">Plataforma Resetada com Sucesso!</div>
                <p className="text-xs text-emerald-700">
                  Uma nova instância limpa foi criada no Firebase Firestore e no armazenamento local.
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-2 text-xs text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="font-bold text-slate-900">O que acontecerá durante o Reset Geral:</div>
                  <ul className="list-disc list-inside space-y-1 text-slate-600">
                    <li>Todos os eventos anteriores serão removidos;</li>
                    <li>Todas as listas de convidados e check-ins serão apagados;</li>
                    <li>Um evento inicial limpo ("Meu Primeiro Evento") será gerado;</li>
                    <li>O seu usuário Administrador continuará com acesso total.</li>
                  </ul>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800">
                    Para confirmar o reset geral, digite exatamente <span className="font-mono text-red-600 bg-red-50 px-1.5 py-0.5 rounded border border-red-200 font-bold select-all">RESETAR-PLATAFORMA</span>:
                  </label>
                  <input
                    type="text"
                    placeholder="RESETAR-PLATAFORMA"
                    value={confirmResetText}
                    onChange={(e) => setConfirmResetText(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500 font-bold"
                    autoFocus
                  />
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowSystemResetModal(false)}
                    disabled={isResettingSystem}
                    className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleExecuteSystemReset}
                    disabled={confirmResetText !== 'RESETAR-PLATAFORMA' || isResettingSystem}
                    className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl text-xs transition-all shadow-lg shadow-red-600/30 cursor-pointer flex items-center justify-center gap-2"
                    id="btn-confirm-total-system-reset"
                  >
                    {isResettingSystem ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Zerando Banco na Nuvem...</span>
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4" />
                        <span>Confirmar Reset Master</span>
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
