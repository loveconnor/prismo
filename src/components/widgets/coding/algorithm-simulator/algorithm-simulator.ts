import {
  Component,
  Input,
  OnInit,
  OnDestroy,
  Inject,
  PLATFORM_ID,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { WidgetBaseComponent } from '../../base/widget-base';
import { ThemeService } from '../../../../services/theme.service';
import { FontService } from '../../../../services/font.service';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucidePlay, lucidePause, lucideRotateCcw } from '@ng-icons/lucide';

export type Algorithm = 'bubble' | 'quick' | 'recursion';

interface QuickSortStep {
  array: number[];
  pivot: number; // index of pivot
  left: number;  // scanning index
  right: number; // swap index
}

interface TreeNode {
  value: number;
  left?: TreeNode;
  right?: TreeNode;
  level: number;
}

interface PositionedNode {
  path: string;
  x: number;
  y: number;
  value: number;
}

interface PositionedEdge {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

@Component({
  selector: 'app-algorithm-simulator',
  standalone: true,
  imports: [CommonModule, NgIconComponent],
  providers: [provideIcons({ lucidePlay, lucidePause, lucideRotateCcw })],
  templateUrl: './algorithm-simulator.html',
  styleUrls: ['./algorithm-simulator.css']
})
export class AlgorithmSimulatorComponent extends WidgetBaseComponent implements OnInit, OnDestroy {
  @Input() defaultAlgorithm: Algorithm = 'bubble';

  // State
  algorithm = signal<Algorithm>('bubble');
  isPlaying = signal<boolean>(false);
  speed = signal<number>(500);
  arraySize = signal<number>(10);
  key = signal<number>(0); // used to reset visualizers

  // Bubble sort state
  bubbleArray = signal<number[]>([]);
  bubbleComparing = signal<number[]>([]);
  bubbleSorted = signal<number[]>([]);
  bubbleStep = signal<number>(0);
  private bubbleInterval: any = null;

  // Quick sort state
  quickArray = signal<number[]>([]);
  quickSteps = signal<QuickSortStep[]>([]);
  quickStepIdx = signal<number>(0);
  private quickInterval: any = null;

  // Recursion tree state
  fibN = signal<number>(5);
  treeRoot: TreeNode | null = null;
  nodes = signal<PositionedNode[]>([]);
  edges = signal<PositionedEdge[]>([]);
  activePath = signal<string>('');
  private fibInterval: any = null;

  // Expose Math for template
  Math = Math;

  constructor(
    themeService: ThemeService,
    fontService: FontService,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    super(themeService, fontService, platformId);
  }

  override ngOnInit(): void {
    super.ngOnInit();
    this.algorithm.set(this.defaultAlgorithm);
    this.generateBubbleArray();
    this.generateQuickArray();
    this.buildFibTree();
  }

  override ngOnDestroy(): void {
    this.clearAllIntervals();
    super.ngOnDestroy();
  }

  protected initializeWidgetData(): void {}
  protected validateInput(): boolean { return true; }
  protected processCompletion(): void {}

  // Controls
  setAlgorithm(algo: Algorithm) {
    this.algorithm.set(algo);
    this.handleReset();
  }

  togglePlay() {
    this.isPlaying.set(!this.isPlaying());
    this.applyPlayState();
  }

  handleReset() {
    this.isPlaying.set(false);
    this.key.set(this.key() + 1);
    this.clearAllIntervals();
    // reset states
    this.generateBubbleArray();
    this.generateQuickArray();
    this.buildFibTree();
  }

  onSpeedChange(val: number) {
    this.speed.set(val);
    this.applyPlayState();
  }

  onArraySizeChange(val: number) {
    this.arraySize.set(val);
    this.handleReset();
  }

  // Apply play/pause for current algorithm
  private applyPlayState() {
    this.clearAllIntervals();
    if (!this.isPlaying()) return;
    switch (this.algorithm()) {
      case 'bubble':
        this.startBubbleInterval();
        break;
      case 'quick':
        this.startQuickInterval();
        break;
      case 'recursion':
        this.startFibInterval();
        break;
    }
  }

  private clearAllIntervals() {
    if (this.bubbleInterval) { clearInterval(this.bubbleInterval); this.bubbleInterval = null; }
    if (this.quickInterval) { clearInterval(this.quickInterval); this.quickInterval = null; }
    if (this.fibInterval) { clearInterval(this.fibInterval); this.fibInterval = null; }
  }

  // ==================== Bubble Sort ====================
  private generateBubbleArray() {
    const n = this.arraySize();
    const arr = Array.from({ length: n }, () => Math.floor(Math.random() * 100) + 10);
    this.bubbleArray.set(arr);
    this.bubbleComparing.set([]);
    this.bubbleSorted.set([]);
    this.bubbleStep.set(0);
  }

  private startBubbleInterval() {
    this.bubbleInterval = setInterval(() => {
      this.bubbleSortStep();
    }, this.speed());
  }

