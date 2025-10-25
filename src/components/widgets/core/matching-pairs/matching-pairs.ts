import { 
  Component, 
  Input, 
  Output, 
  EventEmitter, 
  OnInit,
  Inject,
  PLATFORM_ID,
  signal,
  computed
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { WidgetBaseComponent } from '../../base/widget-base';
import { FontService } from '../../../../services/font.service';
import { ThemeService } from '../../../../services/theme.service';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { 
  lucideCircleCheck, 
  lucideCircleX, 
  lucideShuffle,
  lucideRotateCcw
} from '@ng-icons/lucide';

// ==================== LEGACY (HEAD) TYPES ====================

export interface LegacyMatchItem {
  id: string;
  content: string;
  matchId: string;
}

export interface LegacyPair {
  leftId: string;
  rightId: string;
}

// ==================== MODERN TYPES ====================

export type MatchMode = 'drag-drop' | 'select' | 'connect';
export type MatchingPairsState = 'idle' | 'matching' | 'completed' | 'readOnly';

export interface MatchItem {
  id: string;
  label: string;
  type: 'left' | 'right';
  category?: string;
}

export interface CorrectMatch {
  leftId: string;
  rightId: string;
  explanation?: string;
}

export interface MatchingPairsUI {
  variant?: 'default' | 'compact';
  showCategories?: boolean;
  emphasizeMatches?: boolean;
}

export interface MatchingPairsProps {
  // Core
  id: string;
  title?: string;
  instructions?: string;
  leftItems: MatchItem[];
  rightItems: MatchItem[];
  correctMatches: CorrectMatch[];

  // Configuration
  mode?: MatchMode;
  shuffleItems?: boolean;
  showHints?: boolean;
  requireAllMatches?: boolean;

  // UI
  ui?: MatchingPairsUI;

  // Accessibility
  a11yLabel?: string;

  // Events
  onMatch?: (leftId: string, rightId: string) => void;
  onUnmatch?: (leftId: string, rightId: string) => void;
  onComplete?: (matches: Record<string, string>, score: number, correctMatches: number) => void;
}

// ==================== COMPONENT ====================

@Component({
  selector: 'app-matching-pairs',
  standalone: true,
  imports: [
    CommonModule,
    NgIconComponent
  ],
  providers: [
    provideIcons({
      lucideCircleCheck,
      lucideCircleX,
      lucideShuffle,
      lucideRotateCcw
    })
  ],
  templateUrl: './matching-pairs.html',
  styleUrls: ['./matching-pairs.css']
})
export class MatchingPairsComponent extends WidgetBaseComponent implements OnInit {
  // ==================== MODERN INPUTS ====================
  @Input() id!: string;
  @Input() title?: string;
  @Input() instructions: string = 'Match the items on the left with the correct items on the right.';
  @Input() leftItems: MatchItem[] = [];
  @Input() rightItems: MatchItem[] = [];
  @Input() correctMatches: CorrectMatch[] = [];
  @Input() mode: MatchMode = 'select';
  @Input() shuffleItems: boolean = true; // default true to match legacy behavior
  @Input() showHints: boolean = true;
  @Input() requireAllMatches: boolean = true;
  @Input() ui?: MatchingPairsUI;
  @Input() a11yLabel?: string;

  // Modern callbacks
  @Input() onMatch?: (leftId: string, rightId: string) => void;
  @Input() onUnmatch?: (leftId: string, rightId: string) => void;
  @Input() onComplete?: (matches: Record<string, string>, score: number, correctMatches: number) => void;

  // ==================== LEGACY (HEAD) INPUTS (back-compat) ====================
  @Input() legacyLeftItems: LegacyMatchItem[] = [];
  @Input() legacyRightItems: LegacyMatchItem[] = [];
  @Input() correctPairs: LegacyPair[] = [];
  @Input() allowMultipleAttempts: boolean = true;
  @Input() showFeedback: boolean = true;

  // ==================== MODERN OUTPUTS ====================
  @Output() matchCreated = new EventEmitter<{ leftId: string; rightId: string }>();
  @Output() matchRemoved = new EventEmitter<{ leftId: string; rightId: string }>();
  @Output() complete = new EventEmitter<{ matches: Record<string, string>; score: number; correctMatches: number }>();

  // ==================== LEGACY (HEAD) OUTPUTS (back-compat) ====================
  @Output() pairMatched = new EventEmitter<{ leftId: string; rightId: string }>();
  @Output() pairUnmatched = new EventEmitter<{ leftId: string; rightId: string }>();
  @Output() allPairsSubmitted = new EventEmitter<{ leftId: string; rightId: string }[]>();
  @Output() scoreCalculated = new EventEmitter<{ correct: number; total: number }>();

  // ==================== STATE ====================
  matches = signal<Record<string, string>>({});
  draggedItem = signal<string | null>(null);
  selectedLeft = signal<string | null>(null);
  shuffledLeft = signal<MatchItem[]>([]);
  shuffledRight = signal<MatchItem[]>([]);
  componentState = signal<MatchingPairsState>('idle');
  completed = signal<boolean>(false);

  // ==================== COMPUTED ====================
  get variant(): 'default' | 'compact' {
    return this.ui?.variant || 'default';
  }
  get showCategories(): boolean {
    return this.ui?.showCategories ?? false;
  }
  get emphasizeMatches(): boolean {
    return this.ui?.emphasizeMatches ?? true;
  }

  totalPossibleMatches = computed(() => {
    return this.requireAllMatches 
      ? this.leftItems.length 
      : Math.min(this.leftItems.length, this.rightItems.length);
  });

  currentMatchCount = computed(() => Object.keys(this.matches()).length);

  correctMatchCount = computed(() => {
    let count = 0;
    Object.entries(this.matches()).forEach(([leftId, rightId]) => {
      const isCorrect = this.correctMatches.some(m => m.leftId === leftId && m.rightId === rightId);
      if (isCorrect) count++;
    });
    return count;
  });

  score = computed(() => {
    const total = this.totalPossibleMatches();
    const correct = this.correctMatchCount();
    return total > 0 ? correct / total : 0;
  });

  scorePercentage = computed(() => Math.round(this.score() * 100));

  // ==================== DI / BASE ====================
  constructor(
    protected override fontService: FontService,
    themeService: ThemeService,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    super(themeService, fontService, platformId);
  }

  // ==================== LIFECYCLE ====================
  override ngOnInit(): void {
    super.ngOnInit();

    // Back-compat mapping if modern inputs are empty but legacy provided
    if ((!this.leftItems?.length || !this.rightItems?.length) && (this.legacyLeftItems?.length || this.legacyRightItems?.length)) {
      this.leftItems = (this.legacyLeftItems || []).map(li => ({
        id: li.id,
        label: li.content,
        type: 'left' as const
      }));
      this.rightItems = (this.legacyRightItems || []).map(ri => ({
        id: ri.id,
        label: ri.content,
        type: 'right' as const
      }));

      if (!this.correctMatches?.length && this.correctPairs?.length) {
        this.correctMatches = this.correctPairs.map(p => ({ leftId: p.leftId, rightId: p.rightId }));
      }
    }

    this.initializeItems();
    this.checkCompletion();
  }

  // ==================== WIDGET BASE IMPLEMENTATIONS ====================
  protected override initializeWidgetData(): void {
    // No-op
  }

  protected override validateInput(): boolean {
    return Array.isArray(this.leftItems) && Array.isArray(this.rightItems) && Array.isArray(this.correctMatches);
  }

  protected override processCompletion(): void {
    // No-op in this widget
  }

  // ==================== INIT / CHECK ====================
  private initializeItems(): void {
    if (this.shuffleItems) {
      this.shuffledLeft.set([...this.leftItems].sort(() => Math.random() - 0.5));
      this.shuffledRight.set([...this.rightItems].sort(() => Math.random() - 0.5));
    } else {
      this.shuffledLeft.set([...this.leftItems]);
      this.shuffledRight.set([...this.rightItems]);
    }
  }

  private checkCompletion(): void {
    const currentMatches = this.currentMatchCount();
    const totalPossible = this.totalPossibleMatches();

    if (currentMatches >= totalPossible) {
      this.componentState.set('completed');
      this.completed.set(true);

      const correctCount = this.correctMatchCount();
      const scoreValue = this.score();

      // Modern callback/event
      this.onComplete?.(this.matches(), scoreValue, correctCount);
      this.complete.emit({ matches: this.matches(), score: scoreValue, correctMatches: correctCount });

      // Legacy bridges
      const submittedPairs: { leftId: string; rightId: string }[] = Object.entries(this.matches()).map(
        ([leftId, rightId]) => ({ leftId, rightId })
      );
      this.allPairsSubmitted.emit(submittedPairs);
      this.scoreCalculated.emit({ correct: correctCount, total: totalPossible });

      // If not allowing multiple attempts, lock
      if (!this.allowMultipleAttempts) {
        this.componentState.set('readOnly');
      }
    } else {
      this.componentState.set('matching');
    }
  }

  // ==================== HANDLERS ====================
  handleSelectMatch(leftId: string, rightId: string): void {
    if (this.completed() && !this.allowMultipleAttempts) return;

    const newMatches = { ...this.matches() };

    // Ensure a right item is matched only once: remove existing mapping that uses this rightId
    Object.keys(newMatches).forEach(lId => {
      if (newMatches[lId] === rightId) {
        delete newMatches[lId];
        // Modern + legacy unmatch
        this.onUnmatch?.(lId, rightId);
        this.matchRemoved.emit({ leftId: lId, rightId });
        this.pairUnmatched.emit({ leftId: lId, rightId });
      }
    });

    // Toggle: if already matched together, unmatch; else set the match
    if (newMatches[leftId] === rightId) {
      delete newMatches[leftId];
      this.onUnmatch?.(leftId, rightId);
      this.matchRemoved.emit({ leftId, rightId });
      this.pairUnmatched.emit({ leftId, rightId });
    } else {
      newMatches[leftId] = rightId;
      this.onMatch?.(leftId, rightId);
      this.matchCreated.emit({ leftId, rightId });
      this.pairMatched.emit({ leftId, rightId });
    }

    this.matches.set(newMatches);
    this.checkCompletion();
  }

  handleSelectLeft(leftId: string): void {
    if ((this.completed() && !this.allowMultipleAttempts) || this.componentState() === 'readOnly') return;

    if (this.mode === 'select') {
      const current = this.selectedLeft();
      this.selectedLeft.set(current === leftId ? null : leftId);
    } else {
      const currentMatch = this.matches()[leftId];
      if (currentMatch) {
        this.handleSelectMatch(leftId, currentMatch);
      }
    }
  }

  handleSelectRight(rightId: string): void {
    if ((this.completed() && !this.allowMultipleAttempts) || this.componentState() === 'readOnly') return;

    if (this.mode === 'select') {
      const leftId = this.selectedLeft();
      if (leftId) {
        this.handleSelectMatch(leftId, rightId);
        this.selectedLeft.set(null);
      }
    }
  }

  handleDragStart(event: DragEvent, itemId: string, type: 'left' | 'right'): void {
    if (this.mode !== 'drag-drop' || (this.completed() && !this.allowMultipleAttempts)) return;
    event.dataTransfer!.effectAllowed = 'move';
    event.dataTransfer!.setData('text/plain', JSON.stringify({ itemId, type }));
    this.draggedItem.set(itemId);
  }

  handleDragOver(event: DragEvent): void {
    if (this.mode !== 'drag-drop' || !this.draggedItem()) return;
    event.preventDefault();
    event.dataTransfer!.dropEffect = 'move';
  }

  handleDrop(event: DragEvent, targetId: string, targetType: 'left' | 'right'): void {
    if (this.mode !== 'drag-drop' || !this.draggedItem()) return;
    event.preventDefault();

    const draggedId = this.draggedItem();
    if (!draggedId) return;

    const allItems = [...this.shuffledLeft(), ...this.shuffledRight()];
    const dragged = allItems.find(i => i.id === draggedId);
    if (!dragged) return;

    if (dragged.type === targetType) return;

    const leftId = dragged.type === 'left' ? draggedId : targetId;
    const rightId = dragged.type === 'right' ? draggedId : targetId;

    this.handleSelectMatch(leftId, rightId);
    this.draggedItem.set(null);
  }

  handleReset(): void {
    if (!this.allowMultipleAttempts) return;
    this.matches.set({});
    this.selectedLeft.set(null);
    this.completed.set(false);
    this.componentState.set('idle');
    this.initializeItems();
  }

  handleShuffle(): void {
    this.shuffledLeft.set([...this.leftItems].sort(() => Math.random() - 0.5));
    this.shuffledRight.set([...this.rightItems].sort(() => Math.random() - 0.5));
  }

  // ==================== HELPERS ====================
  getItemStatus(itemId: string, itemType: 'left' | 'right'): 'idle' | 'correct' | 'incorrect' | 'unmatched' {
    if (!this.completed()) return 'idle';

    const currentMatches = this.matches();
    const isMatched = itemType === 'left'
      ? currentMatches[itemId] !== undefined
      : Object.values(currentMatches).includes(itemId);

    if (!isMatched) return 'unmatched';

    const isCorrect = itemType === 'left'
      ? this.correctMatches.some(match => match.leftId === itemId && match.rightId === currentMatches[itemId])
      : this.correctMatches.some(match => {
          const matchedLeftId = Object.keys(currentMatches).find(lId => currentMatches[lId] === itemId);
          return !!matchedLeftId && match.rightId === itemId && match.leftId === matchedLeftId;
        });

    return isCorrect ? 'correct' : 'incorrect';
  }

  isItemMatched(itemId: string, itemType: 'left' | 'right'): boolean {
    const currentMatches = this.matches();
    return itemType === 'left'
      ? currentMatches[itemId] !== undefined
      : Object.values(currentMatches).includes(itemId);
  }

  getMatchedPartner(itemId: string, itemType: 'left' | 'right'): MatchItem | null {
    const currentMatches = this.matches();

    if (itemType === 'left') {
      const rightId = currentMatches[itemId];
      return rightId ? this.shuffledRight().find(r => r.id === rightId) || null : null;
    } else {
      const leftId = Object.keys(currentMatches).find(lId => currentMatches[lId] === itemId);
      return leftId ? this.shuffledLeft().find(l => l.id === leftId) || null : null;
    }
  }

  getContainerClasses(): string {
    const base = 'mx-auto w-full max-w-4xl rounded-2xl border border-[#1f2937] bg-[#0e1318] shadow-sm';
    return this.variant === 'compact' ? `${base} p-4` : `${base} p-6`;
  }

  getItemClasses(itemId: string, itemType: 'left' | 'right'): string {
    const status = this.getItemStatus(itemId, itemType);
    const isMatched = this.isItemMatched(itemId, itemType);
    const isSelected = itemType === 'left' && this.selectedLeft() === itemId;
    const completedState = this.completed();

    const classes = ['rounded-lg border p-3 transition-all'];

    if (status === 'correct' && this.emphasizeMatches) {
      classes.push('border-emerald-500 bg-emerald-500/10');
    } else if (status === 'incorrect') {
      classes.push('border-red-500 bg-red-500/10');
    } else if (status === 'unmatched') {
      classes.push('border-gray-500 bg-gray-500/10');
    } else if (!isMatched && !completedState) {
      classes.push('border-[#1f2937] bg-[#0b0f14] hover:border-[#60a5fa]/50 cursor-pointer');
    } else if (isMatched && !completedState) {
      classes.push('border-[#60a5fa] bg-[#60a5fa]/10');
    }

    if (isSelected) {
      classes.push('ring-2 ring-[#60a5fa] border-[#60a5fa]');
    }

    if (!isMatched && !completedState && itemType === 'right' && this.selectedLeft()) {
      classes.push('cursor-pointer hover:border-[#60a5fa]');
    }

    return classes.join(' ');
  }

  getItemById(itemId: string, itemType: 'left' | 'right'): MatchItem | undefined {
    const items = itemType === 'left' ? this.shuffledLeft() : this.shuffledRight();
    return items.find(item => item.id === itemId);
  }
}
