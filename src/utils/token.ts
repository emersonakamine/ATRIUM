/**
 * Generates a cryptographically secure random token.
 * Uses crypto.randomUUID() with a prefix for readability.
 */
export function generateSecureToken(prefix: string = 'rst'): string {
  return `${prefix}_${crypto.randomUUID()}`;
}
