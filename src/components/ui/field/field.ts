import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { cn } from '../../../lib/utils';

@Component({
  selector: 'app-field',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div [class]="fieldClasses">
      <ng-content></ng-content>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class FieldComponent {
  @Input() className = '';

  get fieldClasses(): string {
    return cn(
      'space-y-2',
      this.className
    );
  }
}

