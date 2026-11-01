import React from 'react';
import { UserProfile } from '../types';
import { hashPassword } from '../utils/crypto';
import { 
  KeyRound, 
  Lock, 
  Eye, 
  EyeOff, 
  Check, 
  AlertCircle, 
  Mail, 
  ShieldCheck, 
  ArrowRight,
  X,
  Sparkles
} from 'lucide-react';

interface SetPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: UserProfile[];
  initialTokenOrEmail?: string;
  isFirstAccess?: boolean;
  onPasswordSetSuccess: (user: UserProfile) => void;
}

export const SetPasswordModal: React.FC<SetPasswordModalProps> = ({
  isOpen,
  onClose,
  users,
  initialTokenOrEmail = '',
  isFirstAccess = true,
  onPasswordSetSuccess,
}) => {
  const [selectedUserEmail, setSelectedUserEmail] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [successMsg, setSuccessMsg] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (initialTokenOrEmail) {
      // Find by email or token
      const found = users.find(
        u => u.email.toLowerCase() === initialTokenOrEmail.toLowerCase() ||
             u.inviteToken === initialTokenOrEmail ||
             u.resetToken === initialTokenOrEmail
      );
      if (found) {
        setSelectedUserEmail(found.email);
      } else {
        setSelectedUserEmail(initialTokenOrEmail);
      }
    } else if (users.length > 0) {
      const pending = users.find(u => u.status === 'pending_password');
      setSelectedUserEmail(pending ? pending.email : users[0].email);
    }
  }, [initialTokenOrEmail, users, isOpen]);

  if (!isOpen) return null;

  const targetUser = users.find(u => u.email.toLowerCase() === selectedUserEmail.toLowerCase());

  // Password rules validation
  const hasMinLength = newPassword.length >= 6;
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!targetUser) {
      setErrorMsg('Nenhum usuário selecionado ou encontrado.');
      return;
    }

    if (!hasMinLength) {
      setErrorMsg('A senha precisa ter pelo menos 6 caracteres.');
      return;
    }

    if (!passwordsMatch) {
      setErrorMsg('As senhas digitadas não coincidem. Verifique os campos.');
      return;
    }

    const hashedPassword = await hashPassword(newPassword);

    // Success: Update user
    const updatedUser: UserProfile = {
      ...targetUser,
      status: 'active',
      password: hashedPassword,
      inviteToken: undefined,
      resetToken: undefined,
      passwordCreatedAt: new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    };

    setSuccessMsg('Senha cadastrada com sucesso! Redirecionando para o sistema...');
    
    setTimeout(() => {
      onPasswordSetSuccess(updatedUser);
      onClose();
    }, 900);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 text-slate-100 rounded-2xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-700 animate-in fade-in zoom-in-95 duration-150 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="space-y-1.5 mb-5">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[11px] font-semibold border border-blue-400/30">
            <Sparkles className="w-3 h-3" />
            <span>{isFirstAccess ? 'Primeiro Acesso / Ativação' : 'Redefinição de Senha'}</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-blue-400" />
            <span>{isFirstAccess ? 'Criar Minha Senha de Acesso' : 'Definir Nova Senha'}</span>
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            {isFirstAccess 
              ? 'Você foi cadastrado pelo Administrador. Defina sua senha pessoal para acessar a plataforma do BP Eventos.'
              : 'Digite sua nova senha de acesso abaixo para recuperar sua conta.'}
          </p>
        </div>

        {/* Error / Success Feedback */}
        {errorMsg && (
          <div className="mb-4 p-3 bg-red-500/15 border border-red-500/30 rounded-xl text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* User Account / Email selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">
              Conta do Usuário Convidado
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-4 h-4" />
              </div>
              <select
                value={selectedUserEmail}
                onChange={(e) => setSelectedUserEmail(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                {users.map(u => (
                  <option key={u.id} value={u.email}>
                    {u.name} ({u.email}) - {u.role === 'admin' ? 'Administrador' : u.role === 'organizer' ? 'Organizador' : 'Portaria'} {u.status === 'pending_password' ? '★ [Pendente]' : ''}
                  </option>
                ))}
              </select>
            </div>
            {targetUser && (
              <div className="text-[11px] text-slate-400 bg-slate-800/60 p-2 rounded-lg border border-slate-700/50 flex items-center justify-between">
                <span>Perfil: <strong>{targetUser.role === 'admin' ? 'Administrador' : targetUser.role === 'organizer' ? 'Organizador' : 'Portaria'}</strong></span>
                <span>Portaria: <strong>{targetUser.assignedGate || 'Geral'}</strong></span>
              </div>
            )}
          </div>

          {/* New Password Field with Eye Toggle */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
              <span>Nova Senha</span>
              <span className="text-[10px] text-slate-400 font-normal">Mínimo de 6 caracteres</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Crie sua nova senha..."
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full pl-9 pr-11 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? 'Ocultar senha' : 'Ver senha'}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                id="btn-toggle-new-password-eye"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4 text-blue-400" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Confirm Password Field with Eye Toggle */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">
              Confirmar Nova Senha
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                required
                placeholder="Repita a mesma senha..."
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-9 pr-11 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                title={showConfirmPassword ? 'Ocultar confirmação de senha' : 'Ver confirmação de senha'}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                id="btn-toggle-confirm-password-eye"
              >
                {showConfirmPassword ? (
                  <EyeOff className="w-4 h-4 text-blue-400" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Real-time Password Rules Checklist */}
          <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/60 space-y-1 text-xs">
            <div className="flex items-center gap-2 text-[11px]">
              <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] ${
                hasMinLength ? 'bg-emerald-500 text-slate-950 font-bold' : 'bg-slate-700 text-slate-400'
              }`}>
                {hasMinLength ? '✓' : '•'}
              </div>
              <span className={hasMinLength ? 'text-emerald-300' : 'text-slate-400'}>
                Pelo menos 6 caracteres
              </span>
            </div>

            <div className="flex items-center gap-2 text-[11px]">
              <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] ${
                passwordsMatch ? 'bg-emerald-500 text-slate-950 font-bold' : 'bg-slate-700 text-slate-400'
              }`}>
                {passwordsMatch ? '✓' : '•'}
              </div>
              <span className={passwordsMatch ? 'text-emerald-300' : 'text-slate-400'}>
                As duas senhas coincidem exatamente
              </span>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!hasMinLength || !passwordsMatch}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer ${
                hasMinLength && passwordsMatch
                  ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30 active:scale-95'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
              }`}
              id="btn-save-password"
            >
              <span>{isFirstAccess ? 'Salvar Senha & Acessar' : 'Salvar Nova Senha'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
