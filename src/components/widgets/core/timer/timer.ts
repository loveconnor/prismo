import { 
  Component, 
  Input, 
  Output, 
  EventEmitter, 
  OnInit,
  OnDestroy,
  signal,
  computed,
  effect
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { WidgetBaseComponent } from '../../base/widget-base';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { 
  lucidePlay,
  lucidePause,
  lucideRotateCcw,
  lucidePlus,
  lucideVolumeX,
  lucideVolume2,
  lucideClock,
  lucideTriangleAlert,
  lucideInfo
} from '@ng-icons/lucide';
import { cn } from '../../../../lib/utils';

// ==================== TYPES ====================

export type TimerScope = 'step' | 'section' | 'lab';
export type TimerMode = 'stopwatch' | 'countdown';
export type TimerState = 'idle' | 'running' | 'paused' | 'expired' | 'completed' | 'readOnly';
export type TimerFormat = 'mm:ss' | 'hh:mm:ss' | 'auto';
export type TimerVariant = 'card' | 'inline' | 'pill';
export type AlertAt = 'elapsed' | 'remaining' | 'percent' | 'deadline';
export type AlertSeverity = 'info' | 'warn' | 'critical';
export type AlertAction = 'suggest_break' | 'open_hint' | 'open_coach' | 'submit';

export interface TimerAlert {
  at: AlertAt;
  value: number;
  label?: string;
  severity?: AlertSeverity;
  action?: AlertAction;
}

export interface TimerPacing {
  targetMs?: number;
  nudgeThresholds?: number[];
}

export interface TimerPolicy {
  lockOnExpire?: boolean;
  autoSubmitOnExpire?: boolean;
  hideControls?: boolean;
  showAsInlinePill?: boolean;
}

export interface TimerUI {
  variant?: TimerVariant;
  size?: 'sm' | 'md' | 'lg';
  defaultCollapsed?: boolean;
}

export interface TimerIntegrations {
  onOpenHintAtMs?: number;
  onCoachNudgeAtMs?: number;
  hostActions?: boolean;
}

// ==================== UTILS ====================

function formatTime(ms: number, format: TimerFormat, showMilliseconds: boolean): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const tenths = Math.floor((ms % 1000) / 100);
  
  let actualFormat = format;
  if (format === 'auto') {
    actualFormat = hours > 0 ? 'hh:mm:ss' : 'mm:ss';
  }
  
  if (actualFormat === 'hh:mm:ss') {
    const result = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    if (showMilliseconds && ms < 10000) {
      return `${result}.${tenths}`;
    }
    return result;
  }
  
  // mm:ss
  const result = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  if (showMilliseconds && ms < 10000) {
    return `${result}.${tenths}`;
  }
  return result;
}

function checkAlert(alert: TimerAlert, elapsedMs: number, remainingMs: number, durationMs: number): boolean {
  switch (alert.at) {
    case 'elapsed':
      return elapsedMs >= alert.value;
    case 'remaining':
      return remainingMs <= alert.value && remainingMs > 0;
    case 'percent': {
      const percent = (elapsedMs / durationMs) * 100;
      return percent >= alert.value;
    }
    case 'deadline':
      return remainingMs <= 0;
    default:
      return false;
  }
}

// ==================== COMPONENT ====================

@Component({
  selector: 'app-timer',
  standalone: true,
  imports: [
    CommonModule,
    NgIconComponent
  ],
  providers: [
    provideIcons({
      lucidePlay,
      lucidePause,
      lucideRotateCcw,
      lucidePlus,
      lucideVolumeX,
      lucideVolume2,
      lucideClock,
      lucideTriangleAlert,
      lucideInfo
    })
  ],
  templateUrl: './timer.html',
  styleUrls: ['./timer.css']
})
export class TimerComponent extends WidgetBaseComponent implements OnInit, OnDestroy {
  // ==================== INPUTS ====================
  @Input() timerId!: string;
  @Input() scope!: TimerScope;
  @Input() scopeId!: string;
  @Input() mode!: TimerMode;
  @Input() durationMs?: number;
  @Input() deadlineTs?: number;
  @Input() autoStart: boolean = true;
  @Input() allowPause: boolean = true;
  @Input() allowReset: boolean = false;
  @Input() allowAddTime: boolean = false;
  @Input() addTimeIncrementMs: number = 300000;
  @Input() tickIntervalMs: number = 250;
  @Input() format: TimerFormat = 'auto';
  @Input() showProgress: boolean = true;
  @Input() showMilliseconds: boolean = false;
  @Input() vibrateOnAlerts: boolean = true;
  @Input() soundOnAlerts: boolean = false;
  @Input() muteByDefault: boolean = true;
  @Input() alerts: TimerAlert[] = [];
  @Input() pacing?: TimerPacing;
  @Input() policy: TimerPolicy = {};
  @Input() ui: TimerUI = {};
  @Input() integrations: TimerIntegrations = {};
  @Input() timerTelemetry?: { cohort?: string; abBucket?: string };
  @Input() a11yLabel?: string;
  @Input() timerReadOnly: boolean = false;
  @Input() serverTimeOffsetMs: number = 0;

