import { Component, Input, Output, EventEmitter, Inject, PLATFORM_ID } from '@angular/core';
import { WidgetBaseComponent } from '../../base/widget-base';
import { FontService } from '../../../../services/font.service';
import { ThemeService } from '../../../../services/theme.service';

export interface FeedbackArea {
  id: string;
  type: 'clarity' | 'conciseness' | 'tone' | 'grammar' | 'vocabulary';
  location: { start: number; end: number };
  suggestion: string;
  severity: 'low' | 'medium' | 'high';
}

@Component({
  selector: 'app-style-feedback',
  standalone: true,
  template: '',
  styles: []
})
export class StyleFeedbackComponent extends WidgetBaseComponent {
  @Input() textContent: string = '';
  @Input() feedbackAreas: FeedbackArea[] = [];
  @Input() showClarity: boolean = true;
  @Input() showConciseness: boolean = true;
  @Input() showTone: boolean = true;
  @Input() showGrammar: boolean = true;
  @Input() targetAudience: 'general' | 'academic' | 'professional' | 'casual' = 'general';

  @Output() feedbackApplied = new EventEmitter<string>();
  @Output() suggestionAccepted = new EventEmitter<string>();
  @Output() suggestionRejected = new EventEmitter<string>();
  @Output() analysisRequested = new EventEmitter<void>();

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

