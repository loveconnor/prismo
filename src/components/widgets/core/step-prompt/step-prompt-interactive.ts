import { 
  Component, 
  Input, 
  Output, 
  EventEmitter, 
  ViewChild, 
  ElementRef, 
  AfterViewInit,
  OnDestroy,
  HostListener,
  signal,
  effect
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WidgetBaseComponent } from '../../base/widget-base';
import { CardComponent } from '../../../ui/card/card';
import { CardHeaderComponent } from '../../../ui/card/card-header';
import { CardContentComponent } from '../../../ui/card/card-content';
import { CardFooterComponent } from '../../../ui/card/card-footer';
import { ButtonComponent } from '../../../ui/button/button';
import { InputComponent } from '../../../ui/input/input';
import { TextareaComponent } from '../../../ui/textarea/textarea';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { 
  lucideCircleCheck, 
  lucideClock, 
  lucideCopy, 
  lucideCircleHelp, 
  lucideLightbulb, 
  lucideMessageSquare,
  lucideFileText,
  lucideListChecks,
  lucideBookOpen
} from '@ng-icons/lucide';
import { gsap } from 'gsap';
import { WidgetMetadata, WidgetDifficulty, WidgetInputType, WidgetOutputType } from '../../../../types/widget.types';
import { SafeHtmlPipe } from '../../../../app/lib/safe-html.pipe';

// ==================== TYPES ====================

export type PromptType = 'task' | 'question' | 'instruction';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type VariantType = 'default' | 'compact' | 'emphatic' | 'assessment';
export type StepState = 'idle' | 'reading' | 'hintAvailable' | 'hintOpened' | 'awaitingSubmission' | 'completed' | 'readOnly';

export interface StepPromptConfig {
  // Core
  title?: string;
  stepNumber?: number;
  totalSteps?: number;
  promptType: PromptType;
  bodyMD: string;

  // Optional content
  example?: string;
  tip?: string;
  assets?: string[];

  // User Input
  requiresSubmission?: boolean;
  inputType?: 'text' | 'textarea' | 'code';
  inputPlaceholder?: string;
  inputLabel?: string;
  validateInput?: (value: string) => string | null; // Returns error message or null

  // Metadata (from WidgetMetadata)
  difficulty?: Difficulty;
  estimatedMinutes?: number;
  skillTags?: string[];

  // CTAs
  ctaPrimary: {
    label: string;
    action: 'next' | 'start' | 'submit' | 'custom';
  };
  ctaSecondary?: {
    showHint?: boolean;
    openCoach?: boolean;
    custom?: {
      label: string;
    };
  };

  // Integrations
  integrations?: {
    showHintPanel?: boolean;
    showFeedbackBox?: boolean;
    showCoach?: boolean;
  };

  // Telemetry
  telemetry?: {
    cohort?: string;
    abBucket?: string;
  };

  // Accessibility
  a11yLabel?: string;
  ariaDescription?: string;

  // Configuration
  readOnly?: boolean;
  allowMarkdownHtml?: boolean;
  variant?: VariantType;

  // Timer Integration
  timeRemainingMs?: number; // For displaying countdown
}

export interface StepPromptTelemetry {
  id: string;
  stepNumber?: number;
  totalSteps?: number;
  cohort?: string;
  abBucket?: string;
  dwellMs?: number;
  scrolledPct?: number;
}

// ==================== COMPONENT ====================

@Component({
  selector: 'app-step-prompt-interactive',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardComponent,
    CardHeaderComponent,
    CardContentComponent,
    CardFooterComponent,
    ButtonComponent,
    InputComponent,
    TextareaComponent,
    NgIconComponent,
    SafeHtmlPipe
  ],
  providers: [
    provideIcons({
      lucideCircleCheck,
      lucideClock,
      lucideCopy,
      lucideCircleHelp,
      lucideLightbulb,
      lucideMessageSquare,
      lucideFileText,
      lucideListChecks,
      lucideBookOpen
    })
  ],
  templateUrl: './step-prompt-interactive.html',
  styleUrls: ['./step-prompt-interactive.css']
})
export class StepPromptInteractiveComponent extends WidgetBaseComponent implements AfterViewInit, OnDestroy {
  // ==================== INPUTS ====================
  @Input() promptConfig!: StepPromptConfig;
  
  // ==================== OUTPUTS ====================
  @Output() stepViewStart = new EventEmitter<StepPromptTelemetry>();
  @Output() stepViewComplete = new EventEmitter<StepPromptTelemetry>();
  @Output() hintRequested = new EventEmitter<{ id: string; source: 'button' | 'hotkey' }>();
  @Output() hintOpened = new EventEmitter<{ id: string }>();
  @Output() primaryAction = new EventEmitter<{ id: string; action: string }>();
  @Output() submitResponse = new EventEmitter<{ id: string; response: string; stepNumber?: number }>();
  @Output() timeUp = new EventEmitter<void>();
  @Output() openHintPanel = new EventEmitter<void>();
  @Output() showFeedback = new EventEmitter<void>();
  @Output() lockNavigation = new EventEmitter<void>();
  
