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
import { FormsModule } from '@angular/forms';
import { WidgetBaseComponent } from '../../base/widget-base';
import { FontService } from '../../../../services/font.service';
import { ThemeService } from '../../../../services/theme.service';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { 
  lucideCircleCheck, 
  lucideCircleX, 
  lucideCircleHelp
} from '@ng-icons/lucide';

/** ==================== HEAD (legacy) TYPES ==================== */
export interface LegacyBlank {
  id: string;
  position: number;
  correctAnswers: string[];
  userAnswer?: string;
}

/** ==================== MODERN TYPES ==================== */
export type BlankType = 'text' | 'number' | 'select';
export type FillInBlanksState = 'idle' | 'checking' | 'completed' | 'readOnly';

export interface Blank {
  id: string;
  placeholder: string;
  type: BlankType;
  correctAnswers: string[];
  caseSensitive?: boolean;
  options?: string[]; // For select type
  hint?: string;
}

export interface FillInBlanksUI {
  variant?: 'default' | 'compact';
  emphasizeBlanks?: boolean;
}

export interface TemplateSegment {
  type: 'text' | 'blank';
  content: string;
  blank?: Blank;
}

@Component({
  selector: 'app-fill-in-blanks',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NgIconComponent
  ],
  providers: [
    provideIcons({
      lucideCircleCheck,
      lucideCircleX,
      lucideCircleHelp
    })
  ],
  templateUrl: './fill-in-blanks.html',
  styleUrls: ['./fill-in-blanks.css']
})
export class FillInBlanksComponent extends WidgetBaseComponent implements OnInit {
  /** ==================== MODERN INPUTS ==================== */
  @Input() id!: string;
  /** Template with {{blank-id}} placeholders. If not provided, we’ll derive a basic one. */
  @Input() template?: string;
  /** Modern blanks definition (preferred). */
  @Input() blanks: Blank[] = [];
  @Input() showHints: boolean = true;
  @Input() showFeedback: boolean = true;
  @Input() allowPartialSubmit: boolean = false;
  @Input() ui?: FillInBlanksUI;
  @Input() a11yLabel?: string;

  /** Callback-style inputs */
  @Input() onChange?: (answers: Record<string, string>) => void;
  @Input() onSubmit?: (answers: Record<string, string>, results: Record<string, boolean>, score: number) => void;

  /** ==================== HEAD (legacy) INPUTS (back-compat) ==================== */
  /** Raw text (legacy). If provided without a template, a simple template is generated. */
  @Input() text: string = '';
  /** Legacy blanks; will be converted to modern blanks if modern `blanks` is empty. */
  @Input() legacyBlanks: LegacyBlank[] = [];
  /** Legacy correct answers matrix (fallback if legacyBlanks provided but missing answers). */
  @Input() correctAnswers: string[][] = [];
  @Input() caseSensitive: boolean = false;
  @Input() hints: string[] = [];
  @Input() allowPartialCredit: boolean = true;

  /** ==================== MODERN OUTPUTS ==================== */
  @Output() answersChange = new EventEmitter<Record<string, string>>();
  @Output() submit = new EventEmitter<{ answers: Record<string, string>; results: Record<string, boolean>; score: number }>();

  /** ==================== HEAD (legacy) OUTPUTS (back-compat) ==================== */
  @Output() blankFilled = new EventEmitter<{ blankId: string; answer: string }>();
  @Output() allBlanksSubmitted = new EventEmitter<LegacyBlank[]>();
  @Output() scoreCalculated = new EventEmitter<{ correct: number; total: number; percentage: number }>();
  @Output() hintRequested = new EventEmitter<string>();

  /** ==================== STATE ==================== */
  answers = signal<Record<string, string>>({});
  componentState = signal<FillInBlanksState>('idle');
  results = signal<Record<string, boolean>>({});
  score = signal<number>(0);
  templateSegments = signal<TemplateSegment[]>([]);

  /** ==================== COMPUTED ==================== */
  get variant(): 'default' | 'compact' {
    return this.ui?.variant || 'default';
  }

