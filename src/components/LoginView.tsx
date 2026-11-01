import React from 'react';
import { UserProfile } from '../types';
import { supabase, getDocByField } from '../services/supabase';
import { 
  ShieldCheck, 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  Sparkles, 
  KeyRound, 
  CheckCircle2, 
  AlertCircle,
  HelpCircle,
  QrCode,
  Layers,
  ChevronRight,
  UserCheck
} from 'lucide-react';

interface LoginViewProps {
  users: UserProfile[];
  onLogin: (user: UserProfile) => void;
  onOpenSetPassword: (tokenOrEmail: string, isFirstAccess: boolean) => void;
  onOpenForgotPassword: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({
  users,
  onLogin,
  onOpenSetPassword,
  onOpenForgotPassword,
}) => {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [pendingUserNotice, setPendingUserNotice] = React.useState<UserProfile | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setErrorMsg(null);
    setPendingUserNotice(null);
    setSubmitting(true);

    try {
      const cleanEmail = email.trim().toLowerCase();

      // Checagens de perfil antes do Auth (mensagens amigáveis, como antes)
      const profile = await getDocByField<UserProfile>('users', 'email', cleanEmail);
      if (!profile) {
        setErrorMsg('Nenhum usuário cadastrado com este e-mail. Solicite o cadastro ao Administrador do evento.');
        return;
      }
      if (profile.status === 'blocked') {
        setErrorMsg('Este usuário está bloqueado temporariamente. Entre em contato com a administração.');
        return;
      }
      if (profile.status === 'pending_password') {
        setPendingUserNotice(profile);
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });
      if (error) {
        if (error.message.toLowerCase().includes('invalid login credentials')) {
          setErrorMsg('Senha incorreta. Verifique se digitou corretamente ou use o recurso de redefinição de senha.');
        } else if (error.message.toLowerCase().includes('email not confirmed')) {
          setErrorMsg('E-mail ainda não confirmado. Contate o administrador.');
        } else {
          setErrorMsg(error.message);
        }
        return;
      }

      onLogin(profile);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/15 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 shadow-xl shadow-blue-600/30 text-white font-extrabold text-xl mb-1">
            BP
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            BP Eventos
          </h1>
          <p className="text-xs text-slate-400 font-medium">
            Sistema Integrado de Gestão de Convidados, Disparos & Portaria QR
          </p>
        </div>

        {/* Main Login Card */}
        <div className="bg-slate-800/90 backdrop-blur-md rounded-2xl border border-slate-700/80 p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="border-b border-slate-700/60 pb-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-blue-400" />
              <span>Acessar o Sistema</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Entre com suas credenciais de Administrador, Organizador ou Portaria
            </p>
          </div>

          {/* Error / Alert banner */}
          {errorMsg && (
            <div className="p-3 bg-red-500/15 border border-red-500/30 rounded-xl text-red-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div className="leading-relaxed">{errorMsg}</div>
            </div>
          )}

          {/* Pending password notification */}
          {pendingUserNotice && (
            <div className="p-4 bg-amber-500/15 border border-amber-500/30 rounded-xl text-amber-200 text-xs space-y-2.5">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-amber-100 font-bold">Primeiro Acesso Detectado!</strong>
                  <span>O usuário <strong>{pendingUserNotice.name}</strong> foi cadastrado pelo administrador, mas ainda não definiu sua senha pessoal.</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onOpenSetPassword(pendingUserNotice.inviteToken || pendingUserNotice.email, true)}
                className="w-full py-2 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
              >
                <span>Criar Minha Senha Agora</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span>E-mail de Acesso</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  placeholder="seu.email@empresa.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Password Field with Eye Icon */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300">
                  Senha de Acesso
                </label>
                <button
                  type="button"
                  onClick={onOpenForgotPassword}
                  className="text-xs text-blue-400 hover:text-blue-300 font-medium hover:underline cursor-pointer"
                >
                  Esqueci minha senha
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Digite sua senha..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-11 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all tracking-normal"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  title={showPassword ? 'Ocultar senha' : 'Ver senha'}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                  id="btn-toggle-password-visibility"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4 text-blue-400" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 active:scale-[0.99] text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 cursor-pointer mt-2 disabled:opacity-60 disabled:cursor-wait"
              id="btn-submit-login"
            >
              <span>{submitting ? 'Entrando...' : 'Entrar no Sistema'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* First access invitation link option */}
          <div className="pt-4 border-t border-slate-700/60 text-center">
            <p className="text-xs text-slate-400">
              Recebeu um convite por e-mail?{' '}
              <button
                type="button"
                onClick={() => onOpenSetPassword('', true)}
                className="text-blue-400 hover:text-blue-300 font-semibold hover:underline cursor-pointer"
              >
                Definir senha de 1º acesso
              </button>
            </p>
          </div>
        </div>

        {/* Security Footer Notice */}
        <div className="text-center text-slate-500 text-[11px] flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
          <span>Acesso restrito a operadores autorizados • Protegido por criptografia</span>
        </div>
      </div>
    </div>
  );
};
