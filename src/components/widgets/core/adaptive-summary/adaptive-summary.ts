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
import { ThemeService } from '../../../../services/theme.service';
import { FontService } from '../../../../services/font.service';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  lucideTrendingUp,
  lucideTrendingDown,
  lucideTarget,
  lucideChevronRight,
  lucideTriangleAlert
} from '@ng-icons/lucide';

// ==================== TYPES (widgets) ====================

export type AdaptationReason =
  | 'struggling'
  | 'excelling'
  | 'time_pressure'
  | 'concept_gaps'
  | 'engagement';

export interface SkillAssessment {
  skill: string;
  currentLevel: number;
  targetLevel: number;
  confidence: number;          // 0..1
  recentPerformance: number[]; // e.g., last N correctness values 0..1
}

export interface Adaptation {
  type: 'difficulty' | 'content' | 'pacing' | 'hints' | 'practice';
  direction: 'increase' | 'decrease' | 'adjust';
  reason: AdaptationReason;
  description: string;
  impact: 'high' | 'medium' | 'low';
}

export interface AdaptiveSummaryUI {
  variant?: 'default' | 'compact' | 'detailed';
  showCharts?: boolean;
  showRecommendations?: boolean;
}

// ==================== COMPONENT ====================

@Component({
  selector: 'app-adaptive-summary',
  standalone: true,
  imports: [CommonModule, NgIconComponent],
  providers: [
    provideIcons({
      lucideTrendingUp,
      lucideTrendingDown,
      lucideTarget,
      lucideChevronRight,
      lucideTriangleAlert
    })
  ],
  templateUrl: './adaptive-summary.html',
  styleUrls: ['./adaptive-summary.css']
})
export class AdaptiveSummaryComponent extends WidgetBaseComponent {
  // -------- Core identity (widgets) --------
  @Input() id!: string;
  @Input() sectionId!: string;
  @Input() sectionTitle!: string;

  // -------- Assessment & adaptations (widgets) --------
  @Input() skillAssessments: SkillAssessment[] = [];
  @Input() adaptations: Adaptation[] = [];

  // -------- Progress metrics (widgets) --------
  @Input() timeSpent?: number;
  @Input() attempts?: number;
  @Input() hintsUsed?: number;
  @Input() successRate?: number; // 0..1

  // -------- Next section preview (widgets) --------
  @Input() nextDifficulty?: 'easy' | 'medium' | 'hard' | 'challenge';
  @Input() estimatedTime?: number;
  @Input() recommendedFocus: string[] = [];

  // -------- UI (widgets) --------
  @Input() ui?: AdaptiveSummaryUI;

  // -------- Callbacks (widgets) --------
  @Input() onAcceptAdaptations?: () => void;
  @Input() onCustomize?: () => void;
  @Input() onContinue?: () => void;

  // -------- Outputs (widgets) --------
  @Output() acceptAdaptations = new EventEmitter<void>();
  @Output() customize = new EventEmitter<void>();
  @Output() continue = new EventEmitter<void>();

  // ==================== LEGACY HEAD API (back-compat) ====================

  // Inputs
  @Input() currentDifficulty: number = 1; // mapped to label via helpers
  @Input() nextDifficultyLevel: number = 1; // renamed to avoid clash; mapped to label
  @Input() sectionProgress: { [sectionId: string]: number } = {};
  @Input() strengths: string[] = [];
  @Input() weaknesses: string[] = [];
  @Input() recommendations: string[] = [];
  @Input() showProgressChart: boolean = true;

  // Outputs
  @Output() difficultyAdjusted = new EventEmitter<number>();
  @Output() sectionSelected = new EventEmitter<string>();
  @Output() recommendationFollowed = new EventEmitter<string>();
  @Output() progressViewed = new EventEmitter<void>();

  // ==================== Constructor ====================
  constructor(
    themeService: ThemeService,
    fontService: FontService,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    super(themeService, fontService, platformId);
  }

  // ==================== WidgetBase hooks ====================
  protected initializeWidgetData(): void {}
  protected validateInput(): boolean { return true; }
  protected processCompletion(): void {}

