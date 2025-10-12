import { Component, Input, HostBinding } from '@angular/core';
import { CommonModule } from '@angular/common';
import { cn } from '../../../lib/utils';

@Component({
  selector: 'app-tabs-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div [class]="tabsListClasses">
      <ng-content></ng-content>
    </div>
  `,
  styles: [`
    :host {
      display: contents;
    }
  `]
})
export class TabsListComponent {
  @Input() className = '';

  get tabsListClasses(): string {
    return cn(
      'inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground',
      this.className
    );
  }
}

