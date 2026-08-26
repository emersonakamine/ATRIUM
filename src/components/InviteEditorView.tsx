import React from 'react';
import { EventData, TicketCategory, Guest, InviteBgMode, InvitePatternStyle, InviteGradientDirection, InviteThemePreset } from '../types';
import { generateQrDataUrl } from '../utils/qr';
import { 
  THEME_PRESETS, 
  PRESET_BACKGROUND_WALLPAPERS, 
  POPULAR_COLORS, 
  POPULAR_ACCENTS, 
  PATTERN_OPTIONS, 
  getInviteBackgroundStyles,
  isColorLight 
} from '../utils/inviteStyles';
import { 
  Palette, 
  Sparkles, 
  QrCode, 
  Smartphone, 
  Monitor, 
  Download, 
  Share2, 
  Check, 
  Type, 
  Image as ImageIcon,
  MapPin,
  Calendar,
  Clock,
  Layers,
  Save,
  Upload,
  Trash2,
  Sliders,
  Eye,
  FileImage,
  RefreshCw,
  Sun,
  Moon
} from 'lucide-react';

interface InviteEditorViewProps {
  event: EventData;
  categories: TicketCategory[];
  sampleGuest?: Guest;
  onSaveLayout: (updatedLayout: EventData['inviteLayout']) => void;
  onOpenPublicInvite: () => void;
}

type EditorTab = 'colors' | 'background' | 'texts' | 'elements';