  // ==================== OUTPUTS ====================
  @Output() timerStarted = new EventEmitter<any>();
  @Output() timerPaused = new EventEmitter<any>();
  @Output() timerResumed = new EventEmitter<any>();
  @Output() timerReset = new EventEmitter<any>();
  @Output() timerTick = new EventEmitter<any>();
  @Output() timerAlertFired = new EventEmitter<any>();
  @Output() timerExpired = new EventEmitter<any>();
  @Output() timerExpiredAutosubmit = new EventEmitter<any>();
  @Output() timerCompleted = new EventEmitter<any>();

  // ==================== STATE ====================
  timerState = signal<TimerState>('idle');
  elapsedMs = signal<number>(0);
  isMuted = signal<boolean>(this.muteByDefault);
  firedAlerts = signal<Set<number>>(new Set());
  nudgeMessage = signal<string>('');

  private startTimeRef: number = 0;
  private pausedAtRef: number = 0;
  private animationFrameRef: number | null = null;
  private lastTickRef: number = 0;
  durationMsRef: number = 0;
  private syncInterval?: any;

  // ==================== COMPUTED ====================
  remainingMs = computed(() => 
    this.mode === 'countdown' ? Math.max(this.durationMsRef - this.elapsedMs(), 0) : 0
  );

  displayMs = computed(() => 
    this.mode === 'countdown' ? this.remainingMs() : this.elapsedMs()
  );

  progressPercent = computed(() => {
    if (this.mode === 'countdown' && this.durationMsRef > 0) {
      return (this.elapsedMs() / this.durationMsRef) * 100;
    } else if (this.mode === 'stopwatch' && this.pacing?.targetMs) {
      return (this.elapsedMs() / this.pacing.targetMs) * 100;
    }
    return 0;
  });

  formattedTime = computed(() => 
    formatTime(this.displayMs(), this.format, this.showMilliseconds)
  );

  stateDisplay = computed(() => {
    switch (this.timerState()) {
      case 'running':
        return { label: 'Running', color: 'text-emerald-500' };
      case 'paused':
        return { label: 'Paused', color: 'text-amber-500' };
      case 'expired':
        return { label: 'Expired', color: 'text-red-500' };
      case 'completed':
        return { label: 'Completed', color: 'text-blue-500' };
      default:
        return { label: 'Ready', color: 'text-gray-500' };
    }
  });

  // Policy getters
  get lockOnExpire() { return this.policy.lockOnExpire ?? false; }
  get autoSubmitOnExpire() { return this.policy.autoSubmitOnExpire ?? false; }
  get hideControls() { return this.policy.hideControls ?? false; }
  get showAsInlinePill() { return this.policy.showAsInlinePill ?? false; }

  // UI getters
  get variant() { return this.ui.variant ?? (this.showAsInlinePill ? 'pill' : 'card'); }
  get size() { return this.ui.size ?? 'md'; }

  // Integration getters
  get hostActions() { return this.integrations.hostActions ?? true; }

  // ==================== LIFECYCLE ====================

  override ngOnInit(): void {
    super.ngOnInit();

    // Calculate initial duration
    this.durationMsRef = this.getInitialDuration();

    // Auto-start if configured
    if (this.autoStart && this.timerState() === 'idle') {
      setTimeout(() => this.handleStart(), 100);
    }

    // Setup keyboard listeners
    this.setupKeyboardListeners();

    // Setup deadline sync for countdown mode
    if (this.mode === 'countdown' && this.deadlineTs) {
      this.setupDeadlineSync();
    }
  }

  override ngOnDestroy(): void {
    if (this.animationFrameRef) {
      cancelAnimationFrame(this.animationFrameRef);
    }
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
    super.ngOnDestroy();
  }

  // ==================== INITIALIZATION ====================

  private getInitialDuration(): number {
    if (this.mode === 'countdown') {
      if (this.deadlineTs) {
        const now = Date.now() + this.serverTimeOffsetMs;
        return Math.max(this.deadlineTs - now, 0);
      }
      return this.durationMs || 0;
    }
    return 0;
  }

