import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  lucideRotateCcw,
  lucideCircleCheck,
  lucideClock,
  lucideTarget,
  lucideTrendingUp
} from '@ng-icons/lucide';
import { WidgetBaseComponent } from '../../base/widget-base';
import { ThemeService } from '../../../../services/theme.service';
import { FontService } from '../../../../services/font.service';

/* ==================== TOP-LEVEL TYPES (no nesting in class) ==================== */

/** Legacy (HEAD) type */
export interface PracticeQuestion {
  id: string;
  question: string;
  type: 'multiple-choice' | 'short-answer' | 'coding';
  difficulty: number;         // 1..n
  skillId: string;
}

/** Modern (widgets) types */
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
  timeLimit?: number;      // minutes
  completedAt?: Date;
}

export interface ReviewLoopUI {
  variant?: 'default' | 'compact' | 'gamified';
  showProgress?: boolean;
  showTimer?: boolean;
  showExplanations?: boolean;
}

/* ==================== COMPONENT ==================== */

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
export class ReviewLoopComponent extends WidgetBaseComponent implements OnInit, OnDestroy {
  /* ==================== MODERN INPUTS ==================== */
  @Input() id!: string;
  @Input() weakSkills: string[] = [];
  @Input() reviewMode: ReviewMode = 'adaptive';
  @Input() questionsPerSkill: number = 3;
  @Input() timeLimit?: number; // minutes
  @Input() targetAccuracy: number = 0.8;
  @Input() questionPool: ReviewQuestion[] = [];
  @Input() ui?: ReviewLoopUI;
  @Input() onSessionStart?: () => void;
  @Input() onQuestionAnswer?: (questionId: string, isCorrect: boolean) => void;
  @Input() onSessionComplete?: (results: ReviewSession) => void;
  @Input() onRetrySkill?: (skillTag: string) => void;
  @Input() a11yLabel?: string;

  /* ==================== LEGACY (HEAD) INPUTS — BACK-COMPAT ==================== */
  @Input() practiceQuestions: PracticeQuestion[] = [];
  @Input() adaptiveLevel: number = 1;
  @Input() questionsPerSession: number = 5;
  @Input() showProgressLegacy: boolean = true;
  @Input() enableSpacedRepetition: boolean = true;

  /* ==================== MODERN OUTPUTS ==================== */
  @Output() sessionStart = new EventEmitter<void>();
  @Output() questionAnswer = new EventEmitter<{ questionId: string; isCorrect: boolean }>();
  @Output() sessionComplete = new EventEmitter<ReviewSession>();
  @Output() retrySkillEvent = new EventEmitter<string>();

  /* ==================== LEGACY (HEAD) OUTPUTS — BACK-COMPAT ==================== */
  @Output() questionAnswered = new EventEmitter<{ questionId: string; correct: boolean }>();
  @Output() sessionCompleted = new EventEmitter<{ correct: number; total: number }>();
  @Output() skillImproved = new EventEmitter<string>();
  @Output() levelAdjusted = new EventEmitter<number>();

  /* ==================== STATE ==================== */
  currentSession: ReviewSession | null = null;
  currentQuestionIndex = 0;
  userAnswers: Record<string, string | string[]> = {};
  showResults = false;
  timeRemaining: number | null = null; // seconds
  startTime: Date | null = null;

  private timerHandle: any = null;

  /* ==================== UI COMPUTEDS ==================== */
  get variant(): 'default' | 'compact' | 'gamified' {
    return this.ui?.variant || 'default';
  }
  get showProgress(): boolean {
    // prefer modern UI flag, fall back to legacy
    return this.ui?.showProgress ?? this.showProgressLegacy ?? true;
  }
  get showTimer(): boolean { return this.ui?.showTimer ?? true; }
  get showExplanations(): boolean { return this.ui?.showExplanations ?? true; }

  /* ==================== LIFECYCLE ==================== */
  constructor(
    themeService: ThemeService,
    fontService: FontService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    super(themeService, fontService, platformId);
  }

