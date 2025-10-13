import { Component, Input, Output, EventEmitter, Inject, PLATFORM_ID } from '@angular/core';
import { WidgetBaseComponent } from '../../base/widget-base';
import { FontService } from '../../../../services/font.service';
import { ThemeService } from '../../../../services/theme.service';

export interface Blank {
  id: string;
  position: number;
  correctAnswers: string[];
  userAnswer?: string;
}

@Component({
  selector: 'app-fill-in-blanks',
  standalone: true,
  template: '',
  styles: []
})
export class FillInBlanksComponent extends WidgetBaseComponent {
  @Input() text: string = '';
  @Input() blanks: Blank[] = [];
  @Input() correctAnswers: string[][] = [];
  @Input() caseSensitive: boolean = false;
  @Input() showHints: boolean = false;
  @Input() hints: string[] = [];
  @Input() allowPartialCredit: boolean = true;

  @Output() blankFilled = new EventEmitter<{ blankId: string; answer: string }>();
  @Output() allBlanksSubmitted = new EventEmitter<Blank[]>();
  @Output() scoreCalculated = new EventEmitter<{ correct: number; total: number; percentage: number }>();
  @Output() hintRequested = new EventEmitter<string>();

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

