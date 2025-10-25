import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  lucideTrendingUp,
  lucideTrendingDown,
  lucideTarget,
  lucideChevronRight,
  lucideTriangleAlert
} from '@ng-icons/lucide';

// ==================== TYPES ====================

export type AdaptationReason = 'struggling' | 'excelling' | 'time_pressure' | 'concept_gaps' | 'engagement';

export interface SkillAssessment {
  skill: string;
  currentLevel: number;
  targetLevel: number;
  confidence: number;
  recentPerformance: number[];
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
export class AdaptiveSummaryComponent {
  // Core
  @Input() id!: string;
  @Input() sectionId!: string;
  @Input() sectionTitle!: string;

  // Assessment Data
  @Input() skillAssessments: SkillAssessment[] = [];
  @Input() adaptations: Adaptation[] = [];

  // Progress Metrics
  @Input() timeSpent?: number;
  @Input() attempts?: number;
  @Input() hintsUsed?: number;
  @Input() successRate?: number;

  // Next Section Preview
  @Input() nextDifficulty?: 'easy' | 'medium' | 'hard' | 'challenge';
  @Input() estimatedTime?: number;
  @Input() recommendedFocus: string[] = [];

  // UI
  @Input() ui?: AdaptiveSummaryUI;

  // Events (callbacks for parity)
  @Input() onAcceptAdaptations?: () => void;
  @Input() onCustomize?: () => void;
  @Input() onContinue?: () => void;

  // Outputs
  @Output() acceptAdaptations = new EventEmitter<void>();
  @Output() customize = new EventEmitter<void>();
  @Output() continue = new EventEmitter<void>();

  expandedSections: Set<string> = new Set(['overview']);

  get showCharts(): boolean {
    return this.ui?.showCharts ?? true;
  }

  get showRecommendations(): boolean {
    return this.ui?.showRecommendations ?? true;
  }

  toggleSection(section: string): void {
    const updated = new Set(this.expandedSections);
    if (updated.has(section)) updated.delete(section); else updated.add(section);
    this.expandedSections = updated;
  }

  getAdaptationIconName(type: Adaptation['type']): string {
    switch (type) {
      case 'difficulty':
        return 'lucideTarget';
      case 'content':
        return 'lucideTarget';
      case 'pacing':
        return 'lucideTrendingUp';
      case 'hints':
        return 'lucideTriangleAlert';
      case 'practice':
        return 'lucideTarget';
      default:
        return 'lucideTarget';
    }
  }

  getAdaptationColor(direction: Adaptation['direction']): string {
    switch (direction) {
      case 'increase':
        return 'text-emerald-500';
      case 'decrease':
        return 'text-amber-500';
      case 'adjust':
        return 'text-blue-500';
      default:
        return 'text-gray-500';
    }
  }

  getDifficultyColor(difficulty?: string): string {
    switch (difficulty) {
      case 'easy':
        return 'text-emerald-500 bg-emerald-500/10';
      case 'medium':
        return 'text-amber-500 bg-amber-500/10';
      case 'hard':
        return 'text-red-500 bg-red-500/10';
      case 'challenge':
        return 'text-purple-500 bg-purple-500/10';
      default:
        return 'text-gray-500 bg-gray-500/10';
    }
  }

  getSkillStatus(skill: SkillAssessment): { status: string; color: string; iconName: string } {
    const diff = skill.currentLevel - skill.targetLevel;
    if (diff >= 0.5) return { status: 'ahead', color: 'text-emerald-500', iconName: 'lucideTrendingUp' };
    if (diff <= -0.5) return { status: 'behind', color: 'text-amber-500', iconName: 'lucideTrendingDown' };
    return { status: 'on-track', color: 'text-blue-500', iconName: 'lucideTarget' };
  }

  // Event wrappers
  handleCustomize(): void {
    if (this.onCustomize) this.onCustomize();
    this.customize.emit();
  }

  handleAccept(): void {
    if (this.onAcceptAdaptations) this.onAcceptAdaptations();
    this.acceptAdaptations.emit();
  }

  handleContinue(): void {
    if (this.onContinue) this.onContinue();
    this.continue.emit();
  }
}


