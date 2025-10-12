import { Component, Input, HostListener, HostBinding, Inject, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { cn } from '../../../lib/utils';
import { TabsNewComponent } from './tabs-new';

@Component({
  selector: 'app-tabs-trigger',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button
      type="button"
      role="tab"
      [attr.aria-selected]="isActive"
      [attr.data-state]="isActive ? 'active' : 'inactive'"
      [class]="triggerClasses"
    >
      <ng-content></ng-content>
    </button>
  `,
  styles: [`
    :host {
      display: contents;
    }
  `]
})
export class TabsTriggerComponent {
  @Input() value = '';
  @Input() className = '';
  @Input() disabled = false;

  constructor(
    @Inject(forwardRef(() => TabsNewComponent))
    private tabs: TabsNewComponent
  ) {}

  get isActive(): boolean {
    return this.tabs.value === this.value;
  }

  get triggerClasses(): string {
    return cn(
      'inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
      'disabled:pointer-events-none disabled:opacity-50',
      'data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow',
      this.className
    );
  }

  @HostListener('click')
  onClick(): void {
    if (!this.disabled) {
      this.tabs.changeTab(this.value);
    }
  }
}

