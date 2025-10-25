import { 
  Component, 
  Input, 
  Output, 
  EventEmitter, 
  ViewChild, 
  ElementRef, 
  OnInit,
  OnDestroy,
  Inject,
  PLATFORM_ID,
  signal,
  effect
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WidgetBaseComponent } from '../../base/widget-base';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { 
  lucideMessageCircle,
  lucideSave,
  lucideSend,
  lucideSkipForward,
  lucideCheck,
  lucideCircleAlert,
  lucideChevronDown,
  lucideChevronUp,
  lucideX,
  lucideLightbulb,
  lucideTrendingUp
} from '@ng-icons/lucide';
import { cn } from '../../../../lib/utils';
import { ThemeService } from '../../../../services/theme.service';
import { FontService } from '../../../../services/font.service';

// ==================== TYPES ====================

export type ReflectionScope = 'step' | 'section' | 'lab';
export type ReflectionVariant = 'inline' | 'card' | 'modal';
export type ReflectionState = 'collapsed' | 'idle' | 'dirty' | 'submitting' | 'submitted' | 'readOnly';
export type Sentiment = 'neg' | 'neutral' | 'pos';

export interface ReflectionSignals {
  sentiment: Sentiment;
  confusionScore: number;  // 0..1
  selfEfficacy: number;    // 0..1
  keywords: string[];
}

export interface ReflectionPayload {
  text: string;
  feelings: string[];
  topics: string[];
  signals: ReflectionSignals;
  durationMs: number;
  charCount: number;
}

export interface ReflectionChips {
  feelings?: string[];
  topics?: string[];
}

export interface ReflectionUI {
  variant?: ReflectionVariant;
  defaultCollapsed?: boolean;
  showWordCount?: boolean;
}

export interface ReflectionPrivacy {
  storeRaw?: boolean;
  storeSignalsOnlyIfSkipped?: boolean;
  anonymizeForAnalytics?: boolean;
}

export interface ReflectionIntegrations {
  masteryTags?: string[];
  nextAction?: 'continue' | 'open_hint' | 'open_review' | 'recommend_next_lab';
  coachAvailable?: boolean;
}

// ==================== COMPONENT ====================

@Component({
  selector: 'app-reflection-prompt',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NgIconComponent
  ],
  providers: [
    provideIcons({
      lucideMessageCircle,
      lucideSave,
      lucideSend,
      lucideSkipForward,
      lucideCheck,
      lucideCircleAlert,
      lucideChevronDown,
      lucideChevronUp,
      lucideX,
      lucideLightbulb,
      lucideTrendingUp
    })
  ],
  templateUrl: './reflection-prompt.html',
  styleUrls: ['./reflection-prompt.css']
})
export class ReflectionPromptComponent extends WidgetBaseComponent implements OnInit, OnDestroy {
  // ==================== INPUTS ====================
  @Input() reflectionId!: string;
  @Input() scope!: ReflectionScope;
  @Input() scopeId!: string;
  @Input() promptText!: string;
  @Input() minChars: number = 30;
  @Input() maxChars: number = 450;
  @Input() placeholder?: string;
  @Input() chips?: ReflectionChips;
  @Input() allowMarkdownLite: boolean = false;
  @Input() requireBeforeNext: boolean = false;
  @Input() autosaveMs: number = 1200;
  @Input() ui: ReflectionUI = {};
  @Input() privacy: ReflectionPrivacy = {};
  @Input() integrations: ReflectionIntegrations = {};
  @Input() reflectionTelemetry?: { cohort?: string; abBucket?: string };
  @Input() a11yLabel?: string;
  @Input() reflectionReadOnly: boolean = false;

  // ==================== OUTPUTS ====================
  @Output() reflectionViewed = new EventEmitter<any>();
  @Output() reflectionAutosaved = new EventEmitter<any>();
  @Output() reflectionSubmitted = new EventEmitter<any>();
  @Output() reflectionSkipped = new EventEmitter<any>();
  @Output() suggestHint = new EventEmitter<any>();
  @Output() suggestNextLab = new EventEmitter<any>();

  // ==================== VIEW CHILDREN ====================
  @ViewChild('textarea') textareaRef?: ElementRef;

  // ==================== STATE ====================
  reflectionState = signal<ReflectionState>('idle');
  text = signal<string>('');
  selectedFeelings = signal<string[]>([]);
  selectedTopics = signal<string[]>([]);
  autosaved = signal<boolean>(false);
  showSkipModal = signal<boolean>(false);
  skipReason = signal<string>('');

  private autosaveTimer?: any;

  // ==================== COMPUTED ====================
  get variant() { return this.ui.variant ?? 'inline'; }
  get defaultCollapsed() { return this.ui.defaultCollapsed ?? false; }
  get showWordCount() { return this.ui.showWordCount ?? true; }

  get storeRaw() { return this.privacy.storeRaw ?? true; }
  get storeSignalsOnlyIfSkipped() { return this.privacy.storeSignalsOnlyIfSkipped ?? true; }
  get anonymizeForAnalytics() { return this.privacy.anonymizeForAnalytics ?? true; }

