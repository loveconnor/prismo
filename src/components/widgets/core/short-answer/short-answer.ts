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
  lucideSend
} from '@ng-icons/lucide';

// ==================== TYPES ====================

export type ValidationMode = 'exact' | 'contains' | 'similarity' | 'ai' | 'none';
export type ShortAnswerState = 'idle' | 'submitting' | 'submitted' | 'readOnly';

export interface ValidationRule {
  mode: ValidationMode;
  expected: string[];
  caseSensitive?: boolean;
  ignoreWhitespace?: boolean;
  similarityThreshold?: number; // 0-1 for similarity mode
}

export interface ShortAnswerUI {
  variant?: 'default' | 'compact';
  showCharCount?: boolean;
  autoResize?: boolean;
}

export interface ShortAnswerProps {
  // Core
  id: string;
  question: string;
  placeholder?: string;

  // Validation
  validation?: ValidationRule;
  maxLength?: number;
  minLength?: number;

  // UI
  ui?: ShortAnswerUI;

  // Feedback
  showFeedback?: boolean;
  correctFeedback?: string;
  incorrectFeedback?: string;

  // State
  value?: string;
  defaultValue?: string;

  // Accessibility
  a11yLabel?: string;

  // Events
  onChange?: (value: string) => void;
  onSubmit?: (value: string, isCorrect: boolean, feedback?: string) => void;
  onValidate?: (value: string) => { isCorrect: boolean; feedback?: string };
}

export interface ShortAnswerFeedback {
  isCorrect: boolean;
  message: string;
}

// ==================== COMPONENT ====================

@Component({
  selector: 'app-short-answer',
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
      lucideSend
    })
  ],
  templateUrl: './short-answer.html',
  styleUrls: ['./short-answer.css']
})
export class ShortAnswerComponent implements OnInit {
  // ==================== INPUTS ====================
  @Input() id!: string;
  @Input() question!: string;
  @Input() placeholder: string = 'Enter your answer...';
  @Input() validation?: ValidationRule;
  @Input() maxLength: number = 500;
  @Input() minLength: number = 1;
  @Input() ui?: ShortAnswerUI;
  @Input() showFeedback: boolean = true;
  @Input() correctFeedback: string = 'Correct!';
  @Input() incorrectFeedback: string = 'Incorrect. Try again.';
  @Input() value?: string;
  @Input() defaultValue: string = '';
  @Input() a11yLabel?: string;
  
  // Event callbacks
  @Input() onChange?: (value: string) => void;
  @Input() onSubmit?: (value: string, isCorrect: boolean, feedback?: string) => void;
  @Input() onValidate?: (value: string) => { isCorrect: boolean; feedback?: string };
  
  // ==================== OUTPUTS ====================
  @Output() valueChange = new EventEmitter<string>();
  @Output() submit = new EventEmitter<{ value: string; isCorrect: boolean; feedback?: string }>();
  @Output() validate = new EventEmitter<{ value: string; isCorrect: boolean; feedback?: string }>();
  
  // ==================== STATE ====================
  answer = signal<string>('');
  state = signal<ShortAnswerState>('idle');
  feedback = signal<ShortAnswerFeedback | null>(null);
  isValid = signal<boolean>(false);
  
  // ==================== COMPUTED ====================
  get charCount(): number {
    return this.answer().length;
  }
  
  get isTooShort(): boolean {
    return this.charCount < this.minLength;
  }
  
  get isAtLimit(): boolean {
    return this.charCount >= this.maxLength;
  }
  
  get variant(): 'default' | 'compact' {
    return this.ui?.variant || 'default';
  }
  
  get showCharCountUI(): boolean {
    return this.ui?.showCharCount ?? true;
  }
  
  get autoResize(): boolean {
    return this.ui?.autoResize ?? true;
  }
  
  // ==================== LIFECYCLE ====================
  
  ngOnInit(): void {
    // Initialize answer with value or defaultValue
    const initialValue = this.value !== undefined ? this.value : this.defaultValue;
    this.answer.set(initialValue);
  }
  
  // ==================== VALIDATION ====================
  
