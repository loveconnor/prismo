import { Component, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  lucideRotateCcw,
  lucideCircleCheck,
  lucideClock,
  lucideTarget,
  lucideTrendingUp
} from '@ng-icons/lucide';

// ==================== TYPES ====================

export type ReviewMode = 'spaced' | 'intensive' | 'adaptive';
export type QuestionType = 'multiple-choice' | 'short-answer' | 'true-false' | 'matching';

export interface ReviewQuestion {
  id: string;
  type: QuestionType;
  question: string;
  options?: string[];
  correctAnswer: string | string[];
  explanation?: string;
  skillTag: string;
  difficulty: 'easy' | 'medium' | 'hard';
  lastReviewed?: Date;
  timesCorrect: number;
  timesAttempted: number;
}

export interface ReviewSession {
  id: string;
  skillTags: string[];
  questions: ReviewQuestion[];
  mode: ReviewMode;
  targetAccuracy: number;
  timeLimit?: number;
  completedAt?: Date;
}

export interface ReviewLoopUI {
  variant?: 'default' | 'compact' | 'gamified';
  showProgress?: boolean;
  showTimer?: boolean;
  showExplanations?: boolean;
}

@Component({
  selector: 'app-review-loop',
  standalone: true,
  imports: [CommonModule, FormsModule, NgIconComponent],
  providers: [
    provideIcons({
      lucideRotateCcw,
      lucideCircleCheck,
      lucideClock,
      lucideTarget,
      lucideTrendingUp
    })
  ],
  templateUrl: './review-loop.html',
  styleUrls: ['./review-loop.css']
})
export class ReviewLoopComponent implements OnDestroy {
  // Core
  @Input() id!: string;
  @Input() weakSkills: string[] = [];

  // Session Config
  @Input() reviewMode: ReviewMode = 'adaptive';
  @Input() questionsPerSkill: number = 3;
  @Input() timeLimit?: number; // minutes
  @Input() targetAccuracy: number = 0.8;

  // Question Pool
  @Input() questionPool: ReviewQuestion[] = [];

  // UI
  @Input() ui?: ReviewLoopUI;

  // Events (callbacks for parity with React props)
  @Input() onSessionStart?: () => void;
  @Input() onQuestionAnswer?: (questionId: string, isCorrect: boolean) => void;
  @Input() onSessionComplete?: (results: ReviewSession) => void;
  @Input() onRetrySkill?: (skillTag: string) => void;

  // Accessibility
  @Input() a11yLabel?: string;

  // Outputs
  @Output() sessionStart = new EventEmitter<void>();
  @Output() questionAnswer = new EventEmitter<{ questionId: string; isCorrect: boolean }>();
  @Output() sessionComplete = new EventEmitter<ReviewSession>();
  @Output() retrySkillEvent = new EventEmitter<string>();

  // State
  currentSession: ReviewSession | null = null;
  currentQuestionIndex = 0;
  userAnswers: Record<string, string | string[]> = {};
  showResults = false;
  timeRemaining: number | null = null; // seconds
  startTime: Date | null = null;

  private timerHandle: any = null;

  get variant(): 'default' | 'compact' | 'gamified' {
    return this.ui?.variant || 'default';
  }
  get showProgress(): boolean { return this.ui?.showProgress ?? true; }
  get showTimer(): boolean { return this.ui?.showTimer ?? true; }
  get showExplanations(): boolean { return this.ui?.showExplanations ?? true; }

  ngOnDestroy(): void {
    this.clearTimer();
  }

  // ==================== HANDLERS ====================

  startReviewSession(): void {
    const sessionQuestions: ReviewQuestion[] = [];

    this.weakSkills.forEach(skill => {
      const skillQuestions = this.questionPool
        .filter(q => q.skillTag === skill)
        .sort((a, b) => {
          const aAccuracy = a.timesAttempted > 0 ? a.timesCorrect / a.timesAttempted : 0;
          const bAccuracy = b.timesAttempted > 0 ? b.timesCorrect / b.timesAttempted : 0;
          return aAccuracy - bAccuracy;
        })
        .slice(0, this.questionsPerSkill);

      sessionQuestions.push(...skillQuestions);
    });

    const session: ReviewSession = {
      id: `session-${Date.now()}`,
      skillTags: this.weakSkills,
      questions: sessionQuestions,
      mode: this.reviewMode,
      targetAccuracy: this.targetAccuracy,
      timeLimit: this.timeLimit
    };

    this.currentSession = session;
    this.currentQuestionIndex = 0;
    this.userAnswers = {};
    this.showResults = false;
    this.startTime = new Date();

    if (this.timeLimit) {
      this.timeRemaining = this.timeLimit * 60; // minutes to seconds
      this.startTimer();
    } else {
      this.timeRemaining = null;
      this.clearTimer();
    }

    if (this.onSessionStart) this.onSessionStart();
    this.sessionStart.emit();
  }

