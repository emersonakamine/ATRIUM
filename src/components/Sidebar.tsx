import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Send, 
  FileText, 
  Palette, 
  QrCode, 
  ScrollText, 
  Shield, 
  Layers,
  Plus,
  Bot,
  Globe,
  ChevronDown,
  Calendar,
  Settings,
  BookOpen,
  Radio
} from 'lucide-react';
import { UserRole, EventData } from '../types';

export type NavTab = 
  | 'events_hub'
  | 'dashboard'
  | 'guests'
  | 'dispatch'
  | 'form_builder'
  | 'invite_editor'
  | 'landing_page'
  | 'ai_concierge'
  | 'broadcast'
  | 'scanner'
  | 'logs'
  | 'settings'
  | 'admin_settings'
  | 'spec';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  userRole: UserRole;
  pendingCheckInCount: number;
  totalGuests: number;
  totalEventsCount?: number;
  currentEvent?: EventData;
  onOpenCreateEventModal?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  userRole,
  pendingCheckInCount,
  totalGuests,
  totalEventsCount = 1,
  currentEvent,
  onOpenCreateEventModal,
}) => {
  const [eventSectionOpen, setEventSectionOpen] = React.useState(true);
  const [participantsOpen, setParticipantsOpen] = React.useState(true);

  const eventTabs: NavTab[] = ['dashboard', 'guests', 'dispatch', 'broadcast', 'form_builder', 'invite_editor', 'landing_page', 'ai_concierge', 'scanner'];
  const isEventTab = eventTabs.includes(currentTab);

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 border-r border-slate-800 min-h-[calc(100vh-61px)] select-none" id="app-sidebar">
      {/* Brand logo */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-sky-400 flex items-center justify-center text-white font-black shadow-md shadow-blue-500/20 tracking-tighter">
            <span className="text-xs font-black">BP</span>
          </div>
          <div>
            <div className="text-sm font-extrabold text-white tracking-wide flex items-center gap-1.5">
              <span>BP Eventos</span>
              <span className="text-[10px] px-1.5 py-0.2 bg-blue-500/20 text-blue-400 border border-blue-400/30 rounded font-normal">Multi</span>
            </div>
            <p className="text-[10px] text-slate-400">Guest & Portaria OS</p>
          </div>
        </div>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-5 text-xs">
        
        {/* ═══════════ SISTEMA ═══════════ */}
        <div>
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
            <span>Sistema</span>
            {onOpenCreateEventModal && (
              <button
                onClick={onOpenCreateEventModal}
                title="Criar novo evento"
                className="text-blue-400 hover:text-blue-300 flex items-center gap-0.5 hover:underline cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>Novo</span>
              </button>
            )}
          </div>
          <div className="space-y-1">
            <button
              onClick={() => onSelectTab('events_hub')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors cursor-pointer text-left font-medium ${
                currentTab === 'events_hub'
                  ? 'bg-blue-600 text-white font-semibold shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
              }`}
              id="nav-events-hub"
            >
              <div className="flex items-center gap-3">
                <Layers className="w-4 h-4" />
                <span>Meus Eventos</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-950/80 text-blue-300 font-mono border border-blue-800">
                {totalEventsCount}
              </span>
            </button>

            {(userRole === 'admin') && (
              <>
                <button
                  onClick={() => onSelectTab('logs')}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors cursor-pointer text-left font-medium ${
                    currentTab === 'logs'
                      ? 'bg-blue-600 text-white font-semibold'
                      : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                  }`}
                  id="nav-logs"
                >
                  <div className="flex items-center gap-3">
                    <ScrollText className="w-4 h-4" />
                    <span>Auditoria & Reset</span>
                  </div>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-950/70 text-red-300 font-bold border border-red-800/60">
                    Admin
                  </span>
                </button>

                <button
                  onClick={() => onSelectTab('settings')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors cursor-pointer text-left font-medium ${
                    currentTab === 'settings'
                      ? 'bg-blue-600 text-white font-semibold'
                      : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                  }`}
                  id="nav-settings"
                >
                  <Shield className="w-4 h-4" />
                  <span>Equipe & Permissões</span>
                </button>

                <button
                  onClick={() => onSelectTab('admin_settings')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors cursor-pointer text-left font-medium ${
                    currentTab === 'admin_settings'
                      ? 'bg-blue-600 text-white font-semibold'
                      : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                  }`}
                  id="nav-admin-settings"
                >
                  <Settings className="w-4 h-4" />
                  <span>Configurações do Sistema</span>
                </button>
              </>
            )}

            <button
              onClick={() => onSelectTab('spec')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors cursor-pointer text-left font-medium ${
                currentTab === 'spec'
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'text-sky-400 hover:bg-slate-800/70 hover:text-sky-300'
              }`}
              id="nav-spec"
            >
              <BookOpen className="w-4 h-4" />
              <span>Especificação</span>
            </button>
          </div>
        </div>

        {/* ═══════════ EVENTO SELECIONADO ═══════════ */}
        {currentEvent && (
          <div>
            <button
              onClick={() => setEventSectionOpen(!eventSectionOpen)}
              className={`w-full flex items-center justify-between px-3 pb-2 text-[10px] font-bold uppercase tracking-wider cursor-pointer ${
                isEventTab ? 'text-blue-400' : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3 h-3" />
                <span>{currentEvent.title}</span>
              </div>
              <ChevronDown className={`w-3 h-3 transition-transform ${eventSectionOpen ? 'rotate-180' : ''}`} />
            </button>

            {eventSectionOpen && (
              <div className="space-y-1">
                <button
                  onClick={() => onSelectTab('dashboard')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors cursor-pointer text-left font-medium ${
                    currentTab === 'dashboard'
                      ? 'bg-blue-600 text-white font-semibold shadow-sm'
                      : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                  }`}
                  id="nav-dashboard"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Painel do evento</span>
                </button>

                {/* Participantes (expansível) */}
                <div>
                  <button
                    onClick={() => setParticipantsOpen(!participantsOpen)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors cursor-pointer text-left font-medium ${
                      currentTab === 'guests' || currentTab === 'dispatch'
                        ? 'text-white'
                        : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Users className="w-4 h-4" />
                      <span>Participantes</span>
                    </div>
                    <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${participantsOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {participantsOpen && (
                    <div className="ml-4 pl-3 border-l border-slate-700/60 mt-1 space-y-1">
                      <button
                        onClick={() => onSelectTab('guests')}
                        className={`w-full flex items-center justify-between px-2.5 py-2 rounded-md transition-colors cursor-pointer text-left ${
                          currentTab === 'guests'
                            ? 'bg-blue-500/20 text-blue-300 font-semibold'
                            : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                        }`}
                        id="nav-guests"
                      >
                        <span>Lista e check-in</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                          {totalGuests}
                        </span>
                      </button>

                      <button
                        onClick={() => onSelectTab('dispatch')}
                        className={`w-full flex items-center justify-between px-2.5 py-2 rounded-md transition-colors cursor-pointer text-left ${
                          currentTab === 'dispatch'
                            ? 'bg-blue-500/20 text-blue-300 font-semibold'
                            : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                        }`}
                        id="nav-dispatch"
                      >
                        <span className="flex items-center gap-1.5">
                          <Send className="w-3.5 h-3.5" />
                          <span>Enviar convites</span>
                        </span>
                      </button>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => onSelectTab('form_builder')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors cursor-pointer text-left font-medium ${
                    currentTab === 'form_builder'
                      ? 'bg-blue-600 text-white font-semibold'
                      : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                  }`}
                  id="nav-form-builder"
                >
                  <FileText className="w-4 h-4" />
                  <span>Formulário</span>
                </button>

                <button
                  onClick={() => onSelectTab('invite_editor')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors cursor-pointer text-left font-medium ${
                    currentTab === 'invite_editor'
                      ? 'bg-blue-600 text-white font-semibold'
                      : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                  }`}
                  id="nav-invite-editor"
                >
                  <Palette className="w-4 h-4" />
                  <span>Editor do convite</span>
                </button>

                <button
                  onClick={() => onSelectTab('landing_page')}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors cursor-pointer text-left font-medium ${
                    currentTab === 'landing_page'
                      ? 'bg-blue-600 text-white font-semibold shadow-sm'
                      : 'text-blue-300 hover:bg-slate-800/70 hover:text-white'
                  }`}
                  id="nav-landing-page"
                >
                  <div className="flex items-center gap-3">
                    <Globe className="w-4 h-4" />
                    <span>Landing Page</span>
                  </div>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-300 font-bold border border-emerald-700/60">
                    Público
                  </span>
                </button>

                <button
                  onClick={() => onSelectTab('ai_concierge')}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors cursor-pointer text-left font-medium ${
                    currentTab === 'ai_concierge'
                      ? 'bg-purple-600 text-white font-semibold shadow-sm'
                      : 'text-purple-300 hover:bg-slate-800/70 hover:text-purple-200'
                  }`}
                  id="nav-ai-concierge"
                >
                  <div className="flex items-center gap-3">
                    <Bot className="w-4 h-4" />
                    <span>Concierge IA</span>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-950/80 text-purple-300 font-mono border border-purple-700/60">
                    IA
                  </span>
                </button>

                <button
                  onClick={() => onSelectTab('broadcast')}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors cursor-pointer text-left font-medium ${
                    currentTab === 'broadcast'
                      ? 'bg-emerald-600 text-white font-semibold shadow-sm'
                      : 'text-emerald-400 hover:bg-slate-800/70 hover:text-emerald-300'
                  }`}
                  id="nav-broadcast"
                >
                  <div className="flex items-center gap-3">
                    <Radio className="w-4 h-4" />
                    <span>Enviar Convites</span>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-300 font-mono border border-emerald-800">
                    Massa
                  </span>
                </button>

                <button
                  onClick={() => onSelectTab('scanner')}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors cursor-pointer text-left font-medium ${
                    currentTab === 'scanner'
                      ? 'bg-emerald-600 text-white font-semibold shadow-sm'
                      : 'text-emerald-400 hover:bg-slate-800/70 hover:text-emerald-300'
                  }`}
                  id="nav-scanner"
                >
                  <div className="flex items-center gap-3">
                    <QrCode className="w-4 h-4" />
                    <span>Portaria / QR</span>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-300 font-mono border border-emerald-800">
                    PWA
                  </span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
        <span>Sem limites</span>
        <span className="text-[10px] font-mono text-emerald-400">Online</span>
      </div>
    </aside>
  );
};
