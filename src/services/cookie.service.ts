import { Injectable } from '@angular/core';

export interface CookieOptions {
  expires?: Date | number;
  path?: string;
  domain?: string;
  secure?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
  httpOnly?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class CookieService {
  
  /**
   * Check if we're running in a browser environment
   */
  private isBrowser(): boolean {
    return typeof document !== 'undefined';
  }

  /**
   * Set a cookie
   */
  set(name: string, value: string, options: CookieOptions = {}): void {
    if (!this.isBrowser()) return;

    let cookieString = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;

    if (options.expires) {
      if (typeof options.expires === 'number') {
        const date = new Date();
        date.setTime(date.getTime() + (options.expires * 24 * 60 * 60 * 1000));
        options.expires = date;
      }
      cookieString += `; expires=${options.expires.toUTCString()}`;
    }

    if (options.path) {
      cookieString += `; path=${options.path}`;
    } else {
      cookieString += `; path=/`;
    }

    if (options.domain) {
      cookieString += `; domain=${options.domain}`;
    }

    if (options.secure) {
      cookieString += `; secure`;
    }

    if (options.sameSite) {
      cookieString += `; samesite=${options.sameSite}`;
    }

    // Note: httpOnly cannot be set from JavaScript for security reasons
    // This would need to be set by the server

    document.cookie = cookieString;
  }

  /**
   * Get a cookie value
   */
  get(name: string): string | null {
    if (!this.isBrowser()) return null;

    const nameEQ = encodeURIComponent(name) + '=';
    const cookies = document.cookie.split(';');

    for (let cookie of cookies) {
      cookie = cookie.trim();
      if (cookie.indexOf(nameEQ) === 0) {
        return decodeURIComponent(cookie.substring(nameEQ.length));
      }
    }

    return null;
  }

  /**
   * Delete a cookie
   */
  delete(name: string, path: string = '/', domain?: string): void {
    if (!this.isBrowser()) return;

    let cookieString = `${encodeURIComponent(name)}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${path}`;
    
    if (domain) {
      cookieString += `; domain=${domain}`;
    }

    document.cookie = cookieString;
  }

  /**
   * Check if a cookie exists
   */
  exists(name: string): boolean {
    return this.get(name) !== null;
  }

  /**
   * Get all cookies as an object
   */
  getAll(): { [key: string]: string } {
    if (!this.isBrowser()) return {};

    const cookies: { [key: string]: string } = {};
    const cookieArray = document.cookie.split(';');

    for (let cookie of cookieArray) {
      cookie = cookie.trim();
      const [name, value] = cookie.split('=');
      if (name && value) {
        cookies[decodeURIComponent(name)] = decodeURIComponent(value);
      }
    }

    return cookies;
  }

  /**
   * Clear all cookies (client-side only)
   */
  clearAll(): void {
    if (!this.isBrowser()) return;

    const cookies = this.getAll();
    for (const name in cookies) {
      this.delete(name);
    }
  }
}
