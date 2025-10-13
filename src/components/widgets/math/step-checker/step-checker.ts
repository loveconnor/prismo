import { Component, Input, Output, EventEmitter, Inject, PLATFORM_ID } from '@angular/core';
import { WidgetBaseComponent } from '../../base/widget-base';
import { FontService } from '../../../../services/font.service';
import { ThemeService } from '../../../../services/theme.service';

export interface AlgebraicStep {
  id: string;
  expression: string;
  justification: string;
  correct?: boolean;
}

@Component({
  selector: 'app-step-checker',
  standalone: true,
  template: '',
  styles: []
})
export class StepCheckerComponent extends WidgetBaseComponent {
  @Input() algebraicExpression: string = '';
  @Input() expectedSteps: AlgebraicStep[] = [];
  @Input() allowPartial: boolean = true;
  @Input() showHints: boolean = false;
  @Input() checkEquivalence: boolean = true;

  @Output() stepAdded = new EventEmitter<AlgebraicStep>();
  @Output() stepChecked = new EventEmitter<{ stepId: string; correct: boolean }>();
  @Output() allStepsSubmitted = new EventEmitter<AlgebraicStep[]>();
  @Output() hintRequested = new EventEmitter<number>();

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

