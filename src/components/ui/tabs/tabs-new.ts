import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { cn } from '../../../lib/utils';

@Component({
  selector: 'app-tabs',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div [class]="tabsClasses">
      <ng-content></ng-content>
    </div>
  `,
  styles: [`
    :host {
      display: contents;
    }
  `]
})
export class TabsNewComponent {
  @Input()
  set value(v: string) {
    this._value.set(v);
  }
  get value(): string {
    return this._value();
  }
  
  // Expose signal for reactive access
  get valueSignal() {
    return this._value;
  }
  
  @Input() className = '';
  @Input() defaultValue = '';

  @Output() valueChange = new EventEmitter<string>();

  private _value = signal('');

  get tabsClasses(): string {
    return cn('w-full', this.className);
  }

  changeTab(newValue: string): void {
    this._value.set(newValue);
    this.valueChange.emit(newValue);
  }
}

