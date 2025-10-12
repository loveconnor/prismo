import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BehaviorSubject, Observable, combineLatest, takeUntil } from 'rxjs';
import { map, distinctUntilChanged } from 'rxjs/operators';
import { WidgetRegistryService } from '../../../services/widget-registry.service';
import { WidgetStateService } from '../../../services/widget-state.service';
import { ModuleDefinition, WidgetConfig, WidgetMetadata } from '../../../types/widget.types';

// Import all widgets
import { StepPromptComponent } from '../../widgets/core/step-prompt/step-prompt';
import { HintPanelComponent } from '../../widgets/core/hint-panel/hint-panel';
import { FeedbackBoxComponent } from '../../widgets/core/feedback-box/feedback-box';
import { ConfidenceMeterComponent } from '../../widgets/core/confidence-meter/confidence-meter';
import { CodeEditorComponent } from '../../widgets/coding/code-editor/code-editor';
import { EquationInputComponent } from '../../widgets/math/equation-input/equation-input';
import { TextEditorComponent } from '../../widgets/writing/text-editor/text-editor';

interface ModuleState {
  isLoaded: boolean;
  currentWidgetIndex: number;
  totalWidgets: number;
  completedWidgets: number;
  progress: number;
  isCompleted: boolean;
  errors: string[];
}