  get emphasizeBlanks(): boolean {
    return this.ui?.emphasizeBlanks ?? true;
  }

  get filledBlanksCount(): number {
    return Object.values(this.answers()).filter(v => v && v.trim()).length;
  }

  get canSubmit(): boolean {
    if (this.componentState() === 'checking') return false;
    if (this.allowPartialSubmit) return true;
    return this.filledBlanksCount >= this.blanks.length;
  }

  get blanksWithHints(): Blank[] {
    return this.blanks.filter(blank => blank.hint);
  }

  /** ==================== LIFECYCLE ==================== */
  constructor(
    protected override fontService: FontService,
    themeService: ThemeService,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    super(themeService, fontService, platformId);
  }

  override ngOnInit(): void {
    super.ngOnInit();

    // If modern `blanks` not provided but legacy provided, convert.
    if (!this.blanks?.length && this.legacyBlanks?.length) {
      this.blanks = this.legacyBlanks.map((lb, idx) => ({
        id: lb.id,
        placeholder: '',
        type: 'text',
        correctAnswers: lb.correctAnswers?.length ? lb.correctAnswers : (this.correctAnswers[idx] || []),
        caseSensitive: this.caseSensitive,
        hint: this.hints[idx] ?? undefined
      }));
    }

    // If no template supplied, derive a basic one:
    // If `text` contains "{{id}}", use it; otherwise, append blanks after text in order.
    if (!this.template || !/\{\{.+?\}\}/.test(this.template)) {
      const blanksMarkup = this.blanks.map(b => ` {{${b.id}}} `).join('');
      this.template = (this.text && this.text.trim().length > 0) ? `${this.text}${blanksMarkup}` : blanksMarkup.trim();
    }

    this.parseTemplate();
  }

  /** ==================== TEMPLATE PARSING ==================== */
  private parseTemplate(): void {
    const segments: TemplateSegment[] = [];
    const tpl = this.template ?? '';
    const parts = tpl.split(/(\{\{(\w+)\}\})/);

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];

      // Skip captured group duplicates (every 3rd element)
      if (i % 3 === 2) continue;

      const match = part.match(/\{\{(\w+)\}\}/);

