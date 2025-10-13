import { Component, Input, Output, EventEmitter, Inject, PLATFORM_ID } from '@angular/core';
import { WidgetBaseComponent } from '../../base/widget-base';
import { FontService } from '../../../../services/font.service';
import { ThemeService } from '../../../../services/theme.service';

export interface ProofStep {
  id: string;
  statement: string;
  justification: string;
  order: number;
}

@Component({
  selector: 'app-proof-sketch',
  standalone: true,
  template: '',
  styles: []
})
export class ProofSketchComponent extends WidgetBaseComponent {
  @Input() givenStatement: string = '';
  @Input() toShowStatement: string = '';
  @Input() proofSteps: ProofStep[] = [];
  @Input() allowReordering: boolean = true;
  @Input() showHints: boolean = false;
  @Input() checkLogic: boolean = true;

  @Output() stepAdded = new EventEmitter<ProofStep>();
  @Output() stepReordered = new EventEmitter<{ stepId: string; newOrder: number }>();
  @Output() proofSubmitted = new EventEmitter<ProofStep[]>();
  @Output() logicChecked = new EventEmitter<{ valid: boolean; errors: string[] }>();

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