export const InviteEditorView: React.FC<InviteEditorViewProps> = ({
  event,
  categories,
  sampleGuest,
  onSaveLayout,
  onOpenPublicInvite,
}) => {
  const [layout, setLayout] = React.useState<EventData['inviteLayout']>(() => ({
    ...event.inviteLayout,
    bgMode: event.inviteLayout.bgMode || (event.inviteLayout.bgImageUrl ? 'image' : 'preset'),
    patternStyle: event.inviteLayout.patternStyle || 'none',
    bgOverlayOpacity: event.inviteLayout.bgOverlayOpacity ?? 50,
    bgBlur: event.inviteLayout.bgBlur ?? 0,
    gradientDirection: event.inviteLayout.gradientDirection || 'to-br',
    customBgColor: event.inviteLayout.customBgColor || '#0f172a',
    customBgColorEnd: event.inviteLayout.customBgColorEnd || '#1e293b',
    accentColor: event.inviteLayout.accentColor || '#38bdf8',
    textColor: event.inviteLayout.textColor || '#ffffff',
  }));

  const [activeTab, setActiveTab] = React.useState<EditorTab>('colors');
  const [previewMode, setPreviewMode] = React.useState<'mobile' | 'desktop'>('mobile');
  const [qrUrl, setQrUrl] = React.useState<string>('');
  const [savedSuccess, setSavedSuccess] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const previewGuest = sampleGuest || {
    id: 'gst_preview',
    publicCode: 'PREVIEW-CODE-2026',
    qrPayloadToken: 'EVZ-PREVIEW-TOKEN-8899AA',
    name: 'Isabela Mendes',
    email: 'isabela@empresa.com.br',
    phone: '+55 11 98765-4321',
    ticketCategoryId: categories[0]?.id || 'cat_mkt',
    status: 'confirmed',
    isCheckedIn: false,
    emailStatus: 'delivered',
    whatsappStatus: 'delivered',
    docNumber: '341.556.789-00',
    companions: 1,
    qrVersion: 1,
    createdAt: 'Hoje',
  };

  const previewCategory = categories.find(c => c.id === previewGuest.ticketCategoryId) || categories[0];

  React.useEffect(() => {
    generateQrDataUrl(previewGuest.qrPayloadToken).then(setQrUrl);
  }, [previewGuest.qrPayloadToken]);

  const handleSave = () => {
    onSaveLayout(layout);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  // Handle local image file upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 8 * 1024 * 1024) {
        alert('A imagem deve ter no máximo 8MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (result) {
          setLayout(prev => ({
            ...prev,
            bgImageUrl: result,
            bgMode: 'image',
          }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setLayout(prev => ({
      ...prev,
      bgImageUrl: undefined,
      bgMode: prev.customBgColor ? 'custom_color' : 'preset',
    }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSelectPresetTheme = (theme: typeof THEME_PRESETS[0]) => {
    setLayout(prev => ({
      ...prev,
      bgTheme: theme.id,
      bgMode: 'preset',
      accentColor: theme.accentColor,
      textColor: theme.textColor,
      customBgColor: theme.bgGradient.includes('#') ? undefined : prev.customBgColor,
    }));
  };

  const bgStyles = getInviteBackgroundStyles(layout);
  const isLight = bgStyles.isLight;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Palette className="w-5 h-5 text-blue-600" />
            <span>Editor Visual do Convite & Credencial</span>
          </h2>
          <p className="text-xs text-slate-500">
            Personalize temas, paleta de cores, gradientes, papéis de fundo e imagens da credencial do convidado
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenPublicInvite}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold border border-slate-200 transition-colors cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Ver Link do Convidado</span>
          </button>

          <button
            onClick={handleSave}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            {savedSuccess ? (
              <>
                <Check className="w-4 h-4 text-white" />
                <span>Salvo com Sucesso!</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Salvar Template</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Editor Grid: Controls on Left, Live Preview on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Customization Tabs & Controls */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          {/* Navigation Sub-Tabs */}
          <div className="flex border-b border-slate-200 bg-slate-50/70 p-1.5 gap-1 text-xs">
            <button
              onClick={() => setActiveTab('colors')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg font-bold transition-all cursor-pointer ${
                activeTab === 'colors'
                  ? 'bg-white text-blue-600 shadow-xs border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
              }`}
            >
              <Palette className="w-4 h-4" />
              <span>Cores & Temas</span>
            </button>

            <button
              onClick={() => setActiveTab('background')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg font-bold transition-all cursor-pointer ${
                activeTab === 'background'
                  ? 'bg-white text-blue-600 shadow-xs border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
              }`}
            >
              <ImageIcon className="w-4 h-4" />
              <span>Papel de Fundo & Arte</span>
            </button>

            <button
              onClick={() => setActiveTab('texts')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg font-bold transition-all cursor-pointer ${
                activeTab === 'texts'
                  ? 'bg-white text-blue-600 shadow-xs border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
              }`}
            >
              <Type className="w-4 h-4" />
              <span>Textos</span>
            </button>

            <button
              onClick={() => setActiveTab('elements')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg font-bold transition-all cursor-pointer ${
                activeTab === 'elements'
                  ? 'bg-white text-blue-600 shadow-xs border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
              }`}
            >
              <Eye className="w-4 h-4" />
              <span>Campos</span>
            </button>
          </div>

          {/* Tab Content Body */}
          <div className="p-6 space-y-6 text-xs max-h-[680px] overflow-y-auto">
            {/* TAB 1: CORES & TEMAS */}
            {activeTab === 'colors' && (
              <div className="space-y-6">
                {/* Background Mode Selector */}
                <div>
                  <label className="font-bold text-slate-800 block mb-2 text-xs">
                    Tipo de Fundo Principal
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setLayout({ ...layout, bgMode: 'preset' })}
                      className={`p-2.5 rounded-xl border text-center font-bold text-xs cursor-pointer transition-all ${
                        layout.bgMode === 'preset'
                          ? 'border-blue-600 bg-blue-50/40 text-blue-700 ring-2 ring-blue-500/20'
                          : 'border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      Paleta Pronta
                    </button>

                    <button
                      type="button"
                      onClick={() => setLayout({ ...layout, bgMode: 'custom_color' })}
                      className={`p-2.5 rounded-xl border text-center font-bold text-xs cursor-pointer transition-all ${
                        layout.bgMode === 'custom_color'
                          ? 'border-blue-600 bg-blue-50/40 text-blue-700 ring-2 ring-blue-500/20'
                          : 'border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      Cor Sólida
                    </button>

                    <button
                      type="button"
                      onClick={() => setLayout({ ...layout, bgMode: 'custom_gradient' })}
                      className={`p-2.5 rounded-xl border text-center font-bold text-xs cursor-pointer transition-all ${
                        layout.bgMode === 'custom_gradient'
                          ? 'border-blue-600 bg-blue-50/40 text-blue-700 ring-2 ring-blue-500/20'
                          : 'border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      Gradiente Livre
                    </button>
                  </div>
                </div>

                {/* Mode 1: Preset Themes */}
                {layout.bgMode === 'preset' && (
                  <div>
                    <label className="font-bold text-slate-700 block mb-2">
                      Temas & Paletas Pré-definidas ({THEME_PRESETS.length} opções)
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      {THEME_PRESETS.map((theme) => {
                        const isSelected = layout.bgTheme === theme.id && layout.bgMode === 'preset';
                        return (
                          <button
                            key={theme.id}
                            type="button"
                            onClick={() => handleSelectPresetTheme(theme)}
                            className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                              isSelected
                                ? 'border-blue-600 ring-2 ring-blue-500/30 bg-blue-50/20'
                                : 'border-slate-200 hover:border-slate-300 bg-white'
                            }`}
                          >
                            <div 
                              className="w-full h-8 rounded-lg mb-2 shadow-inner border border-black/10 flex items-center justify-end px-2"
                              style={{ background: theme.bgGradient }}
                            >
                              <span 
                                className="w-2.5 h-2.5 rounded-full" 
                                style={{ backgroundColor: theme.accentColor }}
                              />
                            </div>
                            <div className="font-bold text-slate-800 text-[11px] truncate">{theme.name}</div>
                            <div className="text-[10px] text-slate-400 capitalize">{theme.category}</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Mode 2: Custom Solid Color */}
                {layout.bgMode === 'custom_color' && (
                  <div className="space-y-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-slate-800">Seletor de Cor de Fundo</label>
                      <span className="text-[10px] font-mono text-slate-500">{layout.customBgColor || '#0f172a'}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={layout.customBgColor || '#0f172a'}
                        onChange={(e) => setLayout({ ...layout, customBgColor: e.target.value })}
                        className="w-12 h-10 rounded-lg cursor-pointer border border-slate-300 bg-white p-1"
                      />
                      <input
                        type="text"
                        value={layout.customBgColor || '#0f172a'}
                        onChange={(e) => setLayout({ ...layout, customBgColor: e.target.value })}
                        placeholder="#0f172a"
                        className="flex-1 p-2 bg-white border border-slate-300 rounded-lg text-slate-800 font-mono text-xs"
                      />
                    </div>

                    {/* Quick Color Swatches */}
                    <div>
                      <span className="text-[11px] font-semibold text-slate-600 block mb-1.5">Cores Rápidas Sugeridas:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {POPULAR_COLORS.map((hex) => (
                          <button
                            key={hex}
                            type="button"
                            onClick={() => setLayout({ ...layout, customBgColor: hex })}
                            className="w-7 h-7 rounded-md border border-slate-300 cursor-pointer shadow-xs transition-transform hover:scale-110"
                            style={{ backgroundColor: hex }}
                            title={hex}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Mode 3: Custom Gradient */}
                {layout.bgMode === 'custom_gradient' && (
                  <div className="space-y-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="font-bold text-slate-800 block mb-1">Cor Inicial</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={layout.customBgColor || '#0f172a'}
                            onChange={(e) => setLayout({ ...layout, customBgColor: e.target.value })}
                            className="w-8 h-8 rounded-md cursor-pointer border border-slate-300 bg-white p-0.5"
                          />
                          <input
                            type="text"
                            value={layout.customBgColor || '#0f172a'}
                            onChange={(e) => setLayout({ ...layout, customBgColor: e.target.value })}
                            className="w-full p-1.5 bg-white border border-slate-300 rounded-md font-mono text-[11px]"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="font-bold text-slate-800 block mb-1">Cor Final</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={layout.customBgColorEnd || '#1e293b'}
                            onChange={(e) => setLayout({ ...layout, customBgColorEnd: e.target.value })}
                            className="w-8 h-8 rounded-md cursor-pointer border border-slate-300 bg-white p-0.5"
                          />
                          <input
                            type="text"
                            value={layout.customBgColorEnd || '#1e293b'}
                            onChange={(e) => setLayout({ ...layout, customBgColorEnd: e.target.value })}
                            className="w-full p-1.5 bg-white border border-slate-300 rounded-md font-mono text-[11px]"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Gradient Direction */}
                    <div>
                      <label className="font-bold text-slate-800 block mb-1.5">Direção do Gradiente</label>
                      <div className="grid grid-cols-4 gap-1.5">
                        {[
                          { id: 'to-br', label: 'Diagonal ↘' },
                          { id: 'to-b', label: 'Vertical ↓' },
                          { id: 'to-r', label: 'Horizontal →' },
                          { id: 'radial', label: 'Radial ◎' },
                        ].map((dir) => (
                          <button
                            key={dir.id}
                            type="button"
                            onClick={() => setLayout({ ...layout, gradientDirection: dir.id as InviteGradientDirection })}
                            className={`py-1.5 px-2 rounded-lg border text-center font-semibold text-[11px] cursor-pointer ${
                              layout.gradientDirection === dir.id
                                ? 'border-blue-600 bg-blue-50 text-blue-700'
                                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            {dir.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Accent and Text Color Customization */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
                  <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-blue-600" />
                    <span>Cores de Destaque & Tipografia</span>
                  </h4>

                  {/* Accent Color */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="font-semibold text-slate-700">Cor de Destaque (Ícones, Taglines & Bordas)</label>
                      <span className="font-mono text-[10px] text-slate-500">{layout.accentColor}</span>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <input
                        type="color"
                        value={layout.accentColor}
                        onChange={(e) => setLayout({ ...layout, accentColor: e.target.value })}
                        className="w-8 h-8 rounded-md cursor-pointer border border-slate-300 bg-white p-0.5"
                      />
                      <input
                        type="text"
                        value={layout.accentColor}
                        onChange={(e) => setLayout({ ...layout, accentColor: e.target.value })}
                        className="flex-1 p-1.5 bg-white border border-slate-300 rounded-md font-mono text-xs"
                      />
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {POPULAR_ACCENTS.map((hex) => (
                        <button
                          key={hex}
                          type="button"
                          onClick={() => setLayout({ ...layout, accentColor: hex })}
                          className="w-6 h-6 rounded-md border border-slate-300 cursor-pointer shadow-xs transition-transform hover:scale-110"
                          style={{ backgroundColor: hex }}
                          title={hex}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Text Color */}
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1.5">Contraste do Texto</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setLayout({ ...layout, textColor: '#ffffff' })}
                        className={`p-2 rounded-lg border text-center font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
                          layout.textColor === '#ffffff'
                            ? 'border-blue-600 bg-slate-900 text-white ring-2 ring-blue-500/20'
                            : 'border-slate-300 bg-slate-800 text-white'
                        }`}
                      >
                        <Moon className="w-3.5 h-3.5" />
                        <span>Texto Claro (Branco)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setLayout({ ...layout, textColor: '#0f172a' })}
                        className={`p-2 rounded-lg border text-center font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
                          layout.textColor === '#0f172a'
                            ? 'border-blue-600 bg-white text-slate-900 ring-2 ring-blue-500/20'
                            : 'border-slate-300 bg-white text-slate-800'
                        }`}
                      >
                        <Sun className="w-3.5 h-3.5 text-amber-500" />
                        <span>Texto Escuro (Grafite)</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: PAPEL DE FUNDO & ARTE */}
            {activeTab === 'background' && (
              <div className="space-y-6">
                {/* Upload Image Section */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-800 flex items-center gap-1.5">
                      <FileImage className="w-4 h-4 text-blue-600" />
                      <span>Imagem ou Arte de Fundo Personalizada</span>
                    </label>
                    {layout.bgImageUrl && (
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="text-rose-600 hover:text-rose-700 font-semibold text-[11px] flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Remover</span>
                      </button>
                    )}
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="bg-upload-input"
                  />

                  {layout.bgImageUrl ? (
                    <div className="relative rounded-xl overflow-hidden border border-slate-300 h-28 bg-slate-900 group">
                      <img
                        src={layout.bgImageUrl}
                        alt="Papel de fundo"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <label
                          htmlFor="bg-upload-input"
                          className="px-3 py-1.5 bg-white text-slate-900 rounded-lg font-bold text-xs cursor-pointer shadow-md flex items-center gap-1"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>Trocar Imagem</span>
                        </label>
                        <button
                          type="button"
                          onClick={handleRemoveImage}
                          className="px-3 py-1.5 bg-rose-600 text-white rounded-lg font-bold text-xs cursor-pointer shadow-md flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Remover</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <label
                        htmlFor="bg-upload-input"
                        className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl bg-white cursor-pointer transition-colors text-center"
                      >
                        <Upload className="w-6 h-6 text-blue-600 mb-1.5" />
                        <span className="font-bold text-slate-800">Carregar Imagem do seu Computador</span>
                        <span className="text-[11px] text-slate-400">PNG, JPG ou WebP (máx. 8MB)</span>
                      </label>

                      {/* URL input fallback */}
                      <div className="flex items-center gap-2 pt-1">
                        <input
                          type="text"
                          placeholder="Ou cole o link de uma imagem (https://...)"
                          onBlur={(e) => {
                            if (e.target.value.trim()) {
                              setLayout({ ...layout, bgImageUrl: e.target.value.trim(), bgMode: 'image' });
                            }
                          }}
                          className="w-full p-2 bg-white border border-slate-200 rounded-lg text-slate-800 text-[11px]"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Preset Wallpapers Gallery */}
                <div>
                  <label className="font-bold text-slate-800 block mb-2">
                    Papéis de Parede Premium Prontos
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {PRESET_BACKGROUND_WALLPAPERS.map((wp) => {
                      const isSelected = layout.bgImageUrl === wp.url;
                      return (
                        <button
                          key={wp.id}
                          type="button"
                          onClick={() => setLayout({ ...layout, bgImageUrl: wp.url, bgMode: 'image' })}
                          className={`relative rounded-xl overflow-hidden border text-left cursor-pointer transition-all group ${
                            isSelected
                              ? 'border-blue-600 ring-2 ring-blue-500/40'
                              : 'border-slate-200 hover:border-slate-400'
                          }`}
                        >
                          <img
                            src={wp.thumb}
                            alt={wp.name}
                            className="w-full h-14 object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="p-1.5 bg-white border-t border-slate-100">
                            <span className="font-bold text-[10px] text-slate-800 block truncate">
                              {wp.name}
                            </span>
                          </div>
                          {isSelected && (
                            <div className="absolute top-1 right-1 bg-blue-600 text-white rounded-full p-0.5 shadow-sm">
                              <Check className="w-3 h-3" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Paper Textures & Patterns */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                  <label className="font-bold text-slate-800 block">
                    Texturas & Padrões Geométricos de Papel
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {PATTERN_OPTIONS.map((pat) => {
                      const isSelected = (layout.patternStyle || 'none') === pat.id;
                      return (
                        <button
                          key={pat.id}
                          type="button"
                          onClick={() => setLayout({ ...layout, patternStyle: pat.id })}
                          className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                            isSelected
                              ? 'border-blue-600 bg-blue-50/50 text-blue-900 ring-2 ring-blue-500/20'
                              : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                          }`}
                        >
                          <div className="font-bold text-[11px]">{pat.name}</div>
                          <div className="text-[10px] text-slate-500 line-clamp-1">{pat.description}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Adjustments: Overlay Opacity & Blur */}
                {layout.bgImageUrl && (
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
                    <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
                      <Sliders className="w-4 h-4 text-blue-600" />
                      <span>Ajustes de Legibilidade da Imagem</span>
                    </h4>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-slate-700">Escurecimento / Sobreposição (Overlay):</span>
                        <span className="font-mono font-bold text-slate-900">{layout.bgOverlayOpacity ?? 50}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="90"
                        step="5"
                        value={layout.bgOverlayOpacity ?? 50}
                        onChange={(e) => setLayout({ ...layout, bgOverlayOpacity: parseInt(e.target.value) })}
                        className="w-full accent-blue-600 cursor-pointer"
                      />
                      <span className="text-[10px] text-slate-400">
                        Aumente para garantir contraste perfeito no QR Code e textos.
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-slate-700">Desfoque da Arte (Blur):</span>
                        <span className="font-mono font-bold text-slate-900">{layout.bgBlur ?? 0}px</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="12"
                        step="1"
                        value={layout.bgBlur ?? 0}
                        onChange={(e) => setLayout({ ...layout, bgBlur: parseInt(e.target.value) })}
                        className="w-full accent-blue-600 cursor-pointer"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: TEXTOS & MENSAGENS */}
            {activeTab === 'texts' && (
              <div className="space-y-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Título do Convite</label>
                  <input
                    type="text"
                    value={layout.title}
                    onChange={(e) => setLayout({ ...layout, title: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold"
                    placeholder="CONVITE EXCLUSIVO"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Subtítulo / Tagline</label>
                  <input
                    type="text"
                    value={layout.subtitle}
                    onChange={(e) => setLayout({ ...layout, subtitle: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
                    placeholder="MDS | FLC | BP30"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Instruções de Portaria para o Convidado</label>
                  <textarea
                    rows={3}
                    value={layout.instructions}
                    onChange={(e) => setLayout({ ...layout, instructions: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
                    placeholder="Apresente este QR Code diretamente na portaria para validação imediata..."
                  />
                </div>
              </div>
            )}

            {/* TAB 4: CAMPOS & ELEMENTOS */}
            {activeTab === 'elements' && (
              <div className="space-y-3">
                <label className="font-bold text-slate-700 block mb-1">Elementos Visíveis no Convite</label>
                <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  {[
                    { key: 'showQr', label: 'Exibir QR Code Seguro' },
                    { key: 'showName', label: 'Exibir Nome do Convidado' },
                    { key: 'showCategory', label: 'Exibir Categoria / Badge de Acesso' },
                    { key: 'showTime', label: 'Exibir Data & Horário' },
                    { key: 'showLocation', label: 'Exibir Local & Endereço' },
                    { key: 'showDoc', label: 'Exibir Documento / CPF' },
                    { key: 'showCompanions', label: 'Exibir Contador de Acompanhantes' },
                  ].map((item) => (
                    <label key={item.key} className="flex items-center justify-between p-2 rounded-lg hover:bg-white cursor-pointer transition-colors">
                      <span className="text-slate-700 font-medium">{item.label}</span>
                      <input
                        type="checkbox"
                        checked={(layout as any)[item.key]}
                        onChange={(e) => setLayout({ ...layout, [item.key]: e.target.checked })}
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Live Interactive Preview */}
        <div className="lg:col-span-6 space-y-4">
          {/* Mode Switcher */}
          <div className="flex items-center justify-between bg-white p-3 rounded-2xl border border-slate-200">
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setPreviewMode('mobile')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                  previewMode === 'mobile' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Modo Smartphone (PWA)</span>
              </button>
              <button
                onClick={() => setPreviewMode('desktop')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                  previewMode === 'desktop' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
                <span>Modo Cartão Digital</span>
              </button>
            </div>

            <span className="text-[11px] text-slate-400 font-mono hidden sm:inline-block">
              Pré-visualização em tempo real
            </span>
          </div>

          {/* Invitation Card Render Container */}
          <div className="flex justify-center p-6 bg-slate-100/80 rounded-2xl border border-slate-200 min-h-[560px] items-center">
            {previewMode === 'mobile' ? (
              /* Mobile Phone Mockup Frame */
              <div className="w-[330px] bg-slate-950 rounded-[44px] p-3.5 shadow-2xl border-4 border-slate-800 relative">
                {/* Speaker notch */}
                <div className="w-24 h-4 bg-slate-900 rounded-full mx-auto mb-2"></div>

                {/* Mobile screen card */}
                <div 
                  className={`rounded-[32px] p-5 text-center border relative overflow-hidden shadow-inner ${bgStyles.className}`}
                  style={bgStyles.style}
                >
                  {/* Custom Background Image if present */}
                  {layout.bgImageUrl && (
                    <div 
                      className="absolute inset-0 bg-cover bg-center pointer-events-none"
                      style={{
                        backgroundImage: `url(${layout.bgImageUrl})`,
                        filter: layout.bgBlur ? `blur(${layout.bgBlur}px)` : 'none',
                        transform: layout.bgBlur ? 'scale(1.08)' : 'none',
                      }}
                    />
                  )}

                  {/* Dark/Light overlay for readability */}
                  {layout.bgImageUrl && (
                    <div 
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        backgroundColor: isLight ? '#ffffff' : '#000000',
                        opacity: (layout.bgOverlayOpacity ?? 50) / 100,
                      }}
                    />
                  )}

                  {/* Pattern Overlay */}
                  {layout.patternStyle && layout.patternStyle !== 'none' && (
                    <div 
                      className="absolute inset-0 pointer-events-none opacity-30"
                      style={{
                        backgroundImage: getPatternDataUrl(layout.patternStyle, isLight),
                        backgroundSize: layout.patternStyle === 'dots' ? '20px 20px' : layout.patternStyle === 'grid' ? '30px 30px' : 'auto',
                      }}
                    />
                  )}

                  {/* Content Container (relative on top of backgrounds) */}
                  <div className="relative z-10">
                    {/* Top Brand */}
                    <div 
                      className="text-[10px] uppercase tracking-widest font-extrabold mb-1"
                      style={{ color: layout.accentColor }}
                    >
                      {layout.title}
                    </div>
                    <div 
                      className="text-base font-black tracking-tight mb-2"
                      style={{ color: layout.textColor }}
                    >
                      {event.title}
                    </div>

                    {/* QR Code Card */}
                    {layout.showQr && (
                      <div className="bg-white p-3 rounded-2xl mx-auto inline-block shadow-xl my-2 border border-slate-200/50">
                        {qrUrl ? (
                          <img src={qrUrl} alt="QR Code" className="w-36 h-36 mx-auto" />
                        ) : (
                          <div className="w-36 h-36 flex items-center justify-center text-slate-400">QR Code</div>
                        )}
                        <div className="font-mono text-[9px] text-slate-800 font-bold mt-1">
                          {previewGuest.qrPayloadToken}
                        </div>
                      </div>
                    )}

                    {/* Guest Name & Category */}
                    {layout.showName && (
                      <div 
                        className="mt-2 font-black text-base tracking-tight"
                        style={{ color: layout.textColor }}
                      >
                        {previewGuest.name}
                      </div>
                    )}

                    {layout.showCategory && (
                      <div className="mt-1">
                        <span className={`inline-block px-3 py-0.5 rounded-full text-[10px] font-extrabold shadow-xs ${previewCategory.badgeBg}`}>
                          {previewCategory.name}
                        </span>
                      </div>
                    )}

                    {/* Date & Location */}
                    <div 
                      className="mt-3 pt-3 border-t text-[11px] space-y-1.5"
                      style={{ borderColor: isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.15)' }}
                    >
                      {layout.showTime && (
                        <div className="flex items-center justify-center gap-1.5 opacity-90">
                          <Calendar className="w-3.5 h-3.5 shrink-0" style={{ color: layout.accentColor }} />
                          <span style={{ color: layout.textColor }}>{event.startDate} • {event.startTime}</span>
                        </div>
                      )}
                      {layout.showLocation && (
                        <div className="flex items-center justify-center gap-1.5 opacity-90">
                          <MapPin className="w-3.5 h-3.5 shrink-0" style={{ color: layout.accentColor }} />
                          <span className="truncate max-w-[210px]" style={{ color: layout.textColor }}>{event.locationName}</span>
                        </div>
                      )}
                    </div>

                    {/* Instructions */}
                    <p 
                      className="text-[9px] mt-3 leading-relaxed opacity-75"
                      style={{ color: layout.textColor }}
                    >
                      {layout.instructions}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              /* Desktop Pass Card */
              <div 
                className={`w-full max-w-md rounded-3xl p-6 shadow-2xl border relative overflow-hidden ${bgStyles.className}`}
                style={bgStyles.style}
              >
                {/* Background image & overlay */}
                {layout.bgImageUrl && (
                  <div 
                    className="absolute inset-0 bg-cover bg-center pointer-events-none"
                    style={{
                      backgroundImage: `url(${layout.bgImageUrl})`,
                      filter: layout.bgBlur ? `blur(${layout.bgBlur}px)` : 'none',
                      transform: layout.bgBlur ? 'scale(1.08)' : 'none',
                    }}
                  />
                )}

                {layout.bgImageUrl && (
                  <div 
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      backgroundColor: isLight ? '#ffffff' : '#000000',
                      opacity: (layout.bgOverlayOpacity ?? 50) / 100,
                    }}
                  />
                )}

                {/* Pattern Overlay */}
                {layout.patternStyle && layout.patternStyle !== 'none' && (
                  <div 
                    className="absolute inset-0 pointer-events-none opacity-30"
                    style={{
                      backgroundImage: getPatternDataUrl(layout.patternStyle, isLight),
                      backgroundSize: layout.patternStyle === 'dots' ? '20px 20px' : layout.patternStyle === 'grid' ? '30px 30px' : 'auto',
                    }}
                  />
                )}

                <div className="relative z-10">
                  <div 
                    className="flex items-start justify-between border-b pb-4 mb-4"
                    style={{ borderColor: isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.15)' }}
                  >
                    <div>
                      <span 
                        className="text-xs uppercase tracking-widest font-extrabold block mb-1"
                        style={{ color: layout.accentColor }}
                      >
                        {layout.title}
                      </span>
                      <h3 className="text-xl font-black" style={{ color: layout.textColor }}>
                        {event.title}
                      </h3>
                      <p className="text-xs opacity-80" style={{ color: layout.textColor }}>
                        {layout.subtitle}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`px-3 py-1 rounded-full text-xs font-extrabold shadow-sm ${previewCategory.badgeBg}`}>
                        {previewCategory.name}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    {layout.showQr && (
                      <div className="bg-white p-3 rounded-2xl shrink-0 shadow-lg border border-slate-200/50">
                        {qrUrl && <img src={qrUrl} alt="QR Code" className="w-32 h-32" />}
                        <div className="text-[8px] font-mono text-slate-800 font-bold text-center mt-1">
                          {previewGuest.qrPayloadToken}
                        </div>
                      </div>
                    )}

                    <div className="space-y-2.5 text-xs">
                      {layout.showName && (
                        <div>
                          <span className="text-[10px] uppercase font-bold tracking-wider opacity-60" style={{ color: layout.textColor }}>
                            Convidado Titular
                          </span>
                          <div className="font-black text-base" style={{ color: layout.textColor }}>
                            {previewGuest.name}
                          </div>
                        </div>
                      )}
                      {layout.showTime && (
                        <div>
                          <span className="text-[10px] uppercase font-bold tracking-wider opacity-60" style={{ color: layout.textColor }}>
                            Data & Hora
                          </span>
                          <div className="font-medium opacity-90" style={{ color: layout.textColor }}>
                            {event.startDate} às {event.startTime}
                          </div>
                        </div>
                      )}
                      {layout.showLocation && (
                        <div>
                          <span className="text-[10px] uppercase font-bold tracking-wider opacity-60" style={{ color: layout.textColor }}>
                            Local
                          </span>
                          <div className="font-medium opacity-90 truncate max-w-[180px]" style={{ color: layout.textColor }}>
                            {event.locationName}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div 
                    className="mt-5 pt-3 border-t text-[10px] opacity-75"
                    style={{ 
                      borderColor: isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.15)',
                      color: layout.textColor 
                    }}
                  >
                    {layout.instructions}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

function getPatternDataUrl(pattern: InvitePatternStyle, isLight: boolean): string {
  const patternColor = isLight ? '%23000000' : '%23ffffff';
  const patternOpacity = isLight ? '0.05' : '0.08';

  switch (pattern) {
    case 'dots':
      return `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='${patternColor}' fill-opacity='${patternOpacity}' fill-rule='evenodd'%3E%3Ccircle cx='3' cy='3' r='1.5'/%3E%3C/g%3E%3C/svg%3E")`;
    case 'grid':
      return `url("data:image/svg+xml,%3Csvg width='30' height='30' viewBox='0 0 30 30' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h30v30H0z' fill='none'/%3E%3Cpath d='M30 0v30H0' fill='none' stroke='${patternColor}' stroke-opacity='${patternOpacity}' stroke-width='1'/%3E%3C/svg%3E")`;
    case 'lines':
      return `url("data:image/svg+xml,%3Csvg width='24' height='24' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 24L24 0M-6 6L6 -6M18 30L30 18' stroke='${patternColor}' stroke-opacity='${patternOpacity}' stroke-width='1.2'/%3E%3C/svg%3E")`;
    case 'luxury_geo':
      return `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20 0L40 20L20 40L0 20z' fill='none' stroke='${patternColor}' stroke-opacity='${patternOpacity}' stroke-width='1'/%3E%3C/svg%3E")`;
    case 'carbon':
      return `url("data:image/svg+xml,%3Csvg width='12' height='12' viewBox='0 0 12 12' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h6v6H0z' fill='${patternColor}' fill-opacity='${patternOpacity}'/%3E%3Cpath d='M6 6h6v6H6z' fill='${patternColor}' fill-opacity='${patternOpacity}'/%3E%3C/svg%3E")`;
    case 'paper_grain':
      return `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.08'/%3E%3C/svg%3E")`;
    case 'bokeh':
      return `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='20' cy='20' r='14' fill='${patternColor}' fill-opacity='0.04'/%3E%3Ccircle cx='60' cy='50' r='20' fill='${patternColor}' fill-opacity='0.05'/%3E%3Ccircle cx='50' cy='15' r='8' fill='${patternColor}' fill-opacity='0.03'/%3E%3C/svg%3E")`;
    default:
      return '';
  }
}
