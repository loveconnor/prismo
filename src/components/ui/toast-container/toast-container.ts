import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, ToastData } from '../../../services/toast.service';
import { ToastComponent } from '../toast/toast';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule, ToastComponent],
  templateUrl: './toast-container.html',
  styleUrls: ['./toast-container.css']
})
export class ToastContainerComponent implements OnInit, OnDestroy {
  toasts: ToastData[] = [];
  private subscription?: any;

  constructor(private toastService: ToastService) {}

  ngOnInit() {
    this.subscription = this.toastService.toasts$.subscribe(toasts => {
      this.toasts = toasts;
    });
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  onDismiss(id: string) {
    this.toastService.dismiss(id);
  }

  onAction(id: string) {
    // Handle action if needed
  }

  trackByToastId(index: number, toast: ToastData): string {
    return toast.id;
  }
}