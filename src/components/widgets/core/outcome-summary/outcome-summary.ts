import {
  Component,
  Input,
  Output,
  EventEmitter
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  lucideTrophy,
  lucideTarget,
  lucideStar,
  lucideTrendingUp,
  lucideChevronRight,
  lucideCircleCheck,
  lucideClock
} from '@ng-icons/lucide';

// ==================== TYPES ====================

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
      lucideClock
    })
  ],
  templateUrl: './outcome-summary.html',
  styleUrls: ['./outcome-summary.css']
})
export class OutcomeSummaryComponent {
  // Core
  @Input() id!: string;
  @Input() labId!: string;
  @Input() labTitle!: string;

  // Results
  @Input() outcomeType: OutcomeType = 'completion';
  @Input() completionPercent: number = 100;
  @Input() timeSpent?: number; // minutes
  @Input() attempts?: number;
  @Input() score?: number; // 0-1

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

  // Events (callbacks parity)
  @Input() onNextLabSelect?: (labId: string) => void;
  @Input() onReviewSelect?: (topic: string) => void;
  @Input() onShare?: () => void;

  // Outputs
  @Output() nextLabSelect = new EventEmitter<string>();
  @Output() reviewSelect = new EventEmitter<string>();
  @Output() share = new EventEmitter<void>();

  // Local state
  expandedSections: Set<string> = new Set(['summary']);

  // ==================== UI HELPERS ====================
  get variant(): 'default' | 'compact' | 'celebration' {
    return this.ui?.variant || 'default';
  }

  get showSkillProgress(): boolean {
    return this.ui?.showSkillProgress ?? true;
  }

  get showNextSteps(): boolean {
    return this.ui?.showNextSteps ?? true;
  }

  toggleSection(section: string): void {
    const updated = new Set(this.expandedSections);
    if (updated.has(section)) updated.delete(section); else updated.add(section);
    this.expandedSections = updated;
  }

  getOutcomeColor(): string {
    switch (this.outcomeType) {
      case 'completion':
        return 'text-emerald-500';
      case 'mastery':
        return 'text-yellow-500';
      case 'review':
        return 'text-blue-500';
      case 'assessment':
        return 'text-purple-500';
      default:
        return 'text-emerald-500';
    }
  }

  getDifficultyColor(difficulty: string): string {
    switch (difficulty) {
      case 'easy':
        return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
      case 'medium':
        return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
      case 'hard':
        return 'text-red-500 bg-red-500/10 border-red-500/20';
      default:
        return 'text-gray-500 bg-gray-500/10 border-gray-500/20';
    }
  }

  // Icon name for outcome
  outcomeIconName(): string {
    switch (this.outcomeType) {
      case 'completion':
        return 'lucideTrophy';
      case 'mastery':
        return 'lucideStar';
      case 'review':
        return 'lucideTrendingUp';
      case 'assessment':
        return 'lucideTarget';
      default:
        return 'lucideTrophy';
    }
  }

  // Event wrappers
  handleNextLabSelect(labId: string): void {
    if (this.onNextLabSelect) this.onNextLabSelect(labId);
    this.nextLabSelect.emit(labId);
  }

  handleReviewSelect(topic: string): void {
    if (this.onReviewSelect) this.onReviewSelect(topic);
    this.reviewSelect.emit(topic);
  }

  handleShare(): void {
    if (this.onShare) this.onShare();
    this.share.emit();
  }
}


