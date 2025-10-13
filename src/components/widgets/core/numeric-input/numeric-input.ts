import { Component, Input, Output, EventEmitter, Inject, PLATFORM_ID } from '@angular/core';
import { WidgetBaseComponent } from '../../base/widget-base';
import { FontService } from '../../../../services/font.service';
import { ThemeService } from '../../../../services/theme.service';

@Component({
  selector: 'app-numeric-input',
  standalone: true,
  template: '',
  styles: []
})
export class NumericInputComponent extends WidgetBaseComponent {
  @Input() question: string = '';
  @Input() expectedValue: number = 0;
  @Input() tolerance: number = 0.01;
  @Input() units: string = '';
  @Input() showUnits: boolean = true;
  @Input() allowScientificNotation: boolean = true;
  @Input() minValue?: number;
  @Input() maxValue?: number;
  @Input() decimalPlaces: number = 2;

  @Output() valueChanged = new EventEmitter<number>();
  @Output() valueSubmitted = new EventEmitter<{ value: number; correct: boolean; difference: number }>();
  @Output() validationError = new EventEmitter<string>();

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