  // ==================== UI getters ====================
  get variant(): 'default' | 'compact' | 'detailed' {
    return this.ui?.variant ?? 'default';
  }
  get showCharts(): boolean {
    // widgets flag, falls back to legacy showProgressChart
    return this.ui?.showCharts ?? this.showProgressChart ?? true;
  }
  get showRecommendations(): boolean {
    return this.ui?.showRecommendations ?? true;
  }

  // ==================== Difficulty mapping helpers ====================
  /** Map numeric difficulty → label */
  private numToLabel(level: number): 'easy' | 'medium' | 'hard' | 'challenge' {
    if (level <= 1) return 'easy';
    if (level === 2) return 'medium';
    if (level === 3) return 'hard';
    return 'challenge';
  }
  /** Map label → numeric difficulty (1..4) */
  private labelToNum(label?: 'easy' | 'medium' | 'hard' | 'challenge'): number {
    switch (label) {
      case 'easy': return 1;
      case 'medium': return 2;
      case 'hard': return 3;
      case 'challenge': return 4;
      default: return 1;
    }
  }

  /** Effective next difficulty label (widgets) considering legacy numeric input */
  get effectiveNextDifficultyLabel(): 'easy' | 'medium' | 'hard' | 'challenge' | undefined {
    if (this.nextDifficulty) return this.nextDifficulty;
    return this.numToLabel(this.nextDifficultyLevel);
  }

  /** Effective current difficulty label from legacy numeric */
  get effectiveCurrentDifficultyLabel(): 'easy' | 'medium' | 'hard' | 'challenge' {
    return this.numToLabel(this.currentDifficulty);
  }

  // ==================== Presentation helpers ====================
  getAdaptationIconName(type: Adaptation['type']): string {
    switch (type) {
      case 'difficulty': return 'lucideTarget';
      case 'content': return 'lucideTarget';
      case 'pacing': return 'lucideTrendingUp';
      case 'hints': return 'lucideTriangleAlert';
      case 'practice': return 'lucideTarget';
      default: return 'lucideTarget';
    }
  }

  getAdaptationColor(direction: Adaptation['direction']): string {
    switch (direction) {
      case 'increase': return 'text-emerald-500';
      case 'decrease': return 'text-amber-500';
      case 'adjust': return 'text-blue-500';
      default: return 'text-gray-500';
    }
  }

  getDifficultyChipClass(difficulty?: 'easy' | 'medium' | 'hard' | 'challenge'): string {
    switch (difficulty) {
      case 'easy': return 'text-emerald-500 bg-emerald-500/10';
      case 'medium': return 'text-amber-500 bg-amber-500/10';
      case 'hard': return 'text-red-500 bg-red-500/10';
      case 'challenge': return 'text-purple-500 bg-purple-500/10';
      default: return 'text-gray-500 bg-gray-500/10';
    }
  }

  getSkillStatus(skill: SkillAssessment): { status: string; color: string; iconName: string } {
    const diff = skill.currentLevel - skill.targetLevel;
    if (diff >= 0.5) return { status: 'ahead', color: 'text-emerald-500', iconName: 'lucideTrendingUp' };
    if (diff <= -0.5) return { status: 'behind', color: 'text-amber-500', iconName: 'lucideTrendingDown' };
    return { status: 'on-track', color: 'text-blue-500', iconName: 'lucideTarget' };
    }

  // ==================== Actions (widgets + legacy) ====================
  handleCustomize(): void {
    this.onCustomize?.();
    this.customize.emit();
  }

  handleAccept(): void {
    this.onAcceptAdaptations?.();
    this.acceptAdaptations.emit();
  }

  handleContinue(): void {
    this.onContinue?.();
    this.continue.emit();
  }

  // ---- Legacy event facades ----
  adjustDifficulty(newLevel: number): void {
    // legacy emit
    this.difficultyAdjusted.emit(newLevel);
    // also reflect in widgets-facing nextDifficulty
    this.nextDifficulty = this.numToLabel(newLevel);
  }

  selectSection(sectionId: string): void {
    this.sectionSelected.emit(sectionId);
  }

  followRecommendation(rec: string): void {
    this.recommendationFollowed.emit(rec);
  }

  viewProgress(): void {
    this.progressViewed.emit();
  }
}
