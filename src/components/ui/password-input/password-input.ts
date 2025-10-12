import { Component, Input, forwardRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NG_VALUE_ACCESSOR, ControlValueAccessor, FormsModule } from '@angular/forms';
import { provideIcons, NgIconComponent } from '@ng-icons/core';
import { lucideEye, lucideEyeOff } from '@ng-icons/lucide';
import { cn } from '../../../lib/utils';

@Component({
  selector: 'app-password-input',
  standalone: true,
  imports: [CommonModule, FormsModule, NgIconComponent],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => PasswordInputComponent),
      multi: true,
    },
    provideIcons({ lucideEye, lucideEyeOff })
  ],
  template: `
    <div class="relative">
      <input
        [type]="showPassword() ? 'text' : 'password'"
        [id]="id"
        [name]="name"
        [placeholder]="placeholder"
        [disabled]="disabled"
        [value]="value"
        (input)="onInput($event)"
        (blur)="onTouched()"
        [class]="inputClasses"
        [attr.aria-invalid]="ariaInvalid"
        [attr.aria-describedby]="ariaDescribedby"
      />
      <button
        type="button"
        (click)="togglePassword()"
        class="absolute inset-y-0 right-0 flex items-center pr-3 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
        [attr.aria-label]="showPassword() ? 'Hide password' : 'Show password'"
      >
        <ng-icon [name]="showPassword() ? 'lucideEyeOff' : 'lucideEye'" class="h-4 w-4"></ng-icon>
      </button>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class PasswordInputComponent implements ControlValueAccessor {
  @Input() id = '';
  @Input() name = '';
  @Input() placeholder = '';
  @Input() disabled = false;
  @Input() className = '';
  @Input() ariaInvalid?: boolean;
  @Input() ariaDescribedby?: string;

  value = '';
  showPassword = signal(false);
  
  onChange: (value: string) => void = () => {};
  onTouched: () => void = () => {};

  get inputClasses(): string {
    return cn(
      'block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 pr-10 text-sm text-zinc-900',
      'placeholder:text-zinc-400',
      'focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/25',
      'disabled:bg-zinc-50 disabled:text-zinc-500',
      'dark:border-zinc-700 dark:bg-zinc-950 dark:text-white dark:placeholder:text-zinc-500',
      'dark:focus:border-blue-500 dark:disabled:bg-zinc-900 dark:disabled:text-zinc-400',
      this.className
    );
  }

  togglePassword(): void {
    this.showPassword.set(!this.showPassword());
  }

  onInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.value = target.value;
    this.onChange(this.value);
  }

  writeValue(value: string): void {
    this.value = value || '';
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
}

