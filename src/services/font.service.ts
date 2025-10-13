import { Injectable, Renderer2, RendererFactory2, Inject, signal, PLATFORM_ID } from '@angular/core';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';

export type FontFamily = 'system' | 'inter' | 'roboto' | 'fira-code' | 'jetbrains-mono';
export type FontSize = 'small' | 'medium' | 'large';

interface FontDetectionResult {
  isAvailable: boolean;
  fallback: FontFamily;
}

@Injectable({
  providedIn: 'root'
})
export class FontService {
  private renderer: Renderer2;
  public currentFontFamily = signal<FontFamily>(this.getInitialFontFamily());
  public currentFontSize = signal<FontSize>(this.getInitialFontSize());
  public availableFonts = signal<FontFamily[]>([]);

  constructor(
    private rendererFactory: RendererFactory2,
    @Inject(DOCUMENT) private document: Document,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.renderer = this.rendererFactory.createRenderer(null, null);
    this.initializeFonts();
  }

  private getInitialFontFamily(): FontFamily {
    // Only check font in browser environment
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      const savedFont = localStorage.getItem('font-family') as FontFamily;
      if (savedFont && this.isValidFontFamily(savedFont)) {
        return savedFont;
      }
    }
    // Default to system font
    return 'system';
  }

  private getInitialFontSize(): FontSize {
    // Only check font size in browser environment
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      const savedFontSize = localStorage.getItem('font-size') as FontSize;
      if (savedFontSize && this.isValidFontSize(savedFontSize)) {
        return savedFontSize;
      }
    }
    // Default to medium size
    return 'medium';
  }

  private isValidFontFamily(font: string): font is FontFamily {
    return ['system', 'geist', 'inter', 'roboto', 'mono'].includes(font);
  }

  private isValidFontSize(size: string): size is FontSize {
    return ['small', 'medium', 'large'].includes(size);
  }

  private initializeFonts(): void {
    // Only initialize fonts in browser environment
    if (isPlatformBrowser(this.platformId)) {
      // Detect available fonts first
      this.detectAvailableFonts().then(() => {
        // Apply the fonts to the DOM
        this.applyFontFamily(this.currentFontFamily());
        this.applyFontSize(this.currentFontSize());
      });
    }
  }

  private applyFontFamily(fontFamily: FontFamily): void {
    // Remove existing font classes
    this.renderer.removeClass(this.document.documentElement, 'font-system');
    this.renderer.removeClass(this.document.documentElement, 'font-inter');
    this.renderer.removeClass(this.document.documentElement, 'font-roboto');
    this.renderer.removeClass(this.document.documentElement, 'font-fira-code');
    this.renderer.removeClass(this.document.documentElement, 'font-jetbrains-mono');

    // Add new font class
    this.renderer.addClass(this.document.documentElement, `font-${fontFamily}`);
  }

  private applyFontSize(fontSize: FontSize): void {
    // Remove existing font size classes
    this.renderer.removeClass(this.document.documentElement, 'font-size-small');
    this.renderer.removeClass(this.document.documentElement, 'font-size-medium');
    this.renderer.removeClass(this.document.documentElement, 'font-size-large');

    // Add new font size class
    this.renderer.addClass(this.document.documentElement, `font-size-${fontSize}`);
  }

  setFontFamily(fontFamily: FontFamily): void {
    this.currentFontFamily.set(fontFamily);

    if (isPlatformBrowser(this.platformId)) {
      this.applyFontFamily(fontFamily);
      localStorage.setItem('font-family', fontFamily);
    }
  }

  setFontSize(fontSize: FontSize): void {
    this.currentFontSize.set(fontSize);

    if (isPlatformBrowser(this.platformId)) {
      this.applyFontSize(fontSize);
      localStorage.setItem('font-size', fontSize);
    }
  }

  getFontFamily(): FontFamily {
    return this.currentFontFamily();
  }

  getFontSize(): FontSize {
    return this.currentFontSize();
  }

  // Helper methods for components
  getFontFamilyClasses(): string {
    const fontFamily = this.currentFontFamily();
    switch (fontFamily) {
      case 'system':
        return 'font-sans';
      case 'inter':
        return 'font-inter';
      case 'roboto':
        return 'font-roboto';
      case 'fira-code':
        return 'font-fira-code';
      case 'jetbrains-mono':
        return 'font-jetbrains-mono';
      default:
        return 'font-sans';
    }
  }

  getFontSizeClasses(): string {
    const fontSize = this.currentFontSize();
    switch (fontSize) {
      case 'small':
        return 'text-sm';
      case 'medium':
        return 'text-base';
      case 'large':
        return 'text-lg';
      default:
        return 'text-base';
    }
  }

  // Get CSS custom properties for dynamic styling
  getFontFamilyCSS(): string {
    const fontFamily = this.currentFontFamily();
    const bestFont = this.getBestAvailableFont(fontFamily);
    
    switch (bestFont) {
      case 'system':
        return 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      case 'inter':
        return '"Inter", system-ui, sans-serif';
      case 'roboto':
        return '"Roboto", system-ui, sans-serif';
      case 'fira-code':
        return '"Fira Code", monospace';
      case 'jetbrains-mono':
        return '"JetBrains Mono", monospace';
      default:
        return 'system-ui, sans-serif';
    }
  }

  getFontSizeCSS(): string {
    const fontSize = this.currentFontSize();
    switch (fontSize) {
      case 'small':
        return '14px';
      case 'medium':
        return '16px';
      case 'large':
        return '18px';
      default:
        return '16px';
    }
  }

  // Font detection methods
  private async detectAvailableFonts(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) {
      this.availableFonts.set(['system']); // Default to system only for SSR
      return;
    }

    // Assume all fonts are available since we're loading them
    const availableFonts: FontFamily[] = ['system', 'inter', 'roboto', 'fira-code', 'jetbrains-mono'];
    this.availableFonts.set(availableFonts);
  }

  // Wait for web fonts to load
  private async waitForWebFonts(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    // Simple wait for fonts to load
    await new Promise(resolve => setTimeout(resolve, 100));
  }


  // Check if a specific font is available
  isFontFamilyAvailable(fontFamily: FontFamily): boolean {
    return this.availableFonts().includes(fontFamily);
  }

  // Get the best available font (with fallback)
  getBestAvailableFont(requestedFont: FontFamily): FontFamily {
    if (this.isFontFamilyAvailable(requestedFont)) {
      return requestedFont;
    }
    
    // Fallback hierarchy
    const fallbackOrder: FontFamily[] = ['system', 'inter', 'roboto', 'fira-code', 'jetbrains-mono'];
    for (const fallback of fallbackOrder) {
      if (this.isFontFamilyAvailable(fallback)) {
        return fallback;
      }
    }
    
    return 'system'; // Ultimate fallback
  }

  // Get available font options for UI
  getAvailableFontOptions(): Array<{ value: FontFamily; label: string; available: boolean }> {
    const allFonts: Array<{ value: FontFamily; label: string }> = [
      { value: 'system', label: 'System' },
      { value: 'inter', label: 'Inter' },
      { value: 'roboto', label: 'Roboto' },
      { value: 'fira-code', label: 'Fira Code' },
      { value: 'jetbrains-mono', label: 'JetBrains Mono' }
    ];

    return allFonts.map(font => ({
      ...font,
      available: this.isFontFamilyAvailable(font.value)
    }));
  }

  // Force font detection (useful for manual refresh)
  async refreshFontDetection(): Promise<void> {
    await this.detectAvailableFonts();
  }

  // Check if fonts are currently loading
  isFontLoading(): boolean {
    return false; // Assume fonts are always ready
  }

  // Get loading status for UI
  getFontLoadingStatus(): { isLoading: boolean; availableCount: number; totalCount: number } {
    const available = this.availableFonts();
    const total = 5; // system, geist, inter, roboto, mono

    return {
      isLoading: false,
      availableCount: available.length,
      totalCount: total
    };
  }
}
