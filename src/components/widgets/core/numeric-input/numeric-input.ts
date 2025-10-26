import { 
  Component, 
  Input, 
  Output, 
  EventEmitter, 
  OnInit,
  Inject,
  PLATFORM_ID,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { 
  lucideCircleCheck, 
  lucideCircleX,
  lucideCalculator,
  lucideTarget
} from '@ng-icons/lucide';
import { WidgetBaseComponent } from '../../base/widget-base';
import { ThemeService } from '../../../../services/theme.service';
import { FontService } from '../../../../services/font.service';

/** ==================== MODERN TYPES ==================== */
export type NumericValidation = 'exact' | 'range' | 'tolerance' | 'multiple' | 'expression';
export type NumericInputState = 'idle' | 'validating' | 'completed' | 'readOnly';

export interface NumericConstraint {
  type: NumericValidation;
  value?: number;       // target value for exact/tolerance/multiple
  min?: number;         // for range
  max?: number;         // for range
  tolerance?: number;   // for tolerance
  expression?: string;  // JS expression with 'x' as user value, returns boolean
  unit?: string;        // optional display unit
  precision?: number;   // decimal places to show (UI hint only)
}

export interface NumericInputUI {
  variant?: 'default' | 'compact';
  showCalculator?: boolean;
  emphasizeCorrect?: boolean;
}

export interface NumericInputProps {
  // Core
  id: string;
  question: string;
  placeholder?: string;

  // Validation
  correctAnswer?: number;
  constraints?: NumericConstraint;
  showUnit?: boolean;
  unit?: string;

  // UI
  ui?: NumericInputUI;

  // Configuration
  allowDecimals?: boolean;
  allowNegative?: boolean;
  maxLength?: number;

  // Feedback
  showFeedback?: boolean;
  correctFeedback?: string;
  incorrectFeedback?: string;
  hint?: string;

  // Accessibility
  a11yLabel?: string;

  // Events
  onChange?: (value: string, numericValue: number | null) => void;
  onSubmit?: (value: string, numericValue: number | null, isCorrect: boolean, feedback?: string) => void;
}

/** ==================== LEGACY (HEAD) INPUTS/OUTPUTS (BACK-COMPAT) ==================== */
@Component({
  selector: 'app-numeric-input',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NgIconComponent
  ],
  providers: [
    provideIcons({
      lucideCircleCheck,
      lucideCircleX,
      lucideCalculator,
      lucideTarget
    })
  ],
  templateUrl: './numeric-input.html',
  styleUrls: ['./numeric-input.css']
})
export class NumericInputComponent extends WidgetBaseComponent implements OnInit {
  /** ==================== MODERN INPUTS ==================== */
  @Input() id!: string;
  @Input() question!: string;
  @Input() placeholder: string = 'Enter a number...';
  @Input() correctAnswer?: number;
  @Input() constraints?: NumericConstraint;
  @Input() showUnit: boolean = false;
  @Input() unit?: string;
  @Input() ui?: NumericInputUI;
  @Input() allowDecimals: boolean = true;
  @Input() allowNegative: boolean = true;
  @Input() maxLength: number = 20;
  @Input() showFeedback: boolean = true;
  @Input() correctFeedback: string = 'Correct!';
  @Input() incorrectFeedback: string = 'Incorrect. Try again.';
  @Input() hint?: string;
  @Input() a11yLabel?: string;

  /** Modern callback-style inputs */
  @Input() onChange?: (value: string, numericValue: number | null) => void;
  @Input() onSubmit?: (value: string, numericValue: number | null, isCorrect: boolean, feedback?: string) => void;

  /** ==================== LEGACY INPUTS (from HEAD) ==================== */
  @Input() expectedValue: number = 0;
  @Input() tolerance: number = 0.01;
  @Input() units: string = '';
  @Input() showUnits: boolean = true;
  @Input() allowScientificNotation: boolean = true;
  @Input() minValue?: number;
  @Input() maxValue?: number;
  @Input() decimalPlaces: number = 2;

