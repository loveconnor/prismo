import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, Inject, PLATFORM_ID, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ThemeService } from '../../../services/theme.service';
import { WidgetMetadata, WidgetState, WidgetEvent } from '../../../types/widget.types';
import { CardComponent } from '../../ui/card/card';
import { CardContentComponent } from '../../ui/card/card-content';
import { ButtonComponent } from '../../ui/button/button';
import { ProgressComponent } from '../../ui/progress/progress';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucideTriangle, lucideLoader, lucideRefreshCw } from '@ng-icons/lucide';
import { gsap } from 'gsap';

@Component({
  selector: 'app-widget-base',
  standalone: true,
  imports: [
    CommonModule,
    CardComponent,
    CardContentComponent,
    ButtonComponent,
    NgIconComponent
  ],
  providers: [
    provideIcons({
      lucideTriangle,
      lucideLoader,
      lucideRefreshCw
    })
  ],
  template: `
    <app-card 
      [className]="'min-h-[200px] transition-all duration-200'"
      [class.opacity-75]="isLoading"
      [class.pointer-events-none]="isLoading"
      [class.border-destructive]="hasError"
      [attr.aria-label]="metadata.title"
      role="region"
      [attr.aria-live]="isLoading ? 'polite' : 'off'"
      #widgetCard
    >
      <!-- Loading State -->
      <app-card-content *ngIf="isLoading" class="flex flex-col items-center justify-center py-8 text-center" aria-label="Loading widget">
        <ng-icon name="lucideLoader" class="w-8 h-8 text-primary animate-spin mb-4"></ng-icon>
        <p class="text-sm text-muted-foreground">Loading...</p>
      </app-card-content>

      <!-- Error State -->
      <app-card-content *ngIf="hasError && !isLoading" class="flex flex-col items-center justify-center py-8 text-center" role="alert">
        <ng-icon name="lucideTriangle" class="w-12 h-12 text-destructive mb-4"></ng-icon>
        <h3 class="text-lg font-semibold text-destructive mb-2">Something went wrong</h3>
        <p class="text-sm text-muted-foreground mb-4 max-w-md">{{ errorMessage || 'This widget encountered an error.' }}</p>
        <app-button 
          variant="outline"
          size="sm"
          (click)="retry()"
          [attr.aria-label]="'Retry ' + metadata.title"
        >
          <ng-icon name="lucideRefreshCw" class="w-4 h-4 mr-2"></ng-icon>
          Try Again
        </app-button>
      </app-card-content>

      <!-- Widget Content -->
      <ng-content *ngIf="!isLoading && !hasError"></ng-content>
    </app-card>
  `
})
export abstract class WidgetBaseComponent implements OnInit, OnDestroy, AfterViewInit {
  @Input() metadata!: WidgetMetadata;
  @Input() config: Record<string, any> = {};
  @Input() initialData: Record<string, any> = {};
  
  @Output() stateChange = new EventEmitter<WidgetEvent>();
  @ViewChild('widgetCard') widgetCard!: ElementRef;
  @Output() completion = new EventEmitter<WidgetEvent>();
  @Output() error = new EventEmitter<WidgetEvent>();

  // Base state
  protected _state: WidgetState = {
    id: '',
    is_completed: false,
    is_loading: true,
    has_error: false,
    time_spent: 0,
    attempts: 0,
    last_updated: new Date(),
    data: {}
  };

  // Reactive state
  protected stateSubject = new BehaviorSubject<WidgetState>(this._state);
  public state$ = this.stateSubject.asObservable();

  // Component lifecycle
  protected destroy$ = new Subject<void>();
  protected startTime: number = Date.now();

  // UI state
  public isLoading = true;
  public hasError = false;
  public errorMessage = '';

  constructor(
    protected themeService: ThemeService,
    @Inject(PLATFORM_ID) protected platformId: Object
  ) {}

  ngOnInit(): void {
    this.initializeWidget();
    this.setupThemeSubscription();
    this.setupAccessibility();
  }

