import React from 'react';
import { Guest, TicketCategory, UserProfile, CheckInScanResult, EventData } from '../types';
import { sound } from '../utils/audio';
import jsQR from 'jsqr';
import confetti from 'canvas-confetti';
import { 
  Camera, 
  CameraOff, 
  RotateCcw, 
  Search, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  ShieldCheck, 
  Maximize, 
  Minimize, 
  Sun, 
  Moon,
  Smartphone
} from 'lucide-react';

interface PortariaScannerViewProps {
  event: EventData;
  guests: Guest[];
  categories: TicketCategory[];
  currentUser: UserProfile;
  onPerformCheckIn: (payloadToken: string, operatorName: string, gateName: string) => CheckInScanResult;
}

export const PortariaScannerView: React.FC<PortariaScannerViewProps> = ({
  event,
  guests,
  categories,
  currentUser,
  onPerformCheckIn,
}) => {
  const [cameraActive, setCameraActive] = React.useState(false);
  const [cameraFacing, setCameraFacing] = React.useState<'environment' | 'user'>('environment');
  const [cameraError, setCameraError] = React.useState<string | null>(null);
  const [selectedGate, setSelectedGate] = React.useState('Portaria Principal A');
  const [manualQuery, setManualQuery] = React.useState('');
  const [lastResult, setLastResult] = React.useState<CheckInScanResult | null>(null);
  const [scanHistory, setScanHistory] = React.useState<CheckInScanResult[]>([]);
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const [wakeLockActive, setWakeLockActive] = React.useState(false);
  const [isMobile, setIsMobile] = React.useState(false);

  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const animationFrameId = React.useRef<number | null>(null);
  const isScanningRef = React.useRef<boolean>(false);
  const lastScannedTokenRef = React.useRef<string | null>(null);
  const cooldownTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const wakeLockRef = React.useRef<WakeLockSentinel | null>(null);

  // Detect mobile device
  React.useEffect(() => {
    const check = () => {
      const mobile = /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
        || window.innerWidth < 768;
      setIsMobile(mobile);
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Wake Lock API - prevents screen from sleeping
  const requestWakeLock = async () => {
    try {
      if ('wakeLock' in navigator) {
        wakeLockRef.current = await navigator.wakeLock.request('screen');
        setWakeLockActive(true);
        wakeLockRef.current.addEventListener('release', () => setWakeLockActive(false));
      }
    } catch {
      // Wake Lock not supported or denied
    }
  };

  const releaseWakeLock = async () => {
    if (wakeLockRef.current) {
      await wakeLockRef.current.release();
      wakeLockRef.current = null;
    }
  };

  // Fullscreen API
  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement && containerRef.current) {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else if (document.fullscreenElement) {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch {
      // Fullscreen not supported
    }
  };

  React.useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  // Start camera with optimized constraints for mobile QR scanning
  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError('Câmera não suportada neste navegador.');
        return;
      }

      // Request high resolution for better QR detection on mobile
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: cameraFacing,
          width: { ideal: 1920, min: 1280 },
          height: { ideal: 1080, min: 720 },
          frameRate: { ideal: 30, min: 15 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // iOS requirements
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.setAttribute('webkit-playsinline', 'true');
        videoRef.current.setAttribute('muted', 'true');
        videoRef.current.muted = true;
        
        await videoRef.current.play();
        setCameraActive(true);
        isScanningRef.current = true;
        requestWakeLock();
        scanLoop();
      }
    } catch (err: any) {
      console.warn('Camera access issue:', err);
      if (err.name === 'NotAllowedError') {
        setCameraError('Permissão de câmera negada. Ative nas configurações do dispositivo.');
      } else if (err.name === 'OverconstrainedError') {
        // Fallback with lower constraints
        try {
          const fallbackStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: cameraFacing },
            audio: false,
          });
          if (videoRef.current) {
            videoRef.current.srcObject = fallbackStream;
            videoRef.current.setAttribute('playsinline', 'true');
            videoRef.current.muted = true;
            await videoRef.current.play();
            setCameraActive(true);
            isScanningRef.current = true;
            requestWakeLock();
            scanLoop();
          }
        } catch {
          setCameraError('Câmera não disponível. Use a busca manual.');
        }
      } else {
        setCameraError('Câmera não disponível. Use a busca manual.');
      }
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    isScanningRef.current = false;
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
    }
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    releaseWakeLock();
    setCameraActive(false);
  };

  const flipCamera = () => {
    stopCamera();
    setCameraFacing(prev => (prev === 'environment' ? 'user' : 'environment'));
    setTimeout(startCamera, 300);
  };

  // Continuous QR decode loop
  const scanLoop = () => {
    if (!isScanningRef.current) return;

    if (videoRef.current && videoRef.current.readyState >= videoRef.current.HAVE_ENOUGH_DATA) {
      const video = videoRef.current;
      const canvas = canvasRef.current || document.createElement('canvas');
      
      // Use a reasonable resolution for scanning (not full res for performance)
      const scanWidth = Math.min(video.videoWidth, 1280);
      const scanHeight = Math.min(video.videoHeight, 720);
      canvas.width = scanWidth;
      canvas.height = scanHeight;

      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (ctx) {
        ctx.drawImage(video, 0, 0, scanWidth, scanHeight);
        const imageData = ctx.getImageData(0, 0, scanWidth, scanHeight);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'dontInvert',
        });

        if (code?.data && code.data !== lastScannedTokenRef.current) {
          lastScannedTokenRef.current = code.data;
          handleProcessPayload(code.data);

          if (cooldownTimeoutRef.current) clearTimeout(cooldownTimeoutRef.current);
          cooldownTimeoutRef.current = setTimeout(() => {
            lastScannedTokenRef.current = null;
          }, 2500);
        }
      }
    }

    animationFrameId.current = requestAnimationFrame(scanLoop);
  };

  const handleProcessPayload = (rawPayload: string) => {
    const result = onPerformCheckIn(rawPayload.trim(), currentUser.name, selectedGate);
    setLastResult(result);
    setScanHistory(prev => [result, ...prev.slice(0, 19)]);

    if (result.status === 'success') {
      sound.playSuccess();
      sound.triggerVibration([100, 50, 150]);
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
    } else if (result.status === 'duplicate') {
      sound.playWarning();
      sound.triggerVibration([300, 100, 300]);
    } else {
      sound.playError();
      sound.triggerVibration([500]);
    }
  };

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      stopCamera();
      if (document.fullscreenElement) document.exitFullscreen();
    };
  }, []);

  // Re-acquire wake lock when page becomes visible again (mobile browsers release it)
  React.useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible' && cameraActive && !wakeLockActive) {
        requestWakeLock();
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [cameraActive, wakeLockActive]);

  // Search results
  const searchResults = manualQuery.trim().length > 1
    ? guests.filter(g => 
        g.name.toLowerCase().includes(manualQuery.toLowerCase()) ||
        g.phone.includes(manualQuery) ||
        g.email.toLowerCase().includes(manualQuery.toLowerCase()) ||
        g.publicCode.toLowerCase().includes(manualQuery.toLowerCase()) ||
        g.qrPayloadToken.toLowerCase().includes(manualQuery.toLowerCase())
      )
    : [];

  return (
    <div ref={containerRef} className={`${isFullscreen ? 'fixed inset-0 z-50 bg-slate-950 p-4' : 'p-3 sm:p-6'} max-w-5xl mx-auto space-y-4 ${isMobile ? 'pb-24' : ''} min-h-[100dvh]`}>
      {/* Top Bar - Compact on mobile */}
      <div className="bg-slate-900 text-white rounded-xl sm:rounded-2xl p-3 sm:p-5 shadow-xl border border-slate-800">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30 shrink-0">
              <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <h2 className="text-xs sm:text-base font-bold tracking-tight flex items-center gap-1.5">
                <span className="truncate">Portaria QR</span>
                <span className="text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono shrink-0">
                  Anti-fraude
                </span>
              </h2>
              <p className="text-[10px] sm:text-xs text-slate-400 truncate">
                {currentUser.name}
              </p>
            </div>
          </div>

          {/* Quick actions */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Fullscreen toggle */}
            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
              title={isFullscreen ? 'Sair da tela cheia' : 'Tela cheia'}
            >
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </button>

            {/* Gate selector - dropdown on mobile */}
            <select
              value={selectedGate}
              onChange={(e) => setSelectedGate(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-white text-[10px] sm:text-xs font-semibold rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 cursor-pointer max-w-[140px] sm:max-w-none"
            >
              <option value="Portaria Principal A">Principal A</option>
              <option value="Portaria VIP Lateral">VIP Lateral</option>
              <option value="Entrada Staff & Backstage">Staff</option>
              <option value="Totem Autoatendimento">Totem</option>
            </select>
          </div>
        </div>
      </div>

      {/* Scanner - always visible on mobile */}
      <div className="bg-slate-900 rounded-xl sm:rounded-2xl border border-slate-800 overflow-hidden shadow-2xl relative">
        {/* Video Area */}
        <div className={`relative bg-black flex items-center justify-center overflow-hidden ${isFullscreen ? 'aspect-auto h-[50vh]' : isMobile ? 'aspect-[3/4] max-h-[50vh]' : 'aspect-[4/3]'}`}>
          <video
            ref={videoRef}
            className={`w-full h-full object-cover ${cameraActive ? 'block' : 'hidden'}`}
            autoPlay
            playsInline
            muted
          />
          <canvas ref={canvasRef} className="hidden" />

          {/* Scanner overlay */}
          {cameraActive ? (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-6 sm:p-8">
              <div className="w-48 h-48 sm:w-56 sm:h-56 border-2 border-emerald-400/80 rounded-xl sm:rounded-2xl relative animate-pulse shadow-[0_0_25px_rgba(52,211,153,0.3)]">
                <div className="absolute -top-1 -left-1 w-5 h-5 sm:w-6 sm:h-6 border-t-4 border-l-4 border-emerald-400 rounded-tl"></div>
                <div className="absolute -top-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 border-t-4 border-r-4 border-emerald-400 rounded-tr"></div>
                <div className="absolute -bottom-1 -left-1 w-5 h-5 sm:w-6 sm:h-6 border-b-4 border-l-4 border-emerald-400 rounded-bl"></div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 border-b-4 border-r-4 border-emerald-400 rounded-br"></div>
                <div className="w-full h-0.5 bg-emerald-400 absolute top-1/2 -translate-y-1/2 opacity-70 animate-bounce"></div>
              </div>
            </div>
          ) : (
            <div className="p-4 sm:p-6 text-center text-slate-400 space-y-3">
              <CameraOff className="w-10 h-10 sm:w-12 sm:h-12 mx-auto text-slate-600" />
              <p className="text-[11px] sm:text-xs max-w-xs text-slate-400">
                Aponte a câmera para o QR Code do convidado.
              </p>
              <button
                onClick={startCamera}
                className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-600/30 transition-all cursor-pointer inline-flex items-center gap-2"
              >
                <Camera className="w-5 h-5" />
                <span>Iniciar Câmera</span>
              </button>
            </div>
          )}

          {cameraError && (
            <div className="absolute bottom-3 inset-x-3 bg-amber-950/90 border border-amber-800 text-amber-200 text-[10px] sm:text-[11px] p-2.5 rounded-lg text-center">
              {cameraError}
            </div>
          )}
        </div>

        {/* Camera controls */}
        {cameraActive && (
          <div className="p-2.5 sm:p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <button
                onClick={flipCamera}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-200 rounded-lg flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Inverter</span>
              </button>

              {/* Wake lock indicator */}
              <span className={`text-[10px] px-2 py-1 rounded-md font-mono ${wakeLockActive ? 'bg-emerald-950/60 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
                {wakeLockActive ? '☀ Tela ativa' : '☀ Off'}
              </span>
            </div>

            <button
              onClick={stopCamera}
              className="px-3 py-2 bg-red-950/60 hover:bg-red-900/80 active:bg-red-800 text-red-300 rounded-lg flex items-center gap-1.5 cursor-pointer border border-red-800/40"
            >
              <CameraOff className="w-3.5 h-3.5" />
              <span>Parar</span>
            </button>
          </div>
        )}
      </div>

      {/* Result Card */}
      {lastResult && (
        <div
          className={`rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-xl border-2 transition-all duration-300 ${
            lastResult.status === 'success'
              ? 'bg-emerald-500 text-white border-emerald-400 shadow-emerald-500/20'
              : lastResult.status === 'duplicate'
              ? 'bg-amber-500 text-white border-amber-400 shadow-amber-500/20'
              : 'bg-red-600 text-white border-red-400 shadow-red-600/20'
          }`}
        >
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="p-2.5 sm:p-3 bg-white/20 rounded-xl sm:rounded-2xl shrink-0">
              {lastResult.status === 'success' && <CheckCircle2 className="w-8 h-8 sm:w-10 sm:h-10 text-white" />}
              {lastResult.status === 'duplicate' && <AlertTriangle className="w-8 h-8 sm:w-10 sm:h-10 text-white" />}
              {lastResult.status === 'invalid' && <XCircle className="w-8 h-8 sm:w-10 sm:h-10 text-white" />}
            </div>

            <div className="flex-1 min-w-0">
              <div className="text-[10px] sm:text-xs font-extrabold uppercase tracking-widest text-white/80">
                {lastResult.status === 'success' && '✓ Entrada Liberada'}
                {lastResult.status === 'duplicate' && '⚠ DUPLICIDADE'}
                {lastResult.status === 'invalid' && '✗ QR Inválido'}
              </div>

              <h3 className="text-lg sm:text-2xl font-black tracking-tight mt-0.5">
                {lastResult.guest?.name || lastResult.message}
              </h3>

              {lastResult.guest && (
                <div className="mt-2 pt-2 border-t border-white/20 text-[11px] sm:text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-white/80">Categoria:</span>
                    <span className="font-bold bg-white/20 px-2 py-0.5 rounded">
                      {categories.find(c => c.id === lastResult.guest?.ticketCategoryId)?.name || 'Geral'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/80">CPF:</span>
                    <span className="font-mono">{lastResult.guest.docNumber || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/80">Acompanhantes:</span>
                    <span>+{lastResult.guest.companions}</span>
                  </div>
                </div>
              )}

              {lastResult.status === 'duplicate' && lastResult.previousCheckIn && (
                <div className="mt-2 p-2.5 bg-black/20 rounded-lg text-[11px] sm:text-xs space-y-0.5">
                  <div className="font-bold text-yellow-200">1º check-in:</div>
                  <div>{lastResult.previousCheckIn.timestamp} por {lastResult.previousCheckIn.operator}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Quick test buttons */}
      <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-xs">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
          Simulação rápida:
        </span>
        <div className="flex flex-wrap gap-1.5">
          {guests.slice(0, isMobile ? 2 : 3).map((g) => (
            <button
              key={g.id}
              onClick={() => handleProcessPayload(g.qrPayloadToken)}
              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 rounded-lg text-[11px] sm:text-xs font-semibold border border-slate-200 cursor-pointer"
            >
              {g.name.slice(0, 12)}{g.isCheckedIn ? ' ⚠' : ''}
            </button>
          ))}
          <button
            onClick={() => handleProcessPayload('EVZ-INVALIDO-TOKEN-FAKE-999')}
            className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 active:bg-red-200 text-red-700 rounded-lg text-[11px] sm:text-xs font-semibold border border-red-200 cursor-pointer"
          >
            Inválido
          </button>
        </div>
      </div>

      {/* Manual Search */}
      <div className="bg-white rounded-xl border border-slate-200 p-3 sm:p-5 shadow-xs text-xs space-y-3">
        <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
          <Search className="w-4 h-4 text-blue-600" />
          <span>Busca Manual</span>
        </h3>

        <input
          type="text"
          inputMode="search"
          placeholder="Nome, WhatsApp, CPF ou código..."
          value={manualQuery}
          onChange={(e) => setManualQuery(e.target.value)}
          className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-semibold focus:ring-2 focus:ring-blue-500/20 text-sm"
        />

        {searchResults.length > 0 && (
          <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto border border-slate-100 rounded-lg">
            {searchResults.map((guest) => {
              const cat = categories.find(c => c.id === guest.ticketCategoryId);
              return (
                <div key={guest.id} className="p-2.5 flex items-center justify-between hover:bg-slate-50 gap-2">
                  <div className="min-w-0">
                    <div className="font-bold text-slate-800 flex items-center gap-1.5 flex-wrap">
                      <span className="truncate">{guest.name}</span>
                      {cat && (
                        <span className={`text-[9px] sm:text-[10px] px-1.5 py-0.2 rounded font-bold ${cat.badgeBg} shrink-0`}>
                          {cat.name}
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">{guest.phone}</div>
                  </div>

                  <button
                    onClick={() => handleProcessPayload(guest.qrPayloadToken)}
                    className={`px-3 py-2 rounded-lg text-[11px] sm:text-xs font-bold cursor-pointer transition-colors shrink-0 active:scale-95 ${
                      guest.isCheckedIn
                        ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                        : 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white'
                    }`}
                  >
                    {guest.isCheckedIn ? 'Ver' : 'Liberar'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Session History */}
      {scanHistory.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-3 sm:p-4 shadow-xs text-xs">
          <span className="font-bold text-slate-700 block mb-2">Sessão ({scanHistory.length})</span>
          <div className="space-y-1.5 max-h-60 overflow-y-auto overscroll-contain">
            {scanHistory.map((item, idx) => (
              <div key={idx} className="p-2 rounded bg-slate-50 flex items-center justify-between text-[10px] sm:text-[11px]">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${
                    item.status === 'success' ? 'bg-emerald-500' : item.status === 'duplicate' ? 'bg-amber-500' : 'bg-red-500'
                  }`}></span>
                  <strong className="text-slate-800 truncate">{item.guest?.name || '?'}</strong>
                </div>
                <span className="text-slate-400 font-mono shrink-0 ml-2">{item.timestamp.split(' ')[1] || item.timestamp}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mobile bottom spacer for safe area */}
      {isMobile && <div className="h-8" />}
    </div>
  );
};
