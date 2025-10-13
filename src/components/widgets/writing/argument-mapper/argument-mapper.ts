import { Component, Input, Output, EventEmitter, Inject, PLATFORM_ID } from '@angular/core';
import { WidgetBaseComponent } from '../../base/widget-base';
import { FontService } from '../../../../services/font.service';
import { ThemeService } from '../../../../services/theme.service';

export interface ArgumentElement {
  id: string;
  type: 'claim' | 'evidence' | 'reasoning' | 'counterclaim' | 'rebuttal';
  content: string;
  connections: string[];
  position: { x: number; y: number };
}

@Component({
  selector: 'app-argument-mapper',
  standalone: true,
  template: '',
  styles: []
})
export class ArgumentMapperComponent extends WidgetBaseComponent {
  @Input() argumentElements: ArgumentElement[] = [];
  @Input() allowDragDrop: boolean = true;
  @Input() showConnections: boolean = true;
  @Input() showLabels: boolean = true;
  @Input() autoLayout: boolean = false;

  @Output() elementAdded = new EventEmitter<ArgumentElement>();
  @Output() elementEdited = new EventEmitter<ArgumentElement>();
  @Output() elementDeleted = new EventEmitter<string>();
  @Output() elementMoved = new EventEmitter<{ elementId: string; position: { x: number; y: number } }>();
  @Output() connectionCreated = new EventEmitter<{ fromId: string; toId: string }>();
  @Output() connectionDeleted = new EventEmitter<{ fromId: string; toId: string }>();

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

