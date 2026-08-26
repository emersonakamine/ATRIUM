import React from 'react';
import { SPECIFICATION_DATA } from '../data/specification';
import { 
  BookOpen, 
  X, 
  Copy, 
  Check, 
  Download, 
  ExternalLink,
  ChevronRight,
  Sparkles
} from 'lucide-react';

interface SpecDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SpecDocumentModal: React.FC<SpecDocumentModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeSectionId, setActiveSectionId] = React.useState('part1');
  const [copied, setCopied] = React.useState(false);

  if (!isOpen) return null;

  const currentSection = SPECIFICATION_DATA.find(s => s.id === activeSectionId) || SPECIFICATION_DATA[0];

  const handleCopyAll = () => {
    const fullText = SPECIFICATION_DATA.map(s => `# ${s.title}\n${s.subtitle}\n\n${s.content}`).join('\n\n---\n\n');
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadMarkdown = () => {
    const fullText = `# ESPECIFICAÇÃO COMPLETA: SISTEMA DE GESTÃO DE CONVIDADOS E CHECK-IN QR CODE (EVENTIZA ENGINE)\n\n` +
      SPECIFICATION_DATA.map(s => `## ${s.title} - ${s.subtitle}\n\n${s.content}`).join('\n\n---\n\n');
    
    const blob = new Blob([fullText], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'especificacao_tecnica_eventiza_checkin.md';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-5xl w-full h-[90vh] shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold tracking-tight">
                Documento de Especificação Técnica Completa (10 Partes)
              </h2>
              <p className="text-xs text-slate-400">
                Arquitetura de Produto, UX/UI, Modelagem de Banco, Regras de Negócio e APIs
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyAll}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer border border-slate-700 transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copiado!' : 'Copiar Tudo'}</span>
            </button>

            <button
              onClick={handleDownloadMarkdown}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Baixar .MD</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body: Sidebar Navigation on Left, Markdown on Right */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Navigation */}
          <div className="w-72 bg-slate-50 border-r border-slate-200 p-3 overflow-y-auto shrink-0 space-y-1 text-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 block py-1.5">
              Índice das 10 Partes
            </span>
            {SPECIFICATION_DATA.map((sec, idx) => (
              <button
                key={sec.id}
                onClick={() => setActiveSectionId(sec.id)}
                className={`w-full text-left p-2.5 rounded-lg transition-colors cursor-pointer flex items-center justify-between ${
                  activeSectionId === sec.id
                    ? 'bg-blue-600 text-white font-bold shadow-xs'
                    : 'text-slate-700 hover:bg-slate-200/60 font-medium'
                }`}
              >
                <div className="truncate pr-2">
                  <div className="truncate text-xs">{sec.title}</div>
                  <div className={`text-[10px] truncate ${activeSectionId === sec.id ? 'text-blue-100' : 'text-slate-400'}`}>
                    {sec.subtitle}
                  </div>
                </div>
                <ChevronRight className="w-3.5 h-3.5 shrink-0 opacity-60" />
              </button>
            ))}
          </div>

          {/* Right Section Content Reader */}
          <div className="flex-1 p-6 lg:p-8 overflow-y-auto bg-white">
            <div className="max-w-3xl mx-auto space-y-4">
              <div className="border-b border-slate-200 pb-4">
                <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                  Especificação do Sistema
                </span>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
                  {currentSection.title}
                </h1>
                <p className="text-sm text-slate-500 font-medium">{currentSection.subtitle}</p>
              </div>

              {/* Rendered content */}
              <div className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-wrap font-sans space-y-3">
                {currentSection.content}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