  // ==================== VIEW CHILDREN ====================
  @ViewChild('cardHeader') cardHeader?: ElementRef;
  @ViewChild('cardContent') cardContent?: ElementRef;
  @ViewChild('cardFooter') cardFooter?: ElementRef;
  @ViewChild('bodyContainer') bodyContainer?: ElementRef;

  // ==================== STATE ====================
  currentState = signal<StepState>('idle');
  navigationLocked = signal<boolean>(false);
  hintOpen = signal<boolean>(false);
  copied = signal<boolean>(false);
  userResponse = signal<string>('');
  inputError = signal<string | null>(null);
  viewStartTime: number = Date.now();

  // Timer
  timeRemaining = signal<number | undefined>(undefined);
  private timerInterval?: any;

  // ==================== LIFECYCLE ====================

  override ngOnInit(): void {
    super.ngOnInit();
    
    // Set initial state
    if (this.promptConfig?.requiresSubmission) {
      this.currentState.set('awaitingSubmission');
    } else {
      this.currentState.set('idle');
    }

    // Initialize timer if provided
    if (this.promptConfig?.timeRemainingMs !== undefined) {
      this.timeRemaining.set(this.promptConfig.timeRemainingMs);
      this.startTimer();
    }

    // Emit step view start
    this.viewStartTime = Date.now();
    this.stepViewStart.emit({
      id: this.metadata.id,
      stepNumber: this.promptConfig?.stepNumber,
      totalSteps: this.promptConfig?.totalSteps,
      cohort: this.promptConfig?.telemetry?.cohort,
      abBucket: this.promptConfig?.telemetry?.abBucket
    });
  }

  override ngAfterViewInit(): void {
    super.ngAfterViewInit();
    
    // Animate content reveal
    if (this.cardContent) {
      gsap.from(this.cardContent.nativeElement, {
        opacity: 0,
        y: 10,
        duration: 0.3,
        delay: 0.1,
        ease: "power2.out"
      });
    }
  }

  override ngOnDestroy(): void {
    // Emit step view complete
    const dwellMs = Date.now() - this.viewStartTime;
    this.stepViewComplete.emit({
      id: this.metadata.id,
      dwellMs,
      scrolledPct: 100 // Simplified; could track actual scroll
    });

    // Clear timer
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }

