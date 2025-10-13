import { Component, Input, Output, EventEmitter, Inject, PLATFORM_ID } from '@angular/core';
import { WidgetBaseComponent } from '../../base/widget-base';
import { FontService } from '../../../../services/font.service';
import { ThemeService } from '../../../../services/theme.service';

export interface DetectedError {
  id: string;
  type: string;
  line?: number;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

@Component({
  selector: 'app-error-explain',
  standalone: true,
  template: '',
  styles: []
})
export class ErrorExplainComponent extends WidgetBaseComponent {
  @Input() errorText: string = '';
  @Input() detectedErrors: DetectedError[] = [];
  @Input() explanations: { [errorId: string]: string } = {};
  @Input() showLineNumbers: boolean = true;
  @Input() allowUserExplanation: boolean = true;
  @Input() showHints: boolean = true;

  @Output() errorSelected = new EventEmitter<string>();
  @Output() explanationSubmitted = new EventEmitter<{ errorId: string; explanation: string }>();
  @Output() hintRequested = new EventEmitter<string>();
  @Output() errorFixed = new EventEmitter<string>();

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

