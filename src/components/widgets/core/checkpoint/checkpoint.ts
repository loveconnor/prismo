import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  lucideSave,
  lucideClock,
  lucideCircleCheck,
  lucideRotateCcw,
  lucideCircleAlert
} from '@ng-icons/lucide';

// ==================== TYPES ====================

export type CheckpointState = 'idle' | 'saving' | 'saved' | 'error' | 'restoring';

export interface CheckpointUI {
  variant?: 'default' | 'compact' | 'inline';
  showProgressBar?: boolean;
  showLastSaved?: boolean;
}

export interface CheckpointSaveData {
  progressPercent: number;
  lastSavedStep?: string;
  timestamp?: Date;
}

@Component({
  selector: 'app-checkpoint',
  standalone: true,
  imports: [CommonModule, NgIconComponent],
  providers: [
    provideIcons({
      lucideSave,
      lucideClock,
      lucideCircleCheck,
      lucideRotateCcw,
      lucideCircleAlert
    })
  ],
  templateUrl: './checkpoint.html',
  styleUrls: ['./checkpoint.css']
})
export class CheckpointComponent implements OnInit, OnDestroy {
  // Core
  @Input() id!: string;
  @Input() stepId?: string;
  @Input() labId?: string;

  // Progress
  @Input() progressPercent: number = 0;
  @Input() lastSavedStep?: string;
  @Input() lastSavedTime?: Date | null = null;
  @Input() autoSave: boolean = true;

  // UI
  @Input() ui?: CheckpointUI;

  // Configuration
  @Input() autoSaveInterval: number = 30; // seconds
  @Input() maxRetries: number = 3;

  // Events (callback-style inputs for parity with React props)
  @Input() onSave?: (data: CheckpointSaveData) => void;
  @Input() onRestore?: () => void;
  @Input() onError?: (error: string) => void;

  // Angular outputs
  @Output() save = new EventEmitter<CheckpointSaveData>();
  @Output() restore = new EventEmitter<void>();
  @Output() error = new EventEmitter<string>();

  // ==================== STATE ====================
  state = signal<CheckpointState>('idle');
  lastSaveTimeSig = signal<Date | null>(null);
  retryCount = signal<number>(0);

  private intervalId: any;

  // ==================== LIFECYCLE ====================
  ngOnInit(): void {
    this.lastSaveTimeSig.set(this.lastSavedTime ?? null);

    if (this.autoSave) {
      this.intervalId = setInterval(() => {
        this.handleSave();
      }, Math.max(1, this.autoSaveInterval) * 1000);
    }
  }

  ngOnDestroy(): void {
    if (this.intervalId) clearInterval(this.intervalId);
  }

  // ==================== HANDLERS ====================
  async handleSave(): Promise<void> {
    if (this.state() === 'saving') return;
    this.state.set('saving');

    try {
      // Simulate save operation
      await new Promise(resolve => setTimeout(resolve, 1000));

      const saveData: CheckpointSaveData = {
        progressPercent: this.progressPercent,
        lastSavedStep: this.stepId || this.lastSavedStep,
        timestamp: new Date()
      };

      if (this.onSave) {
        this.onSave(saveData);
      }
      this.save.emit(saveData);

      this.lastSaveTimeSig.set(saveData.timestamp!);
      this.state.set('saved');
      this.retryCount.set(0);

      setTimeout(() => this.state.set('idle'), 2000);
    } catch (_e) {
      const currentRetries = this.retryCount() + 1;
      this.retryCount.set(currentRetries);

      if (currentRetries < this.maxRetries) {
        setTimeout(() => this.handleSave(), 2000);
      } else {
        this.state.set('error');
        const msg = 'Failed to save progress';
        if (this.onError) this.onError(msg);
        this.error.emit(msg);
      }
    }
  }

  handleRestore(): void {
    this.state.set('restoring');
    if (this.onRestore) this.onRestore();
    this.restore.emit();
    setTimeout(() => this.state.set('idle'), 1000);
  }

  // ==================== HELPERS ====================
  get variant(): 'default' | 'compact' | 'inline' {
    return this.ui?.variant || 'default';
  }

  get showProgressBar(): boolean {
    return this.ui?.showProgressBar ?? true;
  }

  get showLastSaved(): boolean {
    return this.ui?.showLastSaved ?? true;
  }

  getStatusColor(): string {
    switch (this.state()) {
      case 'saving':
        return 'text-blue-500';
      case 'saved':
        return 'text-emerald-500';
      case 'error':
        return 'text-red-500';
      default:
        return 'text-[#60a5fa]';
    }
  }

  formatTimeAgo(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  }

  getStatusText(): string {
    switch (this.state()) {
      case 'saving':
        return 'Saving...';
      case 'saved':
        return 'Progress saved';
      case 'error':
        return 'Save failed';
      case 'restoring':
        return 'Restoring...';
      default:
        return 'Auto-saving';
    }
  }
}


