import { Component, Input, Output, EventEmitter, forwardRef, AfterViewInit, ViewChild, ElementRef, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { cn } from '../../../../lib/utils';
import { gsap } from 'gsap';

@Component({
  selector: 'app-sidebar-item',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sidebar-item.html',
  styleUrl: './sidebar-item.css',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SidebarItemComponent),
      multi: true
    }
  ]
})
export class SidebarItemComponent implements ControlValueAccessor, AfterViewInit, OnInit, OnDestroy {
  @Input() current = false;
  @Input() href?: string;
  @Input() className = '';
  @Input() disabled = false;

  @Output() click = new EventEmitter<Event>();

  @ViewChild('currentIndicator', { static: false }) currentIndicator!: ElementRef;

  // Form control implementation
  private _value: any = null;
  private onChange = (value: any) => {};
  private onTouched = () => {};

  // Theme tracking
  isDark = true;
  private themeObserver?: MutationObserver;

  ngOnInit(): void {
    if (typeof document !== 'undefined') {
      this.updateTheme();
      this.setupThemeObserver();
    }
  }

  ngOnDestroy(): void {
    if (this.themeObserver) {
      this.themeObserver.disconnect();
    }
  }

  private updateTheme(): void {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    this.isDark = root.classList.contains('dark') && !root.classList.contains('theme-light');
  }

  private setupThemeObserver(): void {
    if (typeof document === 'undefined') return;
    
    this.themeObserver = new MutationObserver((mutations) => {
      if (mutations.some(m => m.attributeName === 'class')) {
        this.updateTheme();
      }
    });
    
    this.themeObserver.observe(document.documentElement, { 
      attributes: true, 
      attributeFilter: ['class'] 
    });
  }

  get itemClasses(): string {
    return cn(
      // Base
      'flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-left text-base/6 font-medium sm:py-2 sm:text-sm/5',
      // Theme-aware text color
      this.isDark ? 'text-[#a9b1bb]' : 'text-zinc-700',
      // Leading icon/icon-only
      '*:data-[slot=icon]:size-6 *:data-[slot=icon]:shrink-0 sm:*:data-[slot=icon]:size-5',
      this.isDark ? '*:data-[slot=icon]:text-[#a9b1bb]' : '*:data-[slot=icon]:text-zinc-500',
      // Trailing icon
      '*:last:data-[slot=icon]:ml-auto *:last:data-[slot=icon]:size-5 sm:*:last:data-[slot=icon]:size-4',
      // Avatar
      '*:data-[slot=avatar]:-m-0.5 *:data-[slot=avatar]:size-7 sm:*:data-[slot=avatar]:size-6',
      // Hover states
      this.isDark
        ? 'data-hover:bg-white/[0.04] data-hover:text-[#e5e7eb] data-hover:*:data-[slot=icon]:text-[#e5e7eb]'
        : 'data-hover:bg-zinc-950/5 data-hover:text-zinc-900 data-hover:*:data-[slot=icon]:text-zinc-900',
      // Active states
      this.isDark
        ? 'data-active:bg-white/[0.06] data-active:text-[#e5e7eb] data-active:*:data-[slot=icon]:text-[#e5e7eb]'
        : 'data-active:bg-zinc-950/5 data-active:text-zinc-900 data-active:*:data-[slot=icon]:text-zinc-900',
      // Current state
      'data-current:bg-[rgba(96,165,250,0.12)]',
      this.isDark
        ? 'data-current:text-[#e5e7eb] data-current:*:data-[slot=icon]:text-[#e5e7eb]'
        : 'data-current:text-zinc-950 data-current:*:data-[slot=icon]:text-zinc-950',
      // Disabled
      this.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
      this.className
    );
  }

  get wrapperClasses(): string {
    return cn('relative', this.className);
  }

  // Form control methods
  writeValue(value: any): void {
    this._value = value;
  }

  registerOnChange(fn: (value: any) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  ngAfterViewInit(): void {
    if (this.current && typeof window !== 'undefined') {
      setTimeout(() => {
        this.animateCurrentIndicator();
      }, 50);
    }
  }

  private animateCurrentIndicator(): void {
    if (!this.currentIndicator || typeof window === 'undefined') return;

    gsap.from(this.currentIndicator.nativeElement, {
      scaleY: 0,
      duration: 0.3,
      ease: "power2.out",
      transformOrigin: "center"
    });
  }

  onItemClick(event: Event): void {
    if (this.disabled) return;
    
    this.onChange(this._value);
    this.onTouched();
    this.click.emit(event);
  }
}
