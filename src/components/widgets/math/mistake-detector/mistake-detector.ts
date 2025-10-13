import { Component, Input, Output, EventEmitter, Inject, PLATFORM_ID } from '@angular/core';
import { WidgetBaseComponent } from '../../base/widget-base';
import { FontService } from '../../../../services/font.service';
import { ThemeService } from '../../../../services/theme.service';

@Component({
  selector: 'app-mistake-detector',
  standalone: true,
  template: '',
  styles: []
})
export class MistakeDetectorComponent extends WidgetBaseComponent {
  @Input() userInput: string = '';
  @Input() expectedResult: string = '';
  @Input() mistakeTypes: string[] = ['algebraic', 'arithmetic', 'sign', 'order'];
  @Input() showHints: boolean = true;
  @Input() allowCorrection: boolean = true;

  @Output() mistakeDetected = new EventEmitter<{ type: string; location: string; description: string }>();
  @Output() correctionAttempted = new EventEmitter<string>();
  @Output() hintRequested = new EventEmitter<void>();
  @Output() mistakeFixed = new EventEmitter<string>();

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

