import { Component, Input, Output, EventEmitter, Inject, PLATFORM_ID } from '@angular/core';
import { WidgetBaseComponent } from '../../base/widget-base';
import { FontService } from '../../../../services/font.service';
import { ThemeService } from '../../../../services/theme.service';

export interface ConsoleMessage {
  id: string;
  type: 'log' | 'error' | 'warn' | 'info';
  message: string;
  timestamp: Date;
}

@Component({
  selector: 'app-console-output',
  standalone: true,
  template: '',
  styles: []
})
export class ConsoleOutputComponent extends WidgetBaseComponent {
  @Input() output: ConsoleMessage[] = [];
  @Input() showTimestamp: boolean = true;
  @Input() allowClear: boolean = true;
  @Input() maxLines: number = 1000;
  @Input() autoScroll: boolean = true;
  @Input() showLineNumbers: boolean = false;
  @Input() filterByType: string[] = ['log', 'error', 'warn', 'info'];

  @Output() outputCleared = new EventEmitter<void>();
  @Output() messageSelected = new EventEmitter<string>();
  @Output() filterChanged = new EventEmitter<string[]>();
  @Output() maxLinesReached = new EventEmitter<void>();

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

