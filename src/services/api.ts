// Fallback pro túnel local (cloudflared) quando VITE_API_BASE_URL não está setado
const FALLBACK_API = 'https://modes-intl-luggage-labels.trycloudflare.com';
const API_BASE = (import.meta.env.VITE_API_BASE_URL || FALLBACK_API).replace(/\/+$/, '');

export function apiUrl(path: string): string {
  if (!API_BASE) return path;
  return `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`;
}

export function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  return fetch(apiUrl(path), init);
}
