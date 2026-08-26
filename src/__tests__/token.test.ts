import { describe, it, expect } from 'vitest';
import { generateSecureToken } from '../utils/token';

describe('generateSecureToken', () => {
  it('returns a string with the default prefix', () => {
    const token = generateSecureToken();
    expect(token).toMatch(/^rst_/);
  });

  it('returns a string with a custom prefix', () => {
    const token = generateSecureToken('inv');
    expect(token).toMatch(/^inv_/);
  });

  it('generates unique tokens each call', () => {
    const tokens = new Set(Array.from({ length: 100 }, () => generateSecureToken()));
    expect(tokens.size).toBe(100);
  });

  it('token has sufficient length for security', () => {
    const token = generateSecureToken();
    // UUID is 36 chars + prefix + underscore = at least 40
    expect(token.length).toBeGreaterThanOrEqual(40);
  });
});
