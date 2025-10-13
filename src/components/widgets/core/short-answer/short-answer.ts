import { Component, Input, Output, EventEmitter, Inject, PLATFORM_ID } from '@angular/core';
import { WidgetBaseComponent } from '../../base/widget-base';
import { FontService } from '../../../../services/font.service';
import { ThemeService } from '../../../../services/theme.service';

@Component({
  selector: 'app-short-answer',
  standalone: true,
  template: '',
  styles: []
})
export class ShortAnswerComponent extends WidgetBaseComponent {
  @Input() question: string = '';
  @Input() maxLength: number = 500;
  @Input() expectedKeywords: string[] = [];
  @Input() similarityThreshold: number = 0.7;
  @Input() caseSensitive: boolean = false;
  @Input() showWordCount: boolean = true;
  @Input() showCharacterCount: boolean = false;
  @Input() allowRichText: boolean = false;
  @Input() placeholder: string = 'Enter your answer...';

  @Output() answerChanged = new EventEmitter<string>();
  @Output() answerSubmitted = new EventEmitter<string>();
  @Output() keywordsMatched = new EventEmitter<{ matched: string[]; missing: string[] }>();
  @Output() similarityCalculated = new EventEmitter<number>();

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

