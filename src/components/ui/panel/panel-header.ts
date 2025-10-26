import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { cn } from '../../../lib/utils';

@Component({
  selector: 'app-panel-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      [class]="cn(
        'h-10 text-[11px] sm:text-xs font-mono uppercase font-semibold tracking-wider flex items-center justify-between px-3 py-1 text-muted-foreground/90 bg-gradient-to-b from-background/70 to-background/40 backdrop-blur supports-[backdrop-filter]:bg-background/50 border-b border-border/80 dark:border-border/60 shadow-[inset_0_-1px_0_rgba(255,255,255,0.04)] rounded-t-lg',
        className
      )"
    >
      <ng-content></ng-content>
    </div>
  `
})
export class PanelHeaderComponent {
  @Input() className?: string;
  
  protected cn = cn;
}