  override ngOnInit(): void {
    super.ngOnInit();
    // If there is no modern pool but we have legacy practiceQuestions, build a minimal pool
    if ((!this.questionPool || this.questionPool.length === 0) && this.practiceQuestions?.length) {
      this.questionPool = this.convertLegacyQuestions(this.practiceQuestions);
      // If weakSkills not set, infer from legacy questions
      if (!this.weakSkills?.length) {
        this.weakSkills = Array.from(new Set(this.practiceQuestions.map(q => q.skillId)));
      }
      // If questionsPerSkill looks unset, derive from questionsPerSession
      if (!this.questionsPerSkill && this.questionsPerSession > 0 && this.weakSkills.length > 0) {
        this.questionsPerSkill = Math.max(1, Math.floor(this.questionsPerSession / this.weakSkills.length));
      }
    }
  }

  override ngOnDestroy(): void {
    this.clearTimer();
    super.ngOnDestroy();
  }

  /* ==================== ABSTRACT HOOKS FROM WIDGET BASE ==================== */
  protected override initializeWidgetData(): void {
    this.setDataValue('initialized_at', new Date());
  }

  protected override validateInput(): boolean {
    // Basic sanity: we need a pool or legacy questions
    return (this.questionPool && this.questionPool.length > 0) || (this.practiceQuestions && this.practiceQuestions.length > 0);
  }

  protected override processCompletion(): void {
    this.setDataValue('completed_at', new Date());
  }

  /* ==================== SESSION HANDLERS ==================== */

