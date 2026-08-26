import type { CSSProperties } from 'react';
import { InviteLayoutConfig, InviteThemePreset, InvitePatternStyle } from '../types';

export interface ThemeDefinition {
  id: InviteThemePreset;
  name: string;
  category: 'dark' | 'light' | 'vibrant' | 'luxury';
  bgClass: string;
  bgGradient: string;
  accentColor: string;
  textColor: string;
  borderColor: string;
  badgeTone: string;
}

export const THEME_PRESETS: ThemeDefinition[] = [
  {
    id: 'dark',
    name: 'Dark Modern',
    category: 'dark',
    bgClass: 'bg-slate-900',
    bgGradient: 'linear-gradient(145deg, #0f172a 0%, #1e293b 100%)',
    accentColor: '#38bdf8',
    textColor: '#ffffff',
    borderColor: '#334155',
    badgeTone: '#38bdf8',
  },
  {
    id: 'indigo',
    name: 'Royal Indigo',
    category: 'dark',
    bgClass: 'bg-indigo-950',
    bgGradient: 'linear-gradient(145deg, #0f172a 0%, #1e1b4b 60%, #172554 100%)',
    accentColor: '#818cf8',
    textColor: '#ffffff',
    borderColor: '#3730a3',
    badgeTone: '#818cf8',
  },
  {
    id: 'emerald',
    name: 'Emerald VIP',
    category: 'luxury',
    bgClass: 'bg-emerald-950',
    bgGradient: 'linear-gradient(145deg, #022c22 0%, #0f172a 60%, #134e4a 100%)',
    accentColor: '#34d399',
    textColor: '#ffffff',
    borderColor: '#065f46',
    badgeTone: '#34d399',
  },
  {
    id: 'gold',
    name: 'Golden Executive',
    category: 'luxury',
    bgClass: 'bg-amber-950',
    bgGradient: 'linear-gradient(145deg, #2a1b06 0%, #1c1917 50%, #451a03 100%)',
    accentColor: '#fbbf24',
    textColor: '#fef3c7',
    borderColor: '#78350f',
    badgeTone: '#f59e0b',
  },
  {
    id: 'ruby',
    name: 'Ruby Velvet',
    category: 'luxury',
    bgClass: 'bg-rose-950',
    bgGradient: 'linear-gradient(145deg, #380718 0%, #0f172a 60%, #4c0519 100%)',
    accentColor: '#fb7185',
    textColor: '#ffe4e6',
    borderColor: '#881337',
    badgeTone: '#f43f5e',
  },
  {
    id: 'purple',
    name: 'Midnight Purple',
    category: 'vibrant',
    bgClass: 'bg-purple-950',
    bgGradient: 'linear-gradient(145deg, #2e1065 0%, #0f172a 50%, #3b0764 100%)',
    accentColor: '#c084fc',
    textColor: '#faf5ff',
    borderColor: '#581c87',
    badgeTone: '#c084fc',
  },
  {
    id: 'sunset',
    name: 'Sunset Amber',
    category: 'vibrant',
    bgClass: 'bg-orange-950',
    bgGradient: 'linear-gradient(145deg, #431407 0%, #18181b 50%, #7c2d12 100%)',
    accentColor: '#fb923c',
    textColor: '#ffedd5',
    borderColor: '#9a3412',
    badgeTone: '#f97316',
  },
  {
    id: 'ocean',
    name: 'Ocean Cyan',
    category: 'vibrant',
    bgClass: 'bg-cyan-950',
    bgGradient: 'linear-gradient(145deg, #083344 0%, #020617 50%, #164e63 100%)',
    accentColor: '#22d3ee',
    textColor: '#ecfeff',
    borderColor: '#155e75',
    badgeTone: '#06b6d4',
  },
  {
    id: 'cyberpunk',
    name: 'Cyberpunk Neon',
    category: 'vibrant',
    bgClass: 'bg-black',
    bgGradient: 'linear-gradient(145deg, #000000 0%, #030712 50%, #042f2e 100%)',
    accentColor: '#2dd4bf',
    textColor: '#f0fdfa',
    borderColor: '#0f766e',
    badgeTone: '#14b8a6',
  },
  {
    id: 'rosegold',
    name: 'Rose Gold Glam',
    category: 'luxury',
    bgClass: 'bg-zinc-900',
    bgGradient: 'linear-gradient(145deg, #27272a 0%, #3f2d34 50%, #18181b 100%)',
    accentColor: '#fda4af',
    textColor: '#fff1f2',
    borderColor: '#9f1239',
    badgeTone: '#fb7185',
  },
  {
    id: 'slate',
    name: 'Clean Light Slate',
    category: 'light',
    bgClass: 'bg-slate-100',
    bgGradient: 'linear-gradient(145deg, #f8fafc 0%, #e2e8f0 100%)',
    accentColor: '#2563eb',
    textColor: '#0f172a',
    borderColor: '#cbd5e1',
    badgeTone: '#2563eb',
  },
  {
    id: 'pure_white',
    name: 'Pure White Editorial',
    category: 'light',
    bgClass: 'bg-white',
    bgGradient: 'linear-gradient(145deg, #ffffff 0%, #f1f5f9 100%)',
    accentColor: '#0f172a',
    textColor: '#020617',
    borderColor: '#e2e8f0',
    badgeTone: '#0f172a',
  },
];

