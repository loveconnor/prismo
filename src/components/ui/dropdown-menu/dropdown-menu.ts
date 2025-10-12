import { Component, Input, Output, EventEmitter, ViewChild, ElementRef, AfterViewInit, OnDestroy, HostListener, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OverlayModule, CdkOverlayOrigin, ConnectedPosition } from '@angular/cdk/overlay';
import { cn } from '../../../lib/utils';

@Component({
  selector: 'app-dropdown-menu',
  standalone: true,
  imports: [CommonModule, OverlayModule],
  templateUrl: './dropdown-menu.html',
  styleUrl: './dropdown-menu.css'
})
export class DropdownMenuComponent implements AfterViewInit, OnDestroy, OnChanges {
  @Input() className = '';
  @Input() align: 'start' | 'center' | 'end' = 'start';
  @Input() side: 'top' | 'right' | 'bottom' | 'left' = 'bottom';
  @Input() sideOffset = 4;
  @Input() alignOffset = 0;
  @Input() disabled = false;

  @Output() openChange = new EventEmitter<boolean>();

  @ViewChild('contentRef', { static: false }) contentRef?: ElementRef<HTMLElement>;
  @ViewChild('triggerElement', { read: ElementRef }) triggerElement?: ElementRef<HTMLElement>;
  @ViewChild(CdkOverlayOrigin, { static: false }) overlayOrigin?: CdkOverlayOrigin;

  isOpen = false;
  private positions: ConnectedPosition[] = [];

  ngAfterViewInit(): void {
    // Initialize dropdown functionality
  }

  ngOnDestroy(): void {
    // Cleanup if needed
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['align'] || changes['side'] || changes['alignOffset'] || changes['sideOffset']) {
      this.positions = this.computePositions();
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    if (!this.isOpen) {
      return;
    }

    const target = event.target as HTMLElement | null;
    const content = this.contentRef?.nativeElement;
    const trigger = this.triggerElement?.nativeElement ?? this.overlayOrigin?.elementRef.nativeElement;

    if (target && (content?.contains(target) || trigger?.contains(target))) {
      return;
    }

    this.close();
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    if (this.isOpen) {
      this.close();
    }
  }

  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if (!this.isOpen) {
      if (event.key === 'Enter' || event.key === ' ' || event.key === 'ArrowDown') {
        event.preventDefault();
        this.open();
      }
      return;
    }

