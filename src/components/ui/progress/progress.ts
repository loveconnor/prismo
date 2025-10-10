import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { cn } from '../../../lib/utils';

@Component({
  selector: 'app-progress',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './progress.html',
  styleUrl: './progress.css'
})
export class ProgressComponent {
  @Input() value: number = 0;
  @Input() max: number = 100;
  @Input() className = '';
  @Input() showValue = false;

  get progressClasses(): string {
    return cn(
      'relative h-2 w-full overflow-hidden rounded-full bg-secondary',
      this.className
    );
  }

  get barClasses(): string {
    return cn(
      'h-full w-full flex-1 bg-primary transition-all'
    );
  }

  get percentage(): number {
    return Math.min(Math.max((this.value / this.max) * 100, 0), 100);
  }

  getRoundedPercentage(): number {
    return Math.round(this.percentage);
  }
}
