import { 
  Component, 
  Input, 
  Output, 
  EventEmitter, 
  OnInit,
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

// ==================== TYPES ====================

export type NumericValidation = 'exact' | 'range' | 'tolerance' | 'multiple' | 'expression';
export type NumericInputState = 'idle' | 'validating' | 'completed' | 'readOnly';

export interface NumericConstraint {
  type: NumericValidation;
  value?: number;
  min?: number;
  max?: number;
  tolerance?: number;
  expression?: string;
  unit?: string;
  precision?: number;
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

// ==================== COMPONENT ====================

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
export class NumericInputComponent implements OnInit {
  // ==================== INPUTS ====================
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
  
  // Event callbacks
  @Input() onChange?: (value: string, numericValue: number | null) => void;
  @Input() onSubmit?: (value: string, numericValue: number | null, isCorrect: boolean, feedback?: string) => void;
  
  // ==================== OUTPUTS ====================
  @Output() valueChange = new EventEmitter<{ value: string; numericValue: number | null }>();
  @Output() submit = new EventEmitter<{ value: string; numericValue: number | null; isCorrect: boolean; feedback?: string }>();
  
  // ==================== STATE ====================
  value = signal<string>('');
  state = signal<NumericInputState>('idle');
  feedback = signal<{ isCorrect: boolean; message: string } | null>(null);
  submitted = signal<boolean>(false);
  
  // ==================== COMPUTED ====================
  get variant(): 'default' | 'compact' {
    return this.ui?.variant || 'default';
  }
  
  get showCalculator(): boolean {
    return this.ui?.showCalculator ?? false;
  }
  
  get emphasizeCorrect(): boolean {
    return this.ui?.emphasizeCorrect ?? true;
  }
  
  // ==================== LIFECYCLE ====================
  
  ngOnInit(): void {
    // Initialization if needed
  }
  
  // ==================== VALIDATION ====================
  
  parseNumericValue(input: string): number | null {
    const parsed = parseFloat(input);
    return isNaN(parsed) ? null : parsed;
  }
  
  validateNumericInput(input: string): { isCorrect: boolean; feedback?: string } {
    const numericValue = this.parseNumericValue(input);
    if (numericValue === null) {
      return { isCorrect: false, feedback: 'Please enter a valid number.' };
    }
    
    if (!this.constraints) {
      // Simple exact match
      if (this.correctAnswer !== undefined) {
        return {
          isCorrect: numericValue === this.correctAnswer,
          feedback: numericValue === this.correctAnswer ? this.correctFeedback : this.incorrectFeedback
        };
      }
      return { isCorrect: true };
    }
    
    switch (this.constraints.type) {
      case 'exact':
        const exactMatch = this.constraints.value !== undefined && numericValue === this.constraints.value;
        return {
          isCorrect: exactMatch,
          feedback: exactMatch ? this.correctFeedback : this.incorrectFeedback
        };
      
      case 'range':
        const inRange = this.constraints.min !== undefined && this.constraints.max !== undefined &&
                        numericValue >= this.constraints.min && numericValue <= this.constraints.max;
        return {
          isCorrect: inRange,
          feedback: inRange ? this.correctFeedback : `Value must be between ${this.constraints.min} and ${this.constraints.max}.`
        };
      
      case 'tolerance':
        const tolerance = this.constraints.tolerance || 0;
        const target = this.constraints.value || 0;
        const withinTolerance = Math.abs(numericValue - target) <= tolerance;
        return {
          isCorrect: withinTolerance,
          feedback: withinTolerance ? this.correctFeedback : `Value must be within ${tolerance} of ${target}.`
        };
      
      case 'multiple':
        const isMultiple = this.constraints.value !== undefined && numericValue % this.constraints.value === 0;
        return {
          isCorrect: isMultiple,
          feedback: isMultiple ? this.correctFeedback : `Value must be a multiple of ${this.constraints.value}.`
        };
      
      case 'expression':
        // Simple expression evaluation (basic arithmetic)
        try {
          if (this.constraints.expression) {
            // Replace x with the input value
            const expression = this.constraints.expression.replace(/x/g, numericValue.toString());
            const result = Function(`"use strict"; return (${expression})`)();
            return {
              isCorrect: result === true || result === 1,
              feedback: result ? this.correctFeedback : this.incorrectFeedback
            };
          }
        } catch (e) {
          return { isCorrect: false, feedback: 'Invalid expression.' };
        }
        return { isCorrect: false, feedback: 'Expression evaluation failed.' };
      
      default:
        return { isCorrect: true };
    }
  }
  
  // ==================== HANDLERS ====================
  
  handleInputChange(event: Event): void {
    if (this.submitted()) return;
    
    const target = event.target as HTMLInputElement;
    let newValue = target.value;
    
    // Limit length
    if (newValue.length > this.maxLength) {
      newValue = newValue.slice(0, this.maxLength);
    }
    
    // Validate characters
    const isValidChar = (char: string) => {
      if (char >= '0' && char <= '9') return true;
      if (this.allowDecimals && char === '.') return true;
      if (this.allowNegative && char === '-') return true;
      return false;
    };
    
    if (!newValue.split('').every(isValidChar)) {
      return;
    }
    
    this.value.set(newValue);
    this.state.set('idle');
    
    const numericValue = this.parseNumericValue(newValue);
    
    if (this.onChange) {
      this.onChange(newValue, numericValue);
    }
    
    this.valueChange.emit({ value: newValue, numericValue });
  }
  
  handleSubmit(): void {
    if (this.submitted() || !this.value().trim()) return;
    
    this.state.set('validating');
    
    // Simulate validation delay
    setTimeout(() => {
      const validation = this.validateNumericInput(this.value());
      this.feedback.set({
        isCorrect: validation.isCorrect,
        message: validation.feedback || (validation.isCorrect ? this.correctFeedback : this.incorrectFeedback)
      });
      this.submitted.set(true);
      this.state.set('completed');
      
      const numericValue = this.parseNumericValue(this.value());
      
      if (this.onSubmit) {
        this.onSubmit(this.value(), numericValue, validation.isCorrect, validation.feedback);
      }
      
      this.submit.emit({
        value: this.value(),
        numericValue,
        isCorrect: validation.isCorrect,
        feedback: validation.feedback
      });
    }, 300);
  }
  
  handleKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.handleSubmit();
    }
  }
  
  // ==================== HELPERS ====================
  
  isValidInput(): boolean {
    const val = this.value();
    return val === '' || this.parseNumericValue(val) !== null;
  }
  
  getContainerClasses(): string {
    const base = 'mx-auto w-full max-w-2xl rounded-2xl border border-[#1f2937] bg-[#0e1318] shadow-sm';
    
    if (this.variant === 'compact') {
      return `${base} p-4`;
    }
    
    return `${base} p-6`;
  }
  
  getInputClasses(): string {
    const classes = [
      'w-full rounded-lg border bg-[#0b0f14] px-4 py-3 text-left text-lg font-mono text-[#e5e7eb] placeholder-[#6b7280] transition-colors focus:border-[#60a5fa] focus:outline-none focus:ring-1 focus:ring-[#60a5fa]'
    ];
    
    const submittedState = this.submitted();
    const feedbackState = this.feedback();
    
    if (submittedState && feedbackState?.isCorrect && this.emphasizeCorrect) {
      classes.push('border-emerald-500');
    } else if (submittedState && !feedbackState?.isCorrect) {
      classes.push('border-red-500');
    } else if (!this.isValidInput()) {
      classes.push('border-red-500');
    }
    
    classes.push('disabled:cursor-not-allowed disabled:opacity-50');
    
    return classes.join(' ');
  }
  
  getConstraintDisplay(): string | null {
    if (!this.constraints) return null;
    
    switch (this.constraints.type) {
      case 'range':
        if (this.constraints.min !== undefined && this.constraints.max !== undefined) {
          return `Range: ${this.constraints.min} to ${this.constraints.max}`;
        }
        break;
      case 'tolerance':
        if (this.constraints.value !== undefined && this.constraints.tolerance !== undefined) {
          return `Target: ${this.constraints.value} ± ${this.constraints.tolerance}`;
        }
        break;
      case 'multiple':
        if (this.constraints.value !== undefined) {
          return `Multiple of: ${this.constraints.value}`;
        }
        break;
    }
    
    return null;
  }
  
  getExpectedDisplay(): string | null {
    if (!this.constraints) return null;
    
    if (this.constraints.value !== undefined) {
      let display = this.constraints.value.toString();
      if (this.constraints.unit) {
        display += ` ${this.constraints.unit}`;
      }
      return display;
    }
    
    if (this.constraints.min !== undefined && this.constraints.max !== undefined) {
      let display = `${this.constraints.min}-${this.constraints.max}`;
      if (this.constraints.unit) {
        display += ` ${this.constraints.unit}`;
      }
      return display;
    }
    
    return null;
  }
}