    switch (event.key) {
      case 'Escape':
        event.preventDefault();
        this.close();
        break;
      case 'ArrowDown':
        event.preventDefault();
        this.focusNextItem();
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.focusPreviousItem();
        break;
    }
  }

  private focusNextItem(): void {
    const items = this.contentRef?.nativeElement?.querySelectorAll('[role="menuitem"]');
    if (items && items.length > 0) {
      const currentIndex = Array.from(items).findIndex((el: any) => el === document.activeElement);
      const nextIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
      (items[nextIndex] as HTMLElement)?.focus();
    }
  }

  private focusPreviousItem(): void {
    const items = this.contentRef?.nativeElement?.querySelectorAll('[role="menuitem"]');
    if (items && items.length > 0) {
      const currentIndex = Array.from(items).findIndex((el: any) => el === document.activeElement);
      const prevIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
      (items[prevIndex] as HTMLElement)?.focus();
    }
  }

  get contentClasses(): string {
    return cn(
      'z-[60] isolate w-max max-h-[calc(100vh-4rem)] overflow-y-auto rounded-2xl bg-popover text-popover-foreground shadow-[0_18px_45px_-20px_rgba(15,23,42,0.2)] backdrop-blur-sm',
      'border border-border',
      'transition data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
      this.className
    );
  }

  get overlayPositions(): ConnectedPosition[] {
    if (!this.positions.length) {
      this.positions = this.computePositions();
    }
    return this.positions;
  }

  get overlayOffsetX(): number {
    if (this.side === 'left') {
      return -this.sideOffset;
    }
    if (this.side === 'right') {
      return this.sideOffset;
    }

    switch (this.align) {
      case 'start':
        return -this.alignOffset;
      case 'end':
        return this.alignOffset;
      default:
        return 0;
    }
  }

  get overlayOffsetY(): number {
    if (this.side === 'top') {
      return -this.sideOffset;
    }
    if (this.side === 'bottom') {
      return this.sideOffset;
    }

    switch (this.align) {
      case 'start':
        return -this.alignOffset;
      case 'end':
        return this.alignOffset;
      default:
        return 0;
    }
  }

  private computePositions(): ConnectedPosition[] {
    const positions: ConnectedPosition[] = [];
    const primary = this.resolvePosition(this.side, this.align);
    positions.push(primary);

    const fallbacks: Array<{ side: 'top' | 'right' | 'bottom' | 'left'; align: 'start' | 'center' | 'end' }> = [
      { side: 'bottom', align: this.align },
      { side: 'top', align: this.align },
      { side: 'right', align: 'start' },
      { side: 'left', align: 'start' },
      { side: 'right', align: 'end' },
      { side: 'left', align: 'end' }
    ];

    for (const fallback of fallbacks) {
      const position = this.resolvePosition(fallback.side, fallback.align);
      if (!this.positionExists(positions, position)) {
        positions.push(position);
      }
    }

    return positions;
  }

  private positionExists(list: ConnectedPosition[], candidate: ConnectedPosition): boolean {
    return list.some(
      (pos) =>
        pos.originX === candidate.originX &&
        pos.originY === candidate.originY &&
        pos.overlayX === candidate.overlayX &&
        pos.overlayY === candidate.overlayY
    );
  }

  private resolvePosition(side: 'top' | 'right' | 'bottom' | 'left', align: 'start' | 'center' | 'end'): ConnectedPosition {
    switch (side) {
      case 'top':
        return {
          originX: this.mapAlignToX(align),
          originY: 'top',
          overlayX: this.mapAlignToX(align),
          overlayY: 'bottom'
        };
      case 'right':
        return {
          originX: 'end',
          originY: this.mapAlignToY(align),
          overlayX: 'start',
          overlayY: this.mapAlignToY(align)
        };
      case 'left':
        return {
          originX: 'start',
          originY: this.mapAlignToY(align),
          overlayX: 'end',
          overlayY: this.mapAlignToY(align)
        };
      case 'bottom':
      default:
        return {
          originX: this.mapAlignToX(align),
          originY: 'bottom',
          overlayX: this.mapAlignToX(align),
          overlayY: 'top'
        };
    }
  }

  private mapAlignToX(align: 'start' | 'center' | 'end'): 'start' | 'center' | 'end' {
    return align;
  }

  private mapAlignToY(align: 'start' | 'center' | 'end'): 'top' | 'center' | 'bottom' {
    switch (align) {
      case 'start':
        return 'top';
      case 'end':
        return 'bottom';
      default:
        return 'center';
    }
  }

  onTriggerClick(event: Event): void {
    event.stopPropagation();
    if (event.cancelable) {
      event.preventDefault();
    }

    this.toggle();
  }

  toggle(): void {
    if (this.disabled) return;
    this.isOpen ? this.close() : this.open();
  }

  open(): void {
    if (this.disabled) return;
    this.positions = this.computePositions();
    this.isOpen = true;
    this.openChange.emit(true);
  }

  close(): void {
    this.isOpen = false;
    this.openChange.emit(false);
  }

  onItemClick(): void {
    this.close();
  }

  onMenuClick(event: Event): void {
    const target = event.target as HTMLElement | null;
    if (!target) {
      return;
    }

    const menuItem = target.closest('[role="menuitem"]');
    const dismissFalse = target.closest('[data-dropdown-dismiss="false"]');

    if (!menuItem || dismissFalse) {
      return;
    }

    this.close();
  }
}
