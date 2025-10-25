import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  Inject,
  PLATFORM_ID
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  lucideCircleCheck,
  lucideCircleX,
  lucideSend
} from '@ng-icons/lucide';
import { signal } from '@angular/core';
import { WidgetBaseComponent } from '../../base/widget-base';
import { ThemeService } from '../../../../services/theme.service';
import { FontService } from '../../../../services/font.service';

/* ==================== TYPES (top-level) ==================== */

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

export interface ShortAnswerFeedback {
  isCorrect: boolean;
  message: string;
}

/* ==================== COMPONENT ==================== */

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
export class ShortAnswerComponent extends WidgetBaseComponent implements OnInit {
  /* ========== Modern Inputs ========== */
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

  /* ========== Modern Outputs ========== */
  @Output() valueChange = new EventEmitter<string>();
  @Output() submit = new EventEmitter<{ value: string; isCorrect: boolean; feedback?: string }>();
  @Output() validate = new EventEmitter<{ value: string; isCorrect: boolean; feedback?: string }>();

  /* ========== Callback-style props (modern parity) ========== */
  @Input() onChange?: (value: string) => void;
  @Input() onSubmit?: (value: string, isCorrect: boolean, feedback?: string) => void;
  @Input() onValidate?: (value: string) => { isCorrect: boolean; feedback?: string };

  /* ========== Legacy (HEAD) Inputs — Back-compat ========== */
  @Input() expectedKeywords: string[] = [];
  @Input() similarityThreshold: number = 0.7;
  @Input() caseSensitive: boolean = false;
  @Input() showWordCount: boolean = true;
  @Input() showCharacterCount: boolean = false;
  @Input() allowRichText: boolean = false;

  /* ========== Legacy (HEAD) Outputs — Back-compat ========== */
  @Output() answerChanged = new EventEmitter<string>();
  @Output() answerSubmitted = new EventEmitter<string>();
  @Output() keywordsMatched = new EventEmitter<{ matched: string[]; missing: string[] }>();
  @Output() similarityCalculated = new EventEmitter<number>();

  /* ========== State ========== */
  answer = signal<string>('');
  state = signal<ShortAnswerState>('idle');
  feedback = signal<ShortAnswerFeedback | null>(null);
  isValid = signal<boolean>(false);

  /* ========== Computeds ========== */
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

  /* ========== Lifecycle ========== */
  constructor(
    themeService: ThemeService,
    fontService: FontService,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    super(themeService, fontService, platformId);
  }

  override ngOnInit(): void {
    super.ngOnInit();
    const initialValue = this.value !== undefined ? this.value : this.defaultValue;
    this.answer.set(initialValue);
  }

  /* ========== WidgetBase hooks ========== */
  protected override initializeWidgetData(): void {
    this.setDataValue('initialized_at', new Date());
  }

  protected override validateInput(): boolean {
    // For required scenarios, ensure minimum length
    return this.charCount >= this.minLength;
  }

  protected override processCompletion(): void {
    this.setDataValue('submitted_at', new Date());
    this.setDataValue('char_count', this.charCount);
  }

  /* ========== Validation ========== */

  private normalize(s: string, ignoreWhitespace?: boolean): string {
    return ignoreWhitespace ? s.trim().replace(/\s+/g, ' ') : s;
  }