      if (match) {
        const blank = this.blanks.find(b => b.id === match[1]);
        if (blank) {
          segments.push({ type: 'blank', content: match[1], blank });
        }
      } else if (part && part.length) {
        segments.push({ type: 'text', content: part });
      }
    }

    this.templateSegments.set(segments);
  }

  /** ==================== VALIDATION/SCORING ==================== */
  private validateAnswer(blank: Blank, answer: string): boolean {
    if (!answer || !answer.trim()) return false;

    const normalizedAnswer = (blank.caseSensitive ?? this.caseSensitive) ? answer : answer.toLowerCase();
    const normalizedCorrect = blank.correctAnswers.map(ans =>
      (blank.caseSensitive ?? this.caseSensitive) ? ans : ans.toLowerCase()
    );

    return normalizedCorrect.includes(normalizedAnswer.trim());
  }

  private checkAllAnswers(): { results: Record<string, boolean>; score: number } {
    const newResults: Record<string, boolean> = {};
    let correctCount = 0;

    this.blanks.forEach(blank => {
      const answer = this.answers()[blank.id] || '';
      const isCorrect = this.validateAnswer(blank, answer);
      newResults[blank.id] = isCorrect;
      if (isCorrect) correctCount++;
    });

    const totalScore = this.blanks.length > 0 ? correctCount / this.blanks.length : 0;

    return { results: newResults, score: totalScore };
  }

  /** ==================== HANDLERS ==================== */
  handleAnswerChange(blankId: string, value: string): void {
    const currentAnswers = this.answers();
    const newAnswers = { ...currentAnswers, [blankId]: value };
    this.answers.set(newAnswers);

    // Modern callback/event
    this.onChange?.(newAnswers);
    this.answersChange.emit(newAnswers);

    // Legacy event
    this.blankFilled.emit({ blankId, answer: value });
  }

  handleSubmit(): void {
    if (!this.canSubmit) return;

    this.componentState.set('checking');

    // Simulate checking delay
    setTimeout(() => {
      const { results: checkResults, score: checkScore } = this.checkAllAnswers();
      this.results.set(checkResults);
      this.score.set(checkScore);
      this.componentState.set('completed');

      // Modern callback/event
      this.onSubmit?.(this.answers(), checkResults, checkScore);
      this.submit.emit({
        answers: this.answers(),
        results: checkResults,
        score: checkScore
      });

      // Legacy events
      const legacySubmitted: LegacyBlank[] = (this.legacyBlanks?.length ? this.legacyBlanks : this.blanks.map((b, i) => ({
        id: b.id,
        position: i,
        correctAnswers: b.correctAnswers,
        userAnswer: this.answers()[b.id] || ''
      } as LegacyBlank))).map(lb => ({
        ...lb,
        userAnswer: this.answers()[lb.id] ?? lb.userAnswer ?? ''
      }));

      this.allBlanksSubmitted.emit(legacySubmitted);

      const correct = Object.values(checkResults).filter(Boolean).length;
      const total = this.blanks.length;
      const percentage = Math.round((total ? (correct / total) : 0) * 100);
      this.scoreCalculated.emit({ correct, total, percentage });
    }, 400);
  }

  /** Legacy hint request bridge */
  requestHint(blankId: string): void {
    if (!this.showHints) return;
    this.hintRequested.emit(blankId);
  }

  /** ==================== HELPERS ==================== */
  getContainerClasses(): string {
    const base = 'mx-auto w-full max-w-4xl rounded-2xl border border-[#1f2937] bg-[#0e1318] shadow-sm';
    return this.variant === 'compact' ? `${base} p-4` : `${base} p-6`;
  }

  getInputClasses(blank: Blank): string {
    const value = this.answers()[blank.id] || '';
    const isSubmitted = this.componentState() === 'completed';
    const isCorrect = this.results()[blank.id];
    const hasAnswer = value.trim() !== '';

    const classes = [
      'inline-block mx-1 px-2 py-1 text-sm border rounded bg-[#0b0f14] text-[#e5e7eb]'
    ];

    if (this.emphasizeBlanks) {
      classes.push('bg-primary-strong/10 border-blue-500/50');
    } else {
      classes.push('border-[#1f2937]');
    }

    if (isSubmitted && isCorrect) {
      classes.push('bg-emerald-500/20 border-emerald-500');
    } else if (isSubmitted && !isCorrect && hasAnswer) {
      classes.push('bg-red-500/20 border-red-500');
    }

    classes.push('focus:outline-none focus:ring-2 focus:ring-blue-500');

    return classes.join(' ');
  }

  getInputWidth(blank: Blank): string {
    const minWidth = 60;
    const calculatedWidth = Math.max((blank.placeholder || '').length * 8, minWidth);
    return `${calculatedWidth}px`;
  }

  getResultClasses(blank: Blank): string {
    const isCorrect = this.results()[blank.id];
    const base = 'flex items-center gap-2 rounded-lg border p-3 text-sm';
    return isCorrect
      ? `${base} border-emerald-500/20 bg-emerald-500/10`
      : `${base} border-red-500/20 bg-red-500/10`;
  }

  getAnswer(blankId: string): string {
    return this.answers()[blankId] || '';
  }

  isCorrect(blankId: string): boolean {
    return this.results()[blankId] || false;
  }

  hasAnswer(blankId: string): boolean {
    const answer = this.answers()[blankId];
    return answer ? answer.trim() !== '' : false;
  }

  getCorrectAnswersDisplay(blank: Blank): string {
    return blank.correctAnswers.join(', ');
  }

  getScorePercentage(): number {
    return Math.round(this.score() * 100);
  }

  getCorrectCount(): number {
    return Object.values(this.results()).filter(Boolean).length;
  }

  /** ==================== WIDGET BASE IMPLEMENTATION ==================== */
  protected override initializeWidgetData(): void {
    // No async setup required
  }

  protected override validateInput(): boolean {
    // Basic sanity: blanks are present
    return Array.isArray(this.blanks);
  }

  protected override processCompletion(): void {
    // No-op
  }
}
