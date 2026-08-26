import { describe, it, expect } from 'vitest';
import { sanitizeForFirestore } from '../utils/firestoreSanitizer';

describe('sanitizeForFirestore', () => {
  it('removes undefined values from objects', () => {
    const input = { a: 1, b: undefined, c: 'hello' };
    const result = sanitizeForFirestore(input);
    expect(result).toEqual({ a: 1, c: 'hello' });
    expect('b' in result).toBe(false);
  });

  it('handles nested objects', () => {
    const input = {
      outer: {
        inner: 'value',
        missing: undefined,
      },
      arr: [1, undefined, 3],
    };
    const result = sanitizeForFirestore(input);
    expect(result).toEqual({
      outer: { inner: 'value' },
      arr: [1, null, 3],
    });
  });

  it('returns null for null input', () => {
    expect(sanitizeForFirestore(null)).toBeNull();
  });

  it('returns null for undefined input (Firestore-safe)', () => {
    expect(sanitizeForFirestore(undefined)).toBeNull();
  });

  it('returns primitives as-is', () => {
    expect(sanitizeForFirestore(42)).toBe(42);
    expect(sanitizeForFirestore('hello')).toBe('hello');
    expect(sanitizeForFirestore(true)).toBe(true);
  });

  it('handles empty objects', () => {
    expect(sanitizeForFirestore({})).toEqual({});
  });

  it('handles Date objects without stripping them', () => {
    const date = new Date('2026-01-01');
    const input = { created: date };
    const result = sanitizeForFirestore(input);
    expect(result.created).toBeInstanceOf(Date);
  });
});
