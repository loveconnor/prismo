import { Component, Input, forwardRef, ElementRef, HostBinding } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { cn } from '../../../lib/utils';

// Input types
export type InputType = 'email' | 'number' | 'password' | 'search' | 'tel' | 'text' | 'url' | 'date' | 'datetime-local' | 'month' | 'time' | 'week';

@Component({
  selector: 'app-input',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './input.html',
  styleUrl: './input.css',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InputComponent),
      multi: true
    }
  ]
})
export class InputComponent implements ControlValueAccessor {
  @Input() type: InputType = 'text';
  @Input() placeholder = '';
  @Input() disabled = false;
  @Input() required = false;
  @Input() readonly = false;
  @Input() className = '';
  @Input() id?: string;
  @Input() name?: string;
  @Input() min?: string | number;
  @Input() max?: string | number;
  @Input() step?: string | number;
  @Input() pattern?: string;
  @Input() autocomplete?: string;

  // Form control implementation
  private _value: any = '';
  private onChange = (value: any) => {};
  private onTouched = () => {};

  // State for focus and validation
  isFocused = false;
  isInvalid = false;

  @HostBinding('attr.data-slot')
  get dataSlot() {
    return 'input';
  }

  get currentValue(): any {
    return this._value;
  }

  get inputClasses(): string {
    const baseClasses = [
      // Base styles
      'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none',
      // Typography
      'placeholder:text-muted-foreground text-foreground',
      // File input styles
      'file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground',
      // Selection styles
      'selection:bg-primary selection:text-primary-foreground',
      // Disabled state
      'disabled:cursor-not-allowed disabled:opacity-50',
      // Focus styles
      'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
      // Invalid state
      'aria-invalid:ring-destructive/20 aria-invalid:border-destructive'
    ];

    // Date input specific styles
    const dateClasses = this.isDateType() ? [
      '[&::-webkit-datetime-edit-fields-wrapper]:p-0',
      '[&::-webkit-date-and-time-value]:min-h-[1.5em]',
      '[&::-webkit-datetime-edit]:inline-flex',
      '[&::-webkit-datetime-edit]:p-0',
      '[&::-webkit-datetime-edit-year-field]:p-0',
      '[&::-webkit-datetime-edit-month-field]:p-0',
      '[&::-webkit-datetime-edit-day-field]:p-0',
      '[&::-webkit-datetime-edit-hour-field]:p-0',
      '[&::-webkit-datetime-edit-minute-field]:p-0',
      '[&::-webkit-datetime-edit-second-field]:p-0',
      '[&::-webkit-datetime-edit-millisecond-field]:p-0',
      '[&::-webkit-datetime-edit-meridiem-field]:p-0'
    ] : [];

    return cn(
      baseClasses,
      dateClasses,
      this.className
    );
  }

  private isDateType(): boolean {
    const dateTypes = ['date', 'datetime-local', 'month', 'time', 'week'];
    return dateTypes.includes(this.type);
  }

  // Form control methods
  writeValue(value: any): void {
    this._value = value || '';
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

  onFocus(): void {
    this.isFocused = true;
  }

  onBlur(): void {
    this.isFocused = false;
    this.onTouched();
  }

  onInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this._value = target.value;
    this.onChange(this._value);
  }

  onKeyDown(event: KeyboardEvent): void {
    // Handle any special key behaviors if needed
  }
}