  private validateAnswer(input: string): { isCorrect: boolean; feedback?: string } {
    if (!this.validation) {
      return { isCorrect: true };
    }
    
    const validation = this.validation;
    const normalizedInput = validation.ignoreWhitespace
      ? input.trim().replace(/\s+/g, ' ')
      : input;
    
    const normalizedExpected = validation.expected.map(exp =>
      validation.ignoreWhitespace
        ? exp.trim().replace(/\s+/g, ' ')
        : exp
    );
    
    switch (validation.mode) {
      case 'exact':
        const exactMatch = validation.caseSensitive
          ? normalizedExpected.includes(normalizedInput)
          : normalizedExpected.some(exp =>
              exp.toLowerCase() === normalizedInput.toLowerCase()
            );
        return {
          isCorrect: exactMatch,
          feedback: exactMatch ? this.correctFeedback : this.incorrectFeedback
        };
      
      case 'contains':
        const containsMatch = normalizedExpected.some(exp => {
          const check = validation.caseSensitive
            ? normalizedInput.includes(exp)
            : normalizedInput.toLowerCase().includes(exp.toLowerCase());
          return check;
        });
        return {
          isCorrect: containsMatch,
          feedback: containsMatch ? this.correctFeedback : this.incorrectFeedback
        };
      
      case 'similarity':
        const similarities = normalizedExpected.map(exp =>
          this.calculateSimilarity(normalizedInput, exp)
        );
        const maxSimilarity = Math.max(...similarities);
        const threshold = validation.similarityThreshold || 0.8;
        
        return {
          isCorrect: maxSimilarity >= threshold,
          feedback: maxSimilarity >= threshold ? this.correctFeedback : this.incorrectFeedback
        };
      
      case 'ai':
        // Placeholder for AI validation - would call an API
        return { isCorrect: false, feedback: 'AI validation not implemented' };
      
      case 'none':
      default:
        return { isCorrect: true, feedback: this.correctFeedback };
    }
  }
  
  private calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const distance = this.levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }
  
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }
  
  // ==================== HANDLERS ====================
  
  handleInputChange(event: Event): void {
    const textarea = event.target as HTMLTextAreaElement;
    const newValue = textarea.value.slice(0, this.maxLength);
    this.answer.set(newValue);
    
    if (this.state() === 'submitted') {
      this.state.set('idle');
      this.feedback.set(null);
    }
    
    // Call onChange callback if provided
    if (this.onChange) {
      this.onChange(newValue);
    }
    
    // Emit event
    this.valueChange.emit(newValue);
  }
  
  handleKeyDown(event: KeyboardEvent): void {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault();
      this.handleSubmit();
    }
  }
  
  async handleSubmit(): Promise<void> {
    if (this.state() === 'submitting' || this.isTooShort) {
      return;
    }
    
    this.state.set('submitting');
    
    // Validate
    const validationResult = this.onValidate
      ? this.onValidate(this.answer())
      : this.validateAnswer(this.answer());
    
    this.feedback.set({
      isCorrect: validationResult.isCorrect,
      message: validationResult.feedback || (validationResult.isCorrect ? this.correctFeedback : this.incorrectFeedback)
    });
    
    this.isValid.set(validationResult.isCorrect);
    this.state.set('submitted');
    
    // Call onSubmit callback if provided
    if (this.onSubmit) {
      this.onSubmit(this.answer(), validationResult.isCorrect, validationResult.feedback);
    }
    
    // Emit event
    this.submit.emit({
      value: this.answer(),
      isCorrect: validationResult.isCorrect,
      feedback: validationResult.feedback
    });
  }
  
  // ==================== HELPERS ====================
  
  getContainerClasses(): string {
    const base = 'mx-auto w-full max-w-2xl rounded-2xl border border-[#1f2937] bg-[#0e1318] shadow-sm';
    
    if (this.variant === 'compact') {
      return `${base} p-4`;
    }
    
    return `${base} p-6`;
  }
  
  getTextareaClasses(): string {
    const base = 'w-full resize-none rounded-lg border bg-[#0b0f14] px-3 py-2 text-sm text-[#e5e7eb] placeholder-[#6b7280] focus:border-[#60a5fa] focus:outline-none focus:ring-1 focus:ring-[#60a5fa]';
    
    const stateClasses = [];
    
    if (this.autoResize) {
      stateClasses.push('min-h-[60px]');
    }
    
    if (this.state() === 'submitted' && this.feedback()?.isCorrect) {
      stateClasses.push('border-emerald-500');
    } else if (this.state() === 'submitted' && !this.feedback()?.isCorrect) {
      stateClasses.push('border-red-500');
    }
    
    stateClasses.push('disabled:cursor-not-allowed disabled:opacity-50');
    
    return [base, ...stateClasses].join(' ');
  }
  
  getButtonClasses(): string {
    const base = 'inline-flex items-center gap-2 rounded-lg px-6 py-2 text-sm font-medium transition-colors';
    
    if (this.isTooShort || this.state() === 'submitting') {
      return `${base} cursor-not-allowed bg-[#1f2937] text-[#6b7280]`;
    }
    
    return `${base} bg-[#3b82f6] text-white hover:bg-[#2563eb]`;
  }
  
  isButtonDisabled(): boolean {
    return this.isTooShort || this.state() === 'submitting';
  }
  
  isTextareaDisabled(): boolean {
    return this.state() === 'submitting' || this.state() === 'readOnly';
  }
}

