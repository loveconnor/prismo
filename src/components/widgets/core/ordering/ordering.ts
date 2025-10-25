import { 
  Component, 
  Input, 
  Output, 
  EventEmitter, 
  OnInit,
  Inject,
  PLATFORM_ID,
  signal,
  effect
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { 
  lucideGripVertical,
  lucideCircleCheck, 
  lucideCircleX,
  lucideArrowUp,
  lucideArrowDown,
  lucideShuffle
} from '@ng-icons/lucide';
import { WidgetBaseComponent } from '../../base/widget-base';
import { ThemeService } from '../../../../services/theme.service';
import { FontService } from '../../../../services/font.service';

/** ==================== SHARED TYPES ==================== */
export type OrderingMode = 'drag-drop' | 'buttons' | 'manual';
export type OrderingState = 'idle' | 'ordering' | 'completed' | 'readOnly';

export interface OrderItem {
  id: string;
  content: string;
  /** 1-based correct position (for modern scoring).
   *  If using legacy `correctOrder`, this can be omitted. */
  correctPosition: number;
  explanation?: string;
  category?: string;
}

export interface OrderingUI {
  variant?: 'default' | 'compact';
  showCategories?: boolean;
  emphasizeCorrect?: boolean;
}

/** ==================== COMPONENT ==================== */
@Component({
  selector: 'app-ordering',
  standalone: true,
  imports: [
    CommonModule,
    NgIconComponent
  ],
  providers: [
    provideIcons({
      lucideGripVertical,
      lucideCircleCheck,
      lucideCircleX,
      lucideArrowUp,
      lucideArrowDown,
      lucideShuffle
    })
  ],
  templateUrl: './ordering.html',
  styleUrls: ['./ordering.css']
})
export class OrderingComponent extends WidgetBaseComponent implements OnInit {
  /** ==================== MODERN INPUTS ==================== */
  @Input() id!: string;
  @Input() title?: string;
  @Input() instructions: string = 'Drag the items into the correct order.';
  @Input() items: OrderItem[] = [];
  @Input() mode: OrderingMode = 'drag-drop';
  @Input() shuffleItems: boolean = true;
  @Input() showHints: boolean = true;
  @Input() showPositions: boolean = true;
  @Input() autoCheck: boolean = true;
  @Input() ui?: OrderingUI;
  @Input() a11yLabel?: string;

  /** Modern callback-style inputs */
  @Input() onReorder?: (items: OrderItem[]) => void;
  @Input() onCheck?: (orderedItems: OrderItem[], score: number, correctPositions: number) => void;
  @Input() onComplete?: (orderedItems: OrderItem[], score: number, correctPositions: number) => void;

  /** ==================== LEGACY (HEAD) INPUTS — BACK-COMPAT ==================== */
  /** If provided, overrides per-item correctPosition when scoring. */
  @Input() correctOrder: string[] = [];               // array of item IDs in the correct order
  @Input() allowPartial: boolean = true;              // affects feedback behavior
  @Input() shuffleInitial: boolean = true;            // maps to shuffleItems
  @Input() showPositionNumbers: boolean = true;       // maps to showPositions
  @Input() enableDragDrop: boolean = true;            // maps to mode

  /** ==================== MODERN OUTPUTS ==================== */
  @Output() reorder = new EventEmitter<OrderItem[]>();
  @Output() check = new EventEmitter<{ orderedItems: OrderItem[]; score: number; correctPositions: number }>();
  @Output() complete = new EventEmitter<{ orderedItems: OrderItem[]; score: number; correctPositions: number }>();

  /** ==================== LEGACY (HEAD) OUTPUTS — BACK-COMPAT BRIDGE ==================== */
  @Output() itemMoved = new EventEmitter<{ itemId: string; fromPosition: number; toPosition: number }>();
  @Output() orderSubmitted = new EventEmitter<string[]>(); // ordered list of IDs
  @Output() scoreCalculated = new EventEmitter<{ correct: number; total: number; percentage: number }>();

  /** ==================== STATE ==================== */
  orderedItems = signal<OrderItem[]>([]);
  draggedIndex = signal<number | null>(null);
  state = signal<OrderingState>('idle');
  completed = signal<boolean>(false);
  correctCount = signal<number>(0);

  /** ==================== UI COMPUTED ==================== */
  get variant(): 'default' | 'compact' {
    return this.ui?.variant || 'default';
  }
  get showCategories(): boolean {
    return this.ui?.showCategories ?? false;
  }
  get emphasizeCorrect(): boolean {
    return this.ui?.emphasizeCorrect ?? true;
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

    // Map legacy props to modern ones where appropriate
    if (!this.enableDragDrop && this.mode === 'drag-drop') this.mode = 'buttons';
    if (this.shuffleItems !== this.shuffleInitial) this.shuffleItems = this.shuffleInitial;
    if (this.showPositions !== this.showPositionNumbers) this.showPositions = this.showPositionNumbers;

    this.initializeItems();

    // Auto-check effect (re-runs when orderedItems changes)
    effect(() => {
      const items = this.orderedItems();
      if (items.length === 0 || !this.autoCheck || this.completed()) return;

      const { correctPositions } = this.evaluateOrder(items);
      const perfect = correctPositions === items.length;

      if (perfect) {
        this.finish(items, correctPositions);
      } else {
        this.state.set('ordering');
      }
    });
  }

  /** ==================== CORE LOGIC ==================== */

  private initializeItems(): void {
    const initialItems = (this.shuffleItems
      ? [...this.items].sort(() => Math.random() - 0.5)
      : [...this.items]);

    this.orderedItems.set(initialItems);
    this.state.set('ordering');
  }

  /** Returns number of correct positions and score (0..1). Respects legacy `correctOrder` if provided. */
  private evaluateOrder(items: OrderItem[]): { correctPositions: number; score: number } {
    let correctPositions = 0;

    if (this.correctOrder?.length) {
      // Build a map from itemId -> desired index
      const desiredIndex: Record<string, number> = {};
      this.correctOrder.forEach((id, i) => { desiredIndex[id] = i; });

      items.forEach((item, idx) => {
        const want = desiredIndex[item.id];
        if (want !== undefined && want === idx) correctPositions++;
      });
    } else {
      // Use per-item correctPosition (1-based)
      items.forEach((item, idx) => {
        if (item.correctPosition === idx + 1) correctPositions++;
      });
    }

    const score = items.length > 0 ? correctPositions / items.length : 0;
    return { correctPositions, score };
  }

  private emitLegacyScore(items: OrderItem[], correctPositions: number) {
    const total = items.length;
    const percentage = Math.round(((total ? (correctPositions / total) : 0) * 100));
    this.scoreCalculated.emit({ correct: correctPositions, total, percentage });
  }

  private finish(items: OrderItem[], correctPositions: number) {
    this.completed.set(true);
    this.state.set('completed');

    const { score } = this.evaluateOrder(items);

    // Modern events
    this.onComplete?.(items, score, correctPositions);
    this.complete.emit({ orderedItems: items, score, correctPositions });

    // Legacy events
    this.orderSubmitted.emit(items.map(i => i.id));
    this.emitLegacyScore(items, correctPositions);
  }

  /** ==================== ACTIONS ==================== */

  handleCheckOrder(): void {
    const items = this.orderedItems();
    const { correctPositions, score } = this.evaluateOrder(items);

    // Modern events
    this.onCheck?.(items, score, correctPositions);
    this.check.emit({ orderedItems: items, score, correctPositions });

    // If not perfect but allowPartial, still show feedback (completed state)
    if (score === 1 || this.allowPartial) {
      this.state.set('completed');
    }

    // Completion only when perfect
    if (score === 1) {
      this.finish(items, correctPositions);
    } else {
      // Legacy score emission for partial checks
      this.emitLegacyScore(items, correctPositions);
    }

    this.correctCount.set(correctPositions);
  }

  handleDragStart(event: DragEvent, index: number): void {
    if (this.mode !== 'drag-drop' || this.completed()) return;
    event.dataTransfer!.effectAllowed = 'move';
    event.dataTransfer!.setData('text/plain', index.toString());
    this.draggedIndex.set(index);
  }

  handleDragOver(event: DragEvent): void {
    if (this.mode !== 'drag-drop' || this.draggedIndex() === null) return;
    event.preventDefault();
    event.dataTransfer!.dropEffect = 'move';
  }

  handleDrop(event: DragEvent, dropIndex: number): void {
    if (this.mode !== 'drag-drop' || this.draggedIndex() === null) return;
    event.preventDefault();

    const dragIdx = this.draggedIndex();
    if (dragIdx === null || dragIdx === dropIndex) {
      this.draggedIndex.set(null);
      return;
    }

    const newItems = [...this.orderedItems()];
    const [draggedItem] = newItems.splice(dragIdx, 1);
    newItems.splice(dropIndex, 0, draggedItem);

    this.orderedItems.set(newItems);

    // Modern
    this.onReorder?.(newItems);
    this.reorder.emit(newItems);

    // Legacy
    this.itemMoved.emit({ itemId: draggedItem.id, fromPosition: dragIdx + 1, toPosition: dropIndex + 1 });

    this.draggedIndex.set(null);
  }

  handleMoveUp(index: number): void {
    if (index === 0 || this.completed()) return;

    const newItems = [...this.orderedItems()];
    [newItems[index], newItems[index - 1]] = [newItems[index - 1], newItems[index]];
    this.orderedItems.set(newItems);

    // Modern
    this.onReorder?.(newItems);
    this.reorder.emit(newItems);

    // Legacy
    this.itemMoved.emit({ itemId: newItems[index].id, fromPosition: index + 1, toPosition: index });
  }

  handleMoveDown(index: number): void {
    const items = this.orderedItems();
    if (index === items.length - 1 || this.completed()) return;

    const newItems = [...items];
    [newItems[index], newItems[index + 1]] = [newItems[index + 1], newItems[index]];
    this.orderedItems.set(newItems);

    // Modern
    this.onReorder?.(newItems);
    this.reorder.emit(newItems);

    // Legacy
    this.itemMoved.emit({ itemId: newItems[index].id, fromPosition: index + 1, toPosition: index + 2 });
  }

  handleShuffle(): void {
    if (this.completed()) return;

    const shuffled = [...this.orderedItems()].sort(() => Math.random() - 0.5);
    this.orderedItems.set(shuffled);

    this.onReorder?.(shuffled);
    this.reorder.emit(shuffled);
  }

  handleReset(): void {
    const resetItems = (this.shuffleItems
      ? [...this.items].sort(() => Math.random() - 0.5)
      : [...this.items]);

    this.orderedItems.set(resetItems);
    this.completed.set(false);
    this.state.set('ordering');
    this.correctCount.set(0);

    this.onReorder?.(resetItems);
    this.reorder.emit(resetItems);
  }

  /** ==================== TEMPLATE HELPERS ==================== */

  getContainerClasses(): string {
    const base = 'mx-auto w-full max-w-2xl rounded-2xl border border-[#1f2937] bg-[#0e1318] shadow-sm';
    return this.variant === 'compact' ? `${base} p-4` : `${base} p-6`;
  }

  getItemClasses(item: OrderItem, index: number): string {
    const currentState = this.state();
    const desiredIndex = this.correctOrder?.length
      ? this.correctOrder.indexOf(item.id) // 0-based
      : (item.correctPosition - 1);

    const isCorrect = currentState === 'completed' && desiredIndex === index;
    const isIncorrect = currentState === 'completed' && desiredIndex !== index;
    const isDragged = this.draggedIndex() === index;

    const classes = ['flex items-center gap-3 rounded-lg border p-4 transition-all'];
    if (isCorrect && this.emphasizeCorrect) {
      classes.push('border-emerald-500 bg-emerald-500/10');
    } else if (isIncorrect) {
      classes.push('border-red-500 bg-red-500/10');
    } else if (currentState !== 'completed') {
      classes.push('border-[#1f2937] bg-[#0b0f14]');
    }
    if (isDragged) classes.push('opacity-50');

    return classes.join(' ');
  }

  getPositionClasses(item: OrderItem, index: number): string {
    const currentState = this.state();
    const desiredIndex = this.correctOrder?.length
      ? this.correctOrder.indexOf(item.id)
      : (item.correctPosition - 1);

    const isCorrect = currentState === 'completed' && desiredIndex === index;
    const isIncorrect = currentState === 'completed' && desiredIndex !== index;
    const isCompleted = this.completed();

    const classes = ['flex h-8 w-8 items-center justify-center rounded-full border text-sm font-medium'];
    if (isCorrect) {
      classes.push('border-emerald-500 text-emerald-500');
    } else if (isIncorrect) {
      classes.push('border-red-500 text-red-500');
    } else if (!isCompleted) {
      classes.push('border-[#1f2937] text-[#9ca3af]');
    }
    return classes.join(' ');
  }

  isItemCorrect(item: OrderItem, index: number): boolean {
    const desiredIndex = this.correctOrder?.length
      ? this.correctOrder.indexOf(item.id)
      : (item.correctPosition - 1);
    return this.state() === 'completed' && desiredIndex === index;
  }

  isItemIncorrect(item: OrderItem, index: number): boolean {
    const desiredIndex = this.correctOrder?.length
      ? this.correctOrder.indexOf(item.id)
      : (item.correctPosition - 1);
    return this.state() === 'completed' && desiredIndex !== index;
  }

  getSortedItemsByCorrectPosition(): OrderItem[] {
    if (this.correctOrder?.length) {
      const orderMap = new Map(this.correctOrder.map((id, i) => [id, i]));
      return [...this.orderedItems()].sort((a, b) => (orderMap.get(a.id) ?? 0) - (orderMap.get(b.id) ?? 0));
    }
    return [...this.orderedItems()].sort((a, b) => a.correctPosition - b.correctPosition);
  }

  /** ==================== WIDGET BASE IMPLEMENTATION ==================== */
  protected override initializeWidgetData(): void {
    // No special init
  }

  protected override validateInput(): boolean {
    // Basic sanity
    return Array.isArray(this.items) && this.items.length >= 0;
  }

  protected override processCompletion(): void {
    this.updateState({ is_completed: true });
    this.completion.emit({
      widget_id: this._state.id,
      event_type: 'completion',
      data: { orderedIds: this.orderedItems().map(i => i.id) },
      timestamp: new Date()
    });
  }
}
