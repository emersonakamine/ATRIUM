import React from 'react';
import { ShieldAlert, ArrowLeft, RefreshCw, HelpCircle } from 'lucide-react';

interface PublicInviteNotFoundProps {
  codeEntered?: string;
  onRetry?: () => void;
}

export const PublicInviteNotFound: React.FC<PublicInviteNotFoundProps> = ({
  codeEntered,
  onRetry,
}) => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 selection:bg-blue-600 selection:text-white">
      <div className="max-w-md w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 text-center space-y-5 shadow-2xl relative overflow-hidden">
        {/* Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mx-auto shadow-inner">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-xl font-extrabold text-white tracking-tight">
            Convite Não Encontrado
          </h1>
          <p className="text-xs text-slate-400 leading-relaxed">
            O link de acesso utilizado é inválido, expirou ou o convite foi cancelado pela organização do evento.
          </p>
        </div>

        {codeEntered && (
          <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-left">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Código Informado:
            </span>
            <code className="font-mono text-xs text-amber-400 break-all select-all font-bold">
              {codeEntered}
            </code>
          </div>
        )}

        <div className="p-3.5 bg-blue-950/30 rounded-xl border border-blue-900/30 text-[11px] text-blue-300 text-left space-y-1">
          <div className="font-bold flex items-center gap-1.5 text-blue-200">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>O que fazer?</span>
          </div>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            • Verifique se o link enviado pelo WhatsApp ou e-mail foi copiado por completo.<br />
            • Caso tenha dúvidas, entre em contato direto com os organizadores do evento.
          </p>
        </div>

        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer border border-slate-700 shadow-md"
          >
            <RefreshCw className="w-4 h-4 text-blue-400" />
            <span>Tentar Novamente</span>
          </button>
        )}

        <div className="pt-2 text-[10px] text-slate-600 border-t border-slate-800/80">
          Guest Gate Security • Protegido por Criptografia & LGPD
        </div>
      </div>
    </div>
  );
};
