import React from 'react';
import { UserProfile, UserRole, EventData } from '../types';
import { 
  Shield, 
  UserPlus, 
  Check, 
  Trash2, 
  KeyRound, 
  ShieldCheck, 
  UserCheck, 
  Building,
  Mail,
  Copy,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  Clock,
  Sparkles,
  Send,
  Calendar
} from 'lucide-react';

interface TeamSettingsViewProps {
  users: UserProfile[];
  events: EventData[];
  onAddUser: (user: UserProfile) => void;
  onUpdateRole: (userId: string, role: UserRole) => void;
  onUpdateAssignedEvents: (userId: string, eventIds: string[]) => void;
  onDeleteUser: (userId: string) => void;
  onAdminSendPasswordReset: (userId: string) => { success: boolean; token: string; user: UserProfile };
  onOpenSetPasswordModal: (tokenOrEmail: string, isFirstAccess: boolean) => void;
}

export const TeamSettingsView: React.FC<TeamSettingsViewProps> = ({
  users,
  events,
  onAddUser,
  onUpdateRole,
  onUpdateAssignedEvents,
  onDeleteUser,
  onAdminSendPasswordReset,
  onOpenSetPasswordModal,
}) => {
  const [showModal, setShowModal] = React.useState(false);
  const [invitedFeedbackUser, setInvitedFeedbackUser] = React.useState<UserProfile | null>(null);
  const [resetFeedbackUser, setResetFeedbackUser] = React.useState<{ user: UserProfile; token: string } | null>(null);
  const [copiedToken, setCopiedToken] = React.useState<string | null>(null);

  const [newUser, setNewUser] = React.useState<{
    name: string;
    email: string;
    role: UserRole;
    assignedGate: string;
    assignedEventIds: string[];
  }>({
    name: '',
    email: '',
    role: 'gate',
    assignedGate: 'Portaria Principal A',
    assignedEventIds: [],
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.name.trim() || !newUser.email.trim()) return;

    const token = `inv_${Math.random().toString(36).substring(2, 10)}`;
    const createdUser: UserProfile = {
      id: `usr_${Date.now()}`,
      name: newUser.name,
      email: newUser.email.trim().toLowerCase(),
      role: newUser.role,
      assignedGate: newUser.assignedGate,
      assignedEventIds: newUser.assignedEventIds,
      status: 'pending_password',
      inviteToken: token,
      invitedAt: new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    };

    onAddUser(createdUser);
    setShowModal(false);
    setNewUser({ name: '', email: '', role: 'gate', assignedGate: 'Portaria Principal A', assignedEventIds: [] });
    setInvitedFeedbackUser(createdUser);
  };

  const handleTriggerReset = (user: UserProfile) => {
    const res = onAdminSendPasswordReset(user.id);
    if (res.success) {
      setResetFeedbackUser({ user: res.user, token: res.token });
    }
  };

  const copyLink = (token: string) => {
    const fullUrl = `${window.location.origin}/#create-password?token=${token}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 text-xs">
      {/* Top Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-600" />
            <span>Equipe do Evento, Perfis & Permissões</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Cadastre membros da equipe, envie convites para criação de senha e gerencie redefinições de acesso.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-xs cursor-pointer active:scale-95 transition-all"
          id="btn-invite-team-member"
        >
          <UserPlus className="w-4 h-4" />
          <span>Convidar Membro da Equipe</span>
        </button>
      </div>

      {/* Role Matrix Description Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-purple-200 shadow-xs">
          <div className="flex items-center gap-2 text-purple-700 font-bold mb-2">
            <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-800 text-[10px]">ADMINISTRADOR</span>
          </div>
          <p className="text-slate-600 text-xs leading-relaxed">
            Acesso irrestrito a configurações, exclusão de dados, cadastro de usuários, disparo de reset de senhas e auditoria completa.
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-blue-200 shadow-xs">
          <div className="flex items-center gap-2 text-blue-700 font-bold mb-2">
            <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px]">ORGANIZADOR</span>
          </div>
          <p className="text-slate-600 text-xs leading-relaxed">
            Pode criar e editar eventos, importar listas de convidados, personalizar convites, disparar WhatsApp/E-mails e ver relatórios.
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-amber-200 shadow-xs">
          <div className="flex items-center gap-2 text-amber-700 font-bold mb-2">
            <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px]">PORTARIA / SCANNER</span>
          </div>
          <p className="text-slate-600 text-xs leading-relaxed">
            Acesso focado na operação do leitor móvel de QR Code, busca rápida de participantes e confirmação de entrada.
          </p>
        </div>
      </div>

      {/* Team Table with Auth & Password Management */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="font-bold text-slate-800 flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-blue-600" />
            <span>Membros Credenciados ({users.length})</span>
          </div>
          <span className="text-[11px] text-slate-500">
            {users.filter(u => u.status === 'active').length} ativos • {users.filter(u => u.status === 'pending_password').length} aguardando senha
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Nome do Membro</th>
                <th className="py-3 px-4">E-mail de Acesso</th>
                <th className="py-3 px-4">Status da Senha</th>
                <th className="py-3 px-4">Perfil de Acesso</th>
                <th className="py-3 px-4">Portaria Atribuída</th>
                <th className="py-3 px-4 text-right">Gerenciar Acesso</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {users.map((user) => {
                const isPending = user.status === 'pending_password' || !user.password;
                return (
                  <tr key={user.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs overflow-hidden">
                        {user.avatarUrl ? (
                          <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                        ) : (
                          user.name.charAt(0)
                        )}
                      </div>
                      <div>
                        <div className="text-slate-900">{user.name}</div>
                        <div className="text-[10px] text-slate-400 font-normal">
                          {user.role === 'admin' ? 'Acesso Total' : user.role === 'organizer' ? 'Organização' : 'Check-in'}
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 font-mono text-[11px]">
                      {user.email}
                    </td>

                    <td className="py-3.5 px-4">
                      {isPending ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                          <Clock className="w-3 h-3 text-amber-500" />
                          <span>Aguardando Criar Senha</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                          <span>Ativo (Senha Definida)</span>
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <select
                        value={user.role}
                        onChange={(e) => onUpdateRole(user.id, e.target.value as UserRole)}
                        className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-800 text-xs cursor-pointer focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="admin">Administrador</option>
                        <option value="organizer">Organizador</option>
                        <option value="gate">Portaria / Check-in</option>
                      </select>
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 font-medium">
                      {user.role === 'gate' ? (
                        <div className="space-y-1.5">
                          <div className="text-[10px] text-slate-400">{user.assignedGate || 'Portaria Principal'}</div>
                          <div className="relative">
                            <details className="group">
                              <summary className="cursor-pointer text-[10px] text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                <span>{user.assignedEventIds?.length || 0} evento(s)</span>
                              </summary>
                              <div className="absolute z-20 top-5 left-0 bg-white border border-slate-200 rounded-lg shadow-xl p-2 min-w-[200px] space-y-1">
                                {events.length === 0 ? (
                                  <p className="text-[10px] text-slate-400 p-1">Nenhum evento cadastrado</p>
                                ) : events.map((ev) => (
                                  <label key={ev.id} className="flex items-center gap-2 p-1 hover:bg-slate-50 rounded cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={user.assignedEventIds?.includes(ev.id) || false}
                                      onChange={(e) => {
                                        const current = user.assignedEventIds || [];
                                        const updated = e.target.checked
                                          ? [...current, ev.id]
                                          : current.filter(id => id !== ev.id);
                                        onUpdateAssignedEvents(user.id, updated);
                                      }}
                                      className="w-3 h-3 text-blue-600 rounded"
                                    />
                                    <span className="text-[10px] text-slate-700 font-medium truncate">{ev.title}</span>
                                  </label>
                                ))}
                              </div>
                            </details>
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[10px]">—</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Send Password Reset Button */}
                        <button
                          onClick={() => handleTriggerReset(user)}
                          title="Enviar link para o usuário criar/redefinir senha"
                          className="p-1.5 text-blue-600 hover:bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-1 transition-colors cursor-pointer text-[11px] font-semibold"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Resetar Senha</span>
                        </button>

                        {/* Delete User */}
                        {users.length > 1 && (
                          <button
                            onClick={() => {
                              if (confirm(`Deseja remover o acesso de ${user.name}?`)) {
                                onDeleteUser(user.id);
                              }
                            }}
                            title="Remover membro"
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Invite New Member */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-blue-600" />
              <span>Convidar Membro para a Equipe</span>
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              O administrador cadastra o membro e o sistema dispara um e-mail para que ele crie sua senha pessoal com segurança.
            </p>

            <form onSubmit={handleCreate} className="space-y-3.5">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Nome Completo</label>
                <input
                  type="text"
                  required
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  placeholder="Ex: Emerson Akamine"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-semibold focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">E-mail Corporativo</label>
                <input
                  type="email"
                  required
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  placeholder="emerson@bellinatiperez.com.br"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Perfil de Acesso</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value as UserRole })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-semibold focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="admin">Administrador (Controle Total & Resets)</option>
                  <option value="organizer">Organizador (Gestão de Convidados & Convites)</option>
                  <option value="gate">Portaria / Check-in Móvel</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Portaria Designada</label>
                <input
                  type="text"
                  value={newUser.assignedGate}
                  onChange={(e) => setNewUser({ ...newUser, assignedGate: e.target.value })}
                  placeholder="Ex: Portaria Principal ou ADM Geral"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
              </div>

              {newUser.role === 'gate' && events.length > 0 && (
                <div>
                  <label className="font-bold text-slate-700 block mb-1 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-blue-600" />
                    <span>Eventos Permitidos</span>
                  </label>
                  <p className="text-[10px] text-slate-400 mb-2">Selecione os eventos que este membro pode fazer check-in. Se nenhum for selecionado, terá acesso a todos.</p>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto border border-slate-200 rounded-lg p-2 bg-slate-50">
                    {events.map((ev) => (
                      <label key={ev.id} className="flex items-center gap-2 p-1.5 hover:bg-white rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newUser.assignedEventIds.includes(ev.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewUser({ ...newUser, assignedEventIds: [...newUser.assignedEventIds, ev.id] });
                            } else {
                              setNewUser({ ...newUser, assignedEventIds: newUser.assignedEventIds.filter(id => id !== ev.id) });
                            }
                          }}
                          className="w-3.5 h-3.5 text-blue-600 rounded"
                        />
                        <span className="text-xs text-slate-700 font-medium">{ev.title}</span>
                        <span className="text-[9px] text-slate-400 ml-auto">{ev.startDate}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 text-[11px] text-blue-800 flex items-start gap-2">
                <Mail className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span>
                  Um link de primeiro acesso seguro será gerado automaticamente para que o novo membro cadastre sua senha.
                </span>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Cadastrar & Enviar Convite</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Invite Sent Feedback */}
      {invitedFeedbackUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Convite Enviado com Sucesso!</h3>
                <p className="text-xs text-slate-500">Membro adicionado à equipe com status pendente de senha.</p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Nome:</span>
                <span className="font-bold text-slate-800">{invitedFeedbackUser.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">E-mail:</span>
                <span className="font-mono text-slate-800">{invitedFeedbackUser.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Perfil:</span>
                <span className="font-semibold text-blue-600">{invitedFeedbackUser.role.toUpperCase()}</span>
              </div>
            </div>

            <div className="bg-blue-50/70 p-3 rounded-xl border border-blue-200 space-y-2">
              <div className="text-[11px] font-bold text-blue-900 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>Link de 1º Acesso Gerado:</span>
              </div>
              <p className="text-[11px] text-blue-700">
                O usuário pode criar a senha acessando diretamente o link abaixo:
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => invitedFeedbackUser.inviteToken && copyLink(invitedFeedbackUser.inviteToken)}
                  className="flex-1 py-2 px-3 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  <span>{copiedToken === invitedFeedbackUser.inviteToken ? 'Link Copiado!' : 'Copiar Link'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const token = invitedFeedbackUser.inviteToken || invitedFeedbackUser.email;
                    setInvitedFeedbackUser(null);
                    onOpenSetPasswordModal(token, true);
                  }}
                  className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Criar Senha Agora</span>
                </button>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setInvitedFeedbackUser(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold text-xs cursor-pointer"
              >
                Concluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Admin Password Reset Feedback */}
      {resetFeedbackUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Link de Redefinição Gerado!</h3>
                <p className="text-xs text-slate-500">Solicitação de reset realizada pelo Administrador.</p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
              <p className="text-slate-700">
                Um e-mail de redefinição foi simulado para <strong>{resetFeedbackUser.user.name}</strong> ({resetFeedbackUser.user.email}).
              </p>
            </div>

            <div className="bg-slate-100 p-3 rounded-xl border border-slate-200 space-y-2">
              <div className="text-[11px] font-bold text-slate-600">Ações Rápidas:</div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => copyLink(resetFeedbackUser.token)}
                  className="flex-1 py-2 px-3 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  <span>{copiedToken === resetFeedbackUser.token ? 'Link Copiado!' : 'Copiar Link'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const token = resetFeedbackUser.token;
                    setResetFeedbackUser(null);
                    onOpenSetPasswordModal(token, false);
                  }}
                  className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Definir Nova Senha</span>
                </button>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setResetFeedbackUser(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold text-xs cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