export const PRESET_BACKGROUND_WALLPAPERS = [
  {
    id: 'abstract_dark',
    name: 'Dark Tech Flow',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
    thumb: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=160&auto=format&fit=crop&q=80',
  },
  {
    id: 'luxury_gold_silk',
    name: 'Golden Waves',
    url: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800&auto=format&fit=crop&q=80',
    thumb: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=160&auto=format&fit=crop&q=80',
  },
  {
    id: 'corporate_blue',
    name: 'Executive Blue',
    url: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=800&auto=format&fit=crop&q=80',
    thumb: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=160&auto=format&fit=crop&q=80',
  },
  {
    id: 'emerald_mesh',
    name: 'Emerald Silk',
    url: 'https://images.unsplash.com/photo-1550684376-efcbd6e3f031?w=800&auto=format&fit=crop&q=80',
    thumb: 'https://images.unsplash.com/photo-1550684376-efcbd6e3f031?w=160&auto=format&fit=crop&q=80',
  },
  {
    id: 'sparkle_lights',
    name: 'Gala & Champagne',
    url: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=800&auto=format&fit=crop&q=80',
    thumb: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=160&auto=format&fit=crop&q=80',
  },
  {
    id: 'minimal_marble',
    name: 'Mármore Clean',
    url: 'https://images.unsplash.com/photo-1588345921523-c2dcdb7f1dcd?w=800&auto=format&fit=crop&q=80',
    thumb: 'https://images.unsplash.com/photo-1588345921523-c2dcdb7f1dcd?w=160&auto=format&fit=crop&q=80',
  },
];

export const POPULAR_COLORS = [
  '#0f172a', // Slate 900
  '#020617', // Zinc 950
  '#1e1b4b', // Indigo 950
  '#022c22', // Emerald 950
  '#2a1b06', // Amber 950
  '#380718', // Rose 950
  '#2e1065', // Purple 950
  '#083344', // Cyan 950
  '#1e293b', // Slate 800
  '#2563eb', // Blue 600
  '#7c3aed', // Violet 600
  '#059669', // Emerald 600
  '#d97706', // Amber 600
  '#dc2626', // Red 600
  '#db2777', // Pink 600
  '#f8fafc', // Slate 50
];

export const POPULAR_ACCENTS = [
  '#38bdf8', // Sky 400
  '#60a5fa', // Blue 400
  '#818cf8', // Indigo 400
  '#34d399', // Emerald 400
  '#fbbf24', // Amber 400
  '#fb7185', // Rose 400
  '#c084fc', // Purple 400
  '#2dd4bf', // Teal 400
  '#f97316', // Orange 500
  '#e11d48', // Rose 600
  '#ffffff', // White
  '#0f172a', // Slate 900
];

export const PATTERN_OPTIONS: { id: InvitePatternStyle; name: string; description: string }[] = [
  { id: 'none', name: 'Nenhum (Liso)', description: 'Fundo limpo sem texturas adicionais' },
  { id: 'dots', name: 'Pontilhado Matrix', description: 'Grade pontilhada contemporânea' },
  { id: 'grid', name: 'Grid Técnico', description: 'Linhas ortogonais minimalistas' },
  { id: 'lines', name: 'Linhas Diagonais', description: 'Linhas finas dinâmicas de 45°' },
  { id: 'paper_grain', name: 'Textura Papel & Grão', description: 'Grão sutil estilo papel nobre' },
  { id: 'bokeh', name: 'Círculos / Partículas', description: 'Partículas de luz suaves' },
  { id: 'luxury_geo', name: 'Geometria VIP', description: 'Losangos e traços sofisticados' },
  { id: 'carbon', name: 'Malha Carbono', description: 'Textura cruzada estilo tech' },
];

/**
 * Returns inline CSS styles or classes for an invite layout based on config
 */
