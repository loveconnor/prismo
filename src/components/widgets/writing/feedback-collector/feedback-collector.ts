import { Component, Input, Output, EventEmitter, Inject, PLATFORM_ID } from '@angular/core';
import { WidgetBaseComponent } from '../../base/widget-base';
import { FontService } from '../../../../services/font.service';
import { ThemeService } from '../../../../services/theme.service';

export interface FeedbackQuestion {
  id: string;
  question: string;
  type: 'rating' | 'text' | 'multiple-choice' | 'yes-no';
  options?: string[];
  required: boolean;
}

@Component({
  selector: 'app-feedback-collector',
  standalone: true,
  template: '',
  styles: []
})
export class FeedbackCollectorComponent extends WidgetBaseComponent {
  @Input() feedbackQuestions: FeedbackQuestion[] = [];
  @Input() allowRating: boolean = true;
  @Input() showProgress: boolean = true;
  @Input() allowAnonymous: boolean = true;
  @Input() maxQuestions: number = 10;

  @Output() questionAnswered = new EventEmitter<{ questionId: string; answer: any }>();
  @Output() feedbackSubmitted = new EventEmitter<{ [questionId: string]: any }>();
  @Output() progressUpdated = new EventEmitter<{ current: number; total: number }>();

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

