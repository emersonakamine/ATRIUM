/**
 * URL Helper for Public Event & Guest Links
 * 
 * In Google AI Studio:
 * - `ais-dev-...` is the private developer environment (requires Google Account sign-in).
 * - `ais-pre-...` is the shared public preview environment (accessible to anyone without login).
 */

export function getPublicBaseUrl(): string {
  if (typeof window === 'undefined') return '';

  // Check if custom public domain is configured in localStorage
  const customDomain = localStorage.getItem('guestgate_custom_public_domain');
  if (customDomain && customDomain.trim()) {
    let formatted = customDomain.trim();
    if (!formatted.startsWith('http://') && !formatted.startsWith('https://')) {
      formatted = `https://${formatted}`;
    }
    return formatted.replace(/\/+$/, '');
  }

  let origin = window.location.origin;

  // Convert private dev sandbox URL to public shared preview URL if applicable
  if (origin.includes('ais-dev-')) {
    origin = origin.replace('ais-dev-', 'ais-pre-');
  }

  return origin;
}

/**
 * Returns the public URL for a specific guest's digital pass & landing page
 */
export function getGuestInviteUrl(guestPublicCode: string): string {
  const base = getPublicBaseUrl();
  return `${base}/convite/${guestPublicCode}`;
}

/**
 * Returns the general public landing page URL for the event (no specific guest)
 */
export function getEventLandingUrl(eventCodeOrId: string): string {
  const base = getPublicBaseUrl();
  return `${base}/evento/${eventCodeOrId}`;
}

export interface RouteInfo {
  isPublic: boolean;
  isPortaria: boolean;
  code: string;
  isGeneralEvent: boolean;
}

/**
 * Parses the current window location to check if this is a public guest or event link
 */
export function parseCurrentRoute(): RouteInfo {
  if (typeof window === 'undefined') {
    return { isPublic: false, isPortaria: false, code: '', isGeneralEvent: false };
  }

  const path = window.location.pathname;
  const hash = window.location.hash;
  const search = window.location.search;

  if (path === '/portaria' || path === '/portaria/' || hash.includes('portaria')) {
    return { isPublic: false, isPortaria: true, code: '', isGeneralEvent: false };
  }

  // 1. Path format: /convite/:code or /evento/:code
  if (path.includes('/convite/')) {
    const raw = path.split('/convite/')[1]?.split('/')[0]?.split('?')[0] || '';
    const code = decodeURIComponent(raw).trim();
    return { isPublic: true, isPortaria: false, code, isGeneralEvent: false };
  }
  if (path.includes('/evento/')) {
    const raw = path.split('/evento/')[1]?.split('/')[0]?.split('?')[0] || '';
    const code = decodeURIComponent(raw).trim();
    return { isPublic: true, isPortaria: false, code, isGeneralEvent: true };
  }

  // 2. Hash format: #/convite/:code or #convite/:code or #/evento/:code
  if (hash.includes('/convite/')) {
    const raw = hash.split('/convite/')[1]?.split('?')[0] || '';
    const code = decodeURIComponent(raw).trim();
    return { isPublic: true, isPortaria: false, code, isGeneralEvent: false };
  }
  if (hash.includes('convite/')) {
    const raw = hash.split('convite/')[1]?.split('?')[0] || '';
    const code = decodeURIComponent(raw).trim();
    return { isPublic: true, isPortaria: false, code, isGeneralEvent: false };
  }
  if (hash.includes('/evento/')) {
    const raw = hash.split('/evento/')[1]?.split('?')[0] || '';
    const code = decodeURIComponent(raw).trim();
    return { isPublic: true, isPortaria: false, code, isGeneralEvent: true };
  }
  if (hash.includes('evento/')) {
    const raw = hash.split('evento/')[1]?.split('?')[0] || '';
    const code = decodeURIComponent(raw).trim();
    return { isPublic: true, isPortaria: false, code, isGeneralEvent: true };
  }

  // 3. Query param format: ?convite=:code or ?code=:code or ?evento=:code
  if (search.includes('convite=')) {
    const match = search.match(/[?&]convite=([^&#]+)/);
    if (match && match[1]) {
      return { isPublic: true, isPortaria: false, code: decodeURIComponent(match[1]).trim(), isGeneralEvent: false };
    }
  }
  if (search.includes('code=')) {
    const match = search.match(/[?&]code=([^&#]+)/);
    if (match && match[1]) {
      return { isPublic: true, isPortaria: false, code: decodeURIComponent(match[1]).trim(), isGeneralEvent: false };
    }
  }
  if (search.includes('evento=')) {
    const match = search.match(/[?&]evento=([^&#]+)/);
    if (match && match[1]) {
      return { isPublic: true, isPortaria: false, code: decodeURIComponent(match[1]).trim(), isGeneralEvent: true };
    }
  }

  return { isPublic: false, isPortaria: false, code: '', isGeneralEvent: false };
}

