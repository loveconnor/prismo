import { 
  Component, 
  Input, 
  ElementRef, 
  AfterViewInit, 
  OnDestroy,
  Inject,
  PLATFORM_ID,
  ViewChild,
  ViewContainerRef
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ResizablePanelComponent } from './panel';

@Component({
  selector: 'app-panel-resize-handle',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div 
      #handle
      class="resize-handle"
      [class.horizontal]="isHorizontal"
      [class.vertical]="!isHorizontal"
      [class.active]="isDragging"
    >
      <div class="handle-bar"></div>
    </div>
  `,
  styles: [`
    .resize-handle {
      position: relative;
      flex-shrink: 0;
      z-index: 100;
      background: rgba(148, 163, 184, 0.15);
      transition: background-color 0.2s ease;
    }

    .resize-handle.horizontal {
      width: 12px;
      cursor: ew-resize;
      min-width: 12px;
    }

    .resize-handle.vertical {
      height: 12px;
      cursor: ns-resize;
      min-height: 12px;
    }

    .resize-handle:hover {
      background: rgba(59, 130, 246, 0.25);
    }

    .resize-handle.active {
      background: rgba(59, 130, 246, 0.4);
    }

    .handle-bar {
      position: absolute;
      background: rgba(148, 163, 184, 0.4);
      border-radius: 3px;
      transition: all 0.2s ease;
    }

    .resize-handle.horizontal .handle-bar {
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 4px;
      height: 50px;
    }

    .resize-handle.vertical .handle-bar {
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 50px;
      height: 4px;
    }

    .resize-handle:hover .handle-bar {
      background: rgba(59, 130, 246, 0.7);
    }

    .resize-handle.horizontal:hover .handle-bar {
      height: 80px;
      width: 5px;
    }

    .resize-handle.vertical:hover .handle-bar {
      width: 80px;
      height: 5px;
    }

    .resize-handle.active .handle-bar {
      background: rgba(59, 130, 246, 0.9);
    }

    .resize-handle.horizontal.active .handle-bar {
      height: 100px;
      width: 6px;
    }

    .resize-handle.vertical.active .handle-bar {
      width: 100px;
      height: 6px;
    }
  `]
})
export class PanelResizeHandleComponent implements AfterViewInit, OnDestroy {
  @Input() className: string = '';
  @ViewChild('handle') handleElement!: ElementRef;

  isDragging = false;
  isHorizontal = false;
  
  private startPos = 0;
  private prevPanel: HTMLElement | null = null;
  private nextPanel: HTMLElement | null = null;
  private prevPanelComponent: ResizablePanelComponent | null = null;
  private nextPanelComponent: ResizablePanelComponent | null = null;
  private prevPanelStartSize = 0;
  private nextPanelStartSize = 0;
  private containerSize = 0;

  private boundOnMouseMove = this.onMouseMove.bind(this);
  private boundOnMouseUp = this.onMouseUp.bind(this);

  constructor(
    private elementRef: ElementRef,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const handle = this.handleElement.nativeElement as HTMLElement;
    const parent = handle.parentElement;
    
    if (parent) {
      this.isHorizontal = parent.classList.contains('horizontal');
      console.log('Resize handle initialized:', {
        isHorizontal: this.isHorizontal,
        parent: parent.className,
        children: Array.from(parent.children).map((c: any) => c.tagName)
      });
    }

    handle.addEventListener('mousedown', this.onMouseDown.bind(this));
    handle.addEventListener('touchstart', this.onTouchStart.bind(this));
  }

  ngOnDestroy(): void {
    if (isPlatformBrowser(this.platformId)) {
      document.removeEventListener('mousemove', this.boundOnMouseMove);
      document.removeEventListener('mouseup', this.boundOnMouseUp);
      document.removeEventListener('touchmove', this.boundOnMouseMove);
      document.removeEventListener('touchend', this.boundOnMouseUp);
    }
  }

  private onMouseDown(e: MouseEvent): void {
    console.log('Mouse down on resize handle');
    e.preventDefault();
    this.startResize(e.clientX, e.clientY);
  }

  private onTouchStart(e: TouchEvent): void {
    console.log('Touch start on resize handle');
    e.preventDefault();
    const touch = e.touches[0];
    this.startResize(touch.clientX, touch.clientY);
  }

  private startResize(clientX: number, clientY: number): void {
    console.log('Starting resize');
    this.isDragging = true;
    this.startPos = this.isHorizontal ? clientX : clientY;

    const handle = this.handleElement.nativeElement as HTMLElement;
    this.prevPanel = this.getPreviousPanel(handle);
    this.nextPanel = this.getNextPanel(handle);

    console.log('Panels found:', {
      prevPanel: this.prevPanel,
      nextPanel: this.nextPanel,
      prevPanelSize: this.prevPanel ? (this.isHorizontal ? this.prevPanel.offsetWidth : this.prevPanel.offsetHeight) : 'N/A',
      nextPanelSize: this.nextPanel ? (this.isHorizontal ? this.nextPanel.offsetWidth : this.nextPanel.offsetHeight) : 'N/A'
    });

    if (!this.prevPanel || !this.nextPanel) {
      console.error('Could not find adjacent panels!');
      this.isDragging = false;
      return;
    }

    const container = handle.parentElement as HTMLElement;
    this.containerSize = this.isHorizontal ? container.offsetWidth : container.offsetHeight;

    this.prevPanelStartSize = this.isHorizontal ? this.prevPanel.offsetWidth : this.prevPanel.offsetHeight;
    this.nextPanelStartSize = this.isHorizontal ? this.nextPanel.offsetWidth : this.nextPanel.offsetHeight;

    console.log('Initial sizes:', {
      containerSize: this.containerSize,
      prevPanelStartSize: this.prevPanelStartSize,
      nextPanelStartSize: this.nextPanelStartSize
    });

    document.addEventListener('mousemove', this.boundOnMouseMove);
    document.addEventListener('mouseup', this.boundOnMouseUp);
    document.addEventListener('touchmove', this.boundOnMouseMove);
    document.addEventListener('touchend', this.boundOnMouseUp);

    document.body.style.cursor = this.isHorizontal ? 'ew-resize' : 'ns-resize';
    document.body.style.userSelect = 'none';
  }

  private onMouseMove(e: MouseEvent | TouchEvent): void {
    if (!this.isDragging || !this.prevPanel || !this.nextPanel) return;

    const clientX = (e as MouseEvent).clientX ?? (e as TouchEvent).touches[0].clientX;
    const clientY = (e as MouseEvent).clientY ?? (e as TouchEvent).touches[0].clientY;
    const currentPos = this.isHorizontal ? clientX : clientY;
    const delta = currentPos - this.startPos;

    const newPrevSize = this.prevPanelStartSize + delta;
    const newNextSize = this.nextPanelStartSize - delta;

    // Calculate percentages
    const prevPercent = (newPrevSize / this.containerSize) * 100;
    const nextPercent = (newNextSize / this.containerSize) * 100;

    console.log('Resizing:', {
      delta,
      newPrevSize,
      newNextSize,
      prevPercent: prevPercent.toFixed(2),
      nextPercent: nextPercent.toFixed(2)
    });

    // Enforce min/max constraints (10% min, 90% max)
    if (prevPercent < 10 || prevPercent > 90 || nextPercent < 10 || nextPercent > 90) {
      return;
    }

    // Update panel sizes - try component method first, fallback to DOM
    if (this.prevPanelComponent && this.nextPanelComponent) {
      this.prevPanelComponent.updateSize(prevPercent);
      this.nextPanelComponent.updateSize(nextPercent);
    } else {
      // Fallback to direct DOM manipulation
      if (this.isHorizontal) {
        this.prevPanel.style.width = `${prevPercent}%`;
        this.prevPanel.style.flexBasis = `${prevPercent}%`;
        this.nextPanel.style.width = `${nextPercent}%`;
        this.nextPanel.style.flexBasis = `${nextPercent}%`;
      } else {
        this.prevPanel.style.height = `${prevPercent}%`;
        this.prevPanel.style.flexBasis = `${prevPercent}%`;
        this.nextPanel.style.height = `${nextPercent}%`;
        this.nextPanel.style.flexBasis = `${nextPercent}%`;
      }
    }

    // Notify parent PanelGroup of size changes
    this.notifyLayoutChange();
  }

  private onMouseUp(): void {
    if (!this.isDragging) return;

    this.isDragging = false;
    document.removeEventListener('mousemove', this.boundOnMouseMove);
    document.removeEventListener('mouseup', this.boundOnMouseUp);
    document.removeEventListener('touchmove', this.boundOnMouseMove);
    document.removeEventListener('touchend', this.boundOnMouseUp);

    document.body.style.cursor = '';
    document.body.style.userSelect = '';

    this.notifyLayoutChange();
  }

  private getPreviousPanel(handle: HTMLElement): HTMLElement | null {
    let prev = handle.previousElementSibling;
    // Look for app-resizable-panel elements
    while (prev && prev.tagName !== 'APP-RESIZABLE-PANEL') {
      prev = prev.previousElementSibling;
    }
    console.log('Previous panel element:', prev?.tagName, prev);
    
    // Store the component instance
    if (prev) {
      this.prevPanelComponent = (prev as any).__ngContext__?.[8] || null;
      console.log('Previous panel component:', this.prevPanelComponent);
    }
    
    // Return the inner div with class resizable-panel
    return prev ? (prev.querySelector('.resizable-panel') as HTMLElement) : null;
  }

  private getNextPanel(handle: HTMLElement): HTMLElement | null {
    let next = handle.nextElementSibling;
    // Look for app-resizable-panel elements
    while (next && next.tagName !== 'APP-RESIZABLE-PANEL') {
      next = next.nextElementSibling;
    }
    console.log('Next panel element:', next?.tagName, next);
    
    // Store the component instance
    if (next) {
      this.nextPanelComponent = (next as any).__ngContext__?.[8] || null;
      console.log('Next panel component:', this.nextPanelComponent);
    }
    
    // Return the inner div with class resizable-panel
    return next ? (next.querySelector('.resizable-panel') as HTMLElement) : null;
  }

  private notifyLayoutChange(): void {
    const handle = this.handleElement.nativeElement as HTMLElement;
    const container = handle.parentElement as HTMLElement;
    const panels = Array.from(container.children).filter((el: any) => 
      el.classList.contains('resizable-panel')
    ) as HTMLElement[];

    const sizes = panels.map(panel => {
      const size = this.isHorizontal ? panel.offsetWidth : panel.offsetHeight;
      return (size / this.containerSize) * 100;
    });

    // Find the PanelGroup component and call its updateLayout method
    const panelGroup = this.findPanelGroup(container);
    if (panelGroup) {
      panelGroup.updateLayout(sizes);
    }
  }

  private findPanelGroup(element: HTMLElement): any {
    // Walk up the DOM to find the Angular component instance
    let current: any = element;
    while (current) {
      if (current.__ngContext__) {
        // Try to find the PanelGroupComponent in the context
        const context = current.__ngContext__;
        if (Array.isArray(context)) {
          for (const item of context) {
            if (item && typeof item === 'object' && item.constructor.name === 'PanelGroupComponent') {
              return item;
            }
          }
        }
      }
      current = current.parentElement;
    }
    return null;
  }
}
