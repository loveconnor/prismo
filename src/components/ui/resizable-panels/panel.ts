import { Component, Input, ElementRef, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-resizable-panel',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="resizable-panel" 
         [class]="className" 
         [style.flex-basis.%]="flexBasis"
         [style.width.%]="isHorizontal ? flexBasis : null"
         [style.height.%]="!isHorizontal ? flexBasis : null">
      <ng-content></ng-content>
    </div>
  `,
  styles: [`
    .resizable-panel {
      overflow: auto;
      position: relative;
      flex-shrink: 0;
      flex-grow: 0;
    }
    .min-w-0 {
      min-width: 0;
    }
    .min-h-0 {
      min-height: 0;
    }
  `]
})
export class ResizablePanelComponent implements AfterViewInit {
  @Input() defaultSize: number = 50;
  @Input() minSize: number = 10;
  @Input() maxSize: number = 90;
  @Input() className: string = '';

  flexBasis: number = 50;
  isHorizontal: boolean = false;

  constructor(
    private elementRef: ElementRef,
    private cdr: ChangeDetectorRef
  ) {}

  ngAfterViewInit(): void {
    setTimeout(() => {
      const parent = this.elementRef.nativeElement.parentElement;
      this.isHorizontal = parent?.classList.contains('horizontal');
      this.flexBasis = this.defaultSize;
      
      console.log('Panel initialized:', {
        isHorizontal: this.isHorizontal,
        flexBasis: this.flexBasis,
        parent: parent?.className
      });
      
      this.cdr.detectChanges();
    }, 0);
  }

  updateSize(size: number): void {
    this.flexBasis = size;
    this.cdr.detectChanges();
    
    console.log('Panel size updated:', {
      newSize: size,
      isHorizontal: this.isHorizontal
    });
  }

  getElement(): HTMLElement {
    return this.elementRef.nativeElement.querySelector('.resizable-panel');
  }
}
