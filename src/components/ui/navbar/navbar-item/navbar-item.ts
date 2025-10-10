import { Component, Input, Output, EventEmitter, forwardRef, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { cn } from '../../../../lib/utils';
import { gsap } from 'gsap';

@Component({
  selector: 'app-navbar-item',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './navbar-item.html',
  styleUrl: './navbar-item.css',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => NavbarItemComponent),
      multi: true
    }
  ]
})
export class NavbarItemComponent implements ControlValueAccessor, AfterViewInit {
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

  get itemClasses(): string {
    return cn(
      // Base
      'relative flex min-w-0 items-center gap-3 rounded-lg p-2 text-left text-base/6 font-medium text-foreground sm:text-sm/5',
      // Leading icon/icon-only
      '*:data-[slot=icon]:size-6 *:data-[slot=icon]:shrink-0 *:data-[slot=icon]:fill-muted-foreground sm:*:data-[slot=icon]:size-5',
      // Trailing icon (down chevron or similar)
      '*:not-nth-2:last:data-[slot=icon]:ml-auto *:not-nth-2:last:data-[slot=icon]:size-5 sm:*:not-nth-2:last:data-[slot=icon]:size-4',
      // Avatar
      '*:data-[slot=avatar]:-m-0.5 *:data-[slot=avatar]:size-7 *:data-[slot=avatar]:[--avatar-radius:var(--radius-md)] sm:*:data-[slot=avatar]:size-6',
      // Hover
      'data-hover:bg-accent data-hover:text-accent-foreground data-hover:*:data-[slot=icon]:fill-foreground',
      // Active
      'data-active:bg-accent data-active:text-accent-foreground data-active:*:data-[slot=icon]:fill-foreground',
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
      scaleX: 0,
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
