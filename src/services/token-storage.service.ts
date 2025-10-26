import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class TokenStorageService {
  private readonly ACCESS_TOKEN_KEY = 'access_token';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';
  private readonly USERNAME_KEY = 'auth_username'; // Store username for SECRET_HASH

  /**
   * Check if we're running in a browser environment
   */
  private isBrowser(): boolean {
    return typeof localStorage !== 'undefined';
  }

  /**
   * Store access token
   */
  setAccessToken(token: string): void {
    if (!this.isBrowser()) return;
    const oldToken = localStorage.getItem(this.ACCESS_TOKEN_KEY);
    const changed = oldToken !== token;
    console.log('[TokenStorage] Setting access token:', {
      newTokenPrefix: token?.substring(0, 30),
      oldTokenPrefix: oldToken?.substring(0, 30),
      tokenChanged: changed
    });
    localStorage.setItem(this.ACCESS_TOKEN_KEY, token);
  }

  /**
   * Store refresh token
   */
  setRefreshToken(token: string): void {
    if (!this.isBrowser()) return;
    localStorage.setItem(this.REFRESH_TOKEN_KEY, token);
  }

  /**
   * Get access token
   */
  getAccessToken(): string | null {
    if (!this.isBrowser()) return null;
    return localStorage.getItem(this.ACCESS_TOKEN_KEY);
  }

  /**
   * Get refresh token
   */
  getRefreshToken(): string | null {
    if (!this.isBrowser()) return null;
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  /**
   * Remove access token
   */
  removeAccessToken(): void {
    if (!this.isBrowser()) return;
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
  }

  /**
   * Remove refresh token
   */
  removeRefreshToken(): void {
    if (!this.isBrowser()) return;
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
  }

  /**
   * Store username for SECRET_HASH calculation
   */
  setUsername(username: string): void {
    if (!this.isBrowser()) return;
    localStorage.setItem(this.USERNAME_KEY, username);
  }

  /**
   * Get stored username
   */
  getUsername(): string | null {
    if (!this.isBrowser()) return null;
    return localStorage.getItem(this.USERNAME_KEY);
  }

  /**
   * Remove username
   */
  removeUsername(): void {
    if (!this.isBrowser()) return;
    localStorage.removeItem(this.USERNAME_KEY);
  }

  /**
   * Clear all tokens
   */
  clearTokens(): void {
    this.removeAccessToken();
    this.removeRefreshToken();
    this.removeUsername();
  }

  /**
   * Check if access token exists
   */
  hasAccessToken(): boolean {
    return this.getAccessToken() !== null;
  }

  /**
   * Check if refresh token exists
   */
  hasRefreshToken(): boolean {
    return this.getRefreshToken() !== null;
  }
}
