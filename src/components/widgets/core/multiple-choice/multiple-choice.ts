import { Component, Input, Output, EventEmitter, Inject, PLATFORM_ID } from '@angular/core';
import { WidgetBaseComponent } from '../../base/widget-base';
import { FontService } from '../../../../services/font.service';
import { ThemeService } from '../../../../services/theme.service';

export interface MultipleChoiceOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

@Component({
  selector: 'app-multiple-choice',
  standalone: true,
  template: '',
  styles: []
})
export class MultipleChoiceComponent extends WidgetBaseComponent {
  @Input() question: string = '';
  @Input() options: MultipleChoiceOption[] = [];
  @Input() correctAnswers: string[] = [];
  @Input() allowMultiple: boolean = false;
  @Input() showFeedback: boolean = true;
  @Input() shuffleOptions: boolean = false;
  @Input() showCorrectAnswer: boolean = false;
  @Input() maxAttempts: number = 3;
  @Input() showAttemptCount: boolean = true;

  @Output() answerSelected = new EventEmitter<string[]>();
  @Output() answerSubmitted = new EventEmitter<{ selected: string[]; correct: boolean }>();
  @Output() feedbackRequested = new EventEmitter<string[]>();
  @Output() maxAttemptsReached = new EventEmitter<void>();

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

