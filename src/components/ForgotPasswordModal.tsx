import React from 'react';
import { UserProfile } from '../types';
import { 
  KeyRound, 
  Mail, 
  ArrowRight, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  ExternalLink,
  ShieldCheck
} from 'lucide-react';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: UserProfile[];
  onTriggerResetLink: (email: string) => { success: boolean; user?: UserProfile; token?: string; error?: string };
  onOpenSetPasswordWithToken: (tokenOrEmail: string) => void;
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
  isOpen,
  onClose,
  users,
  onTriggerResetLink,
  onOpenSetPasswordWithToken,
}) => {
  const [email, setEmail] = React.useState('');
  const [resetResult, setResetResult] = React.useState<{
    success: boolean;
    user?: UserProfile;
    token?: string;
    error?: string;
  } | null>(null);
  const [copied, setCopied] = React.useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setResetResult(null);

    const result = onTriggerResetLink(email.trim());
    setResetResult(result);
  };

  const copyResetLink = (token: string) => {
    const fullLink = `${window.location.origin}/#reset-password?token=${token}`;
    navigator.clipboard.writeText(fullLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
        <div className="space-y-1 mb-5">
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-blue-400" />
            <span>Recuperar Senha de Acesso</span>
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Informe o e-mail cadastrado pelo Administrador para receber o link seguro de redefinição de senha.
          </p>
        </div>

        {/* Success View */}
        {resetResult && resetResult.success && resetResult.user && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="p-4 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-xs text-emerald-200 space-y-2">
              <div className="flex items-center gap-2 font-bold text-emerald-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Link de Redefinição Gerado com Sucesso!</span>
              </div>
              <p className="text-slate-300">
                Um e-mail foi simulado para <strong>{resetResult.user.email}</strong> com instruções e link seguro para cadastrar uma nova senha.
              </p>
            </div>

            {/* Email Preview Box */}
            <div className="bg-slate-800/90 rounded-xl p-3.5 border border-slate-700 space-y-2">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                <span>E-mail Disparado para {resetResult.user.name}</span>
                <span className="text-[10px] bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded">Simulação Ativa</span>
              </div>
              <p className="text-xs text-slate-300 italic">
                "Olá {resetResult.user.name}, recebemos sua solicitação para redefinir a senha do BP Eventos. Clique no botão abaixo para criar sua nova senha com segurança."
              </p>
              
              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => resetResult.token && copyResetLink(resetResult.token)}
                  className="flex-1 py-2 px-3 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copied ? 'Link Copiado!' : 'Copiar Link de Reset'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenSetPasswordWithToken(resetResult.token || resetResult.user?.email || '');
                  }}
                  className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                >
                  <span>Abrir & Redefinir</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={onClose}
                className="text-xs text-slate-400 hover:text-slate-200 underline cursor-pointer"
              >
                Voltar à tela de login
              </button>
            </div>
          </div>
        )}

        {/* Error View */}
        {resetResult && !resetResult.success && (
          <div className="mb-4 p-3 bg-red-500/15 border border-red-500/30 rounded-xl text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{resetResult.error || 'E-mail não encontrado no sistema.'}</span>
          </div>
        )}

        {/* Form View */}
        {(!resetResult || !resetResult.success) && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Seu E-mail Cadastrado
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  placeholder="exemplo@empresa.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Hint about admin */}
            <div className="p-3 bg-slate-800/70 rounded-xl border border-slate-700/50 text-[11px] text-slate-400 space-y-1">
              <div className="font-semibold text-slate-300">Dica de Acesso:</div>
              <p>O Administrador geral também pode enviar ou resetar sua senha a qualquer momento através da aba de <strong>Equipe & Permissões</strong>.</p>
            </div>

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
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-600/30 flex items-center gap-1.5 cursor-pointer"
                id="btn-send-reset-email"
              >
                <span>Enviar Link de Redefinição</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
