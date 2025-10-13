import { Component, Input, Output, EventEmitter, Inject, PLATFORM_ID } from '@angular/core';
import { WidgetBaseComponent } from '../../base/widget-base';
import { FontService } from '../../../../services/font.service';
import { ThemeService } from '../../../../services/theme.service';

@Component({
  selector: 'app-unit-checker',
  standalone: true,
  template: '',
  styles: []
})
export class UnitCheckerComponent extends WidgetBaseComponent {
  @Input() expression: string = '';
  @Input() expectedUnits: string = '';
  @Input() allowConversion: boolean = true;
  @Input() showDimensionalAnalysis: boolean = true;
  @Input() supportedUnits: string[] = ['m', 'kg', 's', 'A', 'K', 'mol', 'cd'];

  @Output() unitsChecked = new EventEmitter<{ correct: boolean; userUnits: string; expectedUnits: string }>();
  @Output() conversionRequested = new EventEmitter<{ from: string; to: string }>();
  @Output() analysisShown = new EventEmitter<{ steps: string[]; result: string }>();

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

