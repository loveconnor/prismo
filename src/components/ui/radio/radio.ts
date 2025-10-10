import { Component, Input, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { cn } from '../../../lib/utils';

@Component({
  selector: 'app-radio',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './radio.html',
  styleUrl: './radio.css',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => RadioComponent),
      multi: true
    }
  ]
})
export class RadioComponent implements ControlValueAccessor {
  @Input() value: string = '';
  @Input() name: string = '';
  @Input() disabled = false;
  @Input() className = '';

  // Form control implementation
  private _checked = false;
  private onChange = (value: string) => {};
  private onTouched = () => {};

  get checked(): boolean {
    return this._checked;
  }

  get radioClasses(): string {
    return cn(
      'aspect-square h-4 w-4 rounded-full border border-primary text-primary ring-offset-background focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
      this.className
    );
  }

  // Form control methods
  writeValue(value: string): void {
    this._checked = value === this.value;
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  onSelectionChange(): void {
    if (this.disabled) return;
    
    this._checked = true;
    this.onChange(this.value);
    this.onTouched();
  }
}
