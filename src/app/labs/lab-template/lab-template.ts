import { Component, OnInit, OnDestroy, AfterViewInit, inject, ChangeDetectorRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntil, catchError } from 'rxjs/operators';
import { Subject, throwError } from 'rxjs';
import { LabDataService, LabData } from '../../../services/lab-data.service';
import { ModuleSessionService, ModuleSession } from '../../../services/module-session.service';
import { WidgetInteractionService } from '../../../services/widget-interaction.service';
import { environment } from '../../../environments/environment';

// Import all available widgets
import { StepPromptComponent } from '../../../components/widgets/core/step-prompt/step-prompt';
import { HintPanelComponent } from '../../../components/widgets/core/hint-panel/hint-panel';
import { FeedbackBoxComponent } from '../../../components/widgets/core/feedback-box/feedback-box';
import { ConfidenceMeterComponent } from '../../../components/widgets/core/confidence-meter/confidence-meter';
import { CodeEditorComponent } from '../../../components/widgets/coding/code-editor/code-editor';
import { ConsoleOutputComponent } from '../../../components/widgets/coding/console-output/console-output';
import { TestFeedbackComponent } from '../../../components/widgets/coding/test-feedback/test-feedback';
import { EquationInputComponent } from '../../../components/widgets/math/equation-input/equation-input';
import { TextEditorComponent } from '../../../components/widgets/writing/text-editor/text-editor';
import { MultipleChoiceComponent, ChoiceOption } from '../../../components/widgets/core/multiple-choice/multiple-choice';
import { LabIntroComponent } from '../../../components/widgets/core/lab-intro/lab-intro';
import { ShortAnswerComponent } from '../../../components/widgets/core/short-answer/short-answer';
import { CoachChatComponent } from '../../../components/widgets/core/coach-chat/coach-chat';
import { ReflectionPromptComponent } from '../../../components/widgets/core/reflection-prompt/reflection-prompt';
import { AlgorithmSimulatorComponent, Algorithm } from '../../../components/widgets/coding/algorithm-simulator/algorithm-simulator';
// Tri-panel components
import { StepsPanelComponent } from '../../../components/widgets/core/steps-panel/steps-panel';
import { EditorPanelComponent } from '../../../components/widgets/coding/editor-panel/editor-panel';
import { SupportPanelComponent } from '../../../components/widgets/core/support-panel/support-panel';

// UI Components
import { CardComponent } from '../../../components/ui/card/card';
import { CardHeaderComponent } from '../../../components/ui/card/card-header';
import { CardContentComponent } from '../../../components/ui/card/card-content';
import { CardFooterComponent } from '../../../components/ui/card/card-footer';
import { ButtonComponent } from '../../../components/ui/button/button';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucideArrowLeft, lucidePlay, lucideBookOpen, lucideLightbulb, lucideCode, lucideCircle, lucideClock, lucideX, lucideChevronRight } from '@ng-icons/lucide';

// Types are now imported from the service

