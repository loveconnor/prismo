import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { cn } from '../../../lib/utils';

@Component({
  selector: 'app-logo',
  standalone: true,
  imports: [CommonModule],
  template: `
    <svg [class]="logoClasses" viewBox="0 0 120 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <text x="0" y="18" font-family="system-ui, -apple-system, sans-serif" font-size="18" font-weight="600" letter-spacing="-0.5">
        Prismo Labs
      </text>
    </svg>
  `,
  styles: [`
    :host {
      display: inline-block;
    }
  `]
})
export class LogoComponent {
  @Input() className = '';

  get logoClasses(): string {
    return cn(
      'h-6 text-zinc-950 dark:text-white',
      this.className
    );
  }
}