@Component({
  selector: 'app-module-container',
  standalone: true,
  imports: [
    CommonModule,
    StepPromptComponent,
    HintPanelComponent,
    FeedbackBoxComponent,
    ConfidenceMeterComponent,
    CodeEditorComponent,
    EquationInputComponent,
    TextEditorComponent
  ],
  template: `
    <div class="module-container">
      <!-- Module Header -->
      <div class="module-header">
        <div class="module-title">
          <h2>{{ moduleDefinition.title }}</h2>
          <p class="module-description" *ngIf="moduleDefinition?.description">
            {{ moduleDefinition.description }}
          </p>
        </div>
        
        <div class="module-progress" *ngIf="moduleState$ | async as state">
          <div class="progress-info">
            <span class="progress-text">
              {{ state.completedWidgets }}/{{ state.totalWidgets }} widgets completed
            </span>
            <span class="progress-percentage">{{ state.progress }}%</span>
          </div>
          <div class="progress-bar">
            <div 
              class="progress-fill" 
              [style.width.%]="state.progress"
            ></div>
          </div>
        </div>
      </div>
      
      <!-- Module Content -->
      <div class="module-content" *ngIf="moduleState$ | async as state">
        <!-- Loading State -->
        <div *ngIf="!state.isLoaded" class="module-loading">
          <div class="loading-spinner"></div>
          <p>Loading module...</p>
        </div>
        
        <!-- Error State -->
        <div *ngIf="state.errors.length > 0" class="module-errors">
          <h3>Module Errors</h3>
          <ul>
            <li *ngFor="let error of state.errors">{{ error }}</li>
          </ul>
        </div>
        
        <!-- Widget Content -->
        <div *ngIf="state.isLoaded && state.errors.length === 0" class="widget-content">
          <!-- Current Widget -->
          <div class="current-widget" *ngIf="currentWidget$ | async as widget">
            <div class="widget-header">
              <h3>{{ widget.metadata.title }}</h3>
              <span class="widget-position">
                Widget {{ state.currentWidgetIndex + 1 }} of {{ state.totalWidgets }}
              </span>
            </div>
            
            <div class="widget-container">
              <!-- Dynamic Widget Rendering -->
              <app-step-prompt
                *ngIf="widget.metadata.id === 'step-prompt'"
                [metadata]="widget.metadata"
                [config]="widget.props"
                (stateChange)="onWidgetStateChange($event)"
                (completion)="onWidgetCompletion($event)"
                (error)="onWidgetError($event)"
              ></app-step-prompt>
              
              <app-hint-panel
                *ngIf="widget.metadata.id === 'hint-panel'"
                [metadata]="widget.metadata"
                [config]="widget.props"
                (stateChange)="onWidgetStateChange($event)"
                (completion)="onWidgetCompletion($event)"
                (error)="onWidgetError($event)"
              ></app-hint-panel>
              
              <app-feedback-box
                *ngIf="widget.metadata.id === 'feedback-box'"
                [metadata]="widget.metadata"
                [config]="widget.props"
                (stateChange)="onWidgetStateChange($event)"
                (completion)="onWidgetCompletion($event)"
                (error)="onWidgetError($event)"
              ></app-feedback-box>
              
              <app-confidence-meter
                *ngIf="widget.metadata.id === 'confidence-meter'"
                [metadata]="widget.metadata"
                [config]="widget.props"
                (stateChange)="onWidgetStateChange($event)"
                (completion)="onWidgetCompletion($event)"
                (error)="onWidgetError($event)"
              ></app-confidence-meter>
              
              <app-code-editor
                *ngIf="widget.metadata.id === 'code-editor'"
                [metadata]="widget.metadata"
                [config]="widget.props"
                (stateChange)="onWidgetStateChange($event)"
                (completion)="onWidgetCompletion($event)"
                (error)="onWidgetError($event)"
              ></app-code-editor>
              
              <app-equation-input
                *ngIf="widget.metadata.id === 'equation-input'"
                [metadata]="widget.metadata"
                [config]="widget.props"
                (stateChange)="onWidgetStateChange($event)"
                (completion)="onWidgetCompletion($event)"
                (error)="onWidgetError($event)"
              ></app-equation-input>
              
              <app-text-editor
                *ngIf="widget.metadata.id === 'text-editor'"
                [metadata]="widget.metadata"
                [config]="widget.props"
                (stateChange)="onWidgetStateChange($event)"
                (completion)="onWidgetCompletion($event)"
                (error)="onWidgetError($event)"
              ></app-text-editor>
            </div>
          </div>
          
          <!-- Navigation -->
          <div class="widget-navigation" *ngIf="!state.isCompleted">
            <button 
              class="nav-button prev-button"
              (click)="previousWidget()"
              [disabled]="state.currentWidgetIndex === 0"
            >
              ← Previous
            </button>
            
            <button 
              class="nav-button next-button"
              (click)="nextWidget()"
              [disabled]="state.currentWidgetIndex >= state.totalWidgets - 1"
            >
              Next →
            </button>
          </div>
        </div>
        
        <!-- Completion State -->
        <div *ngIf="state.isCompleted" class="module-completion">
          <div class="completion-content">
            <div class="completion-icon">🎉</div>
            <h3>Module Completed!</h3>
            <p>Great job! You've completed all widgets in this module.</p>
            <div class="completion-stats">
              <div class="stat-item">
                <span class="stat-label">Total Time:</span>
                <span class="stat-value">{{ formatTime(totalTime$ | async) }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Widgets Completed:</span>
                <span class="stat-value">{{ state.completedWidgets }}/{{ state.totalWidgets }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class ModuleContainerComponent implements OnInit, OnDestroy {
  @Input() moduleDefinition!: ModuleDefinition;

  private moduleStateSubject = new BehaviorSubject<ModuleState>({
    isLoaded: false,
    currentWidgetIndex: 0,
    totalWidgets: 0,
    completedWidgets: 0,
    progress: 0,
    isCompleted: false,
    errors: []
  });

  public moduleState$ = this.moduleStateSubject.asObservable();
  public currentWidget$: Observable<{metadata: WidgetMetadata, props: any} | null>;
  public totalTime$: Observable<number>;

  private destroy$ = new BehaviorSubject<void>(void 0);

  constructor(
    private widgetRegistry: WidgetRegistryService,
    private widgetState: WidgetStateService
  ) {
    this.currentWidget$ = this.moduleState$.pipe(
      map(state => {
        if (!state.isLoaded || state.errors.length > 0) return null;
        const widget = this.moduleDefinition.widgets[state.currentWidgetIndex];
        return widget ? { metadata: widget.metadata, props: widget.props } : null;
      }),
      distinctUntilChanged()
    );

    this.totalTime$ = this.widgetState.getModuleTotalTime(this.moduleDefinition?.id || '');
  }

  ngOnInit(): void {
    this.loadModule();
    this.setupStateTracking();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private async loadModule(): Promise<void> {
    try {
      // Initialize module state
      this.widgetState.initializeModule(this.moduleDefinition);
      
      // Load widget metadata
      const widgetPromises = this.moduleDefinition.widgets.map(async widget => {
        const metadata = await this.widgetRegistry.getWidgetById(widget.id).toPromise();
        if (!metadata) {
          throw new Error(`Widget ${widget.id} not found in registry`);
        }
        return { ...widget, metadata };
      });

      const widgets = await Promise.all(widgetPromises);
      
      // Update module definition with metadata
      this.moduleDefinition.widgets = widgets;
      
      // Update state
      this.moduleStateSubject.next({
        isLoaded: true,
        currentWidgetIndex: 0,
        totalWidgets: widgets.length,
        completedWidgets: 0,
        progress: 0,
        isCompleted: false,
        errors: []
      });
      
    } catch (error) {
      this.moduleStateSubject.next({
        isLoaded: false,
        currentWidgetIndex: 0,
        totalWidgets: 0,
        completedWidgets: 0,
        progress: 0,
        isCompleted: false,
        errors: [`Failed to load module: ${error}`]
      });
    }
  }

  private setupStateTracking(): void {
    // Track module progress
    this.widgetState.getModuleProgress(this.moduleDefinition.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe(progress => {
        const currentState = this.moduleStateSubject.value;
        this.moduleStateSubject.next({
          ...currentState,
          progress,
          isCompleted: progress === 100
        });
      });

    // Track completed widgets count
    this.widgetState.getCompletedWidgetsCount(this.moduleDefinition.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe(completedCount => {
        const currentState = this.moduleStateSubject.value;
        this.moduleStateSubject.next({
          ...currentState,
          completedWidgets: completedCount
        });
      });
  }

  onWidgetStateChange(event: any): void {
    // Handle widget state changes
    this.widgetState.updateWidgetState(
      this.moduleDefinition.id,
      event.widget_id,
      event.data
    );
  }

  onWidgetCompletion(event: any): void {
    // Handle widget completion
    this.widgetState.updateWidgetState(
      this.moduleDefinition.id,
      event.widget_id,
      { is_completed: true }
    );
  }

  onWidgetError(event: any): void {
    // Handle widget errors
    const currentState = this.moduleStateSubject.value;
    this.moduleStateSubject.next({
      ...currentState,
      errors: [...currentState.errors, `Widget ${event.widget_id}: ${event.data.error}`]
    });
  }

  previousWidget(): void {
    const currentState = this.moduleStateSubject.value;
    if (currentState.currentWidgetIndex > 0) {
      this.moduleStateSubject.next({
        ...currentState,
        currentWidgetIndex: currentState.currentWidgetIndex - 1
      });
    }
  }

  nextWidget(): void {
    const currentState = this.moduleStateSubject.value;
    if (currentState.currentWidgetIndex < currentState.totalWidgets - 1) {
      this.moduleStateSubject.next({
        ...currentState,
        currentWidgetIndex: currentState.currentWidgetIndex + 1
      });
    }
  }

  formatTime(seconds: number | null): string {
    if (!seconds) return '0s';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return minutes > 0 ? `${minutes}m ${remainingSeconds}s` : `${remainingSeconds}s`;
  }
}
