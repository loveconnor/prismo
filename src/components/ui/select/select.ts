import { Component, Input, Output, EventEmitter, forwardRef, ViewChild, ElementRef, AfterViewInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { OverlayModule, ConnectedPosition } from '@angular/cdk/overlay';
import { cn } from '../../../lib/utils';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

@Component({
  selector: 'app-select',
  standalone: true,
  imports: [CommonModule, OverlayModule],
  templateUrl: './select.html',
  styleUrl: './select.css',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SelectComponent),
      multi: true
    }
  ]
})
export class SelectComponent implements ControlValueAccessor, AfterViewInit, OnDestroy {
  @Input() options: SelectOption[] = [];
  @Input() placeholder = 'Select an option';
  @Input() disabled = false;
  @Input() className = '';
  @Input() contentClassName = '';
  @Input() optionClassName = '';
  @Input() size: 'sm' | 'default' = 'default';

  @Output() selectionChange = new EventEmitter<string>();

  @ViewChild('triggerRef', { static: false }) triggerRef!: ElementRef<HTMLButtonElement>;
  @ViewChild('contentRef', { static: false }) contentRef?: ElementRef<HTMLElement>;

  // Form control implementation
  private _value: string = '';
  private onChange = (value: string) => {};
  private onTouched = () => {};

  isOpen = false;
  selectedOption: SelectOption | null = null;
  triggerWidth = 0;

  get selectedValue(): string {
    return this._value;
  }

  get selectedLabel(): string {
    return this.selectedOption?.label || this.placeholder;
  }

  get triggerClasses(): string {
    return cn(
      'border-input data-[placeholder]:text-muted-foreground [&_svg:not([class*="text-"])]:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 dark:hover:bg-input/50 flex w-full items-center justify-between gap-2 rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50',
      this.size === 'default' ? 'h-9' : 'h-8',
      this.className
    );
  }

  get contentClasses(): string {
    return cn(
      'z-[70] max-h-[calc(100vh-4rem)] min-w-[12rem] overflow-y-auto rounded-lg border bg-popover p-1 text-popover-foreground shadow-lg outline outline-transparent focus:outline-hidden',
      'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
      this.contentClassName
    );
  }

  get optionClasses(): string {
    return cn(
      'relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
      this.optionClassName
    );
  }

  ngAfterViewInit(): void {
    this.updateSelectedOption();
    this.triggerWidth = this.triggerRef?.nativeElement?.offsetWidth ?? 0;
  }

  ngOnDestroy(): void {
    // Cleanup if needed
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
        this.focusNextOption();
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.focusPreviousOption();
        break;
      case 'Enter':
        event.preventDefault();
        this.selectFocusedOption();
        break;
    }
  }

  private updateSelectedOption(): void {
    this.selectedOption = this.options.find(option => option.value === this._value) || null;
  }

  private focusNextOption(): void {
    // Implementation for keyboard navigation
    const options = this.contentRef?.nativeElement?.querySelectorAll('[role="option"]');
    if (options && options.length > 0) {
      const currentIndex = Array.from(options).findIndex((el: any) => el === document.activeElement);
      const nextIndex = currentIndex < options.length - 1 ? currentIndex + 1 : 0;
      (options[nextIndex] as HTMLElement)?.focus();
    }
  }

  private focusPreviousOption(): void {
    const options = this.contentRef?.nativeElement?.querySelectorAll('[role="option"]');
    if (options && options.length > 0) {
      const currentIndex = Array.from(options).findIndex((el: any) => el === document.activeElement);
      const prevIndex = currentIndex > 0 ? currentIndex - 1 : options.length - 1;
      (options[prevIndex] as HTMLElement)?.focus();
    }
  }

  private selectFocusedOption(): void {
    const focusedOption = document.activeElement as HTMLElement;
    if (focusedOption && focusedOption.getAttribute('role') === 'option') {
      const value = focusedOption.getAttribute('data-value');
      if (value) {
        this.selectOption(value);
      }
    }
  }

  // Form control methods
  writeValue(value: string): void {
    this._value = value;
    this.updateSelectedOption();
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

  toggle(): void {
    if (this.disabled) return;
    this.isOpen ? this.close() : this.open();
  }

  open(): void {
    if (this.disabled) return;
    this.triggerWidth = this.triggerRef?.nativeElement?.offsetWidth ?? 0;
    this.isOpen = true;
    this.onTouched();
  }

  close(): void {
    this.isOpen = false;
  }

  selectOption(value: string): void {
    if (this.disabled) return;
    
    this._value = value;
    this.onChange(value);
    this.onTouched();
    this.selectionChange.emit(value);
    this.updateSelectedOption();
    this.close();
  }

  isSelected(value: string): boolean {
    return this._value === value;
  }

  onSelectionChange(value: string): void {
    this.selectOption(value);
  }

  get overlayPositions(): ConnectedPosition[] {
    return [
      {
        originX: 'start',
        originY: 'bottom',
        overlayX: 'start',
        overlayY: 'top'
      },
      {
        originX: 'start',
        originY: 'top',
        overlayX: 'start',
        overlayY: 'bottom'
      }
    ];
  }

  get overlayOffsetY(): number {
    return 4;
  }
}
