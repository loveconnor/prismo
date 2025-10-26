import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  Inject,
  PLATFORM_ID,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { WidgetBaseComponent } from '../../base/widget-base';
import { ThemeService } from '../../../../services/theme.service';
import { FontService } from '../../../../services/font.service';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  lucideTrendingUp,
  lucideClock,
  lucideZap,
  lucideCircleHelp,
  lucideCircleCheck,
  lucideCircleX
} from '@ng-icons/lucide';
import { cn } from '../../../../lib/utils';
import { ComplexityGraphComponent, ComplexityType } from './complexity-graph';

// ==================== TYPES ====================

export type ComplexityLevel =
  | 'constant'
  | 'logarithmic'
  | 'linear'
  | 'quadratic'
  | 'cubic'
  | 'exponential'
  | 'factorial';

export type ComplexityCategory = 'time' | 'space';

export interface ComplexityOption {
  level: ComplexityLevel;
  name: string;
  description: string;
  bigO: string;
  examples: string[];
  commonMistakes?: string[];
}

export interface ComplexityPromptUI {
  variant?: 'default' | 'compact';
  showExamples?: boolean;
  showHints?: boolean;
  showGraph?: boolean;
}

@Component({
  selector: 'app-complexity-prompt',
  standalone: true,
  imports: [CommonModule, NgIconComponent, ComplexityGraphComponent],
  providers: [
    provideIcons({
      lucideTrendingUp,
      lucideClock,
      lucideZap,
      lucideCircleHelp,
      lucideCircleCheck,
      lucideCircleX
    })
  ],
  templateUrl: './complexity-prompt.html',
  styleUrls: ['./complexity-prompt.css']
})
export class ComplexityPromptComponent extends WidgetBaseComponent implements OnInit {
  // ==================== INPUTS ====================

  @Input() id!: string;
  @Input() question!: string;

  // Context
  @Input() codeSnippet?: string;
  @Input() language: string = 'javascript';
  @Input() category: ComplexityCategory = 'time';

  // Options
  @Input() complexityOptions: ComplexityOption[] = [
    {
      level: 'constant',
      name: 'Constant Time',
      description: "Execution time doesn't depend on input size",
      bigO: 'O(1)',
      examples: ['Array access by index', 'Simple arithmetic operations', 'Hash table lookup'],
      commonMistakes: ['Thinking any single operation is O(1)']
    },
    {
      level: 'logarithmic',
      name: 'Logarithmic Time',
      description: 'Execution time grows logarithmically with input size',
      bigO: 'O(log n)',
      examples: ['Binary search', 'Balanced binary search trees', 'Finding elements in sorted arrays'],
      commonMistakes: ['Confusing with linear search']
    },
    {
      level: 'linear',
      name: 'Linear Time',
      description: 'Execution time grows linearly with input size',
      bigO: 'O(n)',
      examples: ['Simple loops through arrays', 'Linear search', 'Counting elements'],
      commonMistakes: ['Forgetting nested loops create higher complexity']
    },
    {
      level: 'quadratic',
      name: 'Quadratic Time',
      description: 'Execution time grows quadratically with input size',
      bigO: 'O(n²)',
      examples: ['Nested loops', 'Bubble sort', 'Checking all pairs in a collection'],
      commonMistakes: ['Thinking one nested loop is still O(n)']
    },
    {
      level: 'cubic',
      name: 'Cubic Time',
      description: 'Execution time grows cubically with input size',
      bigO: 'O(n³)',
      examples: ['Triple nested loops', 'Matrix multiplication (naive)', '3D grid traversals'],
      commonMistakes: ['Rarely needed - usually indicates algorithmic inefficiency']
    },
    {
      level: 'exponential',
      name: 'Exponential Time',
      description: 'Execution time grows exponentially with input size',
      bigO: 'O(2^n)',
      examples: ['Recursive fibonacci without memoization', 'Subset generation', 'Brute force solutions'],
      commonMistakes: ['Acceptable only for very small inputs']
    },
    {
      level: 'factorial',
      name: 'Factorial Time',
      description: 'Execution time grows factorially with input size',
      bigO: 'O(n!)',
      examples: ['Generating all permutations', 'Traveling salesman (brute force)', 'Solving N-queens'],
      commonMistakes: ['Almost always too slow - look for better algorithms']
    }
  ];

  // User Answer and behavior
  @Input() userAnswer?: ComplexityLevel;
  @Input() showFeedback: boolean = false;
  @Input() ui: ComplexityPromptUI = {};
  @Input() allowMultipleAttempts: boolean = true;
  @Input() showCorrectAnswer: boolean = false;

  // Accessibility
  @Input() a11yLabel?: string;

  // Callback-style events (optional to mirror React API)
  @Input() onAnswer?: (answer: ComplexityLevel, isCorrect: boolean) => void;
  @Input() onHintRequest?: () => void;

  // Angular event emitters
  @Output() answerSelected = new EventEmitter<{ answer: ComplexityLevel; isCorrect: boolean }>();
  @Output() hintRequested = new EventEmitter<void>();

  // ==================== STATE ====================
  selectedAnswer = signal<ComplexityLevel | null>(null);
  attempts = signal<number>(0);
  showHint = signal<boolean>(false);

