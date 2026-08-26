import { describe, it, expect } from 'vitest';
import { getGuestInviteUrl, getEventLandingUrl, parseCurrentRoute } from '../utils/urlHelper';

describe('getGuestInviteUrl', () => {
  it('returns a URL with /convite/ path', () => {
    const url = getGuestInviteUrl('ABC123');
    expect(url).toContain('/convite/ABC123');
  });
});

describe('getEventLandingUrl', () => {
  it('returns a URL with /evento/ path', () => {
    const url = getEventLandingUrl('EVT-001');
    expect(url).toContain('/evento/EVT-001');
  });
});

describe('parseCurrentRoute', () => {
  it('returns not public when no matching route', () => {
    // In test environment, window.location is usually about:blank
    const route = parseCurrentRoute();
    expect(route.isPublic).toBe(false);
  });
});
