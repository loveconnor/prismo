import { Component, Input, Output, EventEmitter, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WidgetBaseComponent } from '../../base/widget-base';
import { FontService } from '../../../../services/font.service';
import { ThemeService } from '../../../../services/theme.service';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  lucideTarget,
  lucidePlus,
  lucideCircleCheck,
  lucidePencil,
  lucideTrash2,
  lucideStar,
  lucideCalendar
} from '@ng-icons/lucide';

/** ==================== HEAD (legacy) TYPES ==================== */
export interface Goal {
  id: string;
  title: string;
  category: string;
  targetDate?: Date;
  completed: boolean;
  progress: number;
}

/** ==================== MODERN TYPES ==================== */
export type GoalType = 'learning' | 'skill' | 'completion' | 'time' | 'custom';
export type GoalStatus = 'active' | 'completed' | 'cancelled' | 'overdue';

export interface LearningGoal {
  id: string;
  type: GoalType;
  title: string;
  description?: string;
  targetValue?: number;
  currentValue?: number;
  deadline?: Date;
  priority: 'low' | 'medium' | 'high';
  status: GoalStatus;
  createdAt: Date;
  tags?: string[];
}

export interface GoalTemplate {
  type: GoalType;
  title: string;
  description: string;
  placeholder?: string;
}

export interface GoalSetterUI {
  variant?: 'default' | 'compact' | 'card';
  showProgress?: boolean;
  showPriority?: boolean;
  allowEditing?: boolean;
}

@Component({
  selector: 'app-goal-setter',
  standalone: true,
  imports: [CommonModule, FormsModule, NgIconComponent],
  providers: [
    provideIcons({
      lucideTarget,
      lucidePlus,
      lucideCircleCheck,
      lucidePencil,
      lucideTrash2,
      lucideStar,
      lucideCalendar
    })
  ],
  templateUrl: './goal-setter.html',
  styleUrls: ['./goal-setter.css']
})
export class GoalSetterComponent extends WidgetBaseComponent {
  /** ==================== MODERN INPUTS ==================== */
  // Core
  @Input() id!: string;
  @Input() context: 'lab' | 'section' | 'general' = 'general';

  // Existing Goals (modern)
  @Input() goals: LearningGoal[] = [];
  @Input() maxGoals: number = 5;

  // UI
  @Input() ui?: GoalSetterUI;

  // Templates
  @Input() goalTemplates: GoalTemplate[] = [
    { type: 'learning', title: 'Master a concept', description: 'Deeply understand a specific topic' },
    { type: 'skill', title: 'Develop a skill', description: 'Practice and improve a technical ability' },
    { type: 'completion', title: 'Complete tasks', description: 'Finish labs, sections, or exercises' },
    { type: 'time', title: 'Time-based goal', description: 'Spend focused time on learning' }
  ];

  // Events (callback-style, parity with React)
  @Input() onGoalAdd?: (goal: Omit<LearningGoal, 'id' | 'createdAt' | 'status'>) => void;
  @Input() onGoalUpdate?: (goalId: string, updates: Partial<LearningGoal>) => void;
  @Input() onGoalDelete?: (goalId: string) => void;
  @Input() onGoalComplete?: (goalId: string) => void;

  /** ==================== MODERN OUTPUTS ==================== */
  @Output() goalAdd = new EventEmitter<Omit<LearningGoal, 'id' | 'createdAt' | 'status'>>();
  @Output() goalUpdate = new EventEmitter<{ goalId: string; updates: Partial<LearningGoal> }>();
  @Output() goalDelete = new EventEmitter<string>();
  @Output() goalComplete = new EventEmitter<string>();

  /** ==================== HEAD (legacy) INPUTS (back-compat) ==================== */
  @Input() currentGoals: Goal[] = [];
  @Input() goalCategories: string[] = ['learning', 'skill', 'project', 'career'];
  @Input() allowCustomCategories: boolean = true;
  @Input() showProgress: boolean = true;
  @Input() enableReminders: boolean = true;

  /** ==================== HEAD (legacy) OUTPUTS (back-compat) ==================== */
  @Output() goalCreated = new EventEmitter<Goal>();
  @Output() goalUpdatedLegacy = new EventEmitter<Goal>();
  @Output() goalDeletedLegacy = new EventEmitter<string>();
  @Output() goalCompletedLegacy = new EventEmitter<string>();
  @Output() progressUpdated = new EventEmitter<{ goalId: string; progress: number }>();

  /** ==================== LOCAL STATE ==================== */
  isAddingGoal = false;
  editingGoal: string | null = null;
  newGoal = {
    type: 'learning' as GoalType,
    title: '',
    description: '',
    targetValue: undefined as number | undefined,
    deadline: undefined as Date | undefined,
    priority: 'medium' as 'low' | 'medium' | 'high',
    tags: [] as string[]
  };

  // Expose Math for template use
  Math = Math;

  /** ==================== DI / BASE ==================== */
  constructor(
    protected override fontService: FontService,
    themeService: ThemeService,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    super(themeService, fontService, platformId);
  }

  /** ==================== GETTERS ==================== */
  get variant(): 'default' | 'compact' | 'card' {
    return this.ui?.variant || 'default';
  }
  get showPriorityUI(): boolean { return this.ui?.showPriority ?? true; }
  get allowEditing(): boolean { return this.ui?.allowEditing ?? true; }

  /** ==================== ACTIONS ==================== */
  startAdd(): void {
    this.isAddingGoal = true;
  }

  cancelAdd(): void {
    this.isAddingGoal = false;
  }

