import { Component, Input, forwardRef, HostBinding } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { cn } from '../../../lib/utils';

@Component({
  selector: 'app-switch',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './switch.html',
  styleUrl: './switch.css',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SwitchComponent),
      multi: true
    }
  ]
})
export class SwitchComponent implements ControlValueAccessor {
  @Input() disabled = false;
  @Input() className = '';
  @Input() size: 'default' | 'sm' | 'lg' = 'default';

  // Form control implementation
  private _value = false;
  private onChange = (value: boolean) => {};
  private onTouched = () => {};

  get checked(): boolean {
    return this._value;
  }

  get switchClasses(): string {
    return cn(
      'peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
      'disabled:cursor-not-allowed disabled:opacity-50',
      this.checked ? 'bg-primary' : 'bg-input',
      this.className
    );
  }

  get thumbClasses(): string {
    return cn(
      'pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform',
      this.checked ? 'translate-x-4' : 'translate-x-0'
    );
  }

  // Form control methods
  writeValue(value: boolean): void {
    this._value = value;
  }

  registerOnChange(fn: (value: boolean) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  toggle(): void {
    if (this.disabled) return;
    
    this._value = !this._value;
    this.onChange(this._value);
    this.onTouched();
  }
}