  get masteryTags() { return this.integrations.masteryTags ?? []; }
  get nextAction() { return this.integrations.nextAction; }
  get coachAvailable() { return this.integrations.coachAvailable ?? true; }

  get charCount() { return this.text().length; }
  get charsRemaining() { return this.maxChars - this.charCount; }
  get isTooShort() { return this.charCount < this.minChars; }
  get isAtLimit() { return this.charCount >= this.maxChars; }

  // ==================== LIFECYCLE ====================

  override ngOnInit(): void {
    super.ngOnInit();

    // Set initial state
    if (this.defaultCollapsed) {
      this.reflectionState.set('collapsed');
    }

    this.startTime = Date.now();

    // Emit viewed event
    this.reflectionViewed.emit({ id: this.reflectionId, scope: this.scope, scopeId: this.scopeId });

    // Restore from localStorage
    this.loadFromLocalStorage();
  }

  override ngOnDestroy(): void {
    if (this.autosaveTimer) {
      clearTimeout(this.autosaveTimer);
    }
    super.ngOnDestroy();
  }

  // ==================== LOCAL STORAGE ====================

  private loadFromLocalStorage(): void {
    const saved = localStorage.getItem(`reflection-${this.reflectionId}`);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        this.text.set(data.text || '');
        this.selectedFeelings.set(data.feelings || []);
        this.selectedTopics.set(data.topics || []);
      } catch (e) {
        // Ignore parse errors
      }
    }
  }

  private saveToLocalStorage(): void {
    localStorage.setItem(`reflection-${this.reflectionId}`, JSON.stringify({
      text: this.text(),
      feelings: this.selectedFeelings(),
      topics: this.selectedTopics(),
    }));
  }

  private clearLocalStorage(): void {
    localStorage.removeItem(`reflection-${this.reflectionId}`);
  }

  // ==================== AUTOSAVE ====================

  private scheduleAutosave(): void {
    if (this.autosaveTimer) {
      clearTimeout(this.autosaveTimer);
    }

    this.autosaveTimer = setTimeout(() => {
      this.saveToLocalStorage();
      this.autosaved.set(true);
      setTimeout(() => this.autosaved.set(false), 2000);

      this.reflectionAutosaved.emit({
        id: this.reflectionId,
        scopeId: this.scopeId,
        charCount: this.charCount,
      });
    }, this.autosaveMs);
  }

  // ==================== SIGNAL EXTRACTION ====================

  private extractSignals(text: string, feelings: string[]): ReflectionSignals {
    const lowerText = text.toLowerCase();
    
    // Sentiment analysis (simple keyword-based)
    const negativeWords = ['confused', 'stuck', 'hard', 'difficult', 'frustrated', 'lost', "don't understand"];
    const positiveWords = ['clear', 'understood', 'got it', 'easy', 'confident', 'learned', 'makes sense'];
    
    let sentiment: Sentiment = 'neutral';
    const negCount = negativeWords.filter(word => lowerText.includes(word)).length;
    const posCount = positiveWords.filter(word => lowerText.includes(word)).length;
    
    if (posCount > negCount) sentiment = 'pos';
    else if (negCount > posCount) sentiment = 'neg';
    
    // Confusion score (0..1)
    const confusionIndicators = ['confused', "don't understand", 'unclear', 'lost', 'stuck', 'not sure'];
    const confusionScore = Math.min(
      confusionIndicators.filter(ind => lowerText.includes(ind)).length / 3,
      1
    );
    
    // Self-efficacy (0..1)
    const efficacyIndicators = ['confident', 'understood', 'got it', 'know how', 'can do'];
    const selfEfficacy = Math.min(
      efficacyIndicators.filter(ind => lowerText.includes(ind)).length / 2,
      1
    );
    
    // Extract keywords (simple: just get unique words > 4 chars)
    const words = text.split(/\s+/)
      .map(w => w.toLowerCase().replace(/[^a-z]/g, ''))
      .filter(w => w.length > 4);
    const keywords = Array.from(new Set(words)).slice(0, 5);
    
    // Factor in feelings
    if (feelings.includes('confused') || feelings.includes('frustrated')) {
      return {
        sentiment: 'neg',
        confusionScore: Math.max(confusionScore, 0.6),
        selfEfficacy: Math.min(selfEfficacy, 0.4),
        keywords
      };
    }
    
    if (feelings.includes('confident')) {
      return {
        sentiment: 'pos',
        confusionScore: Math.min(confusionScore, 0.3),
        selfEfficacy: Math.max(selfEfficacy, 0.7),
        keywords
      };
    }
    
    return { sentiment, confusionScore, selfEfficacy, keywords };
  }

  // ==================== EVENT HANDLERS ====================

  handleTextChange(value: string): void {
    if (value.length <= this.maxChars) {
      this.text.set(value);
      const state = this.reflectionState();
      if (state !== 'dirty' && state !== 'submitting') {
        this.reflectionState.set('dirty');
      }
    }
  }

  toggleFeeling(feeling: string): void {
    this.selectedFeelings.update(prev =>
      prev.includes(feeling)
        ? prev.filter(f => f !== feeling)
        : [...prev, feeling]
    );
    this.reflectionState.set('dirty');
  }

  toggleTopic(topic: string): void {
    this.selectedTopics.update(prev =>
      prev.includes(topic)
        ? prev.filter(t => t !== topic)
        : [...prev, topic]
    );
    this.reflectionState.set('dirty');
  }

  async handleSubmit(): Promise<void> {
    if (this.isTooShort || this.reflectionState() === 'submitting' || this.reflectionState() === 'submitted') {
      return;
    }

    this.reflectionState.set('submitting');

    // Extract signals
    const signals = this.extractSignals(this.text(), this.selectedFeelings());
    const durationMs = Date.now() - this.startTime;

    const payload: ReflectionPayload = {
      text: this.text(),
      feelings: this.selectedFeelings(),
      topics: this.selectedTopics(),
      signals,
      durationMs,
      charCount: this.charCount,
    };

    // Simulate async submission
    await new Promise(resolve => setTimeout(resolve, 500));

    this.reflectionState.set('submitted');
    this.clearLocalStorage();

    this.reflectionSubmitted.emit({
      id: this.reflectionId,
      scopeId: this.scopeId,
      payload,
    });

    // Mark widget as complete
    this.completeWidget();

    // Adaptivity hooks
    if (signals.confusionScore >= 0.6) {
      this.suggestHint.emit({ id: this.reflectionId, scopeId: this.scopeId });
    }

    if (signals.sentiment === 'pos' && this.scope === 'lab') {
      this.suggestNextLab.emit({ id: this.reflectionId, scopeId: this.scopeId });
    }
  }

  handleSkip(): void {
    if (this.requireBeforeNext && !this.skipReason()) {
      this.showSkipModal.set(true);
      return;
    }

    // Store signals only if configured
    if (this.storeSignalsOnlyIfSkipped && this.text().length > 0) {
      const signals = this.extractSignals(this.text(), this.selectedFeelings());
      this.reflectionSubmitted.emit({
        id: this.reflectionId,
        scopeId: this.scopeId,
        payload: {
          text: '',  // Don't store raw text
          feelings: this.selectedFeelings(),
          topics: this.selectedTopics(),
          signals,
          durationMs: Date.now() - this.startTime,
          charCount: 0,
        },
      });
    }

    this.reflectionSkipped.emit({ 
      id: this.reflectionId, 
      scopeId: this.scopeId, 
      reason: this.skipReason() 
    });

    this.reflectionState.set('submitted');
    this.clearLocalStorage();
  }

  handleSaveDraft(): void {
    this.saveToLocalStorage();
    this.autosaved.set(true);
    setTimeout(() => this.autosaved.set(false), 2000);
  }

  handleKeyDown(event: KeyboardEvent): void {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault();
      this.handleSubmit();
    }
  }

  handleToggleCollapse(): void {
    const current = this.reflectionState();
    this.reflectionState.set(current === 'collapsed' ? 'idle' : 'collapsed');
  }

  handleSkipModalCancel(): void {
    this.showSkipModal.set(false);
  }

  handleSkipModalConfirm(): void {
    this.showSkipModal.set(false);
    this.handleSkip();
  }

  // ==================== UTILITY ====================

  getChipClasses(selected: boolean, type: 'feeling' | 'topic'): string {
    const base = 'rounded-full border px-3 py-1 text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-50';
    
    if (type === 'feeling') {
      return cn(
        base,
        selected
          ? 'border-[#60a5fa] bg-[#60a5fa]/20 text-[#60a5fa]'
          : 'border-[#1f2937] text-[#9ca3af] hover:border-[#60a5fa]/50 hover:bg-[#60a5fa]/10'
      );
    } else {
      return cn(
        base,
        selected
          ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400'
          : 'border-[#1f2937] text-[#9ca3af] hover:border-emerald-500/50 hover:bg-emerald-500/10'
      );
    }
  }

  getScopeLabel(): string {
    switch (this.scope) {
      case 'step': return 'End of Step';
      case 'section': return 'Section Check-in';
      case 'lab': return 'Lab Summary';
      default: return '';
    }
  }

  // ==================== WIDGET BASE IMPLEMENTATION ====================

  protected override initializeWidgetData(): void {
    this.setDataValue('viewed', true);
    this.setDataValue('viewed_at', new Date());
    this.setDataValue('scope', this.scope);
  }

  protected override validateInput(): boolean {
    return this.charCount >= this.minChars;
  }

  protected override processCompletion(): void {
    this.setDataValue('completed_at', new Date());
    this.setDataValue('char_count', this.charCount);
    this.setDataValue('feelings', this.selectedFeelings());
    this.setDataValue('topics', this.selectedTopics());
  }
}

