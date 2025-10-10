import { Component, Input, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { cn } from '../../../lib/utils';
import { gsap } from 'gsap';

@Component({
  selector: 'app-progress',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './progress.html',
  styleUrl: './progress.css'
})
export class ProgressComponent implements AfterViewInit {
  @Input() value: number = 0;
  @Input() max: number = 100;
  @Input() className = '';
  @Input() showValue = false;
  @Input() animated = true;

  @ViewChild('progressBar', { static: false }) progressBar!: ElementRef;

  get progressClasses(): string {
    return cn(
      'relative h-2 w-full overflow-hidden rounded-full bg-secondary',
      this.className
    );
  }

  get barClasses(): string {
    return cn(
      'h-full w-full flex-1 bg-primary transition-all'
    );
  }

  get percentage(): number {
    return Math.min(Math.max((this.value / this.max) * 100, 0), 100);
  }

  getRoundedPercentage(): number {
    return Math.round(this.percentage);
  }

  ngAfterViewInit(): void {
    if (this.animated && typeof window !== 'undefined') {
      setTimeout(() => {
        this.animateProgress();
      }, 100);
    }
  }

  private animateProgress(): void {
    if (!this.progressBar || typeof window === 'undefined') return;

    // Reset to 0 and animate to target
    gsap.set(this.progressBar.nativeElement, { width: '0%' });
    gsap.to(this.progressBar.nativeElement, {
      width: `${this.percentage}%`,
      duration: 0.8,
      ease: "power2.out"
    });
  }
}
