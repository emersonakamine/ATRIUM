// Vazio = same-origin (funciona quando frontend e backend estão no mesmo túnel)
// Preencher com URL externa só se frontend for hospedado separadamente (ex: Cloudflare Pages)
const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');

export function apiUrl(path: string): string {
  if (!API_BASE) return path;
  return `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`;
}

export function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  return fetch(apiUrl(path), init);
}
