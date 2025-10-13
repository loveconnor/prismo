import { Component, Input, Output, EventEmitter, Inject, PLATFORM_ID } from '@angular/core';
import { WidgetBaseComponent } from '../../base/widget-base';
import { FontService } from '../../../../services/font.service';
import { ThemeService } from '../../../../services/theme.service';

@Component({
  selector: 'app-dataset-table',
  standalone: true,
  template: '',
  styles: []
})
export class DatasetTableComponent extends WidgetBaseComponent {
  @Input() data: any[][] = [];
  @Input() headers: string[] = [];
  @Input() allowEditing: boolean = false;
  @Input() showStatistics: boolean = true;
  @Input() allowSorting: boolean = true;
  @Input() allowFiltering: boolean = true;
  @Input() showRowNumbers: boolean = true;

  @Output() cellEdited = new EventEmitter<{ row: number; col: number; value: any }>();
  @Output() rowAdded = new EventEmitter<any[]>();
  @Output() rowDeleted = new EventEmitter<number>();
  @Output() dataExported = new EventEmitter<{ format: string; data: any }>();
  @Output() statisticsCalculated = new EventEmitter<{ column: string; stats: any }>();

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

