import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { cn } from '../../../lib/utils';

@Component({
  selector: 'app-panel',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      [class]="cn(
        'flex flex-col relative w-full h-full rounded-lg overflow-hidden bg-gradient-to-b from-background/70 to-background/40 backdrop-blur supports-[backdrop-filter]:bg-background/50 ring-1 ring-border/80 dark:ring-border/60 border border-border/90 dark:border-border/60 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_1px_2px_rgba(0,0,0,0.06),0_10px_30px_-12px_rgba(0,0,0,0.15)]',
        className
      )"
    >
      <ng-content></ng-content>
    </div>
  `
})
export class PanelComponent {
  @Input() className?: string;
  
  protected cn = cn;
}