  private bubbleSortStep() {
    const array = [...this.bubbleArray()];
    const n = array.length;
    const currentStep = this.bubbleStep();
    const pass = Math.floor(currentStep / (n - 1));
    const i = currentStep % (n - 1);

    if (n === 0) return;
    if (pass >= n - 1) {
      this.bubbleSorted.set(Array.from({ length: n }, (_, idx) => idx));
      this.isPlaying.set(false);
      this.clearAllIntervals();
      return;
    }

    this.bubbleComparing.set([i, i + 1]);
    if (array[i] > array[i + 1]) {
      [array[i], array[i + 1]] = [array[i + 1], array[i]];
      this.bubbleArray.set(array);
    }
    if (i === n - pass - 2) {
      this.bubbleSorted.set([...this.bubbleSorted(), n - pass - 1]);
    }
    this.bubbleStep.set(currentStep + 1);
  }

  get bubbleMax(): number {
    return Math.max(100, ...this.bubbleArray());
  }

  // ==================== Quick Sort ====================
  private generateQuickArray() {
    const n = this.arraySize();
    const arr = Array.from({ length: n }, () => Math.floor(Math.random() * 100) + 10);
    this.quickArray.set(arr);
    const steps = this.generateQuickSortSteps([...arr]);
    this.quickSteps.set(steps);
    this.quickStepIdx.set(0);
  }

  private startQuickInterval() {
    this.quickInterval = setInterval(() => {
      const idx = this.quickStepIdx();
      const total = this.quickSteps().length;
      if (idx >= total - 1) {
        this.clearAllIntervals();
        this.isPlaying.set(false);
        return;
      }
      this.quickStepIdx.set(idx + 1);
    }, this.speed());
  }

  private generateQuickSortSteps(arr: number[]): QuickSortStep[] {
    const steps: QuickSortStep[] = [];
    const pushStep = (array: number[], pivot: number, left: number, right: number) => {
      steps.push({ array: [...array], pivot, left, right });
    };
    function partition(array: number[], low: number, high: number): number {
      const pivotVal = array[high];
      let i = low - 1;
      for (let j = low; j < high; j++) {
        pushStep(array, high, j, i + 1);
        if (array[j] < pivotVal) {
          i++;
          [array[i], array[j]] = [array[j], array[i]];
        }
      }
      [array[i + 1], array[high]] = [array[high], array[i + 1]];
      return i + 1;
    }
    function quickSort(array: number[], low: number, high: number) {
      if (low < high) {
        const pi = partition(array, low, high);
        quickSort(array, low, pi - 1);
        quickSort(array, pi + 1, high);
      }
    }
    quickSort(arr, 0, arr.length - 1);
    steps.push({ array: arr, pivot: -1, left: -1, right: -1 });
    return steps;
  }

  get quickCurrent(): QuickSortStep {
    return this.quickSteps()[this.quickStepIdx()] || { array: this.quickArray(), pivot: -1, left: -1, right: -1 };
  }
  get quickMax(): number {
    const arr = this.quickCurrent.array || [];
    return Math.max(100, ...arr);
  }

  // ==================== Recursion Tree (Fibonacci) ====================
  private buildFibTree() {
    const n = this.fibN();
    const root = this.createFibNode(n, 0);
    this.treeRoot = root;
    const posNodes: PositionedNode[] = [];
    const posEdges: PositionedEdge[] = [];
    const layout = (node: TreeNode | undefined, x: number, y: number, path: string, offset: number) => {
      if (!node) return;
      posNodes.push({ path, x, y, value: node.value });
      if (node.left) {
        posEdges.push({ x1: x, y1: y, x2: x - offset, y2: y + 80 });
        layout(node.left, x - offset, y + 80, `${path}-L`, offset / 2);
      }
      if (node.right) {
        posEdges.push({ x1: x, y1: y, x2: x + offset, y2: y + 80 });
        layout(node.right, x + offset, y + 80, `${path}-R`, offset / 2);
      }
    };
    layout(root, 400, 40, 'root', 150);
    this.nodes.set(posNodes);
    this.edges.set(posEdges);
    this.activePath.set('');
  }

  private createFibNode(value: number, level: number): TreeNode {
    if (value <= 1) return { value, level };
    return {
      value,
      level,
      left: this.createFibNode(value - 1, level + 1),
      right: this.createFibNode(value - 2, level + 1)
    };
  }

  private startFibInterval() {
    if (!this.treeRoot) return;
    const sequence: string[] = [];
    const traverse = (node: TreeNode | undefined, path: string) => {
      if (!node) return;
      sequence.push(path);
      traverse(node.left, `${path}-L`);
      traverse(node.right, `${path}-R`);
    };
    traverse(this.treeRoot, 'root');
    let idx = 0;
    this.fibInterval = setInterval(() => {
      if (idx >= sequence.length) {
        this.clearAllIntervals();
        this.isPlaying.set(false);
        return;
      }
      this.activePath.set(sequence[idx]);
      idx++;
    }, this.speed());
  }

  onFibNChange(val: number) {
    const v = Math.max(1, Math.min(7, val));
    this.fibN.set(v);
    this.buildFibTree();
    this.applyPlayState();
  }
}