  private setupDeadlineSync(): void {
    this.syncInterval = setInterval(() => {
      if (this.timerState() === 'running') {
        const now = Date.now() + this.serverTimeOffsetMs;
        const newRemaining = Math.max(this.deadlineTs! - now, 0);
        this.durationMsRef = newRemaining + this.elapsedMs();
      }
    }, 5000);
  }

  private setupKeyboardListeners(): void {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      switch (e.key) {
        case ' ':
          e.preventDefault();
          if (this.timerState() === 'idle' || this.timerState() === 'paused') {
            this.timerState() === 'idle' ? this.handleStart() : this.handleResume();
          } else if (this.timerState() === 'running') {
            this.handlePause();
          }
          break;
        case 'r':
          if (this.allowReset) {
            e.preventDefault();
            this.handleReset();
          }
          break;
        case '+':
          if (this.allowAddTime) {
            e.preventDefault();
            this.handleAddTime();
          }
          break;
      }
    };

    window.addEventListener('keydown', handler);
    // Store for cleanup
    (this as any)._keydownHandler = handler;
  }

  // ==================== TIMER LOOP ====================

  private tick = (): void => {
    const now = performance.now();
    const elapsed = now - this.startTimeRef;
    this.elapsedMs.set(elapsed);
    
    // Coarse tick events
    const remaining = this.remainingMs();
    const shouldEmitTick = this.mode === 'countdown' && remaining < 10000
      ? now - this.lastTickRef > 100
      : now - this.lastTickRef > 1000;
    
    if (shouldEmitTick) {
      this.lastTickRef = now;
      this.timerTick.emit({
        id: this.timerId,
        scopeId: this.scopeId,
        elapsedMs: elapsed,
        remainingMs: this.mode === 'countdown' ? remaining : undefined,
        percent: this.progressPercent(),
      });
    }

    // Check alerts
    this.checkAlerts(elapsed, remaining);

    // Check expiry (countdown)
    if (this.mode === 'countdown' && remaining <= 0) {
      this.handleExpiry();
      return;
    }

    // Check stopwatch target
    if (this.mode === 'stopwatch' && this.pacing?.targetMs && elapsed >= this.pacing.targetMs && this.timerState() !== 'completed') {
      if (!this.nudgeMessage()) {
        this.nudgeMessage.set("You've reached the target time. Consider moving on.");
        setTimeout(() => this.nudgeMessage.set(''), 5000);
      }
    }

    // Continue loop
    if (this.timerState() === 'running') {
      this.animationFrameRef = requestAnimationFrame(this.tick);
    }
  };

  private checkAlerts(elapsed: number, remaining: number): void {
    this.alerts.forEach((alert, index) => {
      if (!this.firedAlerts().has(index) && checkAlert(alert, elapsed, remaining, this.durationMsRef)) {
        this.firedAlerts.update(prev => new Set(prev).add(index));
        
        // Fire alert
        this.timerAlertFired.emit({
          id: this.timerId,
          scopeId: this.scopeId,
          at: alert.at,
          value: alert.value,
          label: alert.label,
          severity: alert.severity,
          action: alert.action,
        });
        
        // Vibrate
        if (this.vibrateOnAlerts && navigator.vibrate && !this.isMuted()) {
          navigator.vibrate(alert.severity === 'critical' ? [200, 100, 200] : 200);
        }
        
        // Sound (stub)
        if (this.soundOnAlerts && !this.isMuted()) {
          console.log(`[Timer] Alert sound: ${alert.severity}`);
        }
        
        // Set nudge message
        if (alert.label) {
          this.nudgeMessage.set(alert.label);
          setTimeout(() => this.nudgeMessage.set(''), 5000);
        }
        
        // Announce to screen reader
        if (alert.severity === 'warn' || alert.severity === 'critical') {
          const announcement = alert.label || `Alert at ${formatTime(elapsed, 'auto', false)}`;
          this.announceToScreenReader(announcement);
        }
      }
    });
  }

  private handleExpiry(): void {
    this.timerState.set('expired');
    if (this.animationFrameRef) {
      cancelAnimationFrame(this.animationFrameRef);
      this.animationFrameRef = null;
    }
    
    this.timerExpired.emit({ id: this.timerId, scopeId: this.scopeId });
    
    if (this.autoSubmitOnExpire) {
      this.timerExpiredAutosubmit.emit({ id: this.timerId, scopeId: this.scopeId });
    }
    
    if (this.lockOnExpire) {
      this.timerState.set('readOnly');
    }
    
    this.announceToScreenReader('Timer expired');
    this.completeWidget();
  }

  // ==================== HANDLERS ====================

  handleStart(): void {
    if (this.timerReadOnly || this.timerState() === 'readOnly') return;
    
    this.startTimeRef = performance.now() - this.elapsedMs();
    this.timerState.set('running');
    
    this.timerStarted.emit({
      id: this.timerId,
      scopeId: this.scopeId,
      mode: this.mode,
      startTs: Date.now(),
    });
    
    this.animationFrameRef = requestAnimationFrame(this.tick);
  }

  handlePause(): void {
    if (!this.allowPause || this.timerReadOnly || this.timerState() === 'readOnly') return;
    
    this.pausedAtRef = this.elapsedMs();
    this.timerState.set('paused');
    
    if (this.animationFrameRef) {
      cancelAnimationFrame(this.animationFrameRef);
      this.animationFrameRef = null;
    }
    
    this.timerPaused.emit({
      id: this.timerId,
      scopeId: this.scopeId,
      elapsedMs: this.elapsedMs(),
    });
  }

  handleResume(): void {
    if (this.timerReadOnly || this.timerState() === 'readOnly') return;
    
    this.startTimeRef = performance.now() - this.pausedAtRef;
    this.timerState.set('running');
    
    this.timerResumed.emit({
      id: this.timerId,
      scopeId: this.scopeId,
      elapsedMs: this.pausedAtRef,
    });
    
    this.animationFrameRef = requestAnimationFrame(this.tick);
  }

  handleReset(): void {
    if (!this.allowReset || this.timerReadOnly || this.timerState() === 'readOnly') return;
    
    if (this.animationFrameRef) {
      cancelAnimationFrame(this.animationFrameRef);
      this.animationFrameRef = null;
    }
    
    this.elapsedMs.set(0);
    this.timerState.set('idle');
    this.firedAlerts.set(new Set());
    this.nudgeMessage.set('');
    this.durationMsRef = this.getInitialDuration();
    
    this.timerReset.emit({ id: this.timerId, scopeId: this.scopeId });
  }

  handleAddTime(): void {
    if (!this.allowAddTime || this.mode !== 'countdown' || this.timerReadOnly || this.timerState() === 'readOnly') return;
    
    this.durationMsRef += this.addTimeIncrementMs;
    this.nudgeMessage.set(`Added ${formatTime(this.addTimeIncrementMs, 'auto', false)}`);
    setTimeout(() => this.nudgeMessage.set(''), 3000);
  }

  handleToggleMute(): void {
    this.isMuted.update(muted => !muted);
  }

  // ==================== UTILITY ====================

  // Expose utilities for template
  cn = cn;
  formatTime = formatTime;
  Math = Math;

  getSeverityColor(severity?: AlertSeverity): string {
    switch (severity) {
      case 'critical':
        return 'text-red-500 border-red-500 bg-red-500/10';
      case 'warn':
        return 'text-amber-500 border-amber-500 bg-amber-500/10';
      default:
        return 'text-blue-500 border-blue-500 bg-blue-500/10';
    }
  }

  getScopeLabel(): string {
    switch (this.scope) {
      case 'step': return 'Step';
      case 'section': return 'Section';
      case 'lab': return 'Lab';
      default: return '';
    }
  }

  getProgressBarColor(): string {
    const percent = this.progressPercent();
    if (percent < 50) return 'bg-emerald-500';
    if (percent < 80) return 'bg-amber-500';
    return 'bg-red-500';
  }

  getTimerDisplayColor(): string {
    const state = this.timerState();
    if (state === 'expired') return 'text-red-500';
    if (state === 'running') return 'text-[#e5e7eb]';
    if (state === 'paused') return 'text-amber-500';
    return 'text-[#e5e7eb]';
  }

  private announceToScreenReader(message: string): void {
    const announcement = document.createElement('div');
    announcement.setAttribute('role', 'status');
    announcement.setAttribute('aria-live', 'polite');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    document.body.appendChild(announcement);
    setTimeout(() => document.body.removeChild(announcement), 1000);
  }

  // ==================== WIDGET BASE IMPLEMENTATION ====================

  protected override initializeWidgetData(): void {
    this.setDataValue('mode', this.mode);
    this.setDataValue('scope', this.scope);
    this.setDataValue('initialized_at', new Date());
  }

  protected override validateInput(): boolean {
    return true;
  }

  protected override processCompletion(): void {
    this.setDataValue('completed_at', new Date());
    this.setDataValue('elapsed_ms', this.elapsedMs());
    this.setDataValue('state', this.timerState());
  }
}

