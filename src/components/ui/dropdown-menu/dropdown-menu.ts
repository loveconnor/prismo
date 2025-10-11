import { Component, Input, Output, EventEmitter, ViewChild, ElementRef, AfterViewInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OverlayModule } from '@angular/cdk/overlay';
import { cn } from '../../../lib/utils';

@Component({
  selector: 'app-dropdown-menu',
  standalone: true,
  imports: [CommonModule, OverlayModule],
  templateUrl: './dropdown-menu.html',
  styleUrl: './dropdown-menu.css'
})
export class DropdownMenuComponent implements AfterViewInit, OnDestroy {
  @Input() className = '';
  @Input() align: 'start' | 'center' | 'end' = 'start';
  @Input() side: 'top' | 'right' | 'bottom' | 'left' = 'bottom';
  @Input() sideOffset = 4;
  @Input() alignOffset = 0;
  @Input() disabled = false;

  @Output() openChange = new EventEmitter<boolean>();

  @ViewChild('contentRef', { static: false }) contentRef!: ElementRef;

  isOpen = false;

  ngAfterViewInit(): void {
    // Initialize dropdown functionality
  }

  ngOnDestroy(): void {
    // Cleanup if needed
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    if (this.isOpen && !this.contentRef?.nativeElement?.contains(event.target)) {
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
      'absolute top-full z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md',
      this.getAlignmentClass(),
      'data-[state=open]:animate-in data-[state=closed]:animate-out',
      'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
      'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
      this.getSlideInClass(),
      this.className
    );
  }

  private getAlignmentClass(): string {
    switch (this.align) {
      case 'start':
        return 'left-0';
      case 'center':
        return 'left-1/2 -translate-x-1/2';
      case 'end':
        return 'right-0';
      default:
        return 'left-0';
    }
  }

  private getSlideInClass(): string {
    switch (this.side) {
      case 'top':
        return 'data-[side=top]:slide-in-from-bottom-2';
      case 'right':
        return 'data-[side=right]:slide-in-from-left-2';
      case 'left':
        return 'data-[side=left]:slide-in-from-right-2';
      case 'bottom':
      default:
        return 'data-[side=bottom]:slide-in-from-top-2';
    }
  }

  onTriggerClick(event: Event): void {
    // Prevent event bubbling to avoid immediate close
    event.preventDefault();
    event.stopPropagation();
    
    this.toggle();
  }

  toggle(): void {
    if (this.disabled) return;
    this.isOpen ? this.close() : this.open();
  }

  open(): void {
    if (this.disabled) return;
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
}