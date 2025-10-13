import { Component, Input, Output, EventEmitter, Inject, PLATFORM_ID } from '@angular/core';
import { WidgetBaseComponent } from '../../base/widget-base';
import { FontService } from '../../../../services/font.service';
import { ThemeService } from '../../../../services/theme.service';

@Component({
  selector: 'app-lab-intro',
  standalone: true,
  template: '',
  styles: []
})
export class LabIntroComponent extends WidgetBaseComponent {
  @Input() title: string = '';
  @Input() objective: string = '';
  @Input() difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert' = 'beginner';
  @Input() estimatedTime: number = 30;
  @Input() prerequisites: string[] = [];
  @Input() skills: string[] = [];
  @Input() description: string = '';
  @Input() learningOutcomes: string[] = [];
  @Input() showPrerequisites: boolean = true;
  @Input() showEstimatedTime: boolean = true;

  @Output() labStarted = new EventEmitter<void>();
  @Output() prerequisitesViewed = new EventEmitter<string[]>();
  @Output() skillsViewed = new EventEmitter<string[]>();
  @Output() outcomesViewed = new EventEmitter<string[]>();

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

