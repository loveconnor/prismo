import { 
  Component, 
  Input, 
  Output, 
  EventEmitter, 
  OnInit,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { 
  lucideCircleCheck, 
  lucideCircleX, 
  lucideCircleHelp
} from '@ng-icons/lucide';

// ==================== TYPES ====================

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

export interface FillInBlanksProps {
  // Core
  id: string;
  template: string; // Markdown template with {{blank-id}} placeholders
  blanks: Blank[];

  // Configuration
  showHints?: boolean;
  showFeedback?: boolean;
  allowPartialSubmit?: boolean;

  // UI
  ui?: FillInBlanksUI;

  // Accessibility
  a11yLabel?: string;

  // Events
  onChange?: (answers: Record<string, string>) => void;
  onSubmit?: (answers: Record<string, string>, results: Record<string, boolean>, score: number) => void;
}

export interface TemplateSegment {
  type: 'text' | 'blank';
  content: string;
  blank?: Blank;
}

// ==================== COMPONENT ====================

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
export class FillInBlanksComponent implements OnInit {
  // ==================== INPUTS ====================
  @Input() id!: string;
  @Input() template!: string;
  @Input() blanks: Blank[] = [];
  @Input() showHints: boolean = true;
  @Input() showFeedback: boolean = true;
  @Input() allowPartialSubmit: boolean = false;
  @Input() ui?: FillInBlanksUI;
  @Input() a11yLabel?: string;
  
  // Event callbacks
  @Input() onChange?: (answers: Record<string, string>) => void;
  @Input() onSubmit?: (answers: Record<string, string>, results: Record<string, boolean>, score: number) => void;
  
  // ==================== OUTPUTS ====================
  @Output() answersChange = new EventEmitter<Record<string, string>>();
  @Output() submit = new EventEmitter<{ answers: Record<string, string>; results: Record<string, boolean>; score: number }>();
  
  // ==================== STATE ====================
  answers = signal<Record<string, string>>({});
  state = signal<FillInBlanksState>('idle');
  results = signal<Record<string, boolean>>({});
  score = signal<number>(0);
  templateSegments = signal<TemplateSegment[]>([]);
  
  // ==================== COMPUTED ====================
  get variant(): 'default' | 'compact' {
    return this.ui?.variant || 'default';
  }
  
  get emphasizeBlanks(): boolean {
    return this.ui?.emphasizeBlanks ?? true;
  }
  
  get hintsAvailable(): boolean {
    return this.blanks.some(blank => blank.hint);
  }
  
  get canSubmit(): boolean {
    if (this.state() === 'checking') return false;
    
    if (!this.allowPartialSubmit) {
      const filledBlanks = Object.values(this.answers()).filter(v => v && v.trim()).length;
      return filledBlanks >= this.blanks.length;
    }
    
    return true;
  }
  
  // ==================== LIFECYCLE ====================
  
  ngOnInit(): void {
    // Parse template into segments
    this.parseTemplate();
  }
  
  // ==================== TEMPLATE PARSING ====================
  
  private parseTemplate(): void {
    const segments: TemplateSegment[] = [];
    const parts = this.template.split(/(\{\{(\w+)\}\})/);
    
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      
      // Skip the captured group duplicates (every 3rd element)
      if (i % 3 === 2) continue;
      
      const match = part.match(/\{\{(\w+)\}\}/);
      
      if (match) {
        const blank = this.blanks.find(b => b.id === match[1]);
        if (blank) {
          segments.push({
            type: 'blank',
            content: match[1],
            blank: blank
          });
        }
      } else if (part && part.trim()) {
        segments.push({
          type: 'text',
          content: part
        });
      }
    }
    
    this.templateSegments.set(segments);
  }
  
  // ==================== VALIDATION ====================
  
  private validateAnswer(blank: Blank, answer: string): boolean {
    if (!answer || !answer.trim()) return false;
    
    const normalizedAnswer = blank.caseSensitive ? answer : answer.toLowerCase();
    const normalizedCorrect = blank.correctAnswers.map(ans =>
      blank.caseSensitive ? ans : ans.toLowerCase()
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
  
  // ==================== HANDLERS ====================
  
  handleAnswerChange(blankId: string, value: string): void {
    const currentAnswers = this.answers();
    const newAnswers = { ...currentAnswers, [blankId]: value };
    this.answers.set(newAnswers);
    
    // Call onChange callback if provided
    if (this.onChange) {
      this.onChange(newAnswers);
    }
    
    // Emit event
    this.answersChange.emit(newAnswers);
  }
  
  handleSubmit(): void {
    if (!this.canSubmit) return;
    
    this.state.set('checking');
    
    // Simulate checking delay
    setTimeout(() => {
      const { results: checkResults, score: checkScore } = this.checkAllAnswers();
      this.results.set(checkResults);
      this.score.set(checkScore);
      this.state.set('completed');
      
      // Call onSubmit callback if provided
      if (this.onSubmit) {
        this.onSubmit(this.answers(), checkResults, checkScore);
      }
      
      // Emit event
      this.submit.emit({
        answers: this.answers(),
        results: checkResults,
        score: checkScore
      });
    }, 500);
  }
  
  // ==================== HELPERS ====================
  
  getContainerClasses(): string {
    const base = 'mx-auto w-full max-w-4xl rounded-2xl border border-[#1f2937] bg-[#0e1318] shadow-sm';
    
    if (this.variant === 'compact') {
      return `${base} p-4`;
    }
    
    return `${base} p-6`;
  }
  
  getBlankClasses(blank: Blank): string {
    const value = this.answers()[blank.id] || '';
    const isSubmitted = this.state() === 'completed';
    const isCorrect = this.results()[blank.id];
    const hasAnswer = value.trim() !== '';
    
    const classes = [
      'inline-block mx-1 px-2 py-1 text-sm border rounded text-[#e5e7eb]'
    ];
    
    if (this.emphasizeBlanks && !isSubmitted) {
      classes.push('bg-blue-500/10 border-blue-500/50');
    } else {
      classes.push('bg-[#0b0f14] border-[#1f2937]');
    }
    
    if (isSubmitted && isCorrect) {
      classes.push('bg-emerald-500/20 border-emerald-500');
    } else if (isSubmitted && !isCorrect && hasAnswer) {
      classes.push('bg-red-500/20 border-red-500');
    }
    
    classes.push('focus:outline-none focus:ring-2 focus:ring-blue-500');
    classes.push('disabled:cursor-not-allowed disabled:opacity-50');
    
    return classes.join(' ');
  }
  
  getBlankWidth(blank: Blank): string {
    return `${Math.max(blank.placeholder.length * 8, 60)}px`;
  }
  
  getButtonClasses(): string {
    const base = 'rounded-lg px-6 py-2 text-sm font-medium transition-colors';
    
    if (!this.canSubmit) {
      return `${base} cursor-not-allowed bg-[#1f2937] text-[#6b7280]`;
    }
    
    return `${base} bg-[#3b82f6] text-white hover:bg-[#2563eb]`;
  }
  
  getResultClasses(blank: Blank): string {
    const isCorrect = this.results()[blank.id];
    const base = 'flex items-center gap-2 rounded-lg border p-3 text-sm';
    
    if (isCorrect) {
      return `${base} border-emerald-500/20 bg-emerald-500/10`;
    }
    
    return `${base} border-red-500/20 bg-red-500/10`;
  }
  
  isBlankDisabled(): boolean {
    return this.state() === 'completed' || this.state() === 'readOnly';
  }
  
  getAnswerText(blankId: string): string {
    const answer = this.answers()[blankId] || '';
    return answer.trim() !== '' ? answer : '(no answer)';
  }
  
  hasAnswerForBlank(blankId: string): boolean {
    const answer = this.answers()[blankId] || '';
    return answer.trim() !== '';
  }
  
  getCorrectAnswersText(blank: Blank): string {
    return blank.correctAnswers.join(', ');
  }
  
  getCorrectCount(): number {
    const resultsObj = this.results();
    return Object.values(resultsObj).filter(v => v === true).length;
  }
}

