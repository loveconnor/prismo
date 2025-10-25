import { 
  Component, 
  Input, 
  Output, 
  EventEmitter, 
  OnInit,
  OnDestroy,
  Inject,
  PLATFORM_ID,
  signal,
  effect
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { WidgetBaseComponent } from '../../base/widget-base';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { 
  lucideCircleCheck,
  lucideCircleX,
  lucideCircleHelp
} from '@ng-icons/lucide';
import { cn } from '../../../../lib/utils';
import { ThemeService } from '../../../../services/theme.service';
import { FontService } from '../../../../services/font.service';

/** ==================== LEGACY (HEAD) TYPES ==================== */
export interface MultipleChoiceOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

/** ==================== MODERN TYPES ==================== */
export type SelectionMode = 'single' | 'multiple';
export type ChoiceStatus = 'idle' | 'selected' | 'correct' | 'incorrect' | 'readOnly';

export interface ChoiceOption {
  id: string;
  label: string;     // shown to user
  value: string;     // internal value (usually same as id)
  rationale?: string;
  isCorrect?: boolean;
}

export interface MultipleChoiceUI {
  variant?: 'default' | 'compact' | 'assessment';
  showCheckboxes?: boolean;
  emphasizeCorrect?: boolean;
}

export interface MultipleChoiceChangePayload {
  value: string[];
  isValid: boolean;
}

export interface MultipleChoiceSubmitPayload {
  value: string[];
  correct: boolean;
}

/** ==================== COMPONENT ==================== */
@Component({
  selector: 'app-multiple-choice',
  standalone: true,
  imports: [
    CommonModule,
    NgIconComponent
  ],
  providers: [
    provideIcons({
      lucideCircleCheck,
      lucideCircleX,
      lucideCircleHelp
    })
  ],
  templateUrl: './multiple-choice.html',
  styleUrls: ['./multiple-choice.css']
})
export class MultipleChoiceComponent extends WidgetBaseComponent implements OnInit, OnDestroy {
  /** ==================== ABSTRACT METHOD IMPLEMENTATIONS ==================== */
  protected initializeWidgetData(): void {
    // Initialized in ngOnInit after inputs are set
  }

  protected validateInput(): boolean {
    return this.required ? this.selectedValues().length > 0 : true;
  }

  protected processCompletion(): void {
    this.updateState({ is_completed: true });
    this.completion.emit({
      widget_id: this._state.id,
      event_type: 'completion',
      data: { 
        selectedValues: this.selectedValues(),
        correct: this.isCorrect()
      },
      timestamp: new Date()
    });
  }

  /** ==================== MODERN INPUTS ==================== */
  @Input() id!: string;
  @Input() question!: string;
  /** Modern options (preferred). If empty but legacyOptions provided, we map them. */
  @Input() options: ChoiceOption[] = [];
  @Input() selectionMode: SelectionMode = 'single';
  @Input() required: boolean = false;
  @Input() shuffleOptions: boolean = false;
  @Input() showRationale: boolean = false;
  @Input() allowDeselect: boolean = true;
  /** Controlled value; when provided we mirror it. */
  @Input() value?: string[];
  /** Uncontrolled default. */
  @Input() defaultValue: string[] = [];
  @Input() ui: MultipleChoiceUI = {};
  /** If provided, overrides any per-option isCorrect flags for grading. */
  @Input() correctAnswers: string[] = [];
  @Input() a11yLabel?: string;

  /** ==================== LEGACY (HEAD) INPUTS (back-compat) ==================== */
  /** Legacy single/multi config */
  @Input() allowMultiple: boolean = false;
  /** Legacy options list; used only if modern `options` is empty */
  @Input() legacyOptions: MultipleChoiceOption[] = [];
  /** Legacy correct answer ids; used if `correctAnswers` empty and legacy provided */
  @Input() legacyCorrectAnswers: string[] = [];
  /** Legacy UI flags */
  @Input() showFeedback: boolean = true;
  @Input() showCorrectAnswer: boolean = false;
  @Input() maxAttempts: number = 3;
  @Input() showAttemptCount: boolean = true;

  /** ==================== MODERN OUTPUTS ==================== */
  @Output() valueChange = new EventEmitter<MultipleChoiceChangePayload>();
  @Output() choiceSubmit = new EventEmitter<MultipleChoiceSubmitPayload>();

  /** ==================== LEGACY (HEAD) OUTPUTS (back-compat) ==================== */
  @Output() answerSelected = new EventEmitter<string[]>();
  @Output() answerSubmitted = new EventEmitter<{ selected: string[]; correct: boolean }>();
  @Output() feedbackRequested = new EventEmitter<string[]>();
  @Output() maxAttemptsReached = new EventEmitter<void>();

  /** ==================== STATE ==================== */
  selectedValues = signal<string[]>([]);
  submitted = signal<boolean>(false);
  attempts = signal<number>(0);
  readOnly = signal<boolean>(false);
  shuffled = signal<ChoiceOption[]>([]);
  isValid = signal<boolean>(true);

  /** ==================== COMPUTED ==================== */
  get variant() { return this.ui.variant ?? 'default'; }
  get showCheckboxes() { return this.ui.showCheckboxes ?? false; }
  get emphasizeCorrect() { return this.ui.emphasizeCorrect ?? true; }

  /** ==================== CONSTRUCTOR ==================== */
  constructor(
    themeService: ThemeService,
    fontService: FontService,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    super(themeService, fontService, platformId);

    // Mirror external "value" into internal state
    effect(() => {
      if (this.value !== undefined) {
        this.selectedValues.set(this.value);
        this.emitChange();
      }
    });

    // Shuffle when options change
    effect(() => {
      const opts = this.options && this.options.length ? this.options : this.mapLegacyOptions();
      const arr = this.shuffleOptions ? [...opts].sort(() => Math.random() - 0.5) : [...opts];
      this.shuffled.set(arr);
    });
  }

  /** ==================== LIFECYCLE ==================== */
  override ngOnInit() {
    super.ngOnInit();

    // Back-compat: map legacy if modern not provided
    if (!this.options?.length && this.legacyOptions?.length) {
      this.options = this.mapLegacyOptions();
    }

    // Back-compat: selection mode from legacy allowMultiple if not explicitly set
    if (this.selectionMode === 'single' && this.allowMultiple) {
      this.selectionMode = 'multiple';
    }

    // Back-compat: correct answers
    if ((!this.correctAnswers || this.correctAnswers.length === 0) && this.legacyCorrectAnswers?.length) {
      this.correctAnswers = [...this.legacyCorrectAnswers];
    } else if ((!this.correctAnswers || this.correctAnswers.length === 0) && this.options?.length) {
      // If still empty, derive from options.isCorrect
      this.correctAnswers = this.options.filter(o => o.isCorrect).map(o => o.value);
    }

    // Initial value
    const initialValue = this.value ?? this.defaultValue ?? [];
    this.selectedValues.set(initialValue);
    this.updateValidity();

    // Initial shuffle snapshot
    const arr = this.shuffleOptions ? [...this.options].sort(() => Math.random() - 0.5) : [...this.options];
    this.shuffled.set(arr);
  }

  override ngOnDestroy() {
    super.ngOnDestroy();
  }

  /** ==================== HANDLERS ==================== */
  handleOptionSelect(optionValue: string) {
    if (this.submitted() || this.readOnly()) return;

    let newSelected: string[];

    if (this.selectionMode === 'single') {
      newSelected = this.selectedValues().includes(optionValue) && this.allowDeselect
        ? []
        : [optionValue];
    } else {
      newSelected = this.selectedValues().includes(optionValue)
        ? this.selectedValues().filter(v => v !== optionValue)
        : [...this.selectedValues(), optionValue];
    }

    this.selectedValues.set(newSelected);
    this.updateValidity();

    // Modern change event
    this.emitChange();

    // Legacy "selected" bridge
    this.answerSelected.emit(newSelected);
  }

  handleSubmit() {
    if (this.submitted() || this.readOnly()) return;

    // Count attempt
    this.attempts.update(n => n + 1);
    this.submitted.set(true);

    const correct = this.isCorrect();

    // Modern submit event
    this.choiceSubmit.emit({
      value: this.selectedValues(),
      correct
    });

    // Legacy submit bridge
    this.answerSubmitted.emit({ selected: this.selectedValues(), correct });

    if (correct) {
      // mark completion when correct
      this.processCompletion();
    } else {
      // If user wants feedback, expose hook
      if (this.showFeedback) {
        this.feedbackRequested.emit(this.selectedValues());
      }
      // lock if reached max attempts
      if (this.attempts() >= this.maxAttempts) {
        this.readOnly.set(true);
        this.maxAttemptsReached.emit();
      } else {
        // allow another try
        this.submitted.set(false);
      }
    }
  }

  handleResetAttempts() {
    // helper for host app; not wired to UI by default
    this.attempts.set(0);
    this.submitted.set(false);
    this.readOnly.set(false);
  }

  /** ==================== HELPERS ==================== */
  private mapLegacyOptions(): ChoiceOption[] {
    return (this.legacyOptions || []).map(o => ({
      id: o.id,
      label: o.text,
      value: o.id,
      isCorrect: o.isCorrect
    }));
  }

  private emitChange() {
    const val = this.selectedValues();
    const isValid = this.required ? val.length > 0 : true;

    // Modern event
    this.valueChange.emit({ value: val, isValid });

    // Legacy already emitted in handleOptionSelect via answerSelected
  }

  private updateValidity() {
    const valid = this.required ? this.selectedValues().length > 0 : true;
    this.isValid.set(valid);
  }

  isCorrect(): boolean {
    // Prefer explicit correctAnswers if given
    const answers = this.correctAnswers?.length
      ? this.correctAnswers
      : this.options.filter(o => o.isCorrect).map(o => o.value);

    // If still none, treat any answer as correct (ungraded)
    if (!answers || answers.length === 0) return true;

    const selected = this.selectedValues();

    if (this.selectionMode === 'single') {
      return selected.length === 1 && answers.includes(selected[0]);
    } else {
      return selected.length === answers.length &&
        selected.every(v => answers.includes(v)) &&
        answers.every(v => selected.includes(v));
    }
  }

  getOptionStatus(option: ChoiceOption): ChoiceStatus {
    if (this.readOnly()) return 'readOnly';

    const isSelected = this.selectedValues().includes(option.value);

    if (this.submitted()) {
      const answers = this.correctAnswers?.length
        ? this.correctAnswers
        : this.options.filter(o => o.isCorrect).map(o => o.value);

      const isOptionCorrect = (answers?.length ? answers.includes(option.value) : !!option.isCorrect);
      if (isOptionCorrect) return 'correct';
      if (isSelected) return 'incorrect';
      return 'idle';
    }

    return isSelected ? 'selected' : 'idle';
  }

  isSelected(optionValue: string): boolean {
    return this.selectedValues().includes(optionValue);
  }

  /** ==================== STYLES (helpers for template) ==================== */
  getContainerClasses(): string {
    return cn(
      'mx-auto w-full max-w-2xl rounded-2xl border border-[#1f2937] bg-[#0e1318] p-6 shadow-sm',
      this.variant === 'compact' && 'p-4',
      this.variant === 'assessment' && 'border-t-4 border-t-purple-500'
    );
  }

  getOptionClasses(status: ChoiceStatus, isSelected: boolean): string {
    return cn(
      'w-full rounded-lg border p-4 text-left transition-all',
      status === 'selected' && 'border-[#60a5fa] bg-[#60a5fa]/10',
      status === 'correct' && this.emphasizeCorrect && 'border-emerald-500 bg-emerald-500/10',
      status === 'incorrect' && 'border-red-500 bg-red-500/10',
      status === 'readOnly' && 'opacity-70 cursor-not-allowed',
      !isSelected && !this.submitted() && !this.readOnly() && 'border-[#1f2937] hover:border-[#60a5fa]/50 hover:bg-[#60a5fa]/5',
      (this.submitted() || this.readOnly()) && 'cursor-default'
    );
  }

  getIndicatorClasses(status: ChoiceStatus, isSelected: boolean): string {
    if (this.selectionMode === 'single') {
      return cn(
        'h-4 w-4 rounded-full border-2 transition-colors',
        isSelected ? 'border-[#60a5fa] bg-[#60a5fa]' : 'border-[#6b7280]',
        status === 'correct' && this.emphasizeCorrect && 'border-emerald-500 bg-emerald-500',
        status === 'incorrect' && 'border-red-500 bg-red-500'
      );
    } else {
      return cn(
        'h-4 w-4 rounded border-2 transition-colors',
        isSelected ? 'border-[#60a5fa] bg-[#60a5fa]' : 'border-[#6b7280]',
        status === 'correct' && this.emphasizeCorrect && 'border-emerald-500 bg-emerald-500',
        status === 'incorrect' && 'border-red-500 bg-red-500'
      );
    }
  }

  // Expose for template
  cn = cn;

  /** ==================== GETTERS FOR TEMPLATE / LEGACY UI ==================== */
  showAttemptsLeft(): boolean {
    return this.showAttemptCount && this.maxAttempts > 0 && !this.readOnly();
  }

  attemptsLeft(): number {
    const left = Math.max(0, this.maxAttempts - this.attempts());
    return left;
  }

  shouldRevealCorrectAfterLock(): boolean {
    return this.readOnly() && this.showCorrectAnswer;
  }
}
