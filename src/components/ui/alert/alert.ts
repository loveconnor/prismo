import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { cn } from '../../../lib/utils';

export type AlertVariant = 'default' | 'destructive' | 'warning' | 'success';

@Component({
  selector: 'app-alert',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './alert.html',
  styleUrl: './alert.css'
})
export class AlertComponent {
  @Input() variant: AlertVariant = 'default';
  @Input() className = '';

  get alertClasses(): string {
    const variantClasses = {
      'default': 'bg-background text-foreground',
      'destructive': 'border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive',
      'warning': 'border-yellow-500/50 text-yellow-600 dark:border-yellow-500 [&>svg]:text-yellow-600',
      'success': 'border-green-500/50 text-green-600 dark:border-green-500 [&>svg]:text-green-600'
    };

    return cn(
      'relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground',
      variantClasses[this.variant],
      this.className
    );
  }
}
