import { Component, Input, Output, EventEmitter, Inject, PLATFORM_ID } from '@angular/core';
import { WidgetBaseComponent } from '../../base/widget-base';
import { FontService } from '../../../../services/font.service';
import { ThemeService } from '../../../../services/theme.service';

@Component({
  selector: 'app-numeric-answer',
  standalone: true,
  template: '',
  styles: []
})
export class NumericAnswerComponent extends WidgetBaseComponent {
  @Input() question: string = '';
  @Input() expectedValue: number = 0;
  @Input() tolerance: number = 0.01;
  @Input() units: string = '';
  @Input() showUnits: boolean = true;
  @Input() allowScientificNotation: boolean = true;
  @Input() showWorkingSpace: boolean = false;

  @Output() answerSubmitted = new EventEmitter<{ value: number; correct: boolean }>();
  @Output() workingShown = new EventEmitter<string>();
  @Output() hintRequested = new EventEmitter<void>();

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