  /** ==================== MODERN OUTPUTS ==================== */
  @Output() valueChange = new EventEmitter<{ value: string; numericValue: number | null }>();
  @Output() submit = new EventEmitter<{ value: string; numericValue: number | null; isCorrect: boolean; feedback?: string }>();

  /** ==================== LEGACY OUTPUTS (bridged) ==================== */
  @Output() valueChanged = new EventEmitter<number>();
  @Output() valueSubmitted = new EventEmitter<{ value: number; correct: boolean; difference: number }>();
  @Output() validationError = new EventEmitter<string>();

  /** ==================== STATE ==================== */
  value = signal<string>('');
  componentState = signal<NumericInputState>('idle');
  feedback = signal<{ isCorrect: boolean; message: string } | null>(null);
  submitted = signal<boolean>(false);

  /** ==================== UI COMPUTED ==================== */
  get variant(): 'default' | 'compact' {
    return this.ui?.variant || 'default';
  }
  get showCalculator(): boolean {
    return this.ui?.showCalculator ?? false;
  }
  get emphasizeCorrect(): boolean {
    return this.ui?.emphasizeCorrect ?? true;
  }

  /** ==================== LIFECYCLE ==================== */
  constructor(
    protected override fontService: FontService,
    themeService: ThemeService,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    super(themeService, fontService, platformId);
  }

  override ngOnInit(): void {
    super.ngOnInit();

    // If modern constraints not supplied, derive from legacy props
    if (!this.constraints) {
      // Prefer range if min/max available, else tolerance around expectedValue, else exact
      if (this.minValue !== undefined && this.maxValue !== undefined) {
        this.constraints = {
          type: 'range',
          min: this.minValue,
          max: this.maxValue,
          unit: this.units || this.unit,
          precision: this.decimalPlaces
        };
      } else if (!Number.isNaN(this.expectedValue) && this.expectedValue !== undefined) {
        this.constraints = {
          type: this.tolerance ? 'tolerance' : 'exact',
          value: this.expectedValue,
          tolerance: this.tolerance ?? 0,
          unit: this.units || this.unit,
          precision: this.decimalPlaces
        };
      }
    }

    // If unit still empty, adopt legacy showUnits/units
    if (this.unit === undefined && this.units) this.unit = this.units;
    if (this.showUnit === false && this.showUnits === true) this.showUnit = true;
  }

  /** ==================== VALIDATION ==================== */
  private parseNumericValue(input: string): number | null {
    // Allow scientific notation if enabled
    const trimmed = input.trim();
    if (!trimmed) return null;

    // Quick pattern check to avoid dangerous evals
    const sciPattern = /^[\+\-]?\d*\.?\d+(e[\+\-]?\d+)?$/i;
    const simplePattern = /^[\+\-]?\d*\.?\d+$/;

    if (this.allowScientificNotation) {
      if (!(sciPattern.test(trimmed))) return null;
    } else {
      if (!(simplePattern.test(trimmed))) return null;
    }

    const n = Number(trimmed);
    return Number.isFinite(n) ? n : null;
  }

  private withinPrecision(n: number, precision?: number): number {
    if (precision === undefined) return n;
    const p = Math.max(0, precision | 0);
    return Number(n.toFixed(p));
  }