export function getInviteBackgroundStyles(layout: InviteLayoutConfig): {
  style: CSSProperties;
  className: string;
  isLight: boolean;
  accentColor: string;
  textColor: string;
} {
  const bgMode = layout.bgMode || (layout.bgImageUrl ? 'image' : layout.customBgColor ? 'custom_color' : 'preset');
  const theme = THEME_PRESETS.find(t => t.id === layout.bgTheme) || THEME_PRESETS[0];

  let background = theme.bgGradient;
  let isLight = theme.category === 'light';
  let accentColor = layout.accentColor || theme.accentColor;
  let textColor = layout.textColor || theme.textColor;

  if (bgMode === 'custom_color' && layout.customBgColor) {
    background = layout.customBgColor;
    isLight = isColorLight(layout.customBgColor);
  } else if (bgMode === 'custom_gradient' && layout.customBgColor) {
    const endColor = layout.customBgColorEnd || '#0f172a';
    const dir = layout.gradientDirection || 'to-br';
    
    let cssDir = '145deg';
    if (dir === 'to-b') cssDir = '180deg';
    if (dir === 'to-r') cssDir = '90deg';
    if (dir === 'to-tr') cssDir = '45deg';
    
    if (dir === 'radial') {
      background = `radial-gradient(circle at center, ${layout.customBgColor} 0%, ${endColor} 100%)`;
    } else {
      background = `linear-gradient(${cssDir}, ${layout.customBgColor} 0%, ${endColor} 100%)`;
    }
    isLight = isColorLight(layout.customBgColor);
  }

  // Pattern overlays using SVG data URIs
  let patternBgImage = '';
  const pattern = layout.patternStyle || 'none';
  const patternColor = isLight ? '%23000000' : '%23ffffff';
  const patternOpacity = isLight ? '0.04' : '0.06';

  if (pattern === 'dots') {
    patternBgImage = `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='${patternColor}' fill-opacity='${patternOpacity}' fill-rule='evenodd'%3E%3Ccircle cx='3' cy='3' r='1.5'/%3E%3C/g%3E%3C/svg%3E")`;
  } else if (pattern === 'grid') {
    patternBgImage = `url("data:image/svg+xml,%3Csvg width='30' height='30' viewBox='0 0 30 30' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h30v30H0z' fill='none'/%3E%3Cpath d='M30 0v30H0' fill='none' stroke='${patternColor}' stroke-opacity='${patternOpacity}' stroke-width='1'/%3E%3C/svg%3E")`;
  } else if (pattern === 'lines') {
    patternBgImage = `url("data:image/svg+xml,%3Csvg width='24' height='24' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 24L24 0M-6 6L6 -6M18 30L30 18' stroke='${patternColor}' stroke-opacity='${patternOpacity}' stroke-width='1.2'/%3E%3C/svg%3E")`;
  } else if (pattern === 'luxury_geo') {
    patternBgImage = `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20 0L40 20L20 40L0 20z' fill='none' stroke='${patternColor}' stroke-opacity='${patternOpacity}' stroke-width='1'/%3E%3C/svg%3E")`;
  } else if (pattern === 'carbon') {
    patternBgImage = `url("data:image/svg+xml,%3Csvg width='12' height='12' viewBox='0 0 12 12' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h6v6H0z' fill='${patternColor}' fill-opacity='${patternOpacity}'/%3E%3Cpath d='M6 6h6v6H6z' fill='${patternColor}' fill-opacity='${patternOpacity}'/%3E%3C/svg%3E")`;
  } else if (pattern === 'paper_grain') {
    patternBgImage = `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.07'/%3E%3C/svg%3E")`;
  } else if (pattern === 'bokeh') {
    patternBgImage = `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='20' cy='20' r='14' fill='${patternColor}' fill-opacity='0.03'/%3E%3Ccircle cx='60' cy='50' r='20' fill='${patternColor}' fill-opacity='0.04'/%3E%3Ccircle cx='50' cy='15' r='8' fill='${patternColor}' fill-opacity='0.02'/%3E%3C/svg%3E")`;
  }

  const finalStyle: CSSProperties = {
    background,
    color: textColor,
    borderColor: isLight ? '#cbd5e1' : '#334155',
  };

  return {
    style: finalStyle,
    className: isLight ? 'text-slate-900 border-slate-300' : 'text-white border-slate-700/80',
    isLight,
    accentColor,
    textColor,
  };
}

/**
 * Basic luminescence calculation to check if a hex color is light or dark
 */
export function isColorLight(hex: string): boolean {
  if (!hex || typeof hex !== 'string') return false;
  let cleanHex = hex.replace('#', '');
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split('').map(c => c + c).join('');
  }
  if (cleanHex.length !== 6) return false;
  
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  
  // YIQ formula
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 150;
}
