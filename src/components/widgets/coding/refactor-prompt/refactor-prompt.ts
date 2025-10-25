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
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  lucideWrench,
  lucideCode,
  lucideEye,
  lucideEyeOff,
  lucideCircleCheck,
  lucideLightbulb,
  lucideTriangle,
  lucideX
} from '@ng-icons/lucide';
import { cn } from '../../../../lib/utils';
import { WidgetBaseComponent } from '../../base/widget-base';
import { ThemeService } from '../../../../services/theme.service';
import { FontService } from '../../../../services/font.service';

// ==================== TYPES ====================

export type RefactorType = 'readability' | 'performance' | 'maintainability' | 'correctness' | 'simplicity';
export type RefactorDifficulty = 'easy' | 'medium' | 'hard';

export interface RefactorSuggestion {
  id: string;
  type: RefactorType;
  title: string;
  description: string;
  beforeCode: string;
  afterCode: string;
  benefits: string[];
  difficulty: RefactorDifficulty;
  category: string;
}

export interface RefactorPromptUI {
  variant?: 'default' | 'guided' | 'challenge';
  showHints?: boolean;
  showBenefits?: boolean;
  allowCustomSolution?: boolean;
}

const DEFAULT_SUGGESTIONS: RefactorSuggestion[] = [
  {
    id: 'extract-variable',
    type: 'readability',
    title: 'Extract Magic Number to Variable',
    description: 'Replace magic numbers with named constants for better readability',
    beforeCode: "if (temperature > 100) { return 'hot'; }",
    afterCode: "const HOT_THRESHOLD = 100;\nif (temperature > HOT_THRESHOLD) { return 'hot'; }",
    benefits: ['Improves code readability', 'Makes values configurable', 'Reduces magic numbers'],
    difficulty: 'easy',
    category: 'Constants'
  },
  {
    id: 'extract-function',
    type: 'maintainability',
    title: 'Extract Method',
    description: 'Break down large functions into smaller, focused methods',
    beforeCode: 'function processData(data) {\n  // 20 lines of validation\n  // 15 lines of processing\n  // 10 lines of formatting\n}',
    afterCode: 'function processData(data) {\n  validateData(data);\n  const processed = transformData(data);\n  return formatResult(processed);\n}',
    benefits: ['Improves maintainability', 'Enables code reuse', 'Makes testing easier'],
    difficulty: 'medium',
    category: 'Functions'
  },
  {
    id: 'early-return',
    type: 'readability',
    title: 'Use Early Returns',
    description: 'Return early from functions to reduce nesting and improve readability',
    beforeCode: 'function isValidUser(user) {\n  if (user) {\n    if (user.age >= 18) {\n      if (user.email) {\n        return true;\n      }\n    }\n  }\n  return false;\n}',
    afterCode: 'function isValidUser(user) {\n  if (!user) return false;\n  if (user.age < 18) return false;\n  if (!user.email) return false;\n  return true;\n}',
    benefits: ['Reduces nesting', 'Improves readability', 'Makes logic clearer'],
    difficulty: 'easy',
    category: 'Control Flow'
  },
  {
    id: 'use-ternary',
    type: 'simplicity',
    title: 'Use Ternary Operator',
    description: 'Replace simple if-else statements with ternary operators',
    beforeCode: "let message;\nif (isSuccess) {\n  message = 'Success!';\n} else {\n  message = 'Error!';\n}",
    afterCode: "const message = isSuccess ? 'Success!' : 'Error!';",
    benefits: ['Reduces code length', 'Improves conciseness', 'Maintains readability'],
    difficulty: 'easy',
    category: 'Expressions'
  },
  {
    id: 'remove-duplicate',
    type: 'maintainability',
    title: 'Eliminate Code Duplication',
    description: 'Extract common code patterns into reusable functions or variables',
    beforeCode: "// Duplicate validation in multiple places\nif (user && user.id && user.email) { /* validate */ }\n// ... same check repeated",
    afterCode: 'function isValidUser(user) {\n  return user && user.id && user.email;\n}\n// Now used consistently everywhere',
    benefits: ['Reduces bugs', 'Improves maintainability', 'Makes changes easier'],
    difficulty: 'medium',
    category: 'DRY Principle'
  }
];

@Component({
  selector: 'app-refactor-prompt',
  standalone: true,
  imports: [CommonModule, NgIconComponent],
  providers: [
    provideIcons({
      lucideWrench,
      lucideCode,
      lucideEye,
      lucideEyeOff,
      lucideCircleCheck,
      lucideLightbulb,
      lucideTriangle,
      lucideX
    })
  ],
  templateUrl: './refactor-prompt.html',
  styleUrls: ['./refactor-prompt.css']
})
export class RefactorPromptComponent extends WidgetBaseComponent implements OnInit {
  // ==================== INPUTS ====================
  @Input() id!: string;
  @Input() prompt!: string;

  // Code Context
  @Input() originalCode!: string;
  @Input() language: string = 'javascript';

  // Suggestions
  @Input() suggestions: RefactorSuggestion[] = DEFAULT_SUGGESTIONS;

  // User Interaction
  @Input() userRefactoredCode: string = '';
  @Input() showComparison: boolean = false;

  // UI
  @Input() ui: RefactorPromptUI = {};

  // Configuration
  @Input() requiredRefactors: number = 1;
  @Input() timeLimit?: number;

  // Callback-style inputs (optional)
  @Input() onSuggestionSelect?: (suggestion: RefactorSuggestion) => void;
  @Input() onCodeChange?: (code: string) => void;
  @Input() onSubmit?: (refactoredCode: string, appliedSuggestions: string[]) => void;
  @Input() onHintRequest?: () => void;

