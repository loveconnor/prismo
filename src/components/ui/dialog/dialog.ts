import { Component, Input, Output, EventEmitter, ViewChild, ElementRef, AfterViewInit, OnDestroy, OnChanges, SimpleChanges, AfterViewChecked, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OverlayModule } from '@angular/cdk/overlay';
import { PortalModule } from '@angular/cdk/portal';
import { gsap } from 'gsap';
import { cn } from '../../../lib/utils';

// Dialog size types
export type DialogSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl';

// Dialog position types
export type DialogPosition = 'top' | 'middle' | 'bottom';

@Component({
  selector: 'app-dialog',
  standalone: true,
  imports: [CommonModule, OverlayModule, PortalModule],
  templateUrl: './dialog.html',
  styleUrl: './dialog.css'
})
export class DialogComponent implements AfterViewInit, OnDestroy, OnChanges, AfterViewChecked {
  @Input() open = false;
  @Input() size: DialogSize = 'lg';
  @Input() position: DialogPosition = 'middle';
  @Input() className = '';
  @Input() showCloseButton = true;
  @Input() closeOnBackdropClick = true;
  @Input() closeOnEscape = true;
  
  @Output() openChange = new EventEmitter<boolean>();

  @ViewChild('backdrop', { static: false }) backdrop!: ElementRef;
  @ViewChild('panel', { static: false }) panel!: ElementRef;

  // Animation timeline
  private timeline?: gsap.core.Timeline;
  
  // Animation state
  private shouldAnimateIn = false;
  private hasAnimatedIn = false;

  // Size classes mapping
  private sizeClasses: Record<DialogSize, string> = {
    'xs': 'sm:max-w-xs',
    'sm': 'sm:max-w-sm', 
    'md': 'sm:max-w-md',
    'lg': 'sm:max-w-lg',
    'xl': 'sm:max-w-xl',
    '2xl': 'sm:max-w-2xl',
    '3xl': 'sm:max-w-3xl',
    '4xl': 'sm:max-w-4xl',
    '5xl': 'sm:max-w-5xl'
  };

  get dialogClasses(): string {
    const positionClasses = {
      'top': 'items-start pt-6 sm:pt-8',
      'middle': 'items-center',
      'bottom': 'items-end pb-6 sm:pb-8'
    };

    return cn(
      'fixed inset-0 z-50 flex w-screen justify-center overflow-y-auto',
      'px-2 py-2 sm:px-6 sm:py-8 lg:px-8 lg:py-16',
      positionClasses[this.position]
    );
  }

  get backdropClasses(): string {
    return cn(
      'fixed inset-0 bg-background/80 backdrop-blur-sm transition-opacity duration-100'
    );
  }

  get panelClasses(): string {
    const positionClasses = {
      'top': 'rounded-b-3xl sm:rounded-2xl',
      'middle': 'rounded-2xl',
      'bottom': 'rounded-t-3xl sm:rounded-2xl'
    };

    return cn(
      'relative w-full min-w-0 bg-background p-8 shadow-lg ring-1 ring-border',
      'text-foreground',
      'forced-colors:outline',
      positionClasses[this.position],
      this.sizeClasses[this.size],
      this.className
    );
  }

  ngAfterViewInit(): void {
    if (this.open) {
      this.animateIn();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['open']) {
      if (changes['open'].currentValue) {
        // Dialog is opening - set flag to animate when elements are ready
        this.shouldAnimateIn = true;
        this.hasAnimatedIn = false;
      } else {
        // Dialog is closing
        this.animateOut();
      }
    }
  }

  ngAfterViewChecked(): void {
    if (this.shouldAnimateIn && !this.hasAnimatedIn && this.backdrop && this.panel) {
      this.hasAnimatedIn = true;
      this.shouldAnimateIn = false;
      this.animateIn();
    }
  }

  ngOnDestroy(): void {
    if (this.timeline) {
      this.timeline.kill();
    }
  }

  onBackdropClick(event: Event): void {
    if (this.closeOnBackdropClick && event.target === event.currentTarget) {
      this.close();
    }
  }

  onKeyDown(event: KeyboardEvent): void {
    if (this.closeOnEscape && event.key === 'Escape') {
      this.close();
    }
  }

  close(): void {
    this.animateOut();
  }

  private animateIn(): void {
    if (!this.backdrop || !this.panel) return;

    // Kill any existing timeline
    if (this.timeline) {
      this.timeline.kill();
    }

    // Set initial states - slide from edge
    gsap.set(this.backdrop.nativeElement, { opacity: 0 });
    
    // Slide from different edges based on position
    const initialY = this.position === 'top' ? -window.innerHeight : this.position === 'bottom' ? window.innerHeight : 0;
    
    gsap.set(this.panel.nativeElement, { 
      opacity: 0, 
      y: initialY
    });

    // Create simple slide animation
    this.timeline = gsap.timeline();
    
    this.timeline
      .to(this.backdrop.nativeElement, {
        opacity: 1,
        duration: 0.2,
        ease: "power2.out"
      })
      .to(this.panel.nativeElement, {
        opacity: 1,
        y: 0,
        duration: 0.3,
        ease: "power2.out"
      }, "-=0.1");
  }

  private animateOut(): void {
    if (!this.backdrop || !this.panel) return;

    // Kill any existing timeline
    if (this.timeline) {
      this.timeline.kill();
    }

    // Create simple exit animation
    this.timeline = gsap.timeline({
      onComplete: () => {
        this.openChange.emit(false);
      }
    });

    // Slide to different edges based on position
    const exitY = this.position === 'top' ? -window.innerHeight : this.position === 'bottom' ? window.innerHeight : 0;

    this.timeline
      .to(this.panel.nativeElement, {
        opacity: 0,
        y: exitY,
        duration: 0.2,
        ease: "power2.in"
      })
      .to(this.backdrop.nativeElement, {
        opacity: 0,
        duration: 0.2,
        ease: "power2.in"
      }, "-=0.1");
  }
}
