import { Component, Input, Output, EventEmitter, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
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
export class DropdownMenuComponent implements AfterViewInit {
  @Input() trigger?: string;
  @Input() className = '';
  @Input() align: 'start' | 'center' | 'end' = 'start';
  @Input() side: 'top' | 'right' | 'bottom' | 'left' = 'bottom';

  @Output() openChange = new EventEmitter<boolean>();

  @ViewChild('triggerRef', { static: false }) triggerRef!: ElementRef;
  @ViewChild('contentRef', { static: false }) contentRef!: ElementRef;

  isOpen = false;

  ngAfterViewInit(): void {
    // Initialize dropdown functionality
  }

  get triggerClasses(): string {
    return cn(
      'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
      'disabled:pointer-events-none disabled:opacity-50',
      this.className
    );
  }

  get contentClasses(): string {
    return cn(
      'z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md',
      this.className
    );
  }

  toggle(): void {
    this.isOpen = !this.isOpen;
    this.openChange.emit(this.isOpen);
  }

  close(): void {
    this.isOpen = false;
    this.openChange.emit(false);
  }
}
