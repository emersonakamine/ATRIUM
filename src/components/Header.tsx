import React from 'react';
import { EventData, UserProfile, UserRole } from '../types';
import { 
  Calendar, 
  Clock, 
  Sparkles, 
  FileText, 
  ExternalLink,
  ShieldCheck,
  UserCheck,
  ChevronDown,
  Layers,
  Plus,
  Check,
  LogOut,
  KeyRound
} from 'lucide-react';

interface HeaderProps {
  event: EventData;
  allEvents: EventData[];
  onSelectEvent: (eventId: string) => void;
  onOpenCreateEventModal: () => void;
  onNavigateToEventsHub: () => void;
  currentUser: UserProfile;
  allUsers: UserProfile[];
  onSelectUser: (user: UserProfile) => void;
  onOpenSpecModal: () => void;
  onOpenPublicInvite: () => void;
  onOpenQuickScanner: () => void;
  onLogout?: () => void;
  onChangePassword?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  event,
  allEvents,
  onSelectEvent,
  onOpenCreateEventModal,
  onNavigateToEventsHub,
  currentUser,
  allUsers,
  onSelectUser,
  onOpenSpecModal,
  onOpenPublicInvite,
  onOpenQuickScanner,
  onLogout,
  onChangePassword,
}) => {
  const [showEventDropdown, setShowEventDropdown] = React.useState(false);
  const [showUserDropdown, setShowUserDropdown] = React.useState(false);

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded bg-purple-100 text-purple-700 border border-purple-200">Admin</span>;
      case 'organizer':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded bg-blue-100 text-blue-700 border border-blue-200">Organizador</span>;
      case 'gate':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded bg-amber-100 text-amber-700 border border-amber-200">Portaria</span>;
    }
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs" id="app-header">
      {/* Top Banner / Event Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Event Title & Event Switcher */}
        <div className="flex items-center gap-3">
          {/* Event Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setShowEventDropdown(!showEventDropdown);
                setShowUserDropdown(false);
              }}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-slate-100 border border-slate-200 transition-all text-left cursor-pointer group"
              id="event-switcher-btn"
            >
              <div className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                <Layers className="w-3.5 h-3.5" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm sm:text-base font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors tracking-tight truncate max-w-[200px] sm:max-w-[280px]">
                    {event.title}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 transition-transform" />
                </div>
              </div>
            </button>

            {/* Dropdown Menu */}
            {showEventDropdown && (
              <div className="absolute left-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3.5 py-2 border-b border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Alternar Evento</span>
                  <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono font-bold">
                    {allEvents.length} disponíveis
                  </span>
                </div>

                <div className="max-h-60 overflow-y-auto py-1">
                  {allEvents.map((evt) => (
                    <button
                      key={evt.id}
                      onClick={() => {
                        onSelectEvent(evt.id);
                        setShowEventDropdown(false);
                      }}
                      className={`w-full px-3.5 py-2.5 text-left flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer ${
                        evt.id === event.id ? 'bg-blue-50/70 border-l-4 border-blue-600' : ''
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <div className="text-xs font-bold text-slate-800 truncate flex items-center gap-1.5">
                          <span>{evt.title}</span>
                          {evt.id === event.id && (
                            <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{evt.startDate}</span>
                        </div>
                      </div>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                        evt.status === 'published' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {evt.status === 'published' ? 'Ativo' : 'Rascunho'}
                      </span>
                    </button>
                  ))}
                </div>

                <div className="p-2 border-t border-slate-100 space-y-1 bg-slate-50">
                  <button
                    onClick={() => {
                      setShowEventDropdown(false);
                      onOpenCreateEventModal();
                    }}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Criar Novo Evento</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowEventDropdown(false);
                      onNavigateToEventsHub();
                    }}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 text-slate-700 hover:bg-slate-200/60 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                  >
                    <span>Ver Hub de Todos os Eventos</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          <button 
            onClick={onOpenPublicInvite}
            title="Abrir página pública do convite deste evento" 
            className="text-slate-400 hover:text-blue-600 transition-colors p-1.5 hover:bg-slate-100 rounded-lg cursor-pointer"
          >
            <ExternalLink className="w-4 h-4" />
          </button>

          <div className="hidden lg:flex items-center gap-2 text-xs text-slate-500 border-l border-slate-200 pl-3">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              {event.startDate}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              {event.startTime} às {event.endTime}
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Sincronizado</span>
          </div>
        </div>

        {/* Right: Actions & User Switcher */}
        <div className="flex items-center gap-2">
          {/* Quick Scanner Shortcut */}
          <button
            onClick={onOpenQuickScanner}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-all active:scale-95 cursor-pointer"
            id="btn-quick-scanner"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Portaria / Leitor QR</span>
          </button>

          {/* Technical Spec Viewer Button */}
          <button
            onClick={onOpenSpecModal}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium border border-slate-200 transition-colors cursor-pointer"
            id="btn-open-spec"
            title="Ver Especificação Completa do Sistema (10 Partes)"
          >
            <FileText className="w-3.5 h-3.5 text-blue-600" />
            <span className="hidden sm:inline">Especificação</span>
          </button>

          {/* User Role Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setShowUserDropdown(!showUserDropdown);
                setShowEventDropdown(false);
              }}
              className="flex items-center gap-2 p-1.5 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors cursor-pointer"
              id="user-profile-button"
            >
              <div className="w-7 h-7 rounded-full overflow-hidden bg-slate-900 flex items-center justify-center text-white text-xs font-bold ring-1 ring-slate-200">
                {currentUser.avatarUrl ? (
                  <img src={currentUser.avatarUrl} alt={currentUser.name} className="w-full h-full object-cover" />
                ) : (
                  currentUser.name.charAt(0)
                )}
              </div>
              <div className="hidden lg:block text-left">
                <div className="text-xs font-bold text-slate-800 leading-tight">{currentUser.name}</div>
                <div className="text-[10px] text-slate-500">{currentUser.assignedGate || currentUser.email}</div>
              </div>
              <div className="hidden sm:block">
                {getRoleBadge(currentUser.role)}
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {showUserDropdown && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3.5 py-2 border-b border-slate-100">
                  <div className="text-xs font-bold text-slate-800">{currentUser.name}</div>
                  <div className="text-[11px] text-slate-500 font-mono">{currentUser.email}</div>
                  <div className="mt-1 flex items-center justify-between">
                    {getRoleBadge(currentUser.role)}
                    <span className="text-[10px] text-slate-400">{currentUser.assignedGate || 'Todas as portarias'}</span>
                  </div>
                </div>

                {/* Account Actions */}
                <div className="p-1 border-b border-slate-100 space-y-0.5">
                  {onChangePassword && (
                    <button
                      onClick={() => {
                        setShowUserDropdown(false);
                        onChangePassword();
                      }}
                      className="w-full px-3 py-2 text-left flex items-center gap-2 text-xs text-slate-700 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <KeyRound className="w-3.5 h-3.5 text-blue-600" />
                      <span>Alterar Minha Senha</span>
                    </button>
                  )}

                  {onLogout && (
                    <button
                      onClick={() => {
                        setShowUserDropdown(false);
                        onLogout();
                      }}
                      className="w-full px-3 py-2 text-left flex items-center gap-2 text-xs text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                      id="btn-logout"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sair do Sistema (Logout)</span>
                    </button>
                  )}
                </div>

                <div className="px-3 pt-2 pb-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Alternar Usuário Rápido</p>
                </div>
                
                <div className="max-h-48 overflow-y-auto">
                  {allUsers.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => {
                        onSelectUser(user);
                        setShowUserDropdown(false);
                      }}
                      className={`w-full px-3 py-1.5 text-left flex items-center gap-2.5 hover:bg-slate-50 transition-colors cursor-pointer ${
                        currentUser.id === user.id ? 'bg-blue-50/70' : ''
                      }`}
                    >
                      <div className="w-6 h-6 rounded-full overflow-hidden bg-slate-800 text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                        {user.avatarUrl ? (
                          <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                        ) : (
                          user.name.charAt(0)
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-slate-800 flex items-center justify-between">
                          <span className="truncate">{user.name}</span>
                          {getRoleBadge(user.role)}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

