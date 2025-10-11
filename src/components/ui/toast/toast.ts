import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, HostBinding, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgIconComponent } from '@ng-icons/core';
import { gsap } from 'gsap';

export interface ToastData {
  id: string;
  title: string;
  description?: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule, NgIconComponent],
  templateUrl: './toast.html'
})
export class ToastComponent implements OnInit, OnDestroy, AfterViewInit {
  @Input() toast!: ToastData;
  @Output() dismiss = new EventEmitter<string>();
  @Output() action = new EventEmitter<string>();
  @ViewChild('toastElement', { static: true }) toastElement!: ElementRef;

  @HostBinding('class') get hostClasses() {
    return `toast toast-${this.toast.type}`;
  }

  private timeoutId?: number;

  ngOnInit() {
    if (this.toast.duration && this.toast.duration > 0) {
      this.timeoutId = window.setTimeout(() => {
        this.dismissToast();
      }, this.toast.duration);
    }
  }

  ngAfterViewInit() {
    // Animate in
    gsap.fromTo(this.toastElement.nativeElement, 
      { 
        opacity: 0, 
        y: -50, 
        scale: 0.95 
      },
      { 
        opacity: 1, 
        y: 0, 
        scale: 1, 
        duration: 0.3, 
        ease: "back.out(1.7)" 
      }
    );
  }

  ngOnDestroy() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
  }

  dismissToast() {
    // Animate out
    gsap.to(this.toastElement.nativeElement, {
      opacity: 0,
      y: -20,
      scale: 0.95,
      duration: 0.2,
      ease: "power2.in",
      onComplete: () => {
        this.dismiss.emit(this.toast.id);
      }
    });
  }

  handleAction() {
    if (this.toast.action) {
      this.toast.action.onClick();
      this.action.emit(this.toast.id);
    }
  }

  getIconName(): string {
    switch (this.toast.type) {
      case 'success':
        return 'lucide-circle-check';
      case 'error':
        return 'lucide-circle-x';
      case 'warning':
        return 'lucide-triangle-alert';
      case 'info':
        return 'lucide-info';
      default:
        return 'lucide-info';
    }
  }

  getIconClass(): string {
    switch (this.toast.type) {
      case 'success':
        return 'text-green-500';
      case 'error':
        return 'text-red-500';
      case 'warning':
        return 'text-yellow-500';
      case 'info':
        return 'text-blue-500';
      default:
        return 'text-muted-foreground';
    }
  }
}