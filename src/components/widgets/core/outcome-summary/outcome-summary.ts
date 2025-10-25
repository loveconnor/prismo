import {
  Component,
  Input,
  Output,
  EventEmitter,
  Inject,
  PLATFORM_ID
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { WidgetBaseComponent } from '../../base/widget-base';
import { FontService } from '../../../../services/font.service';
import { ThemeService } from '../../../../services/theme.service';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  lucideTrophy,
  lucideTarget,
  lucideStar,
  lucideTrendingUp,
  lucideChevronRight,
  lucideCircleCheck,
  lucideClock,
  lucideShare2,
  lucideDownload
} from '@ng-icons/lucide';

/** ==================== LEGACY (HEAD) TYPES ==================== */
export interface Outcome {
  id: string;
  title: string;
  achieved: boolean;
  score?: number;
  feedback?: string;
}

/** ==================== MODERN TYPES ==================== */
export type OutcomeType = 'completion' | 'mastery' | 'review' | 'assessment';

export interface LabOutcome {
  skill: string;
  previousLevel: number;
  currentLevel: number;
  improvement: number;
}

export interface NextLabSuggestion {
  id: string;
  title: string;
  reason: string;
  difficulty: 'easy' | 'medium' | 'hard';
  estimatedMinutes: number;
}

export interface OutcomeSummaryUI {
  variant?: 'default' | 'compact' | 'celebration';
  showConfetti?: boolean;
  showSkillProgress?: boolean;
  showNextSteps?: boolean;
}

/** ==================== COMPONENT ==================== */
@Component({
  selector: 'app-outcome-summary',
  standalone: true,
  imports: [CommonModule, NgIconComponent],
  providers: [
    provideIcons({
      lucideTrophy,
      lucideTarget,
      lucideStar,
      lucideTrendingUp,
      lucideChevronRight,
      lucideCircleCheck,
      lucideClock,
      lucideShare2,
      lucideDownload
    })
  ],
  templateUrl: './outcome-summary.html',
  styleUrls: ['./outcome-summary.css']
})
export class OutcomeSummaryComponent extends WidgetBaseComponent {
  /** ==================== MODERN INPUTS ==================== */
  // Core
  @Input() id!: string;
  @Input() labId!: string;
  @Input() labTitle!: string;

  // Results
  @Input() outcomeType: OutcomeType = 'completion';
  @Input() completionPercent: number = 100;
  @Input() timeSpent?: number; // minutes
  @Input() attempts?: number;
  /** 0..1 normalized; if not provided, we’ll derive from legacy overallScore (0..100) */
  @Input() score?: number;

  // Learning Outcomes
  @Input() skillImprovements: LabOutcome[] = [];
  @Input() keyTakeaways: string[] = [];
  @Input() strengths: string[] = [];
  @Input() areasForImprovement: string[] = [];

  // Next Steps
  @Input() nextLabSuggestions: NextLabSuggestion[] = [];
  @Input() recommendedReview: string[] = [];

  // UI
  @Input() ui?: OutcomeSummaryUI;

  // Callback-style “parity” inputs
  @Input() onNextLabSelect?: (labId: string) => void;
  @Input() onReviewSelect?: (topic: string) => void;
  @Input() onShare?: () => void;

  /** ==================== LEGACY (HEAD) INPUTS — BACK-COMPAT ==================== */
  @Input() outcomes: Outcome[] = [];
  @Input() nextLabSuggestion: string = ''; // single title
  /** 0..100 legacy; mapped into `score` if modern undefined */
  @Input() overallScore: number = 0;
  @Input() showDetailedFeedback: boolean = true;
  @Input() allowExport: boolean = true;

  /** ==================== MODERN OUTPUTS ==================== */
  @Output() nextLabSelect = new EventEmitter<string>();
  @Output() reviewSelect = new EventEmitter<string>();
  @Output() share = new EventEmitter<void>();

  /** ==================== LEGACY (HEAD) OUTPUTS — BACK-COMPAT BRIDGE ==================== */
  @Output() outcomeViewed = new EventEmitter<string>();
  @Output() nextLabSelected = new EventEmitter<string>();
  @Output() summaryExported = new EventEmitter<{ format: string; data: any }>();
  @Output() feedbackRequested = new EventEmitter<string>();

  /** ==================== LOCAL STATE ==================== */
  expandedSections: Set<string> = new Set(['summary']);

  /** ==================== CONSTRUCTOR ==================== */
  constructor(
    protected override fontService: FontService,
    themeService: ThemeService,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    super(themeService, fontService, platformId);
  }