  startReviewSession(): void {
    const sessionQuestions: ReviewQuestion[] = [];

    if (this.reviewMode === 'spaced' && this.enableSpacedRepetition) {
      // Simple spaced heuristic: prefer questions least recently reviewed & lowest accuracy
      const pool = [...this.questionPool];
      pool.sort((a, b) => {
        const aAcc = a.timesAttempted > 0 ? a.timesCorrect / a.timesAttempted : 0;
        const bAcc = b.timesAttempted > 0 ? b.timesCorrect / b.timesAttempted : 0;
        const aLast = a.lastReviewed ? a.lastReviewed.getTime() : 0;
        const bLast = b.lastReviewed ? b.lastReviewed.getTime() : 0;
        // lower accuracy first, older lastReviewed first
        if (aAcc !== bAcc) return aAcc - bAcc;
        return aLast - bLast;
      });
      const total = this.questionsPerSkill * Math.max(1, this.weakSkills.length || 1);
      sessionQuestions.push(...pool.slice(0, total));
    } else {
      // Adaptive/intensive: pick per skill by lowest accuracy first
      this.weakSkills.forEach(skill => {
        const skillQuestions = this.questionPool
          .filter(q => q.skillTag === skill)
          .sort((a, b) => {
            const aAcc = a.timesAttempted > 0 ? a.timesCorrect / a.timesAttempted : 0;
            const bAcc = b.timesAttempted > 0 ? b.timesCorrect / b.timesAttempted : 0;
            return aAcc - bAcc;
          })
          .slice(0, this.questionsPerSkill);

        sessionQuestions.push(...skillQuestions);
      });
    }

    const session: ReviewSession = {
      id: `session-${Date.now()}`,
      skillTags: this.weakSkills.length ? this.weakSkills : Array.from(new Set(this.questionPool.map(q => q.skillTag))),
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

    this.onSessionStart?.();
    this.sessionStart.emit();
  }

  handleAnswer(questionId: string, answer: string | string[]): void {
    this.userAnswers = { ...this.userAnswers, [questionId]: answer };

    const question = this.currentSession?.questions.find(q => q.id === questionId);
    if (!question) return;

    const isCorrect = Array.isArray(question.correctAnswer)
      ? Array.isArray(answer) && this.arraysEqual([...answer].sort(), [...(question.correctAnswer as string[])].sort())
      : answer === question.correctAnswer;

    // Modern + legacy parity
    this.onQuestionAnswer?.(questionId, isCorrect);
    this.questionAnswer.emit({ questionId, isCorrect });
    this.questionAnswered.emit({ questionId, correct: isCorrect });
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

    // Legacy summary emit
    const summary = this.calculateSessionResults();
    if (summary) {
      this.sessionCompleted.emit({
        correct: summary.correctCount,
        total: summary.totalQuestions
      });

      // Simple “skill improved” and “level adjusted” heuristics for back-compat
      summary.skillResults.forEach(s => {
        if (s.accuracy >= this.targetAccuracy) {
          this.skillImproved.emit(s.skill);
        }
      });
      // Emit an adjusted level (bounded between 1 and 10) when overall accuracy is high/low
      const newLevel = Math.max(1, Math.min(10,
        this.adaptiveLevel + (summary.overallAccuracy >= this.targetAccuracy ? 1 : (summary.overallAccuracy < 0.5 ? -1 : 0))
      ));
      if (newLevel !== this.adaptiveLevel) this.levelAdjusted.emit(newLevel);
    }

    // Modern emits
    this.onSessionComplete?.(completedSession);
    this.sessionComplete.emit(completedSession);

    // Mark widget completed
    this.completeWidget();
  }

  retrySkill(skillTag: string): void {
    this.onRetrySkill?.(skillTag);
    this.retrySkillEvent.emit(skillTag);
    this.currentSession = null;
    this.currentQuestionIndex = 0;
    this.userAnswers = {};
    this.showResults = false;
    this.timeRemaining = null;
    this.startTime = null;
    this.clearTimer();
  }

  /* ==================== RESULTS / HELPERS ==================== */

  private arraysEqual(a: any[], b: any[]): boolean {
    if (a.length !== b.length) return false;
    return a.every((val, index) => val === b[index]);
  }

  /** Convert legacy PracticeQuestion[] -> minimal ReviewQuestion[] */
  private convertLegacyQuestions(src: PracticeQuestion[]): ReviewQuestion[] {
    return src.map<ReviewQuestion>(q => ({
      id: q.id,
      type: q.type === 'multiple-choice' ? 'multiple-choice' : (q.type === 'short-answer' ? 'short-answer' : 'short-answer'),
      question: q.question,
      options: q.type === 'multiple-choice' ? [] : undefined, // unknown; author can provide in modern pool
      correctAnswer: '', // unknown in legacy; treat as author-supplied later
      explanation: undefined,
      skillTag: q.skillId,
      difficulty: q.difficulty <= 1 ? 'easy' : (q.difficulty <= 3 ? 'medium' : 'hard'),
      lastReviewed: undefined,
      timesCorrect: 0,
      timesAttempted: 0
    }));
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
        ? Array.isArray(userAnswer) && this.arraysEqual(
            [...(userAnswer as string[])].sort(),
            [...(question.correctAnswer as string[])].sort()
          )
        : userAnswer === question.correctAnswer;

      return {
        questionId: question.id,
        skillTag: question.skillTag,
        isCorrect,
        timeSpent: this.startTime ? (new Date().getTime() - this.startTime.getTime()) / 1000 : 0
      };
    });

    const correctCount = results.filter(r => (r as any).isCorrect).length;
    const accuracy = this.currentSession.questions.length > 0
      ? correctCount / this.currentSession.questions.length
      : 0;

    const skillResults = (this.weakSkills.length
      ? this.weakSkills
      : Array.from(new Set(this.currentSession.questions.map(q => q.skillTag)))
    ).map(skill => {
      const skillResultsForTag = results.filter(r => (r as any).skillTag === skill);
      const skillCorrect = skillResultsForTag.filter(r => (r as any).isCorrect).length;
      const total = skillResultsForTag.length || 1;
      const skillAccuracy = skillCorrect / total;
      return {
        skill,
        correct: skillCorrect,
        total,
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

  // Template-safe helpers
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

  /* ==================== TIMER ==================== */

  private startTimer(): void {
    this.clearTimer();
    if (!isPlatformBrowser(this.platformId)) return;
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
