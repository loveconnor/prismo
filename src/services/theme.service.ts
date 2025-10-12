import { Injectable, Renderer2, RendererFactory2, Inject, signal, PLATFORM_ID } from '@angular/core';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private renderer: Renderer2;
  public isDarkMode = signal(this.getInitialTheme());

  constructor(
    private rendererFactory: RendererFactory2,
    @Inject(DOCUMENT) private document: Document,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.renderer = this.rendererFactory.createRenderer(null, null);
    this.initializeTheme();
  }

  private getInitialTheme(): boolean {
    // Only check theme in browser environment
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      return savedTheme === 'dark' || (!savedTheme && prefersDark);
    }
    // Default to dark mode for SSR
    return true;
  }

  private initializeTheme(): void {
    // Only initialize theme in browser environment
    if (isPlatformBrowser(this.platformId)) {
      // Apply the theme to the DOM
      const shouldUseDark = this.isDarkMode();
      this.applyTheme(shouldUseDark);
    }
  }

  private applyTheme(isDark: boolean): void {
    if (isDark) {
      this.renderer.addClass(this.document.documentElement, 'dark');
      this.renderer.removeClass(this.document.documentElement, 'theme-light');
    } else {
      this.renderer.removeClass(this.document.documentElement, 'dark');
      this.renderer.addClass(this.document.documentElement, 'theme-light');
    }
  }

  toggleTheme(): void {
    this.setTheme(!this.isDarkMode());
  }

  setTheme(isDark: boolean): void {
    this.isDarkMode.set(isDark);

    if (isPlatformBrowser(this.platformId)) {
      this.applyTheme(isDark);
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
    }
  }
}