    super.ngOnDestroy();
  }

  // ==================== KEYBOARD SHORTCUTS ====================

  @HostListener('window:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent): void {
    if (!this.promptConfig) return;

    // j / ArrowRight: Next step
    if ((event.key === 'j' || event.key === 'ArrowRight') && !this.navigationLocked()) {
      if ((this.promptConfig.ctaPrimary.action === 'next' || this.promptConfig.ctaPrimary.action === 'start')) {
        event.preventDefault();
        this.handlePrimaryAction();
      }
    }

    // Enter: Submit if input is focused and submission required
    if (event.key === 'Enter' && this.promptConfig.requiresSubmission) {
      const activeElement = document.activeElement;
      if (activeElement?.id === `${this.metadata.id}-input` && this.promptConfig.ctaPrimary.action === 'submit') {
        event.preventDefault();
        this.handlePrimaryAction();
      }
    }

    // H: Open HintPanel
    if (event.key === 'H' && this.promptConfig.ctaSecondary?.showHint) {
      event.preventDefault();
      this.handleHintRequest('hotkey');
    }

    // ?: Toggle help/coach
    if (event.key === '?' && this.promptConfig.ctaSecondary?.openCoach) {
      event.preventDefault();
      this.handleCoachOpen();
    }

    // Escape: Close hints if open
    if (event.key === 'Escape' && this.hintOpen()) {
      this.hintOpen.set(false);
    }
  }

  // ==================== TIMER ====================

  private startTimer(): void {
    this.timerInterval = setInterval(() => {
      const current = this.timeRemaining();
      if (current !== undefined && current > 0) {
        this.timeRemaining.set(current - 1000);
      } else if (current !== undefined && current <= 0) {
        this.timeUp.emit();
        if (this.timerInterval) {
          clearInterval(this.timerInterval);
        }
      }
    }, 1000);
  }

  // ==================== EVENT HANDLERS ====================

  handlePrimaryAction(): void {
    if (!this.promptConfig) return;

    if (this.promptConfig.ctaPrimary.action === 'submit') {
      this.handleSubmit();
    } else {
      this.primaryAction.emit({
        id: this.metadata.id,
        action: this.promptConfig.ctaPrimary.action
      });
    }
  }

  handleHintRequest(source: 'button' | 'hotkey'): void {
    this.hintRequested.emit({ id: this.metadata.id, source });
    this.hintOpen.set(true);
    this.hintOpened.emit({ id: this.metadata.id });
    this.currentState.set('hintOpened');
  }

  handleCoachOpen(): void {
    console.log('Opening coach for step:', this.metadata.id);
    // Coach integration logic could be added here
  }

  async handleCopyExample(): Promise<void> {
    if (this.promptConfig?.example) {
      try {
        await navigator.clipboard.writeText(this.promptConfig.example);
        this.copied.set(true);
        setTimeout(() => this.copied.set(false), 2000);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    }
  }

  handleSubmit(): void {
    if (!this.promptConfig) return;

    const response = this.userResponse();
    
    // Validate input if validator provided
    if (this.promptConfig.validateInput) {
      const error = this.promptConfig.validateInput(response);
      if (error) {
        this.inputError.set(error);
        return;
      }
    }

    this.inputError.set(null);
    this.currentState.set('completed');
    this.submitResponse.emit({ 
      id: this.metadata.id, 
      response, 
      stepNumber: this.promptConfig.stepNumber 
    });

    // Complete the widget
    this.completeWidget();
  }

  handleInputChange(value: string): void {
    this.userResponse.set(value);
    
    // Clear error if validator now passes
    if (this.inputError() && this.promptConfig?.validateInput) {
      const error = this.promptConfig.validateInput(value);
      this.inputError.set(error);
    }
  }

  // ==================== HELPERS ====================

  getPromptIcon(): string {
    if (!this.promptConfig) return 'lucideFileText';
    
    switch (this.promptConfig.promptType) {
      case 'task':
        return 'lucideListChecks';
      case 'question':
        return 'lucideHelpCircle';
      case 'instruction':
        return 'lucideBookOpen';
      default:
        return 'lucideFileText';
    }
  }

  getDifficultyColor(): string {
    const difficulty = this.promptConfig?.difficulty;
    
    switch (difficulty) {
      case 'easy':
        return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'medium':
        return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'hard':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      default:
        return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';
    }
  }

  getContainerClasses(): string {
    const base = 'rounded-2xl border shadow-sm transition-all';
    const theme = 'border-[#1f2937] bg-[#0e1318]';
    const variant = this.promptConfig?.variant || 'default';
    
    switch (variant) {
      case 'compact':
        return `${base} ${theme} p-4`;
      case 'emphatic':
        return `${base} ${theme} p-6 md:p-8 border-l-4 border-l-blue-500`;
      case 'assessment':
        return `${base} ${theme} p-6 md:p-8 border-t-4 border-t-purple-500`;
      default:
        return `${base} ${theme} p-6 md:p-8`;
    }
  }

  getProgressPercentage(): number {
    if (!this.promptConfig?.stepNumber || !this.promptConfig?.totalSteps) {
      return 0;
    }
    return (this.promptConfig.stepNumber / this.promptConfig.totalSteps) * 100;
  }

  getTimeDisplay(): string {
    const time = this.timeRemaining();
    if (time === undefined) return '';
    if (time <= 0) return "Time's up!";
    
    const minutes = Math.ceil(time / 60000);
    return `${minutes}m left`;
  }

  isTimeWarning(): boolean {
    const time = this.timeRemaining();
    return time !== undefined && time > 0 && time < 60000;
  }

  isPrimaryButtonDisabled(): boolean {
    if (!this.promptConfig) return false;
    
    return (
      this.navigationLocked() ||
      this.promptConfig.readOnly ||
      (this.promptConfig.ctaPrimary.action === 'submit' && 
       (!this.userResponse().trim() || !!this.inputError()))
    );
  }

  shouldShowPrimaryKeyboardHint(): boolean {
    if (!this.promptConfig) return false;
    
    return !this.navigationLocked() && 
           !this.promptConfig.readOnly && 
           !(this.promptConfig.ctaPrimary.action === 'submit' && 
             (!this.userResponse().trim() || !!this.inputError()));
  }

  // ==================== WIDGET BASE IMPLEMENTATION ====================

  protected override initializeWidgetData(): void {
    // Mark as viewed when initialized
    this.setDataValue('viewed', true);
    this.setDataValue('viewed_at', new Date());
    this.setDataValue('state', this.currentState());
  }

  protected override validateInput(): boolean {
    if (!this.promptConfig) return false;
    
    if (this.promptConfig.requiresSubmission) {
      return !!this.userResponse().trim() && !this.inputError();
    }
    
    return true;
  }

  protected override processCompletion(): void {
    this.setDataValue('completed_at', new Date());
    this.setDataValue('time_to_complete', this.timeSpent);
    this.setDataValue('response', this.userResponse());
    this.setDataValue('attempts', this._state.attempts);
  }
}

