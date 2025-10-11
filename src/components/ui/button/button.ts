import { Component, Input, forwardRef, ElementRef, HostBinding, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { cn } from '../../../lib/utils';

// Button variant types
export type ButtonVariant = 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
export type ButtonSize = 'default' | 'sm' | 'lg' | 'icon' | 'icon-sm' | 'icon-lg';
export type ButtonColor = 'dark/zinc' | 'light' | 'dark/white' | 'dark' | 'white' | 'zinc' | 'indigo' | 'cyan' | 'red' | 'orange' | 'amber' | 'yellow' | 'lime' | 'green' | 'emerald' | 'teal' | 'sky' | 'blue' | 'violet' | 'purple' | 'fuchsia' | 'pink' | 'rose';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './button.html',
  styleUrl: './button.css',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ButtonComponent),
      multi: true
    }
  ]
})
export class ButtonComponent implements ControlValueAccessor {
  @Input() variant: ButtonVariant = 'default';
  @Input() size: ButtonSize = 'default';
  @Input() disabled = false;
  @Input() href?: string;
  @Input() routerLink?: string | string[];
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Input() className = '';

  // Form control implementation
  private _value: any = null;
  private onChange = (value: any) => {};
  private onTouched = () => {};

  // State for hover and press animations
  isHovered = false;
  isPressed = false;

  get buttonClasses() {
    return this.getButtonClasses();
  }

  // Make the host not generate a box so the inner element sizes as the flex/grid child
  @HostBinding('class') hostClasses = 'contents';

  @HostBinding('attr.data-hover')
  get dataHover() {
    return this.isHovered ? 'true' : null;
  }

  @HostBinding('attr.data-active')
  get dataActive() {
    return this.isPressed ? 'true' : null;
  }

  getButtonClasses(): string {
    // Use the new Tailwind v4 theme system with CSS variables
    const baseClasses = [
      'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium',
      'transition-all disabled:pointer-events-none disabled:opacity-50',
      '[&_svg]:pointer-events-none [&_svg:not([class*=\'size-\'])]:size-4 shrink-0 [&_svg]:shrink-0',
      'outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
      'aria-invalid:ring-destructive/20 aria-invalid:border-destructive'
    ];

    // Size classes from shadcn/ui
    const sizeClasses = this.getSizeClasses();

    // Style variants
    const styleClasses = this.getStyleClasses();

    const hoverClasses = this.disabled ? [] : [
      'hover:scale-[1.02] active:scale-[0.98]'
    ];

    return cn(
      baseClasses,
      sizeClasses,
      styleClasses,
      hoverClasses,
      this.className
    );
  }

  private getSizeClasses(): string[] {
    const sizeMap: Record<ButtonSize, string[]> = {
      'default': ['h-9 px-4 py-2 has-[>svg]:px-3'],
      'sm': ['h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5'],
      'lg': ['h-10 rounded-md px-6 has-[>svg]:px-4'],
      'icon': ['size-9'],
      'icon-sm': ['size-8'],
      'icon-lg': ['size-10']
    };
    return sizeMap[this.size] || sizeMap['default'];
  }

  private getStyleClasses(): string[] {
    // Use the new Tailwind v4 theme system with CSS variables
    switch (this.variant) {
      case 'outline':
        return [
          'border border-border bg-background text-foreground shadow-sm',
          'hover:bg-accent hover:text-accent-foreground'
        ];

      case 'secondary':
        return [
          'bg-secondary text-secondary-foreground',
          'hover:bg-secondary/80'
        ];

      case 'ghost':
        return [
          'text-foreground',
          'hover:bg-accent hover:text-accent-foreground'
        ];

      case 'link':
        return [
          'text-primary underline-offset-4',
          'hover:underline'
        ];

      case 'destructive':
        return [
          'bg-destructive text-destructive-foreground',
          'hover:bg-destructive/90',
          'focus-visible:ring-destructive/20'
        ];

      case 'default':
      default:
        return [
          'bg-primary text-primary-foreground',
          'hover:bg-primary/90'
        ];
    }
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

  onMouseEnter(): void {
    if (!this.disabled) {
      this.isHovered = true;
    }
  }

  onMouseLeave(): void {
    this.isHovered = false;
  }

  onMouseDown(): void {
    if (!this.disabled) {
      this.isPressed = true;
    }
  }

  onMouseUp(): void {
    this.isPressed = false;
  }

  onClick(event: Event): void {
    if (this.disabled) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    this.onTouched();
    this.onChange(this._value);
  }
}
