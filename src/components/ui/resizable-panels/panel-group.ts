import { 
  Component, 
  Input, 
  AfterViewInit, 
  OnDestroy, 
  ElementRef, 
  Inject, 
  PLATFORM_ID,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-panel-group',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="panel-group" [class.horizontal]="direction === 'horizontal'" [class.vertical]="direction === 'vertical'">
      <ng-content></ng-content>
    </div>
  `,
  styles: [`
    .panel-group {
      display: flex;
      width: 100%;
      height: 100%;
      position: relative;
    }
    .panel-group.horizontal {
      flex-direction: row;
    }
    .panel-group.vertical {
      flex-direction: column;
    }
  `]
})
export class PanelGroupComponent implements AfterViewInit, OnDestroy {
  @Input() direction: 'horizontal' | 'vertical' = 'vertical';
  @Input() onLayout?: (sizes: number[]) => void;
  @Input() storageKey?: string;

  private resizeObserver?: ResizeObserver;

  constructor(
    private elementRef: ElementRef,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.initializeLayout();
    }
  }

  ngOnDestroy(): void {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
  }

  private initializeLayout(): void {
    const container = this.elementRef.nativeElement.querySelector('.panel-group');
    if (!container) return;

    // Load saved sizes from localStorage
    let savedSizes: number[] | null = null;
    if (this.storageKey) {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        try {
          savedSizes = JSON.parse(saved);
        } catch (e) {
          console.error('Failed to parse saved panel sizes:', e);
        }
      }
    }

    // Apply saved sizes or defaults
    const panels = Array.from(container.children).filter((el: any) => 
      el.classList.contains('resizable-panel')
    ) as HTMLElement[];

    if (savedSizes && savedSizes.length === panels.length) {
      panels.forEach((panel, index) => {
        const size = savedSizes![index];
        if (this.direction === 'horizontal') {
          panel.style.width = `${size}%`;
          panel.style.flexBasis = `${size}%`;
        } else {
          panel.style.height = `${size}%`;
          panel.style.flexBasis = `${size}%`;
        }
      });
    }
  }

  public updateLayout(sizes: number[]): void {
    if (this.onLayout) {
      this.onLayout(sizes);
    }

    // Save to localStorage if storageKey is provided
    if (this.storageKey && isPlatformBrowser(this.platformId)) {
      localStorage.setItem(this.storageKey, JSON.stringify(sizes));
    }
  }
}
