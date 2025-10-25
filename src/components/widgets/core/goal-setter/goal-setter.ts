import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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

// ==================== TYPES ====================

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
export class GoalSetterComponent {
  // Core
  @Input() id!: string;
  @Input() context: 'lab' | 'section' | 'general' = 'general';

  // Existing Goals
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

  // Events (callbacks parity)
  @Input() onGoalAdd?: (goal: Omit<LearningGoal, 'id' | 'createdAt' | 'status'>) => void;
  @Input() onGoalUpdate?: (goalId: string, updates: Partial<LearningGoal>) => void;
  @Input() onGoalDelete?: (goalId: string) => void;
  @Input() onGoalComplete?: (goalId: string) => void;

  // Outputs
  @Output() goalAdd = new EventEmitter<Omit<LearningGoal, 'id' | 'createdAt' | 'status'>>();
  @Output() goalUpdate = new EventEmitter<{ goalId: string; updates: Partial<LearningGoal> }>();
  @Output() goalDelete = new EventEmitter<string>();
  @Output() goalComplete = new EventEmitter<string>();

  // Local state
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

  get variant(): 'default' | 'compact' | 'card' {
    return this.ui?.variant || 'default';
  }
  get showProgress(): boolean { return this.ui?.showProgress ?? true; }
  get showPriority(): boolean { return this.ui?.showPriority ?? true; }
  get allowEditing(): boolean { return this.ui?.allowEditing ?? true; }

  // Handlers
  startAdd(): void {
    this.isAddingGoal = true;
  }

  cancelAdd(): void {
    this.isAddingGoal = false;
  }

  handleAddGoal(): void {
    if (!this.newGoal.title.trim()) return;
    const goal: Omit<LearningGoal, 'id' | 'createdAt' | 'status'> = {
      type: this.newGoal.type,
      title: this.newGoal.title,
      description: this.newGoal.description || undefined,
      targetValue: this.newGoal.targetValue,
      deadline: this.newGoal.deadline,
      priority: this.newGoal.priority,
      tags: this.newGoal.tags.length > 0 ? this.newGoal.tags : undefined
    };
    if (this.onGoalAdd) this.onGoalAdd(goal);
    this.goalAdd.emit(goal);
    // reset
    this.newGoal = { type: 'learning', title: '', description: '', targetValue: undefined, deadline: undefined, priority: 'medium', tags: [] };
    this.isAddingGoal = false;
  }

  handleUpdateGoal(goalId: string, updates: Partial<LearningGoal>): void {
    if (this.onGoalUpdate) this.onGoalUpdate(goalId, updates);
    this.goalUpdate.emit({ goalId, updates });
    this.editingGoal = null;
  }

  handleCompleteGoal(goalId: string): void {
    if (this.onGoalComplete) this.onGoalComplete(goalId);
    this.goalComplete.emit(goalId);
  }

  handleDeleteGoal(goalId: string): void {
    if (this.onGoalDelete) this.onGoalDelete(goalId);
    this.goalDelete.emit(goalId);
  }

  setPriority(priority: string): void {
    if (priority === 'low' || priority === 'medium' || priority === 'high') {
      this.newGoal.priority = priority;
    }
  }

  // Helpers
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

  formatDeadline(date: Date): string {
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    if (days < 0) return 'Overdue';
    if (days === 0) return 'Today';
    if (days === 1) return 'Tomorrow';
    return `${days} days`;
  }

  // Counts
  activeGoalsCount(): number {
    return this.goals.filter(g => g.status === 'active').length;
  }

  completedGoalsCount(): number {
    return this.goals.filter(g => g.status === 'completed').length;
  }
}