  private validateAnswer(input: string): { isCorrect: boolean; feedback?: string } {
    // If modern validation is provided, respect it
    if (this.validation) {
      const val = this.validation;
      const normalizedInput = this.normalize(input, val.ignoreWhitespace);
      const normalizedExpected = val.expected.map(exp => this.normalize(exp, val.ignoreWhitespace));

      switch (val.mode) {
        case 'exact': {
          const match = val.caseSensitive
            ? normalizedExpected.includes(normalizedInput)
            : normalizedExpected.some(exp => exp.toLowerCase() === normalizedInput.toLowerCase());
          return { isCorrect: match, feedback: match ? this.correctFeedback : this.incorrectFeedback };
        }
        case 'contains': {
          const contains = normalizedExpected.some(exp => {
            return val.caseSensitive
              ? normalizedInput.includes(exp)
              : normalizedInput.toLowerCase().includes(exp.toLowerCase());
          });
          return { isCorrect: contains, feedback: contains ? this.correctFeedback : this.incorrectFeedback };
        }
        case 'similarity': {
          const sims = normalizedExpected.map(exp => this.calculateSimilarity(normalizedInput, exp));
          const maxSim = sims.length ? Math.max(...sims) : 0;
          const threshold = val.similarityThreshold ?? 0.8;
          // Legacy emit for similarity
          this.similarityCalculated.emit(maxSim);
          return { isCorrect: maxSim >= threshold, feedback: maxSim >= threshold ? this.correctFeedback : this.incorrectFeedback };
        }
        case 'ai':
          // Placeholder (no external calls here)
          return { isCorrect: false, feedback: 'AI validation not implemented' };
        case 'none':
        default:
          return { isCorrect: true, feedback: this.correctFeedback };
      }
    }

    // Fallback to legacy keyword/similarity checks if provided
    if (this.expectedKeywords.length > 0) {
      const text = this.caseSensitive ? input : input.toLowerCase();
      const expected = this.caseSensitive ? this.expectedKeywords : this.expectedKeywords.map(k => k.toLowerCase());

      const matched: string[] = [];
      const missing: string[] = [];
      expected.forEach(k => (text.includes(k) ? matched.push(k) : missing.push(k)));
      this.keywordsMatched.emit({ matched, missing });

      // If similarityThreshold is set, compute similarity against joined keywords as a hint
      if (this.similarityThreshold > 0) {
        const joined = expected.join(' ');
        const sim = this.calculateSimilarity(this.caseSensitive ? input : input.toLowerCase(), joined);
        this.similarityCalculated.emit(sim);
        return { isCorrect: sim >= this.similarityThreshold, feedback: sim >= this.similarityThreshold ? this.correctFeedback : this.incorrectFeedback };
      }

      // Otherwise treat presence of any keyword as correct
      const ok = matched.length > 0;
      return { isCorrect: ok, feedback: ok ? this.correctFeedback : this.incorrectFeedback };
    }

    // Default: accept anything
    return { isCorrect: true, feedback: this.correctFeedback };
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

    for (let i = 0; i <= str2.length; i++) matrix[i] = [i];
    for (let j = 0; j <= str1.length; j++) matrix[0][j] = j;

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

  /* ========== Handlers ========== */

  handleInputChange(event: Event): void {
    const textarea = event.target as HTMLTextAreaElement;
    const newValue = textarea.value.slice(0, this.maxLength);
    this.answer.set(newValue);

    if (this.state() === 'submitted') {
      this.state.set('idle');
      this.feedback.set(null);
    }

    // Modern events
    this.onChange?.(newValue);
    this.valueChange.emit(newValue);

    // Legacy event
    this.answerChanged.emit(newValue);
  }

  handleKeyDown(event: KeyboardEvent): void {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault();
      this.handleSubmit();
    }
  }

  async handleSubmit(): Promise<void> {
    if (this.state() === 'submitting' || this.isTooShort) return;

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

    // Modern emits
    this.onSubmit?.(this.answer(), validationResult.isCorrect, validationResult.feedback);
    this.submit.emit({
      value: this.answer(),
      isCorrect: validationResult.isCorrect,
      feedback: validationResult.feedback
    });
    this.validate.emit({
      value: this.answer(),
      isCorrect: validationResult.isCorrect,
      feedback: validationResult.feedback
    });

    // Legacy emit
    this.answerSubmitted.emit(this.answer());

    // Mark widget complete if correct (or always, depending on your flow)
    this.completeWidget();
  }

  /* ========== Styling helpers (template) ========== */

  getContainerClasses(): string {
    const base = 'mx-auto w-full max-w-2xl rounded-2xl border border-[#1f2937] bg-[#0e1318] shadow-sm';
    return this.variant === 'compact' ? `${base} p-4` : `${base} p-6`;
  }

  getTextareaClasses(): string {
    const base = 'w-full resize-none rounded-lg border bg-[#0b0f14] px-3 py-2 text-sm text-[#e5e7eb] placeholder-[#6b7280] focus:border-[#60a5fa] focus:outline-none focus:ring-1 focus:ring-[#60a5fa]';
    const stateClasses: string[] = [];

    if (this.autoResize) stateClasses.push('min-h-[60px]');

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
