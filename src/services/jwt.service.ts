import { Injectable } from '@angular/core';

export interface JWTPayload {
  sub: string; // Subject (user ID)
  email: string;
  name: string;
  avatar?: string;
  iat: number; // Issued at
  exp: number; // Expiration time
  iss?: string; // Issuer
  aud?: string; // Audience
  remember?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class JwtService {

  /**
   * Decode a JWT token (client-side only - for reading payload)
   * Note: This does NOT verify the signature - only use for reading non-sensitive data
   */
  decode(token: string): JWTPayload | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        return null;
      }

      const payload = parts[1];
      const decoded = this.base64UrlDecode(payload);
      return JSON.parse(decoded) as JWTPayload;
    } catch (error) {
      console.error('Error decoding JWT:', error);
      return null;
    }
  }

  /**
   * Check if a JWT token is expired
   */
  isTokenExpired(token: string): boolean {
    const payload = this.decode(token);
    if (!payload) return true;

    const currentTime = Math.floor(Date.now() / 1000);
    return payload.exp < currentTime;
  }

  /**
   * Get the expiration date of a JWT token
   */
  getTokenExpiration(token: string): Date | null {
    const payload = this.decode(token);
    if (!payload) return null;

    return new Date(payload.exp * 1000);
  }

  /**
   * Check if token is valid (not expired and properly formatted)
   */
  isTokenValid(token: string): boolean {
    if (!token) return false;
    
    const payload = this.decode(token);
    if (!payload) return false;

    return !this.isTokenExpired(token);
  }

  /**
   * Get user information from JWT token
   */
  getUserFromToken(token: string): { id: string; email: string; name: string; avatar?: string } | null {
    const payload = this.decode(token);
    if (!payload) return null;

    return {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
      avatar: payload.avatar
    };
  }

  /**
   * Create a demo JWT token for development
   */
  createDemoToken(user: { id: string; email: string; name: string; avatar?: string }, remember: boolean = false): string {
    const header = {
      alg: 'HS256',
      typ: 'JWT'
    };

    const expiration = remember 
      ? Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60) // 30 days
      : Math.floor(Date.now() / 1000) + (24 * 60 * 60); // 1 day

    const payload: JWTPayload = {
      sub: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      iat: Math.floor(Date.now() / 1000),
      exp: expiration,
      iss: 'prismo-demo',
      aud: 'prismo-app',
      remember
    };

    // This is a demo token - in production, tokens should be created and signed by the server
    const encodedHeader = this.base64UrlEncode(JSON.stringify(header));
    const encodedPayload = this.base64UrlEncode(JSON.stringify(payload));
    const signature = this.base64UrlEncode('demo-signature-' + Date.now());

    return `${encodedHeader}.${encodedPayload}.${signature}`;
  }

  /**
   * Base64 URL decode
   */
  private base64UrlDecode(str: string): string {
    // Add padding if necessary
    str += '='.repeat((4 - str.length % 4) % 4);
    // Replace URL-safe characters
    str = str.replace(/-/g, '+').replace(/_/g, '/');
    // Decode
    return atob(str);
  }

  /**
   * Base64 URL encode
   */
  private base64UrlEncode(str: string): string {
    return btoa(str)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }
}
