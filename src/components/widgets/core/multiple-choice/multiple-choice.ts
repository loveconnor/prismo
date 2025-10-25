import { 
  Component, 
  Input, 
  Output, 
  EventEmitter, 
  OnInit,
  OnDestroy,
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

// ==================== TYPES ====================

export type SelectionMode = 'single' | 'multiple';
export type ChoiceStatus = 'idle' | 'selected' | 'correct' | 'incorrect' | 'readOnly';

export interface ChoiceOption {
  id: string;
  label: string;
  value: string;
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

// ==================== COMPONENT ====================

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
  // ==================== ABSTRACT METHOD IMPLEMENTATIONS ====================
  
  protected initializeWidgetData(): void {
    // Options will be initialized in ngOnInit after inputs are set
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

  // ==================== INPUTS ====================

  @Input() id!: string;
  @Input() question!: string;
  @Input() options: ChoiceOption[] = [];
  @Input() selectionMode: SelectionMode = 'single';
  @Input() required: boolean = false;
  @Input() shuffleOptions: boolean = false;
  @Input() showRationale: boolean = false;
  @Input() allowDeselect: boolean = true;
  @Input() value?: string[];
  @Input() defaultValue: string[] = [];
  @Input() ui: MultipleChoiceUI = {};
  @Input() correctAnswers: string[] = [];
  @Input() a11yLabel?: string;

  // ==================== OUTPUTS ====================

  @Output() valueChange = new EventEmitter<MultipleChoiceChangePayload>();
  @Output() choiceSubmit = new EventEmitter<MultipleChoiceSubmitPayload>();

  // ==================== STATE ====================

  selectedValues = signal<string[]>([]);
  submitted = signal<boolean>(false);
  shuffledOptions = signal<ChoiceOption[]>([]);

  // ==================== COMPUTED ====================

  get variant() { return this.ui.variant ?? 'default'; }
  get showCheckboxes() { return this.ui.showCheckboxes ?? false; }
  get emphasizeCorrect() { return this.ui.emphasizeCorrect ?? true; }

  isValid = signal<boolean>(true);

  // ==================== LIFECYCLE ====================

  override ngOnInit() {
    super.ngOnInit();
    
    // Set initial value
    const initialValue = this.value || this.defaultValue;
    this.selectedValues.set(initialValue);
    
    // Initialize shuffled options after inputs are set
    if (this.shuffleOptions) {
      this.shuffledOptions.set([...this.options].sort(() => Math.random() - 0.5));
    } else {
      this.shuffledOptions.set([...this.options]);
    }
    
    // Update validity
    this.updateValidity();
    
    // Watch for external value changes
    effect(() => {
      if (this.value !== undefined) {
        this.selectedValues.set(this.value);
      }
    });
    
    // Watch for options changes
    effect(() => {
      if (this.options && this.options.length > 0) {
        if (this.shuffleOptions) {
          this.shuffledOptions.set([...this.options].sort(() => Math.random() - 0.5));
        } else {
          this.shuffledOptions.set([...this.options]);
        }
      }
    });
  }

  override ngOnDestroy() {
    super.ngOnDestroy();
  }

  // ==================== HANDLERS ====================

  handleOptionSelect(optionValue: string) {
    if (this.submitted()) return;

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

    const isValid = this.required ? newSelected.length > 0 : true;
    this.valueChange.emit({
      value: newSelected,
      isValid
    });
  }

  handleSubmit() {
    if (this.submitted()) return;

    this.submitted.set(true);

    const isCorrect = this.isCorrect();

    this.choiceSubmit.emit({
      value: this.selectedValues(),
      correct: isCorrect
    });

    if (isCorrect) {
      this.processCompletion();
    }
  }

  // ==================== HELPERS ====================

  private updateValidity() {
    const valid = this.required ? this.selectedValues().length > 0 : true;
    this.isValid.set(valid);
  }

  isCorrect(): boolean {
    if (this.correctAnswers.length === 0) return true;

    const selected = this.selectedValues();
    
    if (this.selectionMode === 'single') {
      return selected.length === 1 && this.correctAnswers.includes(selected[0]);
    } else {
      return selected.length === this.correctAnswers.length &&
        selected.every(v => this.correctAnswers.includes(v)) &&
        this.correctAnswers.every(v => selected.includes(v));
    }
  }

  getOptionStatus(option: ChoiceOption): ChoiceStatus {
    const isSelected = this.selectedValues().includes(option.value);
    
    if (this.submitted()) {
      const isOptionCorrect = option.isCorrect || this.correctAnswers.includes(option.value);
      if (isOptionCorrect) return 'correct';
      if (isSelected) return 'incorrect';
      return 'idle';
    }
    
    return isSelected ? 'selected' : 'idle';
  }

  isSelected(optionValue: string): boolean {
    return this.selectedValues().includes(optionValue);
  }

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
      !isSelected && !this.submitted() && 'border-[#1f2937] hover:border-[#60a5fa]/50 hover:bg-[#60a5fa]/5',
      this.submitted() && 'cursor-default'
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

  // Expose cn utility for template
  cn = cn;
}

