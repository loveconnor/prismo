import { Injectable, Renderer2, RendererFactory2, Inject, signal, PLATFORM_ID } from '@angular/core';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private renderer: Renderer2;
  public isDarkMode = signal(false);

  constructor(
    private rendererFactory: RendererFactory2,
    @Inject(DOCUMENT) private document: Document,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.renderer = this.rendererFactory.createRenderer(null, null);
    this.initializeTheme();
  }

  private initializeTheme(): void {
    // Only initialize theme in browser environment
    if (isPlatformBrowser(this.platformId)) {
      // Check for saved theme preference or default to system preference
      const savedTheme = localStorage.getItem('theme');
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      
      const shouldUseDark = savedTheme === 'dark' || (!savedTheme && prefersDark);
      this.setTheme(shouldUseDark);
    }
  }

  toggleTheme(): void {
    this.setTheme(!this.isDarkMode());
  }

  private setTheme(isDark: boolean): void {
    this.isDarkMode.set(isDark);
    
    if (isPlatformBrowser(this.platformId)) {
      if (isDark) {
        this.renderer.addClass(this.document.documentElement, 'dark');
        localStorage.setItem('theme', 'dark');
      } else {
        this.renderer.removeClass(this.document.documentElement, 'dark');
        localStorage.setItem('theme', 'light');
      }
    }
  }
}
