import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges,
  Inject,
  PLATFORM_ID
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { WidgetBaseComponent } from '../../base/widget-base';
import { ThemeService } from '../../../../services/theme.service';
import { FontService } from '../../../../services/font.service';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  lucideCircleCheck,
  lucideX,
  lucideTriangleAlert,
  lucideChevronDown,
  lucideChevronRight,
  lucideCode,
  lucideEye,
  lucideEyeOff
} from '@ng-icons/lucide';

// ==================== LEGACY TYPES (HEAD) ====================
export interface TestResult {
  id: string;
  name: string;
  passed: boolean;
  expected: any;
  actual: any;
  message?: string;
  duration?: number;
}

// ==================== MODERN TYPES (widgets) ====================
export type TestStatus = 'pass' | 'fail' | 'error' | 'timeout' | 'pending';

export interface TestCase {
  id: string;
  name: string;
  description?: string;
  status: TestStatus;
  executionTime?: number;
  expectedOutput?: string;
  actualOutput?: string;
  errorMessage?: string;
  input?: string;
  stackTrace?: string;
}

export interface TestSuite {
  id: string;
  name: string;
  tests: TestCase[];
  totalTests: number;
  passedTests: number;
  failedTests: number;
  executionTime: number;
}

export interface TestFeedbackUI {
  variant?: 'default' | 'compact' | 'minimal';
  showDetails?: boolean;
  showStackTraces?: boolean;
  groupBySuite?: boolean;
}

@Component({
  selector: 'app-test-feedback',
  standalone: true,
  imports: [CommonModule, NgIconComponent],
  providers: [
    provideIcons({
      lucideCircleCheck,
      lucideX,
      lucideTriangleAlert,
      lucideChevronDown,
      lucideChevronRight,
      lucideCode,
      lucideEye,
      lucideEyeOff
    })
  ],
  templateUrl: './test-feedback.html',
  styleUrls: ['./test-feedback.css']
})
export class TestFeedbackComponent extends WidgetBaseComponent implements OnChanges {
  // ==================== CORE ====================
  @Input() id!: string;
  @Input() title: string = 'Test Results';
  @Input() isRunning: boolean = false;

  // Modern data
  @Input() testSuites: TestSuite[] = [];

  // Legacy data (HEAD) — will be merged into suites
  @Input() testResults: TestResult[] = [];

  // Modern UI/config
  @Input() ui?: TestFeedbackUI;
  @Input() maxVisibleTests: number = 50;
  @Input() autoExpandFailures: boolean = true;

  // Legacy flags (HEAD)
  @Input() showReasoning: boolean = true;
  @Input() allowRetry: boolean = true;
  @Input() showDuration: boolean = true;
  @Input() showDiff: boolean = true;
  @Input() groupByStatus: boolean = true;

  // Modern callbacks
  @Input() onTestClick?: (testId: string) => void;
  @Input() onSuiteClick?: (suiteId: string) => void;
  @Input() onRetry?: () => void;

  // Accessibility
  @Input() a11yLabel?: string;

  // Modern outputs (use triggerRetry() method instead of conflicting retry name)

  // Legacy outputs (HEAD)
  @Output() testSelected = new EventEmitter<string>();
  @Output() retryRequested = new EventEmitter<void>();
  @Output() reasoningViewed = new EventEmitter<string>();
  @Output() diffViewed = new EventEmitter<{ expected: any; actual: any }>();

  // Local state
  expandedSuites: Set<string> = new Set<string>();
  expandedTests: Set<string> = new Set<string>();

  constructor(
    themeService: ThemeService,
    fontService: FontService,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    super(themeService, fontService, platformId);
  }

  // ============== WidgetBase hooks ==============
  protected initializeWidgetData(): void {}
  protected validateInput(): boolean { return true; }
  protected processCompletion(): void {}

  // ==================== LIFECYCLE ====================
  ngOnChanges(changes: SimpleChanges): void {
    // Merge legacy results into suites whenever legacy input changes
    if (changes['testResults']) {
      this.mergeLegacyResults();
    }
    // Auto-expand suites with failures
    if (this.autoExpandFailures && (changes['testSuites'] || changes['testResults'])) {
      const failingSuiteIds = this.testSuites.filter(s => s.failedTests > 0).map(s => s.id);
      this.expandedSuites = new Set(failingSuiteIds);
    }
  }

  // ==================== GETTERS ====================
  get variant(): 'default' | 'compact' | 'minimal' { return this.ui?.variant || 'default'; }
  get showDetails(): boolean { return this.ui?.showDetails ?? true; }
  get showStackTraces(): boolean { return this.ui?.showStackTraces ?? false; }
  get groupBySuite(): boolean { return this.ui?.groupBySuite ?? true; }

