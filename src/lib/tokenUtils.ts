// Token generation and validation utilities

import crypto from 'crypto';

export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

export function generateReadableToken(): string {
  // Generate a more readable token format: xxxx-xxxx-xxxx-xxxx
  const segments = [];
  for (let i = 0; i < 4; i++) {
    segments.push(crypto.randomBytes(2).toString('hex'));
  }
  return segments.join('-');
}

export function validateTokenFormat(token: string): boolean {
  // Basic token validation - should be alphanumeric and hyphens
  return /^[a-zA-Z0-9\-]+$/.test(token) && token.length >= 8;
}

export function extractTokenFromHeader(authHeader: string, prefix: string = 'Bearer'): string | null {
  if (!authHeader) return null;
  
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== prefix) {
    return null;
  }
  
  return parts[1];
}

export function formatAuthHeader(token: string, prefix: string = 'Bearer'): string {
  return `${prefix} ${token}`;
}
