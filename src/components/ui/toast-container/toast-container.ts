import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { provideIcons, NgIconComponent } from '@ng-icons/core';
import { lucideCircleCheck, lucideCircleX, lucideTriangleAlert, lucideInfo, lucideX } from '@ng-icons/lucide';
import { ToastService, ToastData } from '../../../services/toast.service';
import { ToastComponent } from '../toast/toast';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  providers: [
    provideIcons({
      lucideCircleCheck,
      lucideCircleX,
      lucideTriangleAlert,
      lucideInfo,
      lucideX
    })
  ],
  imports: [CommonModule,  ToastComponent],
  templateUrl: './toast-container.html'
})
export class ToastContainerComponent implements OnInit, OnDestroy {
  toasts: ToastData[] = [];
  isHovered = false;
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

  onMouseEnter() {
    this.isHovered = true;
  }

  onMouseLeave() {
    this.isHovered = false;
  }
}
