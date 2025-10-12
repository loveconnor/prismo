import { Component, Input, Inject, forwardRef, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { cn } from '../../../lib/utils';
import { TabsNewComponent } from './tabs-new';

@Component({
  selector: 'app-tabs-content',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (isActive()) {
      <div
        role="tabpanel"
        [attr.data-state]="isActive() ? 'active' : 'inactive'"
        [class]="contentClasses"
      >
        <ng-content></ng-content>
      </div>
    }
  `,
  styles: [`
    :host {
      display: contents;
    }
  `]
})
export class TabsContentComponent {
  @Input() value = '';
  @Input() className = '';

  isActive = signal(false);

  constructor(
    @Inject(forwardRef(() => TabsNewComponent))
    private tabs: TabsNewComponent
  ) {
    effect(() => {
      // Use valueSignal for reactive access
      const currentValue = this.tabs.valueSignal();
      this.isActive.set(currentValue === this.value);
    });
  }

  get contentClasses(): string {
    return cn(
      'mt-2 ring-offset-background',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
      this.className
    );
  }
}