  getOverallStats(): { totalTests: number; totalPassed: number; totalFailed: number; totalTime: number; passRate: number } {
    const totalTests = this.testSuites.reduce((sum, suite) => sum + suite.totalTests, 0);
    const totalPassed = this.testSuites.reduce((sum, suite) => sum + suite.passedTests, 0);
    const totalFailed = this.testSuites.reduce((sum, suite) => sum + suite.failedTests, 0);
    const totalTime = this.testSuites.reduce((sum, suite) => sum + (suite.executionTime || 0), 0);
    return {
      totalTests,
      totalPassed,
      totalFailed,
      totalTime,
      passRate: totalTests > 0 ? (totalPassed / totalTests) * 100 : 0
    };
  }

  // Flattened tests for non-grouped view
  get flatTests(): Array<TestCase & { suiteName: string }> {
    const out: Array<TestCase & { suiteName: string }> = [];
    for (const suite of this.testSuites) {
      for (const test of suite.tests) out.push({ ...test, suiteName: suite.name });
    }
    return out;
  }

  // ==================== HANDLERS ====================
  toggleSuite(suiteId: string): void {
    const updated = new Set(this.expandedSuites);
    if (updated.has(suiteId)) updated.delete(suiteId);
    else updated.add(suiteId);
    this.expandedSuites = updated;
    this.onSuiteClick?.(suiteId);
  }

  toggleTest(testId: string): void {
    const updated = new Set(this.expandedTests);
    if (updated.has(testId)) updated.delete(testId);
    else updated.add(testId);
    this.expandedTests = updated;
    this.onTestClick?.(testId);
    this.testSelected.emit(testId); // legacy
  }

  triggerRetry(): void {
    if (!this.allowRetry) return;
    this.onRetry?.();
    this.retryRequested.emit();
    this.retryRequested.emit(); // legacy
  }

  viewReasoning(testId: string): void {
    if (!this.showReasoning) return;
    this.reasoningViewed.emit(testId); // legacy
  }

  viewDiff(expected: any, actual: any): void {
    if (!this.showDiff) return;
    this.diffViewed.emit({ expected, actual }); // legacy
  }

  // ==================== PRESENTATION HELPERS ====================
  getStatusColor(status: TestStatus): string {
    switch (status) {
      case 'pass': return 'text-emerald-500';
      case 'fail': return 'text-red-500';
      case 'error': return 'text-red-600';
      case 'timeout': return 'text-amber-500';
      case 'pending': return 'text-blue-500';
      default: return 'text-gray-500';
    }
  }

  getStatusIconName(status: TestStatus): string {
    switch (status) {
      case 'pass': return 'lucideCircleCheck';
      case 'fail': return 'lucideX';
      case 'error': return 'lucideTriangleAlert';
      case 'timeout': return 'lucideTriangleAlert';
      case 'pending': return '';
      default: return 'lucideTriangleAlert';
    }
  }

  getStatusBgColor(status: TestStatus): string {
    switch (status) {
      case 'pass': return 'bg-emerald-500/10 border-emerald-500/20';
      case 'fail': return 'bg-red-500/10 border-red-500/20';
      case 'error': return 'bg-red-500/10 border-red-500/20';
      case 'timeout': return 'bg-amber-500/10 border-amber-500/20';
      case 'pending': return 'bg-primary-strong/10 border-blue-500/20';
      default: return 'bg-gray-500/10 border-gray-500/20';
    }
  }

  // ==================== LEGACY → MODERN MERGE ====================
  private mergeLegacyResults(): void {
    if (!this.testResults || this.testResults.length === 0) return;

    // Convert legacy TestResult[] to one synthetic suite and merge with provided suites
    const converted: TestCase[] = this.testResults.map<TestCase>((r) => ({
      id: r.id,
      name: r.name,
      description: r.message,
      status: r.passed ? 'pass' : 'fail',
      executionTime: r.duration,
      expectedOutput: stringifyMaybe(r.expected),
      actualOutput: stringifyMaybe(r.actual),
      errorMessage: r.passed ? undefined : r.message
    }));

    const passed = converted.filter(t => t.status === 'pass').length;
    const failed = converted.filter(t => t.status === 'fail').length;
    const time = converted.reduce((s, t) => s + (t.executionTime || 0), 0);

    const legacySuite: TestSuite = {
      id: 'legacy-suite',
      name: 'Results',
      tests: converted,
      totalTests: converted.length,
      passedTests: passed,
      failedTests: failed,
      executionTime: time
    };

    // If there are existing suites, merge by id; else set to legacy
    const existingIndex = this.testSuites.findIndex(s => s.id === legacySuite.id);
    if (existingIndex >= 0) {
      // Replace contents of the legacy suite
      this.testSuites[existingIndex] = legacySuite;
    } else {
      this.testSuites = [...this.testSuites, legacySuite];
    }
  }
}

// Small helper to safely stringify values for display
function stringifyMaybe(v: any): string {
  try {
    if (typeof v === 'string') return v;
    return JSON.stringify(v, null, 2);
  } catch {
    return String(v);
  }
}
