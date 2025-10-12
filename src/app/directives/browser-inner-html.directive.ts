import { Directive, ElementRef, Inject, Input, OnChanges, PLATFORM_ID, Renderer2, SimpleChanges } from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { SafeHtml } from '@angular/platform-browser';

@Directive({
  selector: '[appBrowserInnerHtml]',
  standalone: true
})
export class BrowserInnerHtmlDirective implements OnChanges {
  @Input('appBrowserInnerHtml') content?: SafeHtml | string;

  constructor(
    private elementRef: ElementRef<HTMLElement>,
    private renderer: Renderer2,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['content']) {
      return;
    }

    if (isPlatformBrowser(this.platformId)) {
      this.renderer.setProperty(this.elementRef.nativeElement, 'innerHTML', this.content ?? '');
    }
  }
}
