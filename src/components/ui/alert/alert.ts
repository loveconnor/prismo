import { Component, Input, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { cn } from '../../../lib/utils';
import { gsap } from 'gsap';

export type AlertVariant = 'default' | 'destructive' | 'warning' | 'success';

@Component({
  selector: 'app-alert',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './alert.html',
  styleUrl: './alert.css'
})
export class AlertComponent implements AfterViewInit {
  @Input() variant: AlertVariant = 'default';
  @Input() className = '';
  @Input() animated = true;

  @ViewChild('alertElement', { static: false }) alertElement!: ElementRef;

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

  ngAfterViewInit(): void {
    if (this.animated && typeof window !== 'undefined') {
      setTimeout(() => {
        this.animateIn();
      }, 50);
    }
  }

  private animateIn(): void {
    if (!this.alertElement || typeof window === 'undefined') return;

    gsap.from(this.alertElement.nativeElement, {
      opacity: 0,
      y: -20,
      scale: 0.95,
      duration: 0.4,
      ease: "back.out(1.7)"
    });
  }
}