  // Accessibility
  @Input() a11yLabel?: string;

  // ==================== OUTPUTS ====================
  @Output() suggestionSelected = new EventEmitter<RefactorSuggestion>();
  @Output() codeChanged = new EventEmitter<string>();
  @Output() refactorSubmitted = new EventEmitter<{ refactoredCode: string; appliedSuggestions: string[] }>();
  @Output() hintRequested = new EventEmitter<void>();

  // ==================== STATE ====================
  selectedSuggestions = signal<Set<string>>(new Set());
  customCode = signal<string>('');
  showHint = signal<boolean>(false);
  viewMode = signal<'edit' | 'compare' | 'suggestions'>('edit');

  constructor(
    themeService: ThemeService,
    fontService: FontService,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    super(themeService, fontService, platformId);
  }

  // Expose Math for template usage
  Math = Math;

  override ngOnInit(): void {
    super.ngOnInit();
    this.customCode.set(this.userRefactoredCode || '');
    this.viewMode.set(this.showComparison ? 'compare' : 'edit');
  }

  // ==================== ABSTRACT METHOD IMPLEMENTATIONS ====================
  protected initializeWidgetData(): void {}
  protected validateInput(): boolean { return true; }
  protected processCompletion(): void {}

  // ==================== COMPUTED/HELPERS ====================
  get variant(): 'default' | 'guided' | 'challenge' { return this.ui.variant ?? 'default'; }
  get showHints(): boolean { return this.ui.showHints ?? true; }
  get showBenefits(): boolean { return this.ui.showBenefits ?? true; }
  get allowCustomSolution(): boolean { return this.ui.allowCustomSolution ?? true; }

  getRootClasses(): string {
    return 'mx-auto w-full max-w-6xl rounded-2xl border border-[#1f2937] bg-[#0e1318] shadow-sm';
  }

  getToggleButtonClass(mode: 'edit' | 'compare' | 'suggestions'): string {
    const isActive = this.viewMode() === mode;
    return cn(
      'px-3 py-1.5 text-sm transition-colors',
      isActive ? 'bg-[#60a5fa] text-white' : 'text-[#a9b1bb] hover:bg-[#0e1318]'
    );
  }

  getSuggestionContainerClass(id: string): string {
    const selected = this.selectedSuggestions().has(id);
    return cn(
      'rounded-lg border p-4 transition-colors',
      selected ? 'border-[#60a5fa] bg-[#60a5fa]/5' : 'border-[#1f2937] bg-[#0b0f14] hover:bg-[#0e1318]'
    );
  }

  getDifficultyChipClass(difficulty: RefactorDifficulty): string {
    switch (difficulty) {
      case 'easy': return 'flex items-center gap-1 rounded px-2 py-0.5 text-xs text-emerald-500 bg-emerald-500/10';
      case 'medium': return 'flex items-center gap-1 rounded px-2 py-0.5 text-xs text-amber-500 bg-amber-500/10';
      case 'hard': return 'flex items-center gap-1 rounded px-2 py-0.5 text-xs text-red-500 bg-red-500/10';
      default: return 'flex items-center gap-1 rounded px-2 py-0.5 text-xs text-gray-500 bg-gray-500/10';
    }
  }

  getTypeClass(type: RefactorType): string {
    switch (type) {
      case 'readability': return 'flex items-center gap-1 text-xs text-blue-500';
      case 'performance': return 'flex items-center gap-1 text-xs text-purple-500';
      case 'maintainability': return 'flex items-center gap-1 text-xs text-emerald-500';
      case 'correctness': return 'flex items-center gap-1 text-xs text-red-500';
      case 'simplicity': return 'flex items-center gap-1 text-xs text-amber-500';
      default: return 'flex items-center gap-1 text-xs text-gray-500';
    }
  }

  isSelected(suggestionId: string): boolean {
    return this.selectedSuggestions().has(suggestionId);
  }

  // ==================== ICON HELPERS ====================
  getTypeIconName(type: RefactorType): string {
    switch (type) {
      case 'readability': return 'lucideEye';
      case 'performance': return 'lucideLightbulb';
      case 'maintainability': return 'lucideWrench';
      case 'correctness': return 'lucideCircleCheck';
      case 'simplicity': return 'lucideCode';
      default: return 'lucideCode';
    }
  }

  // ==================== HANDLERS ====================
  handleSuggestionToggle(suggestionId: string) {
    const next = new Set(this.selectedSuggestions());
    if (next.has(suggestionId)) next.delete(suggestionId); else next.add(suggestionId);
    this.selectedSuggestions.set(next);

    const suggestion = this.suggestions.find(s => s.id === suggestionId);
    if (suggestion) {
      this.onSuggestionSelect?.(suggestion);
      this.suggestionSelected.emit(suggestion);
    }
  }

  handleCodeInput(value: string) {
    this.customCode.set(value);
    this.onCodeChange?.(value);
    this.codeChanged.emit(value);
  }

  handleSubmit() {
    const appliedSuggestions = Array.from(this.selectedSuggestions());
    const code = this.customCode();
    this.onSubmit?.(code, appliedSuggestions);
    this.refactorSubmitted.emit({ refactoredCode: code, appliedSuggestions });
  }

  handleHintToggle() {
    this.showHint.set(!this.showHint());
    this.onHintRequest?.();
    this.hintRequested.emit();
  }

  setMode(mode: 'edit' | 'compare' | 'suggestions') {
    this.viewMode.set(mode);
  }

  // ==================== TEMPLATE UTILS ====================
  cn = cn;
}