@Component({
  selector: 'app-lab-template',
  standalone: true,
  imports: [
    CommonModule,
    // Widget imports
    StepPromptComponent,
    HintPanelComponent,
    FeedbackBoxComponent,
    ConfidenceMeterComponent,
    CodeEditorComponent,
    ConsoleOutputComponent,
    TestFeedbackComponent,
    EquationInputComponent,
    TextEditorComponent,
    MultipleChoiceComponent,
    LabIntroComponent,
    ShortAnswerComponent,
    CoachChatComponent,
    ReflectionPromptComponent,
    AlgorithmSimulatorComponent,
    StepsPanelComponent,
    EditorPanelComponent,
    SupportPanelComponent,
    // UI imports
    CardComponent,
    CardHeaderComponent,
    CardContentComponent,
    CardFooterComponent,
    ButtonComponent,
    NgIconComponent
  ],
  providers: [
    provideIcons({
      lucideArrowLeft,
      lucidePlay,
      lucideBookOpen,
      lucideLightbulb,
      lucideCode,
      lucideCircle,
      lucideClock,
      lucideX,
      lucideChevronRight
    })
  ],
  styleUrls: ['./lab-layout.css'],
  template: `
    <!-- Loading State -->
    <div class="flex h-screen items-center justify-center bg-[#0b0f14]" *ngIf="loading">
      <div class="text-center space-y-4">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
        <p class="text-[#a9b1bb]">Loading lab...</p>
      </div>
    </div>

    <!-- Error State -->
    <div class="flex h-screen items-center justify-center bg-[#0b0f14]" *ngIf="error">
      <div class="text-center space-y-4 p-8">
        <div class="text-red-500 text-4xl">⚠️</div>
        <h2 class="text-xl font-semibold text-[#e5e7eb]">Lab Not Found</h2>
        <p class="text-[#a9b1bb]">{{ error }}</p>
        <app-button variant="outline" (click)="goBack()">
          <ng-icon name="lucideArrowLeft" class="w-4 h-4 mr-2"></ng-icon>
          Back to Labs
        </app-button>
      </div>
    </div>

    <!-- Tri-panel Lab Layout -->
    <div class="flex h-screen flex-col bg-[#0b0f14]" *ngIf="labData && !loading && !error">
      <!-- Lab Header -->
      <header class="flex items-center justify-between border-b border-[#1f2937] bg-[#0e1318] px-4 py-3">
        <div class="flex items-center gap-4">
          <app-button variant="ghost" size="sm" (click)="goBack()">
            <ng-icon name="lucideArrowLeft" class="w-4 h-4 mr-2"></ng-icon>
            Back
          </app-button>
          <div class="h-6 w-px bg-[#1f2937]"></div>
          <div class="flex items-center gap-3">
            <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-primary-custom/20 dark:text-primary-custom">
              <ng-icon name="lucideCode" class="h-4 w-4"></ng-icon>
            </div>
            <h1 class="text-lg font-semibold text-[#e5e7eb]">{{ labData.title }}</h1>
          </div>
        </div>
        
        <div class="flex items-center gap-3">
          <div class="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#151a20] text-sm text-[#a9b1bb]">
            <ng-icon name="lucideCircle" class="h-3 w-3" [class]="getDifficultyColor(labData.difficulty)"></ng-icon>
            <span>{{ getDifficultyLabel(labData.difficulty) }}</span>
          </div>
          <div class="flex items-center gap-1.5 text-sm text-[#a9b1bb]">
            <ng-icon name="lucideClock" class="h-3.5 w-3.5"></ng-icon>
            <span>{{ labData.estimatedTime }} min</span>
          </div>
        </div>
      </header>

      <!-- Three-panel layout (CSS Grid) -->
      <div class="grid flex-1 overflow-hidden min-w-0"
           [style.gridTemplateColumns]="gridTemplateColumns">
        <!-- Left: Steps (only if steps exist) -->
        <div class="min-w-0 overflow-hidden" *ngIf="hasSteps">
          <app-steps-panel
            [steps]="steps"
            [currentStep]="currentStep"
            [completedSteps]="completedSteps"
            [progress]="progress"
            [collapsed]="leftPanelCollapsed"
            (toggleCollapse)="leftPanelCollapsed = !leftPanelCollapsed"
            (stepClick)="onStepClick($event)"
          ></app-steps-panel>
        </div>

        <!-- Center: Editor fills remaining space -->
        <div class="min-w-0 overflow-hidden">
          <app-editor-panel
            [currentStep]="currentStep"
            [totalSteps]="steps.length || 1"
            [shiftHeader]="leftPanelCollapsed || !hasSteps"
            [editorConfig]="codeEditorWidget?.config"
            (completeStep)="handleCompleteStep()"
            (codePassed)="handleCodePassed()"
            (aiReviewComplete)="handleAIReviewComplete($event)"
            (refactorFeedback)="handleRefactorFeedback($event)"
          >
            <div expandControl *ngIf="hasSteps && leftPanelCollapsed">
              <button
                (click)="leftPanelCollapsed = false"
                class="flex h-9 w-9 items-center justify-center rounded-full text-[#e5e7eb] hover:bg-white/10"
                aria-label="Expand steps panel"
              >
                <ng-icon name="lucideChevronRight" class="h-5 w-5"></ng-icon>
              </button>
            </div>
          </app-editor-panel>

          <!-- Multiple Choice -->
          <div *ngIf="currentStepWidgetType === 'multiple-choice'" class="flex h-full flex-col bg-[#12161b]">
            <div class="border-b border-[#1f2937] bg-[#151a20] px-4 py-3" [class.pl-16]="leftPanelCollapsed || !hasSteps">
              <div class="absolute left-3 top-1/2 -translate-y-1/2" *ngIf="hasSteps && leftPanelCollapsed">
                <button
                  (click)="leftPanelCollapsed = false"
                  class="flex h-9 w-9 items-center justify-center rounded-full text-[#e5e7eb] hover:bg-white/10"
                  aria-label="Expand steps panel"
                >
                  <ng-icon name="lucideChevronRight" class="h-5 w-5"></ng-icon>
                </button>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-sm text-[#a9b1bb]">Step {{ currentStep }} of {{ steps.length || 1 }}</span>
                <app-button 
                  *ngIf="currentStep < (steps.length || 1) && completedSteps.includes(currentStep)" 
                  (click)="handleCompleteStep()"
                  className="bg-[#16a34a] hover:bg-[#15803d] text-white border-[#16a34a] font-medium shadow-sm">
                  Continue to Step {{ currentStep + 1 }}
                </app-button>
              </div>
            </div>
            <div class="flex-1 overflow-auto p-6">
              <app-multiple-choice
                [id]="currentStepWidget?.id || 'mc-' + currentStep"
                [question]="currentStepWidget?.config?.question || currentStepWidget?.props?.question || ''"
                [options]="currentStepMultipleChoiceOptions"
                [correctAnswers]="(currentStepWidget?.config?.correctAnswer !== undefined ? [currentStepWidget.config.correctAnswer.toString()] : (currentStepWidget?.props?.correctAnswer !== undefined ? [currentStepWidget.props.correctAnswer.toString()] : []))"
                [showFeedback]="true"
                [maxAttempts]="3"
                (choiceSubmit)="handleMultipleChoiceSubmit($event)"
              ></app-multiple-choice>
            </div>
          </div>

          <!-- Text Editor -->
          <div *ngIf="currentStepWidgetType === 'text-editor'" class="flex h-full flex-col bg-[#12161b]">
            <div class="border-b border-[#1f2937] bg-[#151a20] px-4 py-3" [class.pl-16]="leftPanelCollapsed || !hasSteps">
              <div class="absolute left-3 top-1/2 -translate-y-1/2" *ngIf="hasSteps && leftPanelCollapsed">
                <button
                  (click)="leftPanelCollapsed = false"
                  class="flex h-9 w-9 items-center justify-center rounded-full text-[#e5e7eb] hover:bg-white/10"
                  aria-label="Expand steps panel"
                >
                  <ng-icon name="lucideChevronRight" class="h-5 w-5"></ng-icon>
                </button>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-sm text-[#a9b1bb]">Step {{ currentStep }} of {{ steps.length || 1 }}</span>
              </div>
            </div>
            <div class="flex-1 overflow-auto p-6">
              <app-text-editor
                [title]="codeEditorWidget?.config?.title || 'Text Editor'"
                [placeholder]="codeEditorWidget?.config?.placeholder || 'Start writing...'"
                [maxLength]="codeEditorWidget?.config?.maxLength || 5000"
                (stateChanged)="handleWidgetComplete($event)"
              ></app-text-editor>
            </div>
          </div>

          <!-- Equation Input -->
          <div *ngIf="currentStepWidgetType === 'equation-input'" class="flex h-full flex-col bg-[#12161b]">
            <div class="border-b border-[#1f2937] bg-[#151a20] px-4 py-3" [class.pl-16]="leftPanelCollapsed || !hasSteps">
              <div class="absolute left-3 top-1/2 -translate-y-1/2" *ngIf="hasSteps && leftPanelCollapsed">
                <button
                  (click)="leftPanelCollapsed = false"
                  class="flex h-9 w-9 items-center justify-center rounded-full text-[#e5e7eb] hover:bg-white/10"
                  aria-label="Expand steps panel"
                >
                  <ng-icon name="lucideChevronRight" class="h-5 w-5"></ng-icon>
                </button>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-sm text-[#a9b1bb]">Step {{ currentStep }} of {{ steps.length || 1 }}</span>
              </div>
            </div>
            <div class="flex-1 overflow-auto p-6">
              <app-equation-input
                [title]="codeEditorWidget?.config?.title || 'Mathematical Expression'"
                [placeholder]="codeEditorWidget?.config?.placeholder || 'e.g., x^2 + 2x + 1'"
                [formatHint]="codeEditorWidget?.config?.formatHint"
                [expectedFormat]="codeEditorWidget?.config?.expectedFormat"
                (stateChanged)="handleWidgetComplete($event)"
              ></app-equation-input>
            </div>
          </div>

          <!-- Algorithm Simulator -->
          <div *ngIf="currentStepWidgetType === 'algorithm-simulator'" class="flex h-full flex-col bg-[#12161b]">
            <div class="border-b border-[#1f2937] bg-[#151a20] px-4 py-3" [class.pl-16]="leftPanelCollapsed || !hasSteps">
              <div class="absolute left-3 top-1/2 -translate-y-1/2" *ngIf="hasSteps && leftPanelCollapsed">
                <button
                  (click)="leftPanelCollapsed = false"
                  class="flex h-9 w-9 items-center justify-center rounded-full text-[#e5e7eb] hover:bg-white/10"
                  aria-label="Expand steps panel"
                >
                  <ng-icon name="lucideChevronRight" class="h-5 w-5"></ng-icon>
                </button>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-sm text-[#a9b1bb]">Step {{ currentStep }} of {{ steps.length || 1 }}</span>
                <app-button 
                  *ngIf="currentStep < (steps.length || 1)" 
                  (click)="handleCompleteStep()"
                  className="bg-[#16a34a] hover:bg-[#15803d] text-white border-[#16a34a] font-medium shadow-sm">
                  I Understand - Continue to Step {{ currentStep + 1 }}
                </app-button>
              </div>
            </div>
            <div class="flex-1 overflow-auto p-6">
              <app-algorithm-simulator
                [metadata]="currentStepWidget?.metadata"
                [defaultAlgorithm]="algorithmSimulatorDefaultAlgorithm"
                [enabledAlgorithms]="algorithmSimulatorEnabledAlgorithms"
              ></app-algorithm-simulator>
            </div>
          </div>
        </div>

        <!-- Right: Support -->
        <div class="min-w-0 overflow-hidden" *ngIf="shouldShowSupportPanel">
          <app-support-panel
            [collapsed]="rightPanelCollapsed"
            [hints]="hintWidgets"
            [feedback]="feedbackWidgets"
            [sessionId]="currentSession?.id"
            [aiReview]="aiReviewFeedback"
            [refactorData]="refactorFeedbackData"
          ></app-support-panel>
        </div>
      </div>

    </div>

    <!-- Feedback Modal (appears first as overlay) -->
        <!-- Feedback Modal (appears first as overlay) -->
    <div *ngIf="showFeedbackModal && feedbackWidget" 
         class="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
         style="margin: 0; top: 0; left: 0; right: 0; bottom: 0; position: fixed;"
         (click)="handleFeedbackContinue()">
      <div class="max-w-2xl w-full mx-auto" style="position: relative; z-index: 10000;" (click)="$event.stopPropagation()">
        <app-feedback-box
          [metadata]="feedbackWidget.metadata || { id: feedbackWidget.id, type: 'feedback-box' }"
          [config]="feedbackWidget.config"
          [sessionId]="currentSession?.id || ''"
          [moduleId]="feedbackWidget.moduleId || ''"
          [type]="feedbackWidget.config?.type || 'success'"
          [title]="feedbackWidget.config?.title || 'Great Job!'"
          [message]="feedbackWidget.config?.message || 'You completed the exercise!'"
          [explanation]="feedbackWidget.config?.explanation || ''"
          [nextSteps]="feedbackWidget.config?.nextSteps || []"
          [showContinueButton]="feedbackWidget.config?.showContinueButton ?? true"
          [autoComplete]="feedbackWidget.config?.autoComplete ?? false"
          (continueClicked)="handleFeedbackContinue()"
          (acknowledgeClicked)="handleFeedbackContinue()"
        ></app-feedback-box>
      </div>
    </div>

    <!-- Confidence Meter Modal (appears after feedback) -->
    <div *ngIf="showConfidenceMeter && confidenceWidget" 
         class="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
         style="margin: 0; top: 0; left: 0; right: 0; bottom: 0; position: fixed;">
      <div class="max-w-2xl w-full mx-auto" style="position: relative; z-index: 10000;" (click)="$event.stopPropagation()">
        <app-confidence-meter
          [metadata]="confidenceWidget.metadata || { id: confidenceWidget.id, type: 'confidence-meter' }"
          [config]="confidenceWidget.config"
          [sessionId]="currentSession?.id || ''"
          [moduleId]="confidenceWidget.moduleId || ''"
          [title]="confidenceWidget.config?.title || 'Rate Your Confidence'"
          [description]="confidenceWidget.config?.description || ''"
          [scaleLabels]="confidenceWidget.config?.scaleLabels || ['Not at all', 'Slightly', 'Moderately', 'Very', 'Extremely']"
          (submit)="handleConfidenceSubmit()"
        ></app-confidence-meter>
      </div>
    </div>
  `,
})
export class LabTemplateComponent implements OnInit, OnDestroy, AfterViewInit {
  private destroy$ = new Subject<void>();
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private labDataService = inject(LabDataService);
  private moduleSessionService = inject(ModuleSessionService);
  private widgetInteractionService = inject(WidgetInteractionService);
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);

  public labData: LabData | null = null;
  public loading = true;
  public error: string | null = null;
  // Tri-panel state
  public leftPanelCollapsed = false;
  public rightPanelCollapsed = false;
  public currentStep = 1;
  public completedSteps: number[] = [];
  public steps: { id: number; title: string; instruction?: string; example?: string; widgetPosition?: number }[] = [];
  
  // Extracted widgets from labData
  public codeEditorWidget: any = null;
  public allCodeEditorWidgets: any[] = [];
  public allStepPromptWidgets: any[] = [];
  public hintWidgets: any[] = [];
  public feedbackWidget: any = null;
  public confidenceWidget: any = null;
  public feedbackWidgets: any[] = [];
  public aiReviewFeedback: string = '';
  public refactorFeedbackData: any = null; // Store refactor feedback for support panel
  public hasSteps = false;
  public codePassed = false;
  public showFeedbackModal = false;
  public showConfidenceMeter = false;
  
  // Current step widget properties
  public currentStepWidget: any = null;
  public currentStepWidgetType: string | null = null;
  public currentStepMultipleChoiceOptions: ChoiceOption[] = [];
  public algorithmSimulatorDefaultAlgorithm: Algorithm = 'bubble';
  public algorithmSimulatorEnabledAlgorithms: Algorithm[] = ['bubble', 'quick', 'recursion'];
  
  // Session tracking
  public currentSession: ModuleSession | null = null;
  public sessionStartTime: number = 0;
  private sessionUpdateInterval: any = null;
  
  // Step-specific widgets (indexed by stepId)
  private feedbackByStep = new Map<number, any>();
  private confidenceByStep = new Map<number, any>();
  private shownFeedbackForSteps = new Set<number>();
  
  // Check if support panel should be shown
  get shouldShowSupportPanel(): boolean {
    return this.hasHints || this.hasFeedbackContent;
  }
  
  get hasHints(): boolean {
    return this.hintWidgets && this.hintWidgets.length > 0 && 
           this.hintWidgets[0]?.config?.hints && 
           this.hintWidgets[0].config.hints.length > 0;
  }
  
  get hasFeedbackContent(): boolean {
    return this.feedbackWidgets && this.feedbackWidgets.length > 0;
  }
  
  get gridTemplateColumns(): string {
    // If no support panel content, don't allocate space for it
    if (!this.shouldShowSupportPanel) {
      if (!this.hasSteps) {
        return '1fr';
      }
      const left = this.leftPanelCollapsed ? '0px' : 'minmax(260px, 18vw)';
      return `${left} 1fr`;
    }
    
    // If no steps, only use 2 columns (center + right)
    if (!this.hasSteps) {
      const right = this.rightPanelCollapsed ? '0px' : 'minmax(260px, 19vw)';
      return `1fr ${right}`;
    }
    
    // If steps exist, use 3 columns (left + center + right)
    const left = this.leftPanelCollapsed ? '0px' : 'minmax(260px, 18vw)';
    const right = this.rightPanelCollapsed ? '0px' : 'minmax(260px, 19vw)';
    return `${left} 1fr ${right}`;
  }
  
  // Track widget completion states for conditional rendering
  private widgetStates = new Map<string, { completed: boolean; submitted: boolean }>();

  constructor() {
    // Component initialization
  }

  ngOnInit(): void {
    this.loadLab();
  }

  ngAfterViewInit(): void {
    // Component initialized
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.cleanupSession();
  }

  // ===== Session Tracking Methods =====
  
  private async startModuleSession(moduleId: string): Promise<void> {
    console.log('[LabTemplate] Starting module session tracking for:', moduleId);
    console.log('[LabTemplate] Module details:', {
      moduleId: moduleId,
      totalSteps: this.steps.length || 1,
      hasSteps: this.steps.length > 0,
      labData: this.labData ? { id: this.labData.id, title: this.labData.title } : null
    });
    
    try {
      const totalSteps = this.steps.length || 1;
      console.log('[LabTemplate] Calling ModuleSessionService.startSession...');
      
      this.currentSession = await this.moduleSessionService.startSession({
        module_id: moduleId,
        total_steps: totalSteps
      }).toPromise() || null;
      
      if (this.currentSession) {
        this.sessionStartTime = Date.now();
        this.startSessionUpdateInterval();
        
        // Set current session for widget interaction tracking
        this.widgetInteractionService.setCurrentSession(this.currentSession.id);
        
        console.log('[LabTemplate] Module session started successfully:', {
          sessionId: this.currentSession.id,
          moduleId: this.currentSession.module_id,
          status: this.currentSession.status,
          totalSteps: this.currentSession.total_steps,
          startTime: new Date(this.sessionStartTime).toISOString()
        });
      } else {
        console.warn('[LabTemplate] Session creation returned null - session tracking may not be active');
      }
    } catch (error) {
      console.error('[LabTemplate] Failed to start module session:', {
        error: error.message || error,
        moduleId: moduleId,
        timestamp: new Date().toISOString()
      });
      // Don't block the user experience if session tracking fails
      console.log('[LabTemplate] Continuing without session tracking...');
    }
  }

  private async updateModuleSession(updates: {
    status?: 'started' | 'in_progress' | 'completed' | 'abandoned';
    current_step?: number;
    progress?: number;
    time_spent?: number;
    completed?: boolean;
  }): Promise<void> {
    if (!this.currentSession) {
      console.log('[LabTemplate] No active session to update');
      return;
    }

    console.log('[LabTemplate] Updating module session:', {
      sessionId: this.currentSession.id,
      currentStep: this.currentStep,
      totalSteps: this.steps.length,
      updates: updates
    });

    try {
      // Calculate time spent if not provided
      if (updates.time_spent === undefined && this.sessionStartTime > 0) {
        const calculatedTimeSpent = Math.floor((Date.now() - this.sessionStartTime) / 1000);
        updates.time_spent = calculatedTimeSpent;
        console.log('[LabTemplate] Calculated time spent:', calculatedTimeSpent, 'seconds');
      }

      // Calculate progress if not provided
      if (updates.progress === undefined && this.steps.length > 0) {
        const calculatedProgress = Math.min(1.0, (this.currentStep - 1) / this.steps.length);
        updates.progress = calculatedProgress;
        console.log('[LabTemplate] Calculated progress:', calculatedProgress, `(${this.currentStep - 1}/${this.steps.length})`);
      }

      console.log('[LabTemplate] Sending update to ModuleSessionService...');
      this.currentSession = await this.moduleSessionService.updateSession(
        this.currentSession.id, 
        updates
      ).toPromise() || null;
      
      if (this.currentSession) {
        console.log('[LabTemplate] Module session updated successfully:', {
          sessionId: this.currentSession.id,
          status: this.currentSession.status,
          currentStep: this.currentSession.current_step,
          progress: this.currentSession.progress,
          timeSpent: this.currentSession.time_spent,
          lastActivity: this.currentSession.last_activity_at
        });
      } else {
        console.warn('[LabTemplate] Session update returned null');
      }
    } catch (error) {
      console.error('[LabTemplate] Failed to update module session:', {
        error: error.message || error,
        sessionId: this.currentSession.id,
        updates: updates,
        timestamp: new Date().toISOString()
      });
    }
  }

  private async completeModuleSession(): Promise<void> {
    if (!this.currentSession) {
      console.log('[LabTemplate] No active session to complete');
      return;
    }

    console.log('[LabTemplate] Completing module session:', {
      sessionId: this.currentSession.id,
      currentStep: this.currentStep,
      totalSteps: this.steps.length,
      completedSteps: this.completedSteps.length
    });

    try {
      const finalTimeSpent = Math.floor((Date.now() - this.sessionStartTime) / 1000);
      console.log('[LabTemplate] Final time spent:', finalTimeSpent, 'seconds');
      
      console.log('[LabTemplate] Sending completion to ModuleSessionService...');
      this.currentSession = await this.moduleSessionService.completeSession(
        this.currentSession.id,
        { final_time_spent: finalTimeSpent }
      ).toPromise() || null;
      
      if (this.currentSession) {
        console.log('[LabTemplate] Module session completed successfully:', {
          sessionId: this.currentSession.id,
          status: this.currentSession.status,
          finalProgress: this.currentSession.progress,
          finalTimeSpent: this.currentSession.time_spent,
          completedAt: this.currentSession.completed_at,
          totalSteps: this.currentSession.total_steps
        });
      } else {
        console.warn('[LabTemplate] Session completion returned null');
      }
    } catch (error) {
      console.error('[LabTemplate] Failed to complete module session:', {
        error: error.message || error,
        sessionId: this.currentSession.id,
        timestamp: new Date().toISOString()
      });
    }
  }

  private async abandonModuleSession(): Promise<void> {
    if (!this.currentSession) {
      console.log('[LabTemplate] No active session to abandon');
      return;
    }

    console.log('[LabTemplate] Abandoning module session:', this.currentSession.id);

    try {
      this.currentSession = await this.moduleSessionService.abandonSession(
        this.currentSession.id
      ).toPromise() || null;
      
      console.log('[LabTemplate] Module session abandoned successfully:', this.currentSession);
    } catch (error) {
      console.error('[LabTemplate] Failed to abandon module session:', {
        error: error.message || error,
        sessionId: this.currentSession.id,
        timestamp: new Date().toISOString()
      });
    }
  }

  private startSessionUpdateInterval(): void {
    console.log('[LabTemplate] Starting session update interval (30 seconds)');
    // Update session every 30 seconds with current progress
    this.sessionUpdateInterval = setInterval(() => {
      if (this.currentSession && this.currentSession.status !== 'completed') {
        console.log('[LabTemplate] Periodic session update triggered');
        this.updateModuleSession({
          status: 'in_progress',
          current_step: this.currentStep,
          progress: this.steps.length > 0 ? Math.min(1.0, (this.currentStep - 1) / this.steps.length) : 0
        });
      }
    }, 30000); // 30 seconds
  }

  private cleanupSession(): void {
    console.log('[LabTemplate] Cleaning up session tracking');
    if (this.sessionUpdateInterval) {
      clearInterval(this.sessionUpdateInterval);
      this.sessionUpdateInterval = null;
      console.log('[LabTemplate] Session update interval cleared');
    }
    
    // Flush any pending widget interactions and clear session
    this.widgetInteractionService.flushPendingInteractions();
    this.widgetInteractionService.setCurrentSession(null);
  }

  private loadLab(): void {
    const labId = this.route.snapshot.paramMap.get('id');
    
    if (!labId) {
      this.error = 'No lab ID provided';
      this.loading = false;
      return;
    }

    // Always try to load from backend API first for UUIDs or any ID
    this.loadLabFromBackend(labId);
  }

  private loadModuleFromAssets(moduleId: string): void {
    // First check if we have module data passed via navigation state
    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras?.state || window.history.state;
    
    if (state?.module) {
      console.log('Loading module from navigation state:', state.module);
      this.handleModuleLoad(state.module);
      return;
    }
    
    // Try backend API first (for newly generated modules)
    console.log(`Attempting to load ${moduleId} from backend API...`);
    this.http.get<any>(`/api/modules/${moduleId}`)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log(`Successfully loaded ${moduleId} from backend API`);
          this.handleModuleLoad(response.module);
        },
        error: (apiErr) => {
          console.log(`Not found in backend API, trying static assets...`);
          // Fallback to static assets
          this.tryStaticAssets(moduleId);
        }
      });
  }

  private tryStaticAssets(moduleId: string): void {
    this.http.get<any>(`/assets/modules/${moduleId}.json`)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (json) => {
          console.log(`Successfully loaded ${moduleId} from direct path`);
          this.handleModuleLoad(json);
        },
        error: (err) => {
          console.log(`Not found at direct path, searching subfolders...`);
          this.searchForModuleInSubfolders(moduleId);
        }
      });
  }

  private searchForModuleInSubfolders(moduleId: string): void {
    // Use a more dynamic approach - try to find the file by making requests
    // to common subfolder patterns and see which ones exist
    this.tryDynamicSubfolderSearch(moduleId);
  }

  private tryDynamicSubfolderSearch(moduleId: string): void {
    // Create a more intelligent search that can discover folder structures
    // This approach tries to find the file by making educated guesses
    // based on common naming patterns and folder structures
    
    const searchPaths = this.generateSearchPaths(moduleId);
    let currentPathIndex = 0;

    const tryNextPath = () => {
      if (currentPathIndex >= searchPaths.length) {
        this.error = `Module ${moduleId} not found. Searched ${searchPaths.length} possible locations.`;
        this.loading = false;
        this.cdr.detectChanges();
        return;
      }

      const currentPath = searchPaths[currentPathIndex];
      console.log(`Searching: ${currentPath}`);

      this.http.get<any>(currentPath)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (json) => {
            console.log(`Found module at: ${currentPath}`);
            this.handleModuleLoad(json);
          },
          error: (err) => {
            currentPathIndex++;
            tryNextPath();
          }
        });
    };

    tryNextPath();
  }

  private generateSearchPaths(moduleId: string): string[] {
    const paths = [];
    
    // Direct path first
    paths.push(`/assets/modules/${moduleId}.json`);
    
    // Common language/framework folders
    const languages = ['python', 'javascript', 'java', 'cpp', 'csharp', 'typescript', 'go', 'rust', 'php', 'ruby'];
    languages.forEach(lang => {
      paths.push(`/assets/modules/${lang}/${moduleId}.json`);
    });
    
    // Common course/level folders
    const courseLevels = ['CS1', 'CS2', 'CS3', 'intro', 'advanced', 'beginner', 'intermediate', 'expert'];
    courseLevels.forEach(level => {
      paths.push(`/assets/modules/${level}/${moduleId}.json`);
    });
    
    // Lab/lesson folders
    const labFolders = ['01-Lab', '02-Lab', '03-Lab', 'lab1', 'lab2', 'lab3', 'lessons', 'exercises', 'tutorials'];
    labFolders.forEach(lab => {
      paths.push(`/assets/modules/${lab}/${moduleId}.json`);
    });
    
    // Nested combinations (e.g., CS1/01-Lab/)
    courseLevels.forEach(level => {
      labFolders.forEach(lab => {
        paths.push(`/assets/modules/${level}/${lab}/${moduleId}.json`);
      });
    });
    
    // Language + level combinations
    languages.forEach(lang => {
      courseLevels.forEach(level => {
        paths.push(`/assets/modules/${lang}/${level}/${moduleId}.json`);
      });
    });
    
    return paths;
  }

  private handleModuleLoad(json: any): void {
    const labFromModule = this.labDataService.convertModuleToLab(json);
    this.labData = labFromModule;
    this.extractWidgetsFromLabData();
    this.loading = false;
    this.error = null;
    
    // Start session tracking for this module
    this.startModuleSession(json.id || json.name || 'unknown');
    
    this.cdr.detectChanges();
  }

  private loadLabFromBackend(labId: string): void {
    console.log(`Loading lab ${labId} from backend API...`);
    this.http.get<any>(`${environment.apiUrl}/api/labs/${labId}`)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log(`Loaded lab ${labId} from backend:`, response);
          // Backend returns the lab data directly
          const labData = response;
          const labFromResponse = this.labDataService.convertLabToLabData(labData);
          this.labData = labFromResponse;
          this.extractWidgetsFromLabData();
          this.loading = false;
          this.error = null;
          
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error(`Failed to load lab ${labId} from backend:`, err);
          // Fallback to assets if backend fails
          this.loadModuleFromAssets(labId);
        }
      });
  }

  getDifficultyLabel(difficulty: number): string {
    const labels = [
      'Beginner',       // 1
      'Easy',           // 2
      'Moderate',       // 3
      'Medium',         // 4
      'Challenging',    // 5
      'Hard',           // 6
      'Very Hard',      // 7
      'Advanced',       // 8
      'Expert',         // 9
      'Master'          // 10
    ];
    return labels[difficulty - 1] || 'Unknown';
  }

  getDifficultyColor(difficulty: number): string {
    const colors = [
      'text-green-600',    // 1: Beginner
      'text-green-500',    // 2: Easy
      'text-blue-600',     // 3: Moderate
      'text-blue-500',     // 4: Medium
      'text-yellow-600',   // 5: Challenging
      'text-yellow-500',   // 6: Hard
      'text-orange-600',   // 7: Very Hard
      'text-orange-500',   // 8: Advanced
      'text-red-600',      // 9: Expert
      'text-red-500'       // 10: Master
    ];
    return colors[difficulty - 1] || 'text-gray-600';
  }

  /**
   * Extract widgets from labData for the tri-panel layout
   */
  private extractWidgetsFromLabData(): void {
    if (!this.labData || !this.labData.sections || this.labData.sections.length === 0) {
      console.warn('No labData or sections found');
      return;
    }

    // Get all widgets from all sections
    const allWidgets = this.labData.sections.flatMap(section => section.widgets || []);
    console.log('All widgets:', allWidgets);
    
    // Find all code editor widgets
    this.allCodeEditorWidgets = allWidgets.filter(w => 
      w.type === 'code-editor' || 
      w.id === 'code-editor' || 
      w.metadata?.id === 'code-editor'
    );
    console.log('Found code editor widgets:', this.allCodeEditorWidgets);
    
    // Find all step-prompt widgets (like final congratulations)
    this.allStepPromptWidgets = allWidgets.filter(w => 
      w.type === 'step-prompt' || 
      w.id === 'step-prompt' || 
      w.metadata?.id === 'step-prompt'
    );
    console.log('Found step-prompt widgets:', this.allStepPromptWidgets);
    
    // Set the initial code editor widget (will be updated based on current step)
    this.updateCurrentCodeEditor();
    
    // Find hint widgets
    this.hintWidgets = allWidgets.filter(w => 
      w.type === 'hint-panel' || 
      w.id === 'hint-panel' || 
      w.metadata?.id === 'hint-panel'
    );
    console.log('Found hint widgets:', this.hintWidgets);
    
    // Find ALL feedback widgets and organize by step
    const allFeedbackWidgets = allWidgets.filter(w => 
      w.type === 'feedback-box' || 
      w.id === 'feedback-box' || 
      w.metadata?.id === 'feedback-box'
    );
    console.log('All feedback widgets found:', allFeedbackWidgets);
    console.log('Feedback widget details:', allFeedbackWidgets.map(w => ({
      id: w.id,
      type: w.type,
      position: w.metadata?.position,
      config: w.config
    })));
    
    // Map feedback widgets to steps
    allFeedbackWidgets.forEach(feedback => {
      let stepKey: number | undefined;
      
      console.log(`\n=== Processing feedback widget: ${feedback.id} ===`);
      console.log(`  Position: ${feedback.metadata?.position}`);
      console.log(`  Has stepId: ${feedback.metadata?.stepId}`);
      
      // If widget has explicit stepId, use that
      if (feedback.metadata?.stepId !== undefined) {
        stepKey = feedback.metadata.stepId;
        console.log(`  Using explicit stepId: ${stepKey}`);
      } else if (feedback.metadata?.position !== undefined) {
        // Otherwise, find which step this feedback belongs to by finding the nearest preceding content widget
        const feedbackPosition = feedback.metadata.position;
        const sortedWidgets = [...allWidgets].sort((a, b) => 
          (a.metadata?.position || 0) - (b.metadata?.position || 0)
        );
        
        console.log(`  Looking for content widget before position ${feedbackPosition}`);
        
        // Find the last content widget before this feedback widget
        for (let i = sortedWidgets.length - 1; i >= 0; i--) {
          const widget = sortedWidgets[i];
          const widgetPosition = widget.metadata?.position || 0;
          const widgetType = widget.type || widget.metadata?.id || widget.id;
          const isContentWidget = widgetType !== 'feedback-box' && 
                                 widgetType !== 'confidence-meter' && 
                                 widgetType !== 'hint-panel';
          
          console.log(`    Checking widget at position ${widgetPosition} (type: ${widgetType}, isContent: ${isContentWidget})`);
          
          if (widgetPosition < feedbackPosition && isContentWidget) {
            stepKey = widget.metadata?.position;
            console.log(`  Found content widget at position ${widgetPosition}, using as stepKey: ${stepKey}`);
            break;
          }
        }
      }
      
      if (stepKey !== undefined) {
        this.feedbackByStep.set(stepKey, feedback);
        console.log(`✓ Mapped feedback "${feedback.id}" to step key ${stepKey}`);
      } else {
        console.log(`✗ Could not map feedback "${feedback.id}" to any step`);
      }
    });
    console.log('Feedback widgets by step:', this.feedbackByStep);
    
    // Find ALL confidence widgets and organize by step
    const allConfidenceWidgets = allWidgets.filter(w => 
      w.type === 'confidence-meter' || 
      w.id === 'confidence-meter' || 
      w.metadata?.id === 'confidence-meter'
    );
    console.log('All confidence widgets found:', allConfidenceWidgets);
    
    // Map confidence widgets to steps
    allConfidenceWidgets.forEach(confidence => {
      let stepKey: number | undefined;
      
      // If widget has explicit stepId, use that
      if (confidence.metadata?.stepId !== undefined) {
        stepKey = confidence.metadata.stepId;
      } else if (confidence.metadata?.position !== undefined) {
        // Otherwise, find which step this confidence belongs to by finding the nearest preceding content widget
        const confidencePosition = confidence.metadata.position;
        const sortedWidgets = [...allWidgets].sort((a, b) => 
          (a.metadata?.position || 0) - (b.metadata?.position || 0)
        );
        
        // Find the last content widget before this confidence widget
        for (let i = sortedWidgets.length - 1; i >= 0; i--) {
          const widget = sortedWidgets[i];
          const widgetPosition = widget.metadata?.position || 0;
          const widgetType = widget.type || widget.metadata?.id || widget.id;
          const isContentWidget = widgetType !== 'feedback-box' && 
                                 widgetType !== 'confidence-meter' && 
                                 widgetType !== 'hint-panel';
          
          if (widgetPosition < confidencePosition && isContentWidget) {
            stepKey = widget.metadata?.position;
            break;
          }
        }
      }
      
      if (stepKey !== undefined) {
        this.confidenceByStep.set(stepKey, confidence);
        console.log(`Mapped confidence for step ${stepKey}:`, confidence);
      }
    });
    console.log('Confidence widgets by step:', this.confidenceByStep);
    
    // Set current feedback/confidence for the initial step
    this.updateCurrentFeedbackWidgets();
    
    // Find feedback widgets for support panel - these are ALL feedback-box widgets
    // They will be shown in the support panel after code execution
    this.feedbackWidgets = allWidgets.filter(w => 
      w.type === 'feedback-box' || 
      w.id === 'feedback-box' || 
      w.metadata?.id === 'feedback-box'
    );
    console.log('Found feedback widgets for panel:', this.feedbackWidgets);
    
    // Find confidence widget
    this.confidenceWidget = allWidgets.find(w => w.type === 'confidence-meter' || w.id === 'confidence-meter');
    console.log('Found confidence widget:', this.confidenceWidget);
    
    // Extract steps from widgets - use widgets with position field as steps
    // Only create steps if there are multiple positioned widgets
    const positionedWidgets = allWidgets.filter(w => w.metadata?.position !== undefined);
    console.log('Positioned widgets:', positionedWidgets);
    
    if (positionedWidgets.length > 1) {
      this.steps = positionedWidgets
        .sort((a, b) => (a.metadata?.position || 0) - (b.metadata?.position || 0))
        .map((w, index) => ({
          id: w.metadata?.position || index + 1,
          title: w.config?.title || w.metadata?.title || `Step ${index + 1}`,
          instruction: w.config?.prompt || w.metadata?.description,
          example: undefined,
          widgetPosition: w.metadata?.position
        }));
    } else {
      // Fallback to labData.steps if no positioned widgets
      this.steps = this.labData.steps || [];
    }
    this.hasSteps = this.steps.length > 0;
    console.log('Has steps:', this.hasSteps);
    console.log('Steps:', this.steps);
    
    console.log('Extracted widgets summary:', { 
      codeEditorWidget: this.codeEditorWidget, 
      codeEditorConfig: this.codeEditorWidget?.config,
      hintWidgets: this.hintWidgets,
      feedbackWidget: this.feedbackWidget,
      confidenceWidget: this.confidenceWidget,
      hasSteps: this.hasSteps 
    });
  }

  getSectionLayoutClass(layout?: string): string {
    switch (layout) {
      case 'dynamic':
        return 'layout-dynamic gap-md';
      case 'grid':
        return 'layout-grid gap-md';
      case 'stack':
        return 'layout-stack gap-md';
      case 'custom':
        return 'layout-dynamic gap-md';
      default:
        return 'layout-stack gap-md';
    }
  }

  getWidgetClasses(widget: any): string {
    const classes: string[] = [];
    
    // Add size class
    const size = widget.layout?.size || 'auto';
    classes.push(`size-${size}`);
    
    // Add widget type class for specific styling
    const widgetType = widget.type.replace(/([A-Z])/g, '-$1').toLowerCase();
    classes.push(`widget-type-${widgetType}`);
    
    return classes.join(' ');
  }

  isWidgetVisible(widget: any): boolean {
    // Always visible if no condition
    if (!widget.condition) {
      return true;
    }

    const condition = widget.condition;
    const visibility = condition.visibility || 'always';

    // Check visibility type
    switch (visibility) {
      case 'always':
        return true;
      
      case 'after-submission':
        // Check if any required dependencies have been submitted
        if (condition.requiresSubmission) {
          return this.hasSubmittedAnyWidget();
        }
        if (condition.dependsOn && condition.dependsOn.length > 0) {
          return condition.dependsOn.some(depId => {
            const state = this.widgetStates.get(depId);
            return state?.submitted || false;
          });
        }
        return true;
      
      case 'on-complete':
        // Check if dependencies are completed
        if (condition.dependsOn && condition.dependsOn.length > 0) {
          return condition.dependsOn.every(depId => {
            const state = this.widgetStates.get(depId);
            return state?.completed || false;
          });
        }
        return false;
      
      case 'conditional':
        // Check specific conditions
        if (condition.dependsOn && condition.dependsOn.length > 0) {
          return condition.dependsOn.every(depId => {
            const state = this.widgetStates.get(depId);
            return state?.completed || false;
          });
        }
        return true;
      
      default:
        return true;
    }
  }

  onWidgetStateChange(event: any, widget: any): void {
    // Update widget state tracking
    const currentState = this.widgetStates.get(widget.id) || { completed: false, submitted: false };
    
    if (event.type === 'completion' || event.data?.is_completed) {
      currentState.completed = true;
    }
    
    if (event.type === 'submission' || event.data?.submitted) {
      currentState.submitted = true;
    }
    
    this.widgetStates.set(widget.id, currentState);
  }

  private hasSubmittedAnyWidget(): boolean {
    for (const [, state] of this.widgetStates) {
      if (state.submitted) {
        return true;
      }
    }
    return false;
  }

  // ===== Tri-panel helpers =====
  get progress(): number {
    return this.steps.length ? (this.completedSteps.length / this.steps.length) * 100 : 0;
  }

  onStepClick(step: number): void {
    // example rule: allow back, allow next if previous completed
    const highest = this.completedSteps.length ? Math.max(...this.completedSteps) : 0;
    const nextUnlock = highest + 1;
    if (step <= nextUnlock) {
      this.currentStep = step;
      this.updateCurrentCodeEditor();
      this.updateCurrentFeedbackWidgets();
      
      // Update session with new step
      this.updateModuleSession({
        current_step: step,
        status: 'in_progress'
      });
      
      this.cdr.detectChanges();
    }
  }
  
  private updateCurrentCodeEditor(): void {
    // Find the widget for the current step - could be code editor or step-prompt
    
    // Get the current step data to find the widget position
    const currentStepData = this.steps[this.currentStep - 1];
    const widgetPosition = currentStepData?.widgetPosition || this.currentStep;
    
    // First try to find a code editor for this step
    let widgetForStep = null;
    
    if (this.allCodeEditorWidgets.length > 0) {
      // Try to match by stepId first, then widgetPosition, then currentStep
      widgetForStep = this.allCodeEditorWidgets.find(w => w.metadata?.stepId === this.currentStep) ||
                      this.allCodeEditorWidgets.find(w => w.metadata?.position === widgetPosition) ||
                      this.allCodeEditorWidgets.find(w => w.metadata?.position === this.currentStep);
      
      // If no specific match, use index-based fallback
      if (!widgetForStep && this.allCodeEditorWidgets.length === 1) {
        widgetForStep = this.allCodeEditorWidgets[0];
      } else if (!widgetForStep && this.currentStep <= this.allCodeEditorWidgets.length) {
        widgetForStep = this.allCodeEditorWidgets[this.currentStep - 1];
      }
    }
    
    // If no code editor found, try step-prompt widgets (like congratulations screens)
    if (!widgetForStep && this.allStepPromptWidgets.length > 0) {
      widgetForStep = this.allStepPromptWidgets.find(w => w.metadata?.stepId === this.currentStep) ||
                      this.allStepPromptWidgets.find(w => w.metadata?.position === widgetPosition) ||
                      this.allStepPromptWidgets.find(w => w.metadata?.position === this.currentStep);
    }
    
    this.codeEditorWidget = widgetForStep || this.allCodeEditorWidgets[0] || null;
    
    // Update current step widget and type
    this.currentStepWidget = widgetForStep;
    this.currentStepWidgetType = widgetForStep?.type || widgetForStep?.metadata?.id || widgetForStep?.id || null;
    
    // Update multiple choice options if applicable
    if (this.currentStepWidgetType === 'multiple-choice') {
      const options = widgetForStep?.config?.options || widgetForStep?.props?.options || [];
      // Convert to ChoiceOption[] format
      if (Array.isArray(options)) {
        this.currentStepMultipleChoiceOptions = options.map((opt: any, index: number) => {
          // If already in ChoiceOption format
          if (typeof opt === 'object' && opt.id && opt.label) {
            return opt as ChoiceOption;
          }
          // If it's a string, convert it
          if (typeof opt === 'string') {
            return {
              id: `option-${index}`,
              label: opt,
              value: opt
            } as ChoiceOption;
          }
          // Fallback
          return {
            id: opt.id || `option-${index}`,
            label: opt.text || opt.label || String(opt),
            value: opt.value || opt.id || String(opt)
          } as ChoiceOption;
        });
      } else {
        this.currentStepMultipleChoiceOptions = [];
      }
    } else {
      this.currentStepMultipleChoiceOptions = [];
    }
    
    // Update algorithm simulator settings if applicable
    if (this.currentStepWidgetType === 'algorithm-simulator') {
      const defaultAlg = widgetForStep?.config?.defaultAlgorithm || 
                        widgetForStep?.props?.defaultAlgorithm || 
                        'bubble';
      // Validate it's a valid Algorithm type
      this.algorithmSimulatorDefaultAlgorithm = (['bubble', 'quick', 'recursion'].includes(defaultAlg)) 
        ? defaultAlg as Algorithm 
        : 'bubble';
      
      const enabledAlgs = widgetForStep?.config?.enabledAlgorithms || 
                         widgetForStep?.props?.enabledAlgorithms || 
                         ['bubble', 'quick', 'recursion'];
      // Filter to only valid Algorithm types
      this.algorithmSimulatorEnabledAlgorithms = (Array.isArray(enabledAlgs) 
        ? enabledAlgs.filter((alg: string) => ['bubble', 'quick', 'recursion'].includes(alg))
        : ['bubble', 'quick', 'recursion']) as Algorithm[];
    }
    
    console.log(`Current widget for step ${this.currentStep} (widgetPosition: ${widgetPosition}):`, this.codeEditorWidget);
  }
  
  private updateCurrentFeedbackWidgets(): void {
    // Get the actual step data to find its widget position
    const currentStepData = this.steps[this.currentStep - 1];
    const widgetPosition = currentStepData?.widgetPosition || currentStepData?.id || this.currentStep;
    
    // Update feedback and confidence widgets for the current step (using widget position)
    this.feedbackWidget = this.feedbackByStep.get(widgetPosition) || null;
    this.confidenceWidget = this.confidenceByStep.get(widgetPosition) || null;
    console.log(`Feedback/Confidence for step ${this.currentStep} (widgetPosition: ${widgetPosition}):`, { 
      feedback: this.feedbackWidget, 
      confidence: this.confidenceWidget 
    });
  }

  /**
   * Check if the current step is non-coding and has feedback/confidence widgets.
   * If so, auto-show them after a short delay (simulating step completion).
   */
  private checkAndShowFeedbackForNonCodingStep(): void {
    const currentStepData = this.steps[this.currentStep - 1];
    const widgetPosition = currentStepData?.widgetPosition || currentStepData?.id || this.currentStep;
    
    // Check if this step has a code editor widget
    const hasCodeEditor = this.allCodeEditorWidgets.some(w => w.metadata?.position === widgetPosition);
    
    // Check if this step has feedback or confidence widgets
    const hasFeedback = this.feedbackByStep.has(widgetPosition);
    const hasConfidence = this.confidenceByStep.has(widgetPosition);
    
    console.log(`checkAndShowFeedbackForNonCodingStep - Step ${this.currentStep}:`);
    console.log(`  widgetPosition: ${widgetPosition}`);
    console.log(`  hasCodeEditor: ${hasCodeEditor}`);
    console.log(`  hasFeedback: ${hasFeedback}`);
    console.log(`  hasConfidence: ${hasConfidence}`);
    console.log(`  feedbackByStep map:`, this.feedbackByStep);
    console.log(`  confidenceByStep map:`, this.confidenceByStep);
    console.log(`  already shown:`, this.shownFeedbackForSteps.has(widgetPosition));
    
    // If it's a non-coding step with feedback/confidence, auto-trigger after a short delay
    if (!hasCodeEditor && (hasFeedback || hasConfidence)) {
      // Don't show again if we've already shown for this step
      if (!this.shownFeedbackForSteps.has(widgetPosition)) {
        console.log(`Auto-triggering feedback for non-coding step ${this.currentStep}`);
        setTimeout(() => {
          this.handleCodePassed();
          this.cdr.detectChanges();
        }, 500); // Small delay so user can see the step content first
      } else {
        console.log(`Feedback already shown for step ${this.currentStep}, skipping`);
      }
    } else {
      console.log(`Step ${this.currentStep} is a coding step or has no feedback/confidence widgets`);
    }
  }

  handleCompleteStep(): void {
    if (!this.completedSteps.includes(this.currentStep)) {
      this.completedSteps = [...this.completedSteps, this.currentStep];
    }
    
    // Check if all steps are completed
    const allStepsCompleted = this.completedSteps.length === this.steps.length;
    
    if (this.currentStep < this.steps.length) {
      this.currentStep += 1;
      this.updateCurrentCodeEditor();
      this.updateCurrentFeedbackWidgets();
    }
    
    // Update session progress
    this.updateModuleSession({
      current_step: this.currentStep,
      progress: this.steps.length > 0 ? this.completedSteps.length / this.steps.length : 0,
      status: allStepsCompleted ? 'completed' : 'in_progress',
      completed: allStepsCompleted
    });
    
    // Complete session if all steps are done
    if (allStepsCompleted) {
      this.completeModuleSession();
    }
    
    this.cdr.detectChanges();
  }

  handleCodePassed(): void {
    console.log('Code passed! Showing feedback widgets for step', this.currentStep);
    this.codePassed = true;
    
    // Get the actual step data to find its widget position
    const currentStepData = this.steps[this.currentStep - 1];
    const widgetPosition = currentStepData?.widgetPosition || currentStepData?.id || this.currentStep;
    
    // Check if we've already shown feedback for this step
    if (this.shownFeedbackForSteps.has(widgetPosition)) {
      console.log('Feedback already shown for this step, skipping');
      return;
    }
    
    // Mark this step as having shown feedback
    this.shownFeedbackForSteps.add(widgetPosition);
    
    // Get feedback and confidence widgets for the current step (using widget position)
    const stepFeedback = this.feedbackByStep.get(widgetPosition);
    const stepConfidence = this.confidenceByStep.get(widgetPosition);
    
    console.log(`Step ${this.currentStep} (widgetPosition: ${widgetPosition}) feedback:`, stepFeedback);
    console.log(`Step ${this.currentStep} (widgetPosition: ${widgetPosition}) confidence:`, stepConfidence);
    
    // Show feedback modal first if it exists for this step
    if (stepFeedback) {
      this.feedbackWidget = stepFeedback;
      this.showFeedbackModal = true;
    } else if (stepConfidence) {
      // If no feedback widget, go straight to confidence meter
      this.confidenceWidget = stepConfidence;
      this.showConfidenceMeter = true;
    }
    
    this.cdr.detectChanges();
  }

  handleFeedbackContinue(): void {
    console.log('Feedback dismissed, checking for confidence meter...');
    this.showFeedbackModal = false;
    
    // Get the actual step data to find its widget position
    const currentStepData = this.steps[this.currentStep - 1];
    const widgetPosition = currentStepData?.widgetPosition || currentStepData?.id || this.currentStep;
    
    // Show confidence meter for the current step after feedback is dismissed
    const stepConfidence = this.confidenceByStep.get(widgetPosition);
    if (stepConfidence) {
      this.confidenceWidget = stepConfidence;
      this.showConfidenceMeter = true;
    }
    
    this.cdr.detectChanges();
  }

  handleConfidenceSubmit(): void {
    console.log('Confidence submitted');
    this.showConfidenceMeter = false;
    this.cdr.detectChanges();
  }

  handleAIReviewComplete(feedback: string): void {
    this.aiReviewFeedback = feedback;
    this.cdr.detectChanges();
  }

  handleRefactorFeedback(data: any): void {
    console.log('Refactor feedback received:', data);
    this.refactorFeedbackData = data;
    this.cdr.detectChanges();
  }

  handleMultipleChoiceSubmit(event: any): void {
    console.log('Multiple choice submitted:', event);
    // Handle multiple choice submission
    if (event.correct || event.isCorrect) {
      this.handleCodePassed();
    }
  }

  handleWidgetComplete(event: any): void {
    console.log('Widget completed:', event);
    // Handle widget completion (e.g., text-editor, equation-input)
    if (event.complete || event.isComplete || event.completed) {
      this.handleCodePassed();
    }
  }

  goBack(): void {
    // Abandon session if user navigates away
    if (this.currentSession && this.currentSession.status !== 'completed') {
      this.abandonModuleSession();
    }
    this.router.navigate(['/labs']);
  }

  restartLab(): void {
    // Reset any lab state if needed
    this.loadLab();
  }
   /**
   * Transform module-format multiple choice options to component format
   */
  getMultipleChoiceOptions(config: any): any[] {
    if (!config || !config.options) return [];
    
    const options = config.options;
    const correctAnswer = config.correctAnswer;
    const explanation = config.explanation || '';
    
    return options.map((option: string, index: number) => ({
      id: `option-${index}`,
      label: option,
      value: `option-${index}`,
      rationale: index === correctAnswer ? explanation : undefined,
      isCorrect: index === correctAnswer
    }));
  }

  /**
   * Transform module-format correct answer (index) to component format (array of IDs)
   */
  getMultipleChoiceCorrectAnswers(config: any): string[] {
    if (!config || config.correctAnswer === undefined) return [];
    
    const correctIndex = config.correctAnswer;
    return [`option-${correctIndex}`];
  }
  
  
  
}