  // ==================== LIFECYCLE ====================
  constructor(
    themeService: ThemeService,
    fontService: FontService,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    super(themeService, fontService, platformId);
  }

  override ngOnInit(): void {
    super.ngOnInit();
    if (this.userAnswer) this.selectedAnswer.set(this.userAnswer);
  }

  // ==================== ABSTRACT METHOD IMPLEMENTATIONS ====================
  protected initializeWidgetData(): void {
    // No async setup required for now
  }

  protected validateInput(): boolean {
    return this.selectedAnswer() !== null;
  }

  protected processCompletion(): void {
    // Completion is processed when a correct answer is selected (demo behavior)
  }

  // ==================== COMPUTED/HELPERS ====================
  get variant(): 'default' | 'compact' { return this.ui.variant ?? 'default'; }
  get showExamples(): boolean { return this.ui.showExamples ?? true; }
  get showHints(): boolean { return this.ui.showHints ?? true; }
  get showGraph(): boolean { return this.ui.showGraph ?? false; }
  get showAnswer(): boolean { return this.showFeedback && this.selectedAnswer() !== null; }

  get correctAnswer(): ComplexityLevel {
    // Demo logic: default to the 3rd option (linear) if present
    return this.complexityOptions[2]?.level || 'linear';
  }

  levelToComplexityType(level: ComplexityLevel): ComplexityType {
    switch (level) {
      case 'constant': return 'O(1)';
      case 'logarithmic': return 'O(log n)';
      case 'linear': return 'O(n)';
      case 'quadratic': return 'O(n²)';
      case 'cubic': return 'O(n³)';
      case 'exponential': return 'O(2^n)';
      case 'factorial': return 'O(n!)';
      default: return 'O(1)';
    }
  }

  complexityToLevel(complexity: ComplexityType): ComplexityLevel | null {
    const map: Record<ComplexityType, ComplexityLevel> = {
      'O(1)': 'constant',
      'O(log n)': 'logarithmic',
      'O(n)': 'linear',
      'O(n²)': 'quadratic',
      'O(n³)': 'cubic',
      'O(2^n)': 'exponential',
      'O(n!)': 'factorial'
    };
    return map[complexity] || null;
  }

  getComplexityColor(level: ComplexityLevel): string {
    switch (level) {
      case 'constant': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
      case 'logarithmic': return 'text-blue-500 bg-primary-strong/10 border-blue-500/20';
      case 'linear': return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
      case 'quadratic': return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
      case 'cubic': return 'text-red-500 bg-red-500/10 border-red-500/20';
      case 'exponential': return 'text-purple-500 bg-purple-500/10 border-purple-500/20';
      case 'factorial': return 'text-pink-500 bg-pink-500/10 border-pink-500/20';
      default: return 'text-gray-500 bg-gray-500/10 border-gray-500/20';
    }
  }

  isCorrect(): boolean {
    return this.selectedAnswer() === this.correctAnswer;
  }

  get correctOption(): ComplexityOption | undefined {
    return this.complexityOptions.find(o => o.level === this.correctAnswer);
  }

  get selectedOption(): ComplexityOption | undefined {
    const sel = this.selectedAnswer();
    return sel ? this.complexityOptions.find(o => o.level === sel) : undefined;
  }

  get selectedMistake(): string | null {
    const opt = this.selectedOption;
    if (opt && opt.commonMistakes && opt.commonMistakes.length > 0) {
      return opt.commonMistakes[0];
    }
    return null;
  }

  // ==================== HANDLERS ====================
  handleAnswerSelect(answer: ComplexityLevel) {
    this.selectedAnswer.set(answer);
    this.incrementAttempts();
    this.attempts.set(this.attempts() + 1);

    const isCorrect = answer === this.correctAnswer;
    this.onAnswer?.(answer, isCorrect);
    this.answerSelected.emit({ answer, isCorrect });

    if (isCorrect) {
      this.completeWidget();
    }
  }

  handleHintToggle() {
    this.showHint.set(!this.showHint());
    this.onHintRequest?.();
    this.hintRequested.emit();
  }

  onGraphSelect(complexity: ComplexityType) {
    const level = this.complexityToLevel(complexity);
    if (level) {
      this.handleAnswerSelect(level);
    }
  }

  // ==================== TEMPLATE HELPERS ====================
  getRootClasses(): string {
    return cn(
      'mx-auto w-full max-w-4xl rounded-2xl border border-[#1f2937] bg-[#0e1318] shadow-sm',
      this.variant === 'compact' && 'max-w-2xl'
    );
  }

  getOptionClasses(optionLevel: ComplexityLevel): string {
    const selected = this.selectedAnswer() === optionLevel;
    const showAnswer = this.showFeedback && this.selectedAnswer() !== null;
    const correct = optionLevel === this.correctAnswer;

    return cn(
      'rounded-lg border p-3 text-left transition-all',
      selected ? this.getComplexityColor(optionLevel) : 'border-[#1f2937] bg-[#0b0f14] text-[#a9b1bb] hover:bg-[#0e1318] hover:border-[#bc78f9]',
      showAnswer && correct && 'ring-2 ring-emerald-500',
      showAnswer && selected && !correct && 'ring-2 ring-red-500'
    );
  }

  // Expose cn utility for template
  cn = cn;
}