  ngAfterViewInit(): void {
    if (this.widgetCard && isPlatformBrowser(this.platformId)) {
      // Animate widget in
      gsap.from(this.widgetCard.nativeElement, {
        opacity: 0,
        y: 20,
        duration: 0.4,
        ease: "power2.out"
      });
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.updateTimeSpent();
  }

  // Abstract methods to be implemented by child widgets
  protected abstract initializeWidgetData(): void;
  protected abstract validateInput(): boolean;
  protected abstract processCompletion(): void;

  // Public API
  public get state(): WidgetState {
    return this._state;
  }

  public get isDarkMode(): () => boolean {
    return () => this.themeService.isDarkMode();
  }

  public get isCompleted(): boolean {
    return this._state.is_completed;
  }

  public get timeSpent(): number {
    return this._state.time_spent;
  }

  // State management
  protected updateState(updates: Partial<WidgetState>): void {
    this._state = { ...this._state, ...updates, last_updated: new Date() };
    this.stateSubject.next(this._state);
    this.emitStateChange('state_change', updates);
  }

  protected completeWidget(): void {
    this.updateState({ is_completed: true });
    this.processCompletion();
    this.emitStateChange('completion', { completed: true });
    this.completion.emit({
      widget_id: this._state.id,
      event_type: 'completion',
      data: this._state,
      timestamp: new Date()
    });
  }

  protected handleError(error: any): void {
    this.hasError = true;
    this.errorMessage = error.message || 'An unexpected error occurred';
    this.updateState({ has_error: true });
    this.emitStateChange('error', { error });
    this.error.emit({
      widget_id: this._state.id,
      event_type: 'error',
      data: { error },
      timestamp: new Date()
    });
  }

  protected incrementAttempts(): void {
    this.updateState({ attempts: this._state.attempts + 1 });
    this.emitStateChange('attempt', { attempts: this._state.attempts });
  }

  // Private methods
  private initializeWidget(): void {
    if (!this.metadata) {
      this.handleError(new Error('Widget metadata is required'));
      return;
    }

    this._state.id = this.metadata.id;
    this._state.data = { ...this.initialData };
    
    try {
      this.initializeWidgetData();
      this.isLoading = false;
      this.updateState({ is_loading: false });
    } catch (error) {
      this.handleError(error);
    }
  }

  private setupThemeSubscription(): void {
    // Note: isDarkMode is a signal, not an observable
    // For now, we'll skip the subscription
    // this.themeService.isDarkMode
    //   .subscribe(() => {
    //     // Theme change handling - widgets can override this
    //     this.onThemeChange();
    //   });
  }

  private setupAccessibility(): void {
    if (isPlatformBrowser(this.platformId)) {
      // Setup keyboard navigation
      document.addEventListener('keydown', this.handleKeyboardNavigation.bind(this));
    }
  }

  private updateTimeSpent(): void {
    const timeSpent = Math.round((Date.now() - this.startTime) / 1000);
    this.updateState({ time_spent: this._state.time_spent + timeSpent });
  }

  protected emitStateChange(eventType: string, data: any): void {
    this.stateChange.emit({
      widget_id: this._state.id,
      event_type: eventType as any,
      data,
      timestamp: new Date()
    });
  }

  public retry(): void {
    this.hasError = false;
    this.errorMessage = '';
    this.isLoading = true;
    this.updateState({ has_error: false, is_loading: true });
    
    try {
      this.initializeWidgetData();
      this.isLoading = false;
      this.updateState({ is_loading: false });
    } catch (error) {
      this.handleError(error);
    }
  }

  private handleKeyboardNavigation(event: KeyboardEvent): void {
    // Base keyboard navigation - widgets can override
    if (event.key === 'Escape' && this.hasError) {
      this.retry();
    }
  }

  // Override points for child widgets
  protected onThemeChange(): void {
    // Override in child widgets if needed
  }

  // Utility methods for child widgets
  protected getConfigValue(key: string, defaultValue?: any): any {
    return this.config[key] ?? defaultValue;
  }

  protected setDataValue(key: string, value: any): void {
    this._state.data = { ...this._state.data, [key]: value };
    this.updateState({ data: this._state.data });
  }

  protected getDataValue(key: string): any {
    return this._state.data[key];
  }
}
