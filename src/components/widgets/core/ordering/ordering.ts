import { 
  Component, 
  Input, 
  Output, 
  EventEmitter, 
  OnInit,
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

// ==================== TYPES ====================

export type OrderingMode = 'drag-drop' | 'buttons' | 'manual';
export type OrderingState = 'idle' | 'ordering' | 'completed' | 'readOnly';

export interface OrderItem {
  id: string;
  content: string;
  correctPosition: number;
  explanation?: string;
  category?: string;
}

export interface OrderingUI {
  variant?: 'default' | 'compact';
  showCategories?: boolean;
  emphasizeCorrect?: boolean;
}

export interface OrderingProps {
  // Core
  id: string;
  title?: string;
  instructions?: string;
  items: OrderItem[];

  // Configuration
  mode?: OrderingMode;
  shuffleItems?: boolean;
  showHints?: boolean;
  showPositions?: boolean;
  autoCheck?: boolean;

  // UI
  ui?: OrderingUI;

  // Accessibility
  a11yLabel?: string;

  // Events
  onReorder?: (items: OrderItem[]) => void;
  onCheck?: (orderedItems: OrderItem[], score: number, correctPositions: number) => void;
  onComplete?: (orderedItems: OrderItem[], score: number, correctPositions: number) => void;
}

// ==================== COMPONENT ====================

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
export class OrderingComponent implements OnInit {
  // ==================== INPUTS ====================
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
  
  // Event callbacks
  @Input() onReorder?: (items: OrderItem[]) => void;
  @Input() onCheck?: (orderedItems: OrderItem[], score: number, correctPositions: number) => void;
  @Input() onComplete?: (orderedItems: OrderItem[], score: number, correctPositions: number) => void;
  
  // ==================== OUTPUTS ====================
  @Output() reorder = new EventEmitter<OrderItem[]>();
  @Output() check = new EventEmitter<{ orderedItems: OrderItem[]; score: number; correctPositions: number }>();
  @Output() complete = new EventEmitter<{ orderedItems: OrderItem[]; score: number; correctPositions: number }>();
  
  // ==================== STATE ====================
  orderedItems = signal<OrderItem[]>([]);
  draggedIndex = signal<number | null>(null);
  state = signal<OrderingState>('idle');
  completed = signal<boolean>(false);
  
  // ==================== COMPUTED ====================
  get variant(): 'default' | 'compact' {
    return this.ui?.variant || 'default';
  }
  
  get showCategories(): boolean {
    return this.ui?.showCategories ?? false;
  }
  
  get emphasizeCorrect(): boolean {
    return this.ui?.emphasizeCorrect ?? true;
  }
  
  correctCount = signal<number>(0);
  
  // ==================== LIFECYCLE ====================
  
  ngOnInit(): void {
    this.initializeItems();
  }
  
  // Auto-check effect
  private autoCheckEffect = effect(() => {
    const items = this.orderedItems();
    if (items.length === 0 || !this.autoCheck || this.completed()) return;
    
    const isCorrectOrder = items.every((item, index) => item.correctPosition === index + 1);
    
    if (isCorrectOrder) {
      this.completed.set(true);
      this.state.set('completed');
      
      let correctPositions = 0;
      items.forEach((item, index) => {
        if (item.correctPosition === index + 1) correctPositions++;
      });
      
      this.correctCount.set(correctPositions);
      const score = this.items.length > 0 ? correctPositions / this.items.length : 0;
      
      if (this.onComplete) {
        this.onComplete(items, score, correctPositions);
      }
      
      this.complete.emit({
        orderedItems: items,
        score,
        correctPositions
      });
    } else {
      this.state.set('ordering');
    }
  });
  
  private initializeItems(): void {
    const initialItems = this.shuffleItems
      ? [...this.items].sort(() => Math.random() - 0.5)
      : [...this.items];
    this.orderedItems.set(initialItems);
    this.state.set('ordering');
  }
  
  handleCheckOrder(): void {
    const items = this.orderedItems();
    let correctPositions = 0;
    
    items.forEach((item, index) => {
      if (item.correctPosition === index + 1) correctPositions++;
    });
    
    this.correctCount.set(correctPositions);
    const score = items.length > 0 ? correctPositions / items.length : 0;
    
    if (score === 1) {
      this.completed.set(true);
      this.state.set('completed');
      
      if (this.onComplete) {
        this.onComplete(items, score, correctPositions);
      }
      
      this.complete.emit({
        orderedItems: items,
        score,
        correctPositions
      });
    } else {
      this.state.set('completed'); // Show feedback even if not perfect
    }
    
    if (this.onCheck) {
      this.onCheck(items, score, correctPositions);
    }
    
    this.check.emit({
      orderedItems: items,
      score,
      correctPositions
    });
  }
  
  // ==================== HANDLERS ====================
  
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
    this.draggedIndex.set(null);
    
    if (this.onReorder) {
      this.onReorder(newItems);
    }
    
    this.reorder.emit(newItems);
  }
  
  handleMoveUp(index: number): void {
    if (index === 0 || this.completed()) return;
    
    const newItems = [...this.orderedItems()];
    [newItems[index], newItems[index - 1]] = [newItems[index - 1], newItems[index]];
    
    this.orderedItems.set(newItems);
    
    if (this.onReorder) {
      this.onReorder(newItems);
    }
    
    this.reorder.emit(newItems);
  }
  
  handleMoveDown(index: number): void {
    const items = this.orderedItems();
    if (index === items.length - 1 || this.completed()) return;
    
    const newItems = [...items];
    [newItems[index], newItems[index + 1]] = [newItems[index + 1], newItems[index]];
    
    this.orderedItems.set(newItems);
    
    if (this.onReorder) {
      this.onReorder(newItems);
    }
    
    this.reorder.emit(newItems);
  }
  
  handleShuffle(): void {
    if (this.completed()) return;
    
    const shuffled = [...this.orderedItems()].sort(() => Math.random() - 0.5);
    this.orderedItems.set(shuffled);
    
    if (this.onReorder) {
      this.onReorder(shuffled);
    }
    
    this.reorder.emit(shuffled);
  }
  
  handleReset(): void {
    const resetItems = this.shuffleItems
      ? [...this.items].sort(() => Math.random() - 0.5)
      : [...this.items];
    
    this.orderedItems.set(resetItems);
    this.completed.set(false);
    this.state.set('ordering');
    this.correctCount.set(0);
    
    if (this.onReorder) {
      this.onReorder(resetItems);
    }
    
    this.reorder.emit(resetItems);
  }
  
  // ==================== HELPERS ====================
  
  getContainerClasses(): string {
    const base = 'mx-auto w-full max-w-2xl rounded-2xl border border-[#1f2937] bg-[#0e1318] shadow-sm';
    
    if (this.variant === 'compact') {
      return `${base} p-4`;
    }
    
    return `${base} p-6`;
  }
  
  getItemClasses(item: OrderItem, index: number): string {
    const currentState = this.state();
    const isCorrect = currentState === 'completed' && item.correctPosition === index + 1;
    const isIncorrect = currentState === 'completed' && item.correctPosition !== index + 1;
    const isDragged = this.draggedIndex() === index;
    
    const classes = ['flex items-center gap-3 rounded-lg border p-4 transition-all'];
    
    if (isCorrect && this.emphasizeCorrect) {
      classes.push('border-emerald-500 bg-emerald-500/10');
    } else if (isIncorrect) {
      classes.push('border-red-500 bg-red-500/10');
    } else if (currentState !== 'completed') {
      classes.push('border-[#1f2937] bg-[#0b0f14]');
    }
    
    if (isDragged) {
      classes.push('opacity-50');
    }
    
    return classes.join(' ');
  }
  
  getPositionClasses(item: OrderItem, index: number): string {
    const currentState = this.state();
    const isCorrect = currentState === 'completed' && item.correctPosition === index + 1;
    const isIncorrect = currentState === 'completed' && item.correctPosition !== index + 1;
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
    return this.state() === 'completed' && item.correctPosition === index + 1;
  }
  
  isItemIncorrect(item: OrderItem, index: number): boolean {
    return this.state() === 'completed' && item.correctPosition !== index + 1;
  }
  
  getSortedItemsByCorrectPosition(): OrderItem[] {
    return [...this.orderedItems()].sort((a, b) => a.correctPosition - b.correctPosition);
  }
}

