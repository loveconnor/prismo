import { Component, Input, Output, EventEmitter, Inject, PLATFORM_ID } from '@angular/core';
import { WidgetBaseComponent } from '../../base/widget-base';
import { FontService } from '../../../../services/font.service';
import { ThemeService } from '../../../../services/theme.service';

export interface OrderItem {
  id: string;
  content: string;
  correctPosition: number;
}

@Component({
  selector: 'app-ordering',
  standalone: true,
  template: '',
  styles: []
})
export class OrderingComponent extends WidgetBaseComponent {
  @Input() items: OrderItem[] = [];
  @Input() correctOrder: string[] = [];
  @Input() allowPartial: boolean = true;
  @Input() shuffleInitial: boolean = true;
  @Input() showPositionNumbers: boolean = true;
  @Input() enableDragDrop: boolean = true;

  @Output() itemMoved = new EventEmitter<{ itemId: string; fromPosition: number; toPosition: number }>();
  @Output() orderSubmitted = new EventEmitter<string[]>();
  @Output() scoreCalculated = new EventEmitter<{ correct: number; total: number; percentage: number }>();

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

