import React from 'react';
import { 
  Send, 
  Radio, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Pause, 
  Play, 
  Square,
  MessageSquare,
  Zap
} from 'lucide-react';
import { Guest, EventData } from '../types';
import { getGuestInviteUrl } from '../utils/urlHelper';

interface BroadcastViewProps {
  event: EventData;
  guests: Guest[];
}

export const BroadcastView: React.FC<BroadcastViewProps> = ({ event, guests }) => {
  const [messageTemplate, setMessageTemplate] = React.useState(
    `Olá {{nome}}! 🎉\n\nVocê está convidado(a) para o *{{evento}}*!\n\nApresente o QR Code abaixo na portaria para seu check-in:`
  );
  const [includeLink, setIncludeLink] = React.useState(true);
  const [delayMin, setDelayMin] = React.useState(15);
  const [delayMax, setDelayMax] = React.useState(45);
  const [selectedGuests, setSelectedGuests] = React.useState<Set<string>>(new Set(guests.map(g => g.id)));
  const [isSending, setIsSending] = React.useState(false);
  const [progress, setProgress] = React.useState<any>(null);
  const [alerts, setAlerts] = React.useState<any[]>([]);
  const [showPreview, setShowPreview] = React.useState(false);
  const [phase, setPhase] = React.useState<'config' | 'confirm' | 'sending' | 'done'>('config');

  const selectedGuestsList = guests.filter(g => selectedGuests.has(g.id));
  const estimatedTime = selectedGuestsList.length * ((delayMin + delayMax) / 2);

  const handleSelectAll = () => {
    if (selectedGuests.size === guests.length) {
      setSelectedGuests(new Set());
    } else {
      setSelectedGuests(new Set(guests.map(g => g.id)));
    }
  };

  const handleStartBroadcast = async () => {
    setPhase('confirm');
  };

  const handleConfirmSend = async () => {
    setPhase('sending');
    setIsSending(true);

    const zernio = (() => {
      try { return JSON.parse(localStorage.getItem('bp_zernio_config') || 'null'); } catch { return null; }
    })();

    const delay = (ms: number) => new Promise(r => setTimeout(r, ms));
    let sentCount = 0;
    let failedCount = 0;
    const errors: string[] = [];

    for (const guest of selectedGuestsList) {
      const phone = guest.phone.replace(/\D/g, '');
      let cleanPhone = phone;
      if (cleanPhone.length === 10 || cleanPhone.length === 11) {
        cleanPhone = '55' + cleanPhone;
      }

      let msg = messageTemplate
        .replace(/\{\{nome\}\}/g, guest.name)
        .replace(/\{\{evento\}\}/g, event.title);

      if (includeLink && guest.publicCode) {
        msg += `\n\n${getGuestInviteUrl(guest.publicCode)}`;
      }

      try {
        if (zernio?.apiKey && zernio?.profileId && zernio?.accountId) {
          const res = await fetch('/api/zernio/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              apiKey: zernio.apiKey,
              profileId: zernio.profileId,
              accountId: zernio.accountId,
              phone: cleanPhone,
              message: msg,
              templateName: zernio.templateName || 'bp_confirmacao_registro',
              templateLanguage: zernio.templateLanguage || 'pt_BR',
            }),
          });
          const data = await res.json();
          if (data.success) {
            sentCount++;
          } else {
            failedCount++;
            errors.push(`${guest.name}: ${data.error}`);
          }
        } else {
          const waUrl = `https://web.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(msg)}`;
          window.open(waUrl, '_blank');
          sentCount++;
        }
      } catch (err: any) {
        failedCount++;
        errors.push(`${guest.name}: ${err.message}`);
      }

      setProgress({
        broadcastId: zernio?.apiKey ? 'zernio' : 'manual',
        sent: sentCount,
        failed: failedCount,
        total: selectedGuestsList.length,
        currentGuest: guest.name,
      });

      if (sentCount + failedCount < selectedGuestsList.length) {
        await delay(zernio?.apiKey ? 1000 : 5000);
      }
    }

    if (errors.length > 0) {
      setAlerts(prev => [...prev, { type: 'error', message: `${failedCount} falhas: ${errors.slice(0, 3).join('; ')}` }]);
    }

    setPhase('done');
    setIsSending(false);
  };

  const handlePause = async (broadcastId: string) => {
    await fetch(`/api/broadcasts/${broadcastId}/pause`, { method: 'POST' });
  };

  const handleResume = async (broadcastId: string) => {
    await fetch(`/api/broadcasts/${broadcastId}/resume`, { method: 'POST' });
  };

  const handleCancel = async (broadcastId: string) => {
    if (confirm('Tem certeza que deseja cancelar este envio?')) {
      await fetch(`/api/broadcasts/${broadcastId}/cancel`, { method: 'POST' });
      setPhase('config');
      setIsSending(false);
    }
  };

  // Preview message with sample guest
  const previewMessage = messageTemplate
    .replace(/\{\{nome\}\}/g, selectedGuestsList[0]?.name || '[Nome]')
    .replace(/\{\{evento\}\}/g, event.title);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6 text-xs">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
            <Send className="w-5 h-5" />
          </div>
          <h1 className="text-lg font-black tracking-tight">Enviar Convites em Massa</h1>
        </div>
        <p className="text-sm text-emerald-200/80">
          Selecione os convidados, monte a mensagem e envie via WhatsApp (Baileys).
          <span className="text-emerald-300 font-semibold ml-1">Totalmente gratuito.</span>
        </p>
      </div>

      {/* Progress Bar (when sending) */}
      {phase === 'sending' && progress && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <Radio className="w-4 h-4 text-emerald-600 animate-pulse" />
              <span>Enviando convites...</span>
            </h3>
            <div className="flex gap-2">
              {progress.status === 'running' ? (
                <button onClick={() => handlePause(progress.broadcastId)} className="px-3 py-1.5 bg-amber-100 text-amber-700 rounded-lg text-[11px] font-bold cursor-pointer">
                  <Pause className="w-3 h-3 inline mr-1" />Pausar
                </button>
              ) : (
                <button onClick={() => handleResume(progress.broadcastId)} className="px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg text-[11px] font-bold cursor-pointer">
                  <Play className="w-3 h-3 inline mr-1" />Retomar
                </button>
              )}
              <button onClick={() => handleCancel(progress.broadcastId)} className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-[11px] font-bold cursor-pointer">
                <Square className="w-3 h-3 inline mr-1" />Cancelar
              </button>
            </div>
          </div>

          {/* Progress bar */}
          <div className="relative h-3 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500"
              style={{ width: `${((progress.sent + progress.failed) / progress.total) * 100}%` }}
            />
          </div>

          <div className="grid grid-cols-4 gap-3 text-center">
            <div className="p-2 bg-slate-50 rounded-lg">
              <div className="text-lg font-black text-slate-900">{progress.total}</div>
              <div className="text-[10px] text-slate-500">Total</div>
            </div>
            <div className="p-2 bg-emerald-50 rounded-lg">
              <div className="text-lg font-black text-emerald-600">{progress.sent}</div>
              <div className="text-[10px] text-emerald-600">Enviados</div>
            </div>
            <div className="p-2 bg-red-50 rounded-lg">
              <div className="text-lg font-black text-red-600">{progress.failed}</div>
              <div className="text-[10px] text-red-600">Falharam</div>
            </div>
            <div className="p-2 bg-amber-50 rounded-lg">
              <div className="text-lg font-black text-amber-600">{progress.total - progress.sent - progress.failed}</div>
              <div className="text-[10px] text-amber-600">Restantes</div>
            </div>
          </div>

          {progress.currentGuest && (
            <p className="text-[11px] text-slate-500">
              Enviando para: <span className="font-bold text-slate-800">{progress.currentGuest}</span>
            </p>
          )}
        </div>
      )}

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert, idx) => (
            <div key={idx} className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-[11px] font-bold text-amber-800">Atenção necessária</p>
                <p className="text-[10px] text-amber-700">{alert.guestName} - {alert.error}</p>
              </div>
              <button onClick={() => setAlerts(prev => prev.filter((_, i) => i !== idx))} className="text-amber-400 hover:text-amber-600 cursor-pointer">
                <XCircle className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Configuration Phase */}
      {phase === 'config' && (
        <>
          {/* Channel Info */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3">
            <Zap className="w-5 h-5 text-emerald-600" />
            <div>
              <p className="text-xs font-bold text-emerald-800">Canal: WhatsApp (Baileys) - Gratuito</p>
              <p className="text-[10px] text-emerald-600">Delay de {delayMin}-{delayMax} segundos entre mensagens para evitar banimento</p>
            </div>
          </div>

          {/* Message Template */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-emerald-600" />
                <span>Mensagem do Convite</span>
              </h3>
              <button 
                onClick={() => setShowPreview(!showPreview)}
                className="text-[10px] text-blue-600 font-semibold cursor-pointer"
              >
                {showPreview ? 'Ocultar' : 'Ver'} preview
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <textarea
                  rows={6}
                  value={messageTemplate}
                  onChange={(e) => setMessageTemplate(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono resize-none focus:ring-2 focus:ring-emerald-500/20"
                  placeholder="Use {{nome}}, {{evento}}, {{codigo}} como variáveis"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Variáveis: {'{{nome}}'}, {'{{evento}}'}, {'{{codigo}}'}
                </p>
                <label className="flex items-center gap-2 mt-2 cursor-pointer">
                  <input type="checkbox" checked={includeLink} onChange={(e) => setIncludeLink(e.target.checked)} className="rounded text-emerald-600" />
                  <span className="text-[11px] text-slate-600">Incluir link do convite</span>
                </label>
              </div>

              {showPreview && (
                <div className="bg-slate-900 rounded-xl p-4 text-white">
                  <p className="text-[10px] text-slate-400 mb-2 font-bold">PREVIEW:</p>
                  <div className="bg-slate-800 rounded-lg p-3 text-xs whitespace-pre-wrap">
                    {previewMessage}
                    {includeLink && (
                      <div className="mt-2 text-emerald-400">
                        🔗 https://gen-lang-client-0214324880.web.app/convite/{selectedGuestsList[0]?.publicCode || '...'}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Delay Configuration */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-4">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <span>Delay entre Mensagens</span>
              <span className="text-[10px] text-slate-400 font-normal ml-auto">
                ~{Math.round(estimatedTime / 60)} min para {selectedGuestsList.length} convidados
              </span>
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Mínimo (segundos)</label>
                <input
                  type="number"
                  value={delayMin}
                  onChange={(e) => setDelayMin(Number(e.target.value))}
                  min={5}
                  max={120}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Máximo (segundos)</label>
                <input
                  type="number"
                  value={delayMax}
                  onChange={(e) => setDelayMax(Number(e.target.value))}
                  min={10}
                  max={300}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                />
              </div>
            </div>
          </div>

          {/* Guest Selection */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900">
                Convidados ({selectedGuests.size}/{guests.length})
              </h3>
              <button onClick={handleSelectAll} className="text-[10px] text-blue-600 font-semibold cursor-pointer">
                {selectedGuests.size === guests.length ? 'Desmarcar todos' : 'Selecionar todos'}
              </button>
            </div>

            <div className="max-h-60 overflow-y-auto border border-slate-100 rounded-xl divide-y divide-slate-100">
              {guests.map((guest) => (
                <label key={guest.id} className="flex items-center gap-3 px-3 py-2 hover:bg-slate-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedGuests.has(guest.id)}
                    onChange={() => {
                      const next = new Set(selectedGuests);
                      if (next.has(guest.id)) next.delete(guest.id);
                      else next.add(guest.id);
                      setSelectedGuests(next);
                    }}
                    className="rounded text-emerald-600"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-slate-800 text-[11px] truncate">{guest.name}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{guest.phone}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Send Button */}
          <div className="flex justify-end">
            <button
              onClick={handleStartBroadcast}
              disabled={selectedGuests.size === 0}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg shadow-emerald-600/30 cursor-pointer transition-all active:scale-98"
            >
              <Send className="w-4 h-4" />
              <span>Revisar e Enviar ({selectedGuests.size} convites)</span>
            </button>
          </div>
        </>
      )}

      {/* Confirmation Phase */}
      {phase === 'confirm' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
          <h3 className="font-bold text-slate-900 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <span>Confirmar Envio</span>
          </h3>
          
          <div className="p-4 bg-slate-50 rounded-xl space-y-2 text-xs">
            <div className="flex justify-between"><span className="text-slate-500">Canal:</span><span className="font-bold">WhatsApp (Baileys)</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Convidados:</span><span className="font-bold">{selectedGuests.size}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Delay:</span><span className="font-bold">{delayMin}-{delayMax}s entre msgs</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Tempo estimado:</span><span className="font-bold">~{Math.round(estimatedTime / 60)} minutos</span></div>
          </div>

          <div className="flex justify-end gap-3">
            <button onClick={() => setPhase('config')} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold cursor-pointer">
              Voltar
            </button>
            <button onClick={handleConfirmSend} className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center gap-2 cursor-pointer">
              <Send className="w-4 h-4" />
              <span>Confirmar Envio</span>
            </button>
          </div>
        </div>
      )}

      {/* Done Phase */}
      {phase === 'done' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="font-bold text-slate-900 text-lg">Envio Concluído!</h3>
          <p className="text-xs text-slate-500">
            {progress?.sent || 0} convites enviados com sucesso. {progress?.failed || 0} falharam.
          </p>
          <button onClick={() => { setPhase('config'); setProgress(null); setAlerts([]); }} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold cursor-pointer">
            Novo Envio
          </button>
        </div>
      )}
    </div>
  );
};