  handleAddGoal(): void {
    if (!this.newGoal.title.trim()) return;

    const payload: Omit<LearningGoal, 'id' | 'createdAt' | 'status'> = {
      type: this.newGoal.type,
      title: this.newGoal.title,
      description: this.newGoal.description || undefined,
      targetValue: this.newGoal.targetValue,
      deadline: this.newGoal.deadline,
      priority: this.newGoal.priority,
      tags: this.newGoal.tags.length > 0 ? this.newGoal.tags : undefined
    };

    // Modern callbacks & outputs
    this.onGoalAdd?.(payload);
    this.goalAdd.emit(payload);

    // Legacy bridge: emit goalCreated using a synthesized Goal
    const legacyGoal: Goal = {
      id: `g_${Date.now()}`,
      title: payload.title,
      category: this.mapTypeToLegacyCategory(payload.type),
      targetDate: payload.deadline,
      completed: false,
      progress: 0
    };
    this.goalCreated.emit(legacyGoal);

    // reset form
    this.newGoal = { type: 'learning', title: '', description: '', targetValue: undefined, deadline: undefined, priority: 'medium', tags: [] };
    this.isAddingGoal = false;
  }

  handleUpdateGoal(goalId: string, updates: Partial<LearningGoal>): void {
    this.onGoalUpdate?.(goalId, updates);
    this.goalUpdate.emit({ goalId, updates });

    // Legacy bridge: if this maps to a legacy goal, emit updated legacy Goal
    const g = this.goals.find(x => x.id === goalId);
    if (g) {
      const merged: LearningGoal = { ...g, ...updates };
      const legacy: Goal = this.toLegacyGoal(merged);
      this.goalUpdatedLegacy.emit(legacy);

      // progress updates (if currentValue/targetValue present)
      if (typeof updates.currentValue === 'number' || typeof merged.currentValue === 'number') {
        const progress = this.computeProgress(merged);
        this.progressUpdated.emit({ goalId: legacy.id, progress });
      }
    }

    this.editingGoal = null;
  }

  handleCompleteGoal(goalId: string): void {
    this.onGoalComplete?.(goalId);
    this.goalComplete.emit(goalId);

    // Legacy bridge
    this.goalCompletedLegacy.emit(goalId);
  }

  handleDeleteGoal(goalId: string): void {
    this.onGoalDelete?.(goalId);
    this.goalDelete.emit(goalId);

    // Legacy bridge
    this.goalDeletedLegacy.emit(goalId);
  }

  setPriority(priority: string): void {
    if (priority === 'low' || priority === 'medium' || priority === 'high') {
      this.newGoal.priority = priority;
    }
  }

  /** ==================== HELPERS ==================== */
  getGoalTypeIconName(type: GoalType): string {
    switch (type) {
      case 'learning': return 'lucideTarget';
      case 'skill': return 'lucideStar';
      case 'completion': return 'lucideCircleCheck';
      case 'time': return 'lucideCalendar';
      case 'custom': return 'lucideTarget';
      default: return 'lucideTarget';
    }
  }

  getGoalTypeColor(type: GoalType): string {
    switch (type) {
      case 'learning': return 'text-blue-500';
      case 'skill': return 'text-emerald-500';
      case 'completion': return 'text-purple-500';
      case 'time': return 'text-amber-500';
      case 'custom': return 'text-gray-500';
      default: return 'text-gray-500';
    }
  }

  getPriorityChip(priority: 'low' | 'medium' | 'high'): string {
    switch (priority) {
      case 'high': return 'text-red-500 bg-red-500/10 border-red-500/20';
      case 'medium': return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
      case 'low': return 'text-green-500 bg-green-500/10 border-green-500/20';
      default: return 'text-gray-500 bg-gray-500/10 border-gray-500/20';
    }
  }

  getStatusColor(status: GoalStatus): string {
    switch (status) {
      case 'completed': return 'text-emerald-500';
      case 'active': return 'text-blue-500';
      case 'cancelled': return 'text-gray-500';
      case 'overdue': return 'text-red-500';
      default: return 'text-gray-500';
    }
  }

  formatDeadline(date?: Date): string {
    if (!date) return '—';
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    if (days < 0) return 'Overdue';
    if (days === 0) return 'Today';
    if (days === 1) return 'Tomorrow';
    return `${days} days`;
  }

  activeGoalsCount(): number {
    return this.goals.filter(g => g.status === 'active').length;
  }

  completedGoalsCount(): number {
    return this.goals.filter(g => g.status === 'completed').length;
  }

  /** ==================== MAPPERS (Legacy <-> Modern) ==================== */
  private mapTypeToLegacyCategory(type: GoalType): string {
    switch (type) {
      case 'learning': return 'learning';
      case 'skill': return 'skill';
      case 'completion': return 'project';
      case 'time': return 'career';
      case 'custom': return 'custom';
      default: return 'learning';
    }
  }

  private toLegacyGoal(g: LearningGoal): Goal {
    return {
      id: g.id,
      title: g.title,
      category: this.mapTypeToLegacyCategory(g.type),
      targetDate: g.deadline,
      completed: g.status === 'completed',
      progress: this.computeProgress(g)
    };
  }

  private computeProgress(g: LearningGoal): number {
    if (typeof g.currentValue === 'number' && typeof g.targetValue === 'number' && g.targetValue > 0) {
      const pct = Math.max(0, Math.min(100, Math.round((g.currentValue / g.targetValue) * 100)));
      return pct;
    }
    // Fallback: completed => 100, active => 0
    return g.status === 'completed' ? 100 : 0;
  }

  /** ==================== WIDGET BASE IMPLEMENTATION ==================== */
  protected initializeWidgetData(): void {
    // No special init required
  }

  protected validateInput(): boolean {
    // Always valid
    return true;
  }

  protected processCompletion(): void {
    // No-op
  }
}