  private validateNumericInput(input: string): { isCorrect: boolean; feedback?: string; diff?: number } {
    const numericValue = this.parseNumericValue(input);
    if (numericValue === null) {
      return { isCorrect: false, feedback: 'Please enter a valid number.' };
    }

    const c = this.constraints;
    if (!c) {
      // Simple exact vs provided correctAnswer fallback
      if (this.correctAnswer !== undefined) {
        const isEq = numericValue === this.correctAnswer;
        return { isCorrect: isEq, feedback: isEq ? this.correctFeedback : this.incorrectFeedback, diff: numericValue - this.correctAnswer };
      }
      return { isCorrect: true };
    }

    switch (c.type) {
      case 'exact': {
        if (c.value === undefined) return { isCorrect: true };
        const isEq = numericValue === c.value;
        return { isCorrect: isEq, feedback: isEq ? this.correctFeedback : this.incorrectFeedback, diff: numericValue - c.value };
      }

      case 'range': {
        if (c.min === undefined || c.max === undefined) return { isCorrect: true };
        const ok = numericValue >= c.min && numericValue <= c.max;
        return {
          isCorrect: ok,
          feedback: ok ? this.correctFeedback : `Value must be between ${c.min} and ${c.max}${c.unit ? ' ' + c.unit : ''}.`,
          diff: ok ? 0 : (numericValue < c.min ? numericValue - c.min : numericValue - c.max)
        };
      }

      case 'tolerance': {
        const tol = c.tolerance ?? 0;
        const target = c.value ?? 0;
        const diff = Math.abs(numericValue - target);
        const ok = diff <= tol;
        return {
          isCorrect: ok,
          feedback: ok ? this.correctFeedback : `Value must be within ${tol} of ${target}${c.unit ? ' ' + c.unit : ''}.`,
          diff: numericValue - target
        };
      }

      case 'multiple': {
        if (c.value === undefined || c.value === 0) return { isCorrect: true };
        const ok = numericValue % c.value === 0;
        return {
          isCorrect: ok,
          feedback: ok ? this.correctFeedback : `Value must be a multiple of ${c.value}${c.unit ? ' ' + c.unit : ''}.`,
          diff: numericValue % c.value
        };
      }

      case 'expression': {
        try {
          if (c.expression) {
            const expr = c.expression.replace(/x/g, numericValue.toString());
            const result = Function(`"use strict"; return (${expr})`)();
            const ok = !!result;
            return {
              isCorrect: ok,
              feedback: ok ? this.correctFeedback : this.incorrectFeedback,
              diff: 0
            };
          }
        } catch (_e) {
          return { isCorrect: false, feedback: 'Invalid expression.' };
        }
        return { isCorrect: false, feedback: 'Expression evaluation failed.' };
      }

      default:
        return { isCorrect: true };
    }
  }

  /** ==================== HANDLERS ==================== */
  handleInputChange(event: Event): void {
    if (this.submitted()) return;

    const target = event.target as HTMLInputElement;
    let newValue = target.value;

    // Hard limit on length
    if (newValue.length > this.maxLength) {
      newValue = newValue.slice(0, this.maxLength);
    }

    // Character validation (digits, optional ., -, and scientific notation)
    const allowedChars = (ch: string, idx: number) => {
      if (ch >= '0' && ch <= '9') return true;
      if (this.allowDecimals && ch === '.') return true;
      if (this.allowNegative && ch === '-' && idx === 0) return true;
      if (this.allowScientificNotation && (ch === 'e' || ch === 'E')) return true;
      if (this.allowScientificNotation && (ch === '+' || ch === '-') && idx > 0 && (newValue[idx - 1] === 'e' || newValue[idx - 1] === 'E')) return true;
      return false;
    };
    if (!newValue.split('').every((c, i) => allowedChars(c, i))) return;

    this.value.set(newValue);
    this.componentState.set('idle');

    const numericValue = this.parseNumericValue(newValue);

    // Modern callbacks/events
    this.onChange?.(newValue, numericValue);
    this.valueChange.emit({ value: newValue, numericValue });

    // Legacy bridge
    if (numericValue !== null) this.valueChanged.emit(this.withinPrecision(numericValue, this.constraints?.precision ?? this.decimalPlaces));
  }

