import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy,
  Inject,
  PLATFORM_ID,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { WidgetBaseComponent } from '../../base/widget-base';
import { ThemeService } from '../../../../services/theme.service';
import { FontService } from '../../../../services/font.service';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  lucideSave,
  lucideClock,
  lucideCircleCheck,
  lucideRotateCcw,
  lucideCircleAlert
} from '@ng-icons/lucide';

// ==================== TYPES (widgets) ====================

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

// ==================== COMPONENT ====================

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
export class CheckpointComponent extends WidgetBaseComponent implements OnInit, OnDestroy {
  // -------- Modern (widgets) inputs --------
  @Input() id!: string;
  @Input() stepId?: string;
  @Input() labId?: string;

  @Input() progressPercent: number = 0;
  @Input() lastSavedStep?: string;
  @Input() lastSavedTime?: Date | null = null;
  @Input() autoSave: boolean = true;

  @Input() ui?: CheckpointUI;

  /** seconds (widgets); mapped from legacy ms `saveInterval` if provided */
  @Input() autoSaveInterval: number = 30;
  @Input() maxRetries: number = 3;

  // -------- Modern (widgets) callbacks --------
  @Input() onSave?: (data: CheckpointSaveData) => void;
  @Input() onRestore?: () => void;
  @Input() onError?: (error: string) => void;

  // -------- Modern (widgets) outputs --------
  @Output() save = new EventEmitter<CheckpointSaveData>();
  @Output() restore = new EventEmitter<void>();
  @Output() error = new EventEmitter<string>();

  // ==================== LEGACY HEAD API (back-compat) ====================
  // Inputs
  @Input() checkpointData: any;                              // snapshot payload
  @Input() showProgress: boolean = true;
  @Input() allowRollback: boolean = true;
  /** ms (HEAD); if present, overrides autoSaveInterval */
  @Input() set saveInterval(ms: number) {
    if (typeof ms === 'number' && !Number.isNaN(ms) && ms > 0) {
      this.autoSaveInterval = Math.max(1, Math.round(ms / 1000));
    }
  }
  @Input() maxCheckpoints: number = 10;
  @Input() showTimestamp: boolean = true;

  // Outputs
  @Output() checkpointSaved = new EventEmitter<{ id: string; timestamp: Date; data: any }>();
  @Output() checkpointLoaded = new EventEmitter<{ id: string; data: any }>();
  @Output() checkpointDeleted = new EventEmitter<string>();
  @Output() rollbackRequested = new EventEmitter<string>();

  // ==================== STATE ====================
  state = signal<CheckpointState>('idle');
  lastSaveTimeSig = signal<Date | null>(null);
  retryCount = signal<number>(0);

  private intervalId: any;

  // Simple in-memory checkpoint ring for legacy actions
  private checkpoints: Array<{ id: string; timestamp: Date; data: any }> = [];

  // ==================== Lifecycle ====================
  constructor(
    themeService: ThemeService,
    fontService: FontService,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    super(themeService, fontService, platformId);
  }

  override ngOnInit(): void {
    super.ngOnInit();
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

  // ==================== Handlers ====================
  async handleSave(): Promise<void> {
    if (this.state() === 'saving') return;
    this.state.set('saving');

    try {
      // Simulate async work; replace with real persistence as needed
      await new Promise(resolve => setTimeout(resolve, 500));

      const timestamp = new Date();
      const saveData: CheckpointSaveData = {
        progressPercent: this.progressPercent,
        lastSavedStep: this.stepId || this.lastSavedStep,
        timestamp
      };

      // Modern events
      this.onSave?.(saveData);
      this.save.emit(saveData);

      // Legacy: persist a checkpoint snapshot (bounded ring)
      const id = this.makeCheckpointId(timestamp);
      const snapshot = {
        id,
        timestamp,
        data: this.checkpointData ?? {
          progressPercent: this.progressPercent,
          lastSavedStep: saveData.lastSavedStep,
          timestamp
        }
      };
      this.pushCheckpoint(snapshot);
      this.checkpointSaved.emit(snapshot);

      this.lastSaveTimeSig.set(timestamp);
      this.state.set('saved');
      this.retryCount.set(0);
      setTimeout(() => this.state.set('idle'), 1200);
    } catch (_e) {
      const tries = this.retryCount() + 1;
      this.retryCount.set(tries);

      if (tries < this.maxRetries) {
        setTimeout(() => this.handleSave(), 1500);
      } else {
        const msg = 'Failed to save progress';
        this.state.set('error');
        this.onError?.(msg);
        this.error.emit(msg);
      }
    }
  }

  handleRestore(): void {
    this.state.set('restoring');
    this.onRestore?.();
    this.restore.emit();
    setTimeout(() => this.state.set('idle'), 800);
  }

  // ==================== Legacy helpers/actions ====================
  loadCheckpoint(id: string): void {
    const cp = this.checkpoints.find(c => c.id === id);
    if (!cp) return;
    this.checkpointLoaded.emit({ id: cp.id, data: cp.data });
  }

  deleteCheckpoint(id: string): void {
    const idx = this.checkpoints.findIndex(c => c.id === id);
    if (idx === -1) return;
    this.checkpoints.splice(idx, 1);
    this.checkpointDeleted.emit(id);
  }

  requestRollback(id: string): void {
    if (!this.allowRollback) return;
    const cp = this.checkpoints.find(c => c.id === id);
    if (!cp) return;
    this.rollbackRequested.emit(id);
    // Optional: also trigger restore flow
    this.handleRestore();
  }

  // ==================== UI getters ====================
  get variant(): 'default' | 'compact' | 'inline' {
    return this.ui?.variant || 'default';
  }
  get showProgressBar(): boolean {
    return this.ui?.showProgressBar ?? true;
  }
  get showLastSaved(): boolean {
    // prefer widgets flag; fall back to legacy showTimestamp
    return this.ui?.showLastSaved ?? this.showTimestamp ?? true;
  }

  getStatusColor(): string {
    switch (this.state()) {
      case 'saving': return 'text-blue-500';
      case 'saved': return 'text-emerald-500';
      case 'error': return 'text-red-500';
      default: return 'text-[#60a5fa]';
    }
  }

  getStatusText(): string {
    switch (this.state()) {
      case 'saving': return 'Saving...';
      case 'saved': return 'Progress saved';
      case 'error': return 'Save failed';
      case 'restoring': return 'Restoring...';
      default: return 'Auto-saving';
    }
  }

  formatTimeAgo(date: Date): string {
    const now = new Date().getTime();
    const diffMs = now - date.getTime();
    const m = Math.floor(diffMs / 60000);
    const h = Math.floor(m / 60);
    const d = Math.floor(h / 24);
    if (m < 1) return 'just now';
    if (m < 60) return `${m}m ago`;
    if (h < 24) return `${h}h ago`;
    return `${d}d ago`;
  }

  // ==================== Internals ====================
  private makeCheckpointId(ts: Date): string {
    const base = (this.id ?? 'cp') + '-' + ts.toISOString().replace(/[:.]/g, '');
    // avoid accidental duplicates
    return base + '-' + Math.random().toString(36).slice(2, 6);
    }

  private pushCheckpoint(cp: { id: string; timestamp: Date; data: any }): void {
    this.checkpoints.push(cp);
    // enforce max ring size (most recent kept)
    if (this.checkpoints.length > Math.max(1, this.maxCheckpoints)) {
      this.checkpoints.splice(0, this.checkpoints.length - this.maxCheckpoints);
    }
  }
}
