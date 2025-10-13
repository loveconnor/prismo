import { Component, Input, Output, EventEmitter, Inject, PLATFORM_ID } from '@angular/core';
import { WidgetBaseComponent } from '../../base/widget-base';
import { FontService } from '../../../../services/font.service';
import { ThemeService } from '../../../../services/theme.service';

export interface MatchItem {
  id: string;
  content: string;
  matchId: string;
}

@Component({
  selector: 'app-matching-pairs',
  standalone: true,
  template: '',
  styles: []
})
export class MatchingPairsComponent extends WidgetBaseComponent {
  @Input() leftItems: MatchItem[] = [];
  @Input() rightItems: MatchItem[] = [];
  @Input() correctPairs: { leftId: string; rightId: string }[] = [];
  @Input() shuffleItems: boolean = true;
  @Input() allowMultipleAttempts: boolean = true;
  @Input() showFeedback: boolean = true;

  @Output() pairMatched = new EventEmitter<{ leftId: string; rightId: string }>();
  @Output() pairUnmatched = new EventEmitter<{ leftId: string; rightId: string }>();
  @Output() allPairsSubmitted = new EventEmitter<{ leftId: string; rightId: string }[]>();
  @Output() scoreCalculated = new EventEmitter<{ correct: number; total: number }>();

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