  handleSubmit(): void {
    if (this.submitted() || !this.value().trim()) return;

    this.componentState.set('validating');

    // Simulate short validation delay
    setTimeout(() => {
      const validation = this.validateNumericInput(this.value());
      const numericValue = this.parseNumericValue(this.value());

      this.feedback.set({
        isCorrect: validation.isCorrect,
        message: validation.feedback || (validation.isCorrect ? this.correctFeedback : this.incorrectFeedback)
      });
      this.submitted.set(true);
      this.componentState.set('completed');

      // Modern callback/event
      this.onSubmit?.(this.value(), numericValue, validation.isCorrect, validation.feedback);
      this.submit.emit({
        value: this.value(),
        numericValue,
        isCorrect: validation.isCorrect,
        feedback: validation.feedback
      });

      // Legacy bridge events
      if (numericValue === null) {
        this.validationError.emit('Invalid number.');
      } else {
        const diff = validation.diff ?? 0;
        this.valueSubmitted.emit({
          value: this.withinPrecision(numericValue, this.constraints?.precision ?? this.decimalPlaces),
          correct: validation.isCorrect,
          difference: diff
        });
      }

      // Mark completion if correct
      if (validation.isCorrect) {
        this.processCompletion();
      }
    }, 250);
  }

  handleKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.handleSubmit();
    }
  }

  /** ==================== TEMPLATE HELPERS ==================== */
  isValidInput(): boolean {
    const val = this.value();
    return val === '' || this.parseNumericValue(val) !== null;
  }

  getContainerClasses(): string {
    const base = 'mx-auto w-full max-w-2xl rounded-2xl border border-[#1f2937] bg-[#0e1318] shadow-sm';
    return this.variant === 'compact' ? `${base} p-4` : `${base} p-6`;
  }

  getInputClasses(): string {
    const classes = [
      'w-full rounded-lg border bg-[#0b0f14] px-4 py-3 text-left text-lg font-mono text-[#e5e7eb] placeholder-[#6b7280] transition-colors focus:border-[#bc78f9] focus:outline-none focus:ring-1 focus:ring-[#bc78f9]'
    ];

    const submittedState = this.submitted();
    const feedbackState = this.feedback();

    if (submittedState && feedbackState?.isCorrect && this.emphasizeCorrect) {
      classes.push('border-emerald-500');
    } else if (submittedState && feedbackState && !feedbackState.isCorrect) {
      classes.push('border-red-500');
    } else if (!this.isValidInput()) {
      classes.push('border-red-500');
    }

    classes.push('disabled:cursor-not-allowed disabled:opacity-50');
    return classes.join(' ');
  }

  getConstraintDisplay(): string | null {
    const c = this.constraints;
    if (!c) return null;

    switch (c.type) {
      case 'range':
        if (c.min !== undefined && c.max !== undefined) {
          return `Range: ${c.min} to ${c.max}${c.unit ? ' ' + c.unit : ''}`;
        }
        break;
      case 'tolerance':
        if (c.value !== undefined && c.tolerance !== undefined) {
          return `Target: ${c.value} ± ${c.tolerance}${c.unit ? ' ' + c.unit : ''}`;
        }
        break;
      case 'multiple':
        if (c.value !== undefined) {
          return `Multiple of: ${c.value}${c.unit ? ' ' + c.unit : ''}`;
        }
        break;
      case 'exact':
        if (c.value !== undefined) {
          return `Exact: ${c.value}${c.unit ? ' ' + c.unit : ''}`;
        }
        break;
    }
    return null;
  }

  getExpectedDisplay(): string | null {
    const c = this.constraints;
    if (!c) return null;

    if (c.value !== undefined) {
      let display = c.value.toString();
      if (c.unit) display += ` ${c.unit}`;
      return display;
    }
    if (c.min !== undefined && c.max !== undefined) {
      let display = `${c.min}-${c.max}`;
      if (c.unit) display += ` ${c.unit}`;
      return display;
    }
    return null;
  }

  /** ==================== WIDGET BASE IMPLEMENTATIONS ==================== */
  protected override initializeWidgetData(): void {
    // no-op
  }

  protected override validateInput(): boolean {
    // Always allow; per-keystroke validation handled above
    return true;
  }

  protected override processCompletion(): void {
    this.updateState({ is_completed: true });
    this.completion.emit({
      widget_id: this._state.id,
      event_type: 'completion',
      data: { value: this.value() },
      timestamp: new Date()
    });
  }
}
