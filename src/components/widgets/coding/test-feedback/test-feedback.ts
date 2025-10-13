import { Component, Input, Output, EventEmitter, Inject, PLATFORM_ID } from '@angular/core';
import { WidgetBaseComponent } from '../../base/widget-base';
import { FontService } from '../../../../services/font.service';
import { ThemeService } from '../../../../services/theme.service';

export interface TestResult {
  id: string;
  name: string;
  passed: boolean;
  expected: any;
  actual: any;
  message?: string;
  duration?: number;
}

@Component({
  selector: 'app-test-feedback',
  standalone: true,
  template: '',
  styles: []
})
export class TestFeedbackComponent extends WidgetBaseComponent {
  @Input() testResults: TestResult[] = [];
  @Input() showReasoning: boolean = true;
  @Input() allowRetry: boolean = true;
  @Input() showDuration: boolean = true;
  @Input() showDiff: boolean = true;
  @Input() groupByStatus: boolean = true;

  @Output() testSelected = new EventEmitter<string>();
  @Output() retryRequested = new EventEmitter<void>();
  @Output() reasoningViewed = new EventEmitter<string>();
  @Output() diffViewed = new EventEmitter<{ expected: any; actual: any }>();

  constructor(
    protected override fontService: FontService,
    themeService: ThemeService,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    super(themeService, fontService, platformId);
  }

  protected initializeWidgetData(): void {
    // Initialize widget-specific data
  }

  protected validateInput(): boolean {
    // Validate widget input
    return true;
  }

  protected processCompletion(): void {
    // Process widget completion
  }
}

