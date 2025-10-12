import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { cn } from '../../../lib/utils';

@Component({
  selector: 'app-text',
  standalone: true,
  imports: [CommonModule],
  template: `
    <p [class]="textClasses">
      <ng-content></ng-content>
    </p>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class TextComponent {
  @Input() className = '';

  get textClasses(): string {
    return cn(
      'text-sm text-zinc-600 dark:text-zinc-400',
      this.className
    );
  }
}

@Component({
  selector: 'app-text-link',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <a [routerLink]="href" [class]="linkClasses">
      <ng-content></ng-content>
    </a>
  `,
  styles: [`
    :host {
      display: inline;
    }
  `]
})
export class TextLinkComponent {
  @Input() href = '';
  @Input() className = '';

  get linkClasses(): string {
    return cn(
      'text-blue-600 hover:text-blue-700 dark:text-blue-500 dark:hover:text-blue-400',
      this.className
    );
  }
}

@Component({
  selector: 'app-strong',
  standalone: true,
  imports: [CommonModule],
  template: `
    <strong [class]="strongClasses">
      <ng-content></ng-content>
    </strong>
  `,
  styles: [`
    :host {
      display: inline;
    }
  `]
})
export class StrongComponent {
  @Input() className = '';

  get strongClasses(): string {
    return cn(
      'font-semibold',
      this.className
    );
  }
}

