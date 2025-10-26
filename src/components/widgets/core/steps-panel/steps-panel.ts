import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonComponent } from '../../../ui/button/button';
import { ProgressComponent } from '../../../ui/progress/progress';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucideChevronLeft, lucideCheck } from '@ng-icons/lucide';
import { SafeHtmlPipe } from '../../../../app/lib/safe-html.pipe';

interface StepItem {
  id: number;
  title: string;
  instruction?: string;
  example?: string;
}

@Component({
  selector: 'app-steps-panel',
  standalone: true,
  imports: [CommonModule, ButtonComponent, ProgressComponent, NgIconComponent, SafeHtmlPipe],
  providers: [
    provideIcons({
      lucideChevronLeft,
      lucideCheck
    })
  ],
  templateUrl: './steps-panel.html',
  styleUrls: ['./steps-panel.css']
})
export class StepsPanelComponent {
  @Input() steps: StepItem[] = [];
  @Input() currentStep = 1;
  @Input() completedSteps: number[] = [];
  @Input() progress = 0;
  @Input() collapsed = false;

  @Output() toggleCollapse = new EventEmitter<void>();
  @Output() stepClick = new EventEmitter<number>();

  get currentStepData(): StepItem | undefined {
    return this.steps.find(s => s.id === this.currentStep);
  }

  get highestCompleted(): number {
    return this.completedSteps.length ? Math.max(...this.completedSteps) : 0;
  }

  get nextUnlock(): number {
    return this.highestCompleted + 1;
  }

  isCompleted(stepId: number): boolean {
    return this.completedSteps.includes(stepId);
  }

  isLocked(stepId: number): boolean {
    return !this.isCompleted(stepId) && stepId > this.nextUnlock;
  }

  onToggle() {
    this.toggleCollapse.emit();
  }

  onClickStep(stepId: number) {
    if (!this.isLocked(stepId)) this.stepClick.emit(stepId);
  }

  // Simple formatting for example block label and code ticks
  toExampleHtml(example?: string): string {
    if (!example) return '';
    const md = '`Example:`\n\n' + example;
    // very light markdown-ish formatting: code ticks and line breaks
    return md
      .replace(/\n/g, '<br>')
      .replace(/`([^`]+)`/g, '<code>$1</code>');
  }

  trackByStepId = (_: number, item: StepItem) => item.id;
}


