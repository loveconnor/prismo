import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
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

// ==================== TYPES ====================

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
export class TestFeedbackComponent {
  // Core
  @Input() id!: string;
  @Input() title: string = 'Test Results';

  // Test Data
  @Input() testSuites: TestSuite[] = [];
  @Input() isRunning: boolean = false;

  // UI
  @Input() ui?: TestFeedbackUI;

  // Configuration
  @Input() maxVisibleTests: number = 50;
  @Input() autoExpandFailures: boolean = true;

  // Events
  @Input() onTestClick?: (testId: string) => void;
  @Input() onSuiteClick?: (suiteId: string) => void;
  @Input() onRetry?: () => void;

  // Accessibility
  @Input() a11yLabel?: string;

  // Local state
  expandedSuites: Set<string> = new Set<string>();
  expandedTests: Set<string> = new Set<string>();

  ngOnChanges(): void {
    if (this.autoExpandFailures) {
      const failingSuiteIds = this.testSuites.filter(s => s.failedTests > 0).map(s => s.id);
      this.expandedSuites = new Set(failingSuiteIds);
    }
  }

  // ==================== GETTERS ====================
  get variant(): 'default' | 'compact' | 'minimal' { return this.ui?.variant || 'default'; }
  get showDetails(): boolean { return this.ui?.showDetails ?? true; }
  get showStackTraces(): boolean { return this.ui?.showStackTraces ?? false; }
  get groupBySuite(): boolean { return this.ui?.groupBySuite ?? true; }

  // ==================== HANDLERS ====================
  toggleSuite(suiteId: string): void {
    const updated = new Set(this.expandedSuites);
    if (updated.has(suiteId)) updated.delete(suiteId); else updated.add(suiteId);
    this.expandedSuites = updated;
    if (this.onSuiteClick) this.onSuiteClick(suiteId);
  }

  toggleTest(testId: string): void {
    const updated = new Set(this.expandedTests);
    if (updated.has(testId)) updated.delete(testId); else updated.add(testId);
    this.expandedTests = updated;
    if (this.onTestClick) this.onTestClick(testId);
  }

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
      case 'pending': return 'bg-blue-500/10 border-blue-500/20';
      default: return 'bg-gray-500/10 border-gray-500/20';
    }
  }

  getOverallStats(): { totalTests: number; totalPassed: number; totalFailed: number; totalTime: number; passRate: number } {
    const totalTests = this.testSuites.reduce((sum, suite) => sum + suite.totalTests, 0);
    const totalPassed = this.testSuites.reduce((sum, suite) => sum + suite.passedTests, 0);
    const totalFailed = this.testSuites.reduce((sum, suite) => sum + suite.failedTests, 0);
    const totalTime = this.testSuites.reduce((sum, suite) => sum + suite.executionTime, 0);
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
      for (const test of suite.tests) {
        out.push({ ...test, suiteName: suite.name });
      }
    }
    return out;
  }
}