  /** ==================== WIDGET BASE IMPLEMENTATION ==================== */
  protected initializeWidgetData(): void {
    // Normalize modern score from legacy if not given
    if (this.score === undefined && typeof this.overallScore === 'number') {
      this.score = Math.max(0, Math.min(100, this.overallScore)) / 100;
    }

    // Bridge legacy single suggestion into modern list if needed
    if (!this.nextLabSuggestions?.length && this.nextLabSuggestion) {
      this.nextLabSuggestions = [{
        id: this.nextLabSuggestion.toLowerCase().replace(/\s+/g, '-'),
        title: this.nextLabSuggestion,
        reason: 'Based on your recent performance and interests',
        difficulty: 'medium',
        estimatedMinutes: 30
      }];
    }

    // Emit that each outcome was “viewed” (legacy parity)
    this.outcomes?.forEach(o => this.outcomeViewed.emit(o.id));
  }

  protected validateInput(): boolean {
    return true;
  }

  protected processCompletion(): void {
    this.updateState({ is_completed: true });
    this.completion.emit({
      widget_id: this._state.id,
      event_type: 'completion',
      data: {
        labId: this.labId,
        score: this.score ?? null,
        completionPercent: this.completionPercent
      },
      timestamp: new Date()
    });
  }

  /** ==================== UI COMPUTED ==================== */
  get variant(): 'default' | 'compact' | 'celebration' {
    return this.ui?.variant || 'default';
  }

  get showSkillProgress(): boolean {
    // Respect modern flag; otherwise fall back to legacy “showDetailedFeedback”
    return this.ui?.showSkillProgress ?? this.showDetailedFeedback ?? true;
  }

  get showNextSteps(): boolean {
    return this.ui?.showNextSteps ?? true;
  }

  getOutcomeColor(): string {
    switch (this.outcomeType) {
      case 'completion':  return 'text-emerald-500';
      case 'mastery':     return 'text-yellow-500';
      case 'review':      return 'text-blue-500';
      case 'assessment':  return 'text-purple-500';
      default:            return 'text-emerald-500';
    }
  }

  getDifficultyColor(difficulty: string): string {
    switch (difficulty) {
      case 'easy':    return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
      case 'medium':  return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
      case 'hard':    return 'text-red-500 bg-red-500/10 border-red-500/20';
      default:        return 'text-gray-500 bg-gray-500/10 border-gray-500/20';
    }
  }

  outcomeIconName(): string {
    switch (this.outcomeType) {
      case 'completion':  return 'lucideTrophy';
      case 'mastery':     return 'lucideStar';
      case 'review':      return 'lucideTrendingUp';
      case 'assessment':  return 'lucideTarget';
      default:            return 'lucideTrophy';
    }
  }

  /** ==================== SECTION TOGGLING ==================== */
  toggleSection(section: string): void {
    const updated = new Set(this.expandedSections);
    if (updated.has(section)) updated.delete(section); else updated.add(section);
    this.expandedSections = updated;
  }

  /** ==================== EVENT WRAPPERS (MODERN + LEGACY) ==================== */
  handleNextLabSelect(labId: string): void {
    // modern
    this.onNextLabSelect?.(labId);
    this.nextLabSelect.emit(labId);
    // legacy
    this.nextLabSelected.emit(labId);
  }

  handleReviewSelect(topic: string): void {
    // modern
    this.onReviewSelect?.(topic);
    this.reviewSelect.emit(topic);
    // legacy
    this.feedbackRequested.emit(topic);
  }

  handleShare(): void {
    this.onShare?.();
    this.share.emit();
  }

  /** Export bridge for legacy consumers */
  handleExport(format: 'json' | 'csv' = 'json'): void {
    if (!this.allowExport) return;

    const data = {
      id: this.id,
      labId: this.labId,
      labTitle: this.labTitle,
      outcomeType: this.outcomeType,
      completionPercent: this.completionPercent,
      timeSpent: this.timeSpent,
      attempts: this.attempts,
      score: this.score,
      outcomes: this.outcomes,
      skillImprovements: this.skillImprovements,
      keyTakeaways: this.keyTakeaways,
      strengths: this.strengths,
      areasForImprovement: this.areasForImprovement,
      nextLabSuggestions: this.nextLabSuggestions,
      recommendedReview: this.recommendedReview
    };

    // Emit legacy-shaped export event
    this.summaryExported.emit({ format, data });
  }
}
