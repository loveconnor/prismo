import { 
  Component, 
  Input, 
  AfterViewInit, 
  OnDestroy, 
  ElementRef, 
  ViewChild,
  Inject,
  PLATFORM_ID 
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-resizable-panels',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div #container class="resizable-panels-container" [style.flexDirection]="direction">
      <div 
        #panel1
        class="resizable-panel"
        [style.flex]="'0 0 ' + panel1Size + 'px'"
        [style.minWidth.px]="direction === 'row' ? minSize1 : null"
        [style.minHeight.px]="direction === 'column' ? minSize1 : null"
      >
        <ng-content select="[panel1]"></ng-content>
      </div>
      
      <div 
        #resizer
        class="resizer"
        [class.resizer-horizontal]="direction === 'row'"
        [class.resizer-vertical]="direction === 'column'"
        [class.resizing]="isResizing"
        [style.cursor]="direction === 'row' ? 'ew-resize' : 'ns-resize'"
        (mousedown)="startResize($event)"
        (touchstart)="startResize($event)"
        title="Drag to resize panels"
      >
        <div class="resizer-handle"></div>
      </div>
      
      <div 
        #panel2
        class="resizable-panel resizable-panel-flex"
        [style.minWidth.px]="direction === 'row' ? minSize2 : null"
        [style.minHeight.px]="direction === 'column' ? minSize2 : null"
      >
        <ng-content select="[panel2]"></ng-content>
      </div>
    </div>
  `,
  styles: [`
    .resizable-panels-container {
      display: flex;
      width: 100%;
      height: 100%;
      position: relative;
    }
    
    .resizable-panel {
      flex-shrink: 0;
      overflow: hidden;
      position: relative;
    }
    
    .resizable-panel-flex {
      flex: 1 1 auto;
      overflow: hidden;
    }
    
    .resizer {
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      user-select: none;
      touch-action: none;
      transition: background-color 0.15s ease;
      z-index: 100;
      background-color: rgba(156, 163, 175, 0.15);
    }
    
    .resizer.resizing {
      background-color: rgba(59, 130, 246, 0.3) !important;
    }
    
    .resizer-horizontal {
      width: 16px;
      cursor: ew-resize !important;
      min-width: 16px;
    }
    
    .resizer-vertical {
      height: 16px;
      cursor: ns-resize !important;
      min-height: 16px;
    }
    
    .resizer:hover {
      background-color: rgba(59, 130, 246, 0.15) !important;
    }
    
    .resizer:active {
      background-color: rgba(59, 130, 246, 0.25) !important;
    }
    
    .resizer-handle {
      background-color: rgba(156, 163, 175, 0.6);
      border-radius: 3px;
      transition: all 0.2s ease;
      pointer-events: none;
    }
    
    .resizer-horizontal .resizer-handle {
      width: 5px;
      height: 50px;
    }
    
    .resizer-vertical .resizer-handle {
      width: 50px;
      height: 5px;
    }
    
    .resizer:hover .resizer-handle {
      background-color: rgba(59, 130, 246, 0.9);
      box-shadow: 0 0 8px rgba(59, 130, 246, 0.4);
    }
    
    .resizer-horizontal:hover .resizer-handle {
      height: 70px;
      width: 6px;
    }
    
    .resizer-vertical:hover .resizer-handle {
      width: 70px;
      height: 6px;
    }
    
    .resizer:active .resizer-handle {
      background-color: rgb(59, 130, 246);
      box-shadow: 0 0 12px rgba(59, 130, 246, 0.6);
    }
    
    .resizer-horizontal:active .resizer-handle {
      height: 90px;
      width: 7px;
    }
    
    .resizer-vertical:active .resizer-handle {
      width: 90px;
      height: 7px;
    }
  `]
})
export class ResizablePanelsComponent implements AfterViewInit, OnDestroy {
  @Input() direction: 'row' | 'column' = 'column';
  @Input() initialPanel1Size: number = 400;
  @Input() initialPanel2Size: number = 300;
  @Input() minSize1: number = 200;
  @Input() minSize2: number = 150;
  @Input() storageKey?: string;
  
  @ViewChild('container') container!: ElementRef<HTMLDivElement>;
  @ViewChild('panel1') panel1Ref!: ElementRef<HTMLDivElement>;
  @ViewChild('panel2') panel2Ref!: ElementRef<HTMLDivElement>;
  @ViewChild('resizer') resizerRef!: ElementRef<HTMLDivElement>;
  
  public panel1Size: number = 400;
  public panel2Size: number = 300;
  public isResizing = false;
  
  private startPos = 0;
  private startPanel1Size = 0;
  private eventListeners: (() => void)[] = [];
  
  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}
  
  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      // Load saved sizes first
      const savedSizes = this.loadSizes();
      
      // Use saved sizes if available, otherwise use initial sizes
      if (savedSizes) {
        this.panel1Size = savedSizes.panel1Size;
      } else {
        this.panel1Size = this.initialPanel1Size;
      }
      
      console.log('ResizablePanels initialized:', {
        panel1Size: this.panel1Size,
        direction: this.direction,
        containerHeight: this.container?.nativeElement?.offsetHeight,
        containerWidth: this.container?.nativeElement?.offsetWidth
      });
    }
  }
  
  ngOnDestroy(): void {
    this.cleanup();
  }
  
  startResize(event: MouseEvent | TouchEvent): void {
    if (!isPlatformBrowser(this.platformId)) return;
    
    event.preventDefault();
    event.stopPropagation();
    
    console.log('Start resize called');
    
    this.isResizing = true;
    
    // Add cursor style to body
    if (typeof document !== 'undefined') {
      document.body.style.cursor = this.direction === 'row' ? 'ew-resize' : 'ns-resize';
      document.body.style.userSelect = 'none';
    }
    
    // Get initial position
    if (event instanceof MouseEvent) {
      this.startPos = this.direction === 'row' ? event.clientX : event.clientY;
    } else if (event instanceof TouchEvent && event.touches.length > 0) {
      this.startPos = this.direction === 'row' 
        ? event.touches[0].clientX 
        : event.touches[0].clientY;
    }
    
    this.startPanel1Size = this.panel1Size;
    
    console.log('Resize started:', {
      startPos: this.startPos,
      startPanel1Size: this.startPanel1Size,
      direction: this.direction
    });
    
    // Add global event listeners
    if (typeof document !== 'undefined') {
      const mouseMoveHandler = (e: MouseEvent) => this.onResize(e);
      const mouseUpHandler = () => this.stopResize();
      const touchMoveHandler = (e: TouchEvent) => this.onResize(e);
      const touchEndHandler = () => this.stopResize();
      
      document.addEventListener('mousemove', mouseMoveHandler);
      document.addEventListener('mouseup', mouseUpHandler);
      document.addEventListener('touchmove', touchMoveHandler, { passive: false });
      document.addEventListener('touchend', touchEndHandler);
      
      this.eventListeners.push(
        () => document.removeEventListener('mousemove', mouseMoveHandler),
        () => document.removeEventListener('mouseup', mouseUpHandler),
        () => document.removeEventListener('touchmove', touchMoveHandler),
        () => document.removeEventListener('touchend', touchEndHandler)
      );
    }
  }
  
  private onResize(event: MouseEvent | TouchEvent): void {
    if (!this.isResizing) return;
    
    event.preventDefault();
    
    let currentPos: number;
    if (event instanceof MouseEvent) {
      currentPos = this.direction === 'row' ? event.clientX : event.clientY;
    } else if (event instanceof TouchEvent && event.touches.length > 0) {
      currentPos = this.direction === 'row' 
        ? event.touches[0].clientX 
        : event.touches[0].clientY;
    } else {
      return;
    }
    
    const delta = currentPos - this.startPos;
    let newPanel1Size = this.startPanel1Size + delta;
    
    // Enforce minimum size for panel1
    newPanel1Size = Math.max(this.minSize1, newPanel1Size);
    
    // Get container size
    const containerSize = this.direction === 'row'
      ? this.container.nativeElement.offsetWidth
      : this.container.nativeElement.offsetHeight;
    
    // Calculate what panel2 size would be (container - panel1 - resizer)
    const resizerSize = 16; // Match the CSS width/height
    const calculatedPanel2Size = containerSize - newPanel1Size - resizerSize;
    
    // Only update if panel2 would also be above minimum
    if (calculatedPanel2Size >= this.minSize2) {
      this.panel1Size = Math.round(newPanel1Size);
    } else {
      // If panel2 would be too small, set panel1 to max possible size
      this.panel1Size = Math.round(containerSize - this.minSize2 - resizerSize);
    }
    
    console.log('Resizing:', {
      delta,
      newPanel1Size: this.panel1Size,
      containerSize,
      calculatedPanel2Size
    });
  }
  
  private stopResize(): void {
    this.isResizing = false;
    
    // Reset cursor style
    if (typeof document !== 'undefined') {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }
    
    this.saveSizes();
    this.cleanup();
  }
  
  private cleanup(): void {
    this.eventListeners.forEach(cleanup => cleanup());
    this.eventListeners = [];
  }
  
  private saveSizes(): void {
    if (this.storageKey && typeof localStorage !== 'undefined') {
      localStorage.setItem(this.storageKey, JSON.stringify({
        panel1Size: this.panel1Size,
        panel2Size: this.panel2Size
      }));
    }
  }
  
  private loadSizes(): { panel1Size: number } | null {
    if (this.storageKey && typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        try {
          const sizes = JSON.parse(saved);
          return {
            panel1Size: sizes.panel1Size || this.initialPanel1Size
          };
        } catch (e) {
          console.error('Failed to load panel sizes', e);
        }
      }
    }
    return null;
  }
}
