import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ToastData } from '../components/ui/toast/toast';

// Re-export ToastData for other components
export type { ToastData };

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private toastsSubject = new BehaviorSubject<ToastData[]>([]);
  public toasts$ = this.toastsSubject.asObservable();

  private nextId = 1;

  private generateId(): string {
    return `toast-${this.nextId++}`;
  }

  show(toast: Omit<ToastData, 'id'>): string {
    const id = this.generateId();
    const newToast: ToastData = {
      id,
      duration: 5000, // Default 5 seconds
      ...toast
    };

    const currentToasts = this.toastsSubject.value;
    this.toastsSubject.next([...currentToasts, newToast]);

    return id;
  }

  success(title: string, description?: string, options?: Partial<ToastData>): string {
    return this.show({
      title,
      description,
      type: 'success',
      ...options
    });
  }

  error(title: string, description?: string, options?: Partial<ToastData>): string {
    return this.show({
      title,
      description,
      type: 'error',
      duration: 0, // Error toasts don't auto-dismiss
      ...options
    });
  }

  warning(title: string, description?: string, options?: Partial<ToastData>): string {
    return this.show({
      title,
      description,
      type: 'warning',
      ...options
    });
  }

  info(title: string, description?: string, options?: Partial<ToastData>): string {
    return this.show({
      title,
      description,
      type: 'info',
      ...options
    });
  }

  dismiss(id: string): void {
    const currentToasts = this.toastsSubject.value;
    this.toastsSubject.next(currentToasts.filter(toast => toast.id !== id));
  }

  dismissAll(): void {
    this.toastsSubject.next([]);
  }

  getToasts(): ToastData[] {
    return this.toastsSubject.value;
  }
}
