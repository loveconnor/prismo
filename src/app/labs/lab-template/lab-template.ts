import { Component, OnInit, OnDestroy, AfterViewInit, inject, ChangeDetectorRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { LabDataService, LabData } from '../../../services/lab-data.service';

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
import { MultipleChoiceComponent } from '../../../components/widgets/core/multiple-choice/multiple-choice';
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
            <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
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
        </div>

        <!-- Right: Support -->
        <div class="min-w-0 overflow-hidden" *ngIf="shouldShowSupportPanel">
          <app-support-panel
            [collapsed]="rightPanelCollapsed"
            [hints]="hintWidgets"
            [feedback]="feedbackWidgets"
          ></app-support-panel>
        </div>
      </div>

    </div>

    <!-- Feedback Modal (appears first as overlay) -->
    <div *ngIf="showFeedbackModal" 
         class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
         (click)="handleFeedbackContinue()">
      <div class="max-w-2xl w-full" (click)="$event.stopPropagation()">
        <app-feedback-box
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
    <div *ngIf="showConfidenceMeter" 
         class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div class="max-w-2xl w-full" (click)="$event.stopPropagation()">
        <app-confidence-meter
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
  public steps: { id: number; title: string; instruction?: string; example?: string }[] = [];
  
  // Extracted widgets from labData
  public codeEditorWidget: any = null;
  public allCodeEditorWidgets: any[] = [];
  public hintWidgets: any[] = [];
  public feedbackWidget: any = null;
  public confidenceWidget: any = null;
  public feedbackWidgets: any[] = [];
  public hasSteps = false;
  public codePassed = false;
  public showFeedbackModal = false;
  public showConfidenceMeter = false;
  
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
  }

  private loadLab(): void {
    const labId = this.route.snapshot.paramMap.get('id');
    const currentUrl = this.router.url;

    if (!labId && !currentUrl.includes('pt01') && !currentUrl.includes('javascript-array-methods')) {
      this.error = 'No lab ID provided';
      this.loading = false;
      return;
    }

    // Handle specific routes: strictly load from module JSON for pt01
    let actualLabId = labId;
    if (currentUrl.includes('pt01')) {
      // Load the CS1 pt01 module JSON and convert to lab using HttpClient (triggers CD in zoneless mode)
      this.http.get<any>('/assets/modules/CS1/01-Lab/pt02.json')
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (json) => {
            console.log('Loaded pt01.json:', json);
            const labFromModule = this.labDataService.convertModuleToLab(json);
            console.log('Converted to lab:', labFromModule);
            this.labData = labFromModule;
            this.extractWidgetsFromLabData();
            this.loading = false;
            this.error = null;
            this.cdr.detectChanges();
          },
          error: (err) => {
            this.error = err.message || 'Failed to load module JSON';
            this.loading = false;
            this.cdr.detectChanges();
          }
        });
      return;
    } else if (currentUrl.includes('javascript-array-methods')) {
      actualLabId = 'javascript-array-methods';
    }

    this.labDataService.getLab(actualLabId!)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (labData) => {
          this.labData = labData;
          this.extractWidgetsFromLabData();
          this.loading = false;
          this.error = null;
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.error = err.message || 'Failed to load lab';
          this.loading = false;
          this.cdr.detectChanges();
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
    this.allCodeEditorWidgets = allWidgets.filter(w => w.type === 'code-editor' || w.id === 'code-editor');
    console.log('Found code editor widgets:', this.allCodeEditorWidgets);
    
    // Set the initial code editor widget (will be updated based on current step)
    this.updateCurrentCodeEditor();
    
    // Find hint widgets
    this.hintWidgets = allWidgets.filter(w => w.type === 'hint-panel' || w.id === 'hint-panel');
    console.log('Found hint widgets:', this.hintWidgets);
    
    // Find feedback widget (for modal)
    this.feedbackWidget = allWidgets.find(w => w.type === 'feedback-box' || w.id === 'feedback-box');
    console.log('Found feedback widget:', this.feedbackWidget);
    
    // Find feedback widgets for support panel (different from modal feedback)
    this.feedbackWidgets = allWidgets.filter(w => w.type === 'feedback-panel' || w.id === 'feedback-panel');
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
          example: undefined
        }));
    } else {
      this.steps = [];
    }
    
    this.hasSteps = this.steps.length > 0;
    console.log('Extracted steps:', this.steps);
    console.log('Has steps:', this.hasSteps);
    
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
      this.cdr.detectChanges();
    }
  }
  
  private updateCurrentCodeEditor(): void {
    // Find the code editor widget for the current step
    if (this.allCodeEditorWidgets.length > 0) {
      // If there are multiple code editors, find the one matching current step position
      if (this.allCodeEditorWidgets.length > 1) {
        const editorForStep = this.allCodeEditorWidgets.find(w => w.metadata?.position === this.currentStep);
        this.codeEditorWidget = editorForStep || this.allCodeEditorWidgets[this.currentStep - 1] || this.allCodeEditorWidgets[0];
      } else {
        // Only one code editor, use it for all steps
        this.codeEditorWidget = this.allCodeEditorWidgets[0];
      }
      console.log('Current code editor widget for step', this.currentStep, ':', this.codeEditorWidget);
    }
  }

  handleCompleteStep(): void {
    if (!this.completedSteps.includes(this.currentStep)) {
      this.completedSteps = [...this.completedSteps, this.currentStep];
    }
    if (this.currentStep < this.steps.length) {
      this.currentStep += 1;
      this.updateCurrentCodeEditor();
    }
    this.cdr.detectChanges();
  }

  handleCodePassed(): void {
    console.log('Code passed! Showing feedback widgets...');
    console.log('Feedback widget config:', this.feedbackWidget?.config);
    console.log('Confidence widget config:', this.confidenceWidget?.config);
    this.codePassed = true;
    
    // Show feedback modal first if it exists
    if (this.feedbackWidget) {
      this.showFeedbackModal = true;
    } else if (this.confidenceWidget) {
      // If no feedback widget, go straight to confidence meter
      this.showConfidenceMeter = true;
    }
    
    this.cdr.detectChanges();
  }

  handleFeedbackContinue(): void {
    console.log('Feedback dismissed, showing confidence meter...');
    this.showFeedbackModal = false;
    
    // Show confidence meter after feedback is dismissed
    if (this.confidenceWidget) {
      this.showConfidenceMeter = true;
    }
    
    this.cdr.detectChanges();
  }

  handleConfidenceSubmit(): void {
    console.log('Confidence submitted');
    this.showConfidenceMeter = false;
    this.cdr.detectChanges();
  }

  goBack(): void {
    this.router.navigate(['/labs']);
  }

  restartLab(): void {
    // Reset any lab state if needed
    this.loadLab();
  }
}
