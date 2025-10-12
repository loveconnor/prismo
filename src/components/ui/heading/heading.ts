import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { cn } from '../../../lib/utils';

@Component({
  selector: 'app-heading',
  standalone: true,
  imports: [CommonModule],
  template: `
    <h1 [class]="headingClasses">
      <ng-content></ng-content>
    </h1>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class HeadingComponent {
  @Input() className = '';

  get headingClasses(): string {
    return cn(
      'text-2xl font-semibold text-zinc-950 dark:text-white',
      this.className
    );
  }
}

