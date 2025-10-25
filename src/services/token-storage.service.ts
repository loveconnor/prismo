import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class TokenStorageService {
  private readonly ACCESS_TOKEN_KEY = 'access_token';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';

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
   * Clear all tokens
   */
  clearTokens(): void {
    this.removeAccessToken();
    this.removeRefreshToken();
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