  handleAnswer(questionId: string, answer: string | string[]): void {
    this.userAnswers = { ...this.userAnswers, [questionId]: answer };

    const question = this.currentSession?.questions.find(q => q.id === questionId);
    if (!question) return;

    const isCorrect = Array.isArray(question.correctAnswer)
      ? Array.isArray(answer) && this.arraysEqual([...answer].sort(), [...(question.correctAnswer as string[])].sort())
      : answer === question.correctAnswer;

    if (this.onQuestionAnswer) this.onQuestionAnswer(questionId, isCorrect);
    this.questionAnswer.emit({ questionId, isCorrect });
  }

  nextQuestion(): void {
    if (!this.currentSession) return;
    if (this.currentQuestionIndex < this.currentSession.questions.length - 1) {
      this.currentQuestionIndex += 1;
    } else {
      this.handleSessionComplete();
    }
  }

  handleSessionComplete(): void {
    if (!this.currentSession || !this.startTime) return;

    const completedSession: ReviewSession = {
      ...this.currentSession,
      completedAt: new Date()
    };

    this.showResults = true;
    this.clearTimer();

    if (this.onSessionComplete) this.onSessionComplete(completedSession);
    this.sessionComplete.emit(completedSession);
  }

  retrySkill(skillTag: string): void {
    if (this.onRetrySkill) this.onRetrySkill(skillTag);
    this.retrySkillEvent.emit(skillTag);
    this.currentSession = null;
    this.currentQuestionIndex = 0;
    this.userAnswers = {};
    this.showResults = false;
    this.timeRemaining = null;
    this.startTime = null;
    this.clearTimer();
  }

  // ==================== HELPERS ====================

  private arraysEqual(a: any[], b: any[]): boolean {
    if (a.length !== b.length) return false;
    return a.every((val, index) => val === b[index]);
  }

  getQuestionAccuracy(question: ReviewQuestion): number {
    return question.timesAttempted > 0 ? question.timesCorrect / question.timesAttempted : 0;
  }

  calculateSessionResults(): {
    overallAccuracy: number;
    correctCount: number;
    totalQuestions: number;
    skillResults: { skill: string; correct: number; total: number; accuracy: number; needsRetry: boolean }[];
    timeSpent: number;
  } | null {
    if (!this.currentSession) return null;

    const results = this.currentSession.questions.map(question => {
      const userAnswer = this.userAnswers[question.id];
      const isCorrect = Array.isArray(question.correctAnswer)
        ? Array.isArray(userAnswer) && this.arraysEqual([...userAnswer].sort(), [...(question.correctAnswer as string[])].sort())
        : userAnswer === question.correctAnswer;

      return {
        questionId: question.id,
        skillTag: question.skillTag,
        isCorrect,
        timeSpent: this.startTime ? (new Date().getTime() - this.startTime.getTime()) / 1000 : 0
      };
    });

    const correctCount = results.filter(r => (r as any).isCorrect).length;
    const accuracy = correctCount / this.currentSession.questions.length;

    const skillResults = this.weakSkills.map(skill => {
      const skillResultsForTag = results.filter(r => (r as any).skillTag === skill);
      const skillCorrect = skillResultsForTag.filter(r => (r as any).isCorrect).length;
      const skillAccuracy = skillCorrect / (skillResultsForTag.length || 1);
      return {
        skill,
        correct: skillCorrect,
        total: skillResultsForTag.length,
        accuracy: skillAccuracy,
        needsRetry: skillAccuracy < this.targetAccuracy
      };
    });

    return {
      overallAccuracy: accuracy,
      correctCount,
      totalQuestions: this.currentSession.questions.length,
      skillResults,
      timeSpent: this.startTime ? (new Date().getTime() - this.startTime.getTime()) / 1000 : 0
    };
  }

  // Template-safe helpers (avoid arrow functions in templates)
  needsRetryCount(): number {
    const r = this.calculateSessionResults();
    if (!r || !r.skillResults) return 0;
    return r.skillResults.filter(s => s.needsRetry).length;
  }

  isSelectedAnswer(questionId: string, option: string): boolean {
    return (this.userAnswers[questionId] as string) === option;
  }

  isSelectedTF(questionId: string, tf: string): boolean {
    return (this.userAnswers[questionId] as string) === tf;
  }

  formatTime(totalSeconds: number): string {
    const mins = Math.floor(totalSeconds / 60);
    const secs = Math.floor(totalSeconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  private startTimer(): void {
    this.clearTimer();
    if (!this.timeRemaining || this.timeRemaining <= 0) return;
    this.timerHandle = setInterval(() => {
      if (this.timeRemaining === null) return;
      if (this.timeRemaining <= 1) {
        this.timeRemaining = 0;
        this.handleSessionComplete();
        this.clearTimer();
      } else {
        this.timeRemaining = this.timeRemaining - 1;
      }
    }, 1000);
  }

  private clearTimer(): void {
    if (this.timerHandle) {
      clearInterval(this.timerHandle);
      this.timerHandle = null;
    }
  }
}


