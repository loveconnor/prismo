import { Component, OnInit, OnDestroy, AfterViewInit, inject, ChangeDetectorRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { LabDataService, LabData } from '../../../services/lab-data.service';

// Widgets
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
import { AlgorithmSimulatorComponent } from '../../../components/widgets/coding/algorithm-simulator/algorithm-simulator';
import type { Algorithm } from '../../../components/widgets/coding/algorithm-simulator/algorithm-simulator';

// Tri-panel components
import { StepsPanelComponent } from '../../../components/widgets/core/steps-panel/steps-panel';
import { EditorPanelComponent } from '../../../components/widgets/coding/editor-panel/editor-panel';
import { SupportPanelComponent } from '../../../components/widgets/core/support-panel/support-panel';
import { OutcomeSummaryComponent } from '../../../components/widgets/core/outcome-summary/outcome-summary';

// UI Components
import { CardComponent } from '../../../components/ui/card/card';
import { CardHeaderComponent } from '../../../components/ui/card/card-header';
import { CardContentComponent } from '../../../components/ui/card/card-content';
import { CardFooterComponent } from '../../../components/ui/card/card-footer';
import { ButtonComponent } from '../../../components/ui/button/button';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucideArrowLeft, lucidePlay, lucideBookOpen, lucideLightbulb, lucideCode, lucideCircle, lucideClock, lucideX, lucideChevronRight } from '@ng-icons/lucide';

@Component({
  selector: 'app-lab-template',
  standalone: true,
  imports: [
    CommonModule,
    // Widgets
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
    AlgorithmSimulatorComponent,
    // Panels
    StepsPanelComponent,
    EditorPanelComponent,
    SupportPanelComponent,
    OutcomeSummaryComponent,
    // UI
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
        <!-- Left: Steps -->
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

        <!-- Center -->
        <div class="min-w-0 overflow-hidden">
          <!-- Code Editor / Step Prompt default -->
          <app-editor-panel
            *ngIf="currentStepWidgetType === 'code-editor' || currentStepWidgetType === 'step-prompt' || !currentStepWidgetType"
            [currentStep]="currentStep"
            [totalSteps]="steps.length || 1"
            [shiftHeader]="leftPanelCollapsed || !hasSteps"
            [editorConfig]="codeEditorWidget?.config || codeEditorWidget?.props"
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
                  *ngIf="currentStep < (steps.length || 1)" 
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
          ></app-support-panel>
        </div>
      </div>

    </div>

    <!-- Feedback Modal -->
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

    <!-- Confidence Meter Modal -->
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

    <!-- Outcome Summary Modal -->
    <div *ngIf="showOutcomeSummary" 
         class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div class="max-w-4xl w-full max-h-[90vh] overflow-auto" (click)="$event.stopPropagation()">
        <app-outcome-summary
          [id]="'outcome-' + (labData?.id || 'lab')"
          [labId]="labData?.id || ''"
          [labTitle]="labData?.title || 'Lab Complete'"
          [outcomeType]="'completion'"
          [completionPercent]="completionPercentage"
          [timeSpent]="labTimeSpent"
          [score]="completionPercentage / 100"
          [keyTakeaways]="labData?.metadata?.tags || []"
          [strengths]="getLabStrengths()"
          [ui]="{ variant: 'celebration', showConfetti: true, showSkillProgress: true, showNextSteps: true }"
        ></app-outcome-summary>
        <div class="mt-4 flex justify-center gap-3 pb-6">
          <app-button 
            variant="outline"
            (click)="restartLab()"
            className="px-6 py-2">
            Restart Lab
          </app-button>
          <app-button 
            (click)="handleOutcomeSummaryContinue()"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2">
            Continue to Labs
          </app-button>
        </div>
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
  public steps: { id: number; title: string; instruction?: string; example?: string; widgetPosition?: number; widgetType?: string }[] = [];
  
  // Widgets
  public codeEditorWidget: any = null;
  public allWidgets: any[] = [];
  public allCodeEditorWidgets: any[] = [];
  public allStepPromptWidgets: any[] = [];
  public allMultipleChoiceWidgets: any[] = [];
  public hintWidgets: any[] = [];
  public feedbackWidget: any = null;
  public confidenceWidget: any = null;
  public feedbackWidgets: any[] = [];
  public hasSteps = false;
  public codePassed = false;
  public showFeedbackModal = false;
  public showConfidenceMeter = false;
  public showOutcomeSummary = false;
  
  private feedbackByStep = new Map<number, any>();
  private confidenceByStep = new Map<number, any>();
  private shownFeedbackForSteps = new Set<number>();
  
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
    if (!this.shouldShowSupportPanel) {
      if (!this.hasSteps) {
        return '1fr';
      }
      const left = this.leftPanelCollapsed ? '0px' : 'minmax(260px, 18vw)';
      return `${left} 1fr`;
    }
    if (!this.hasSteps) {
      const right = this.rightPanelCollapsed ? '0px' : 'minmax(260px, 19vw)';
      return `1fr ${right}`;
    }
    const left = this.leftPanelCollapsed ? '0px' : 'minmax(260px, 18vw)';
    const right = this.rightPanelCollapsed ? '0px' : 'minmax(260px, 19vw)';
    return `${left} 1fr ${right}`;
  }
  
  private widgetStates = new Map<string, { completed: boolean; submitted: boolean }>();

  constructor() {}

  ngOnInit(): void {
    this.loadLab();
  }

  ngAfterViewInit(): void {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadLab(): void {
    const labId = this.route.snapshot.paramMap.get('id');
    const currentUrl = this.router.url;

    if (
      !labId && !currentUrl.includes('pt01') && 
      !currentUrl.includes('javascript-array-methods') && 
      !currentUrl.includes('test-fullstack-todo') &&
      !currentUrl.includes('binary-search-tree')
    ) {
      this.error = 'No lab ID provided';
      this.loading = false;
      return;
    }

    let actualLabId = labId;
    if (currentUrl.includes('pt01')) {
      this.http.get<any>('/assets/modules/CS1/01-Lab/pt04.json')
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (json) => {
            const labFromModule = this.labDataService.convertModuleToLab(json);
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
    } else if (currentUrl.includes('binary-search-tree')) {
      this.http.get<any>('/assets/modules/python/binary-search-tree.json')
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (json) => {
            const labFromModule = this.labDataService.convertModuleToLab(json);
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
    } else if (currentUrl.includes('test-fullstack-todo')) {
      this.http.get<any>('/assets/modules/test-fullstack-todo.json')
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (json) => {
            const labFromModule = this.labDataService.convertModuleToLab(json);
            this.labData = labFromModule;
            this.extractWidgetsFromLabData();
            this.loading = false;
            this.error = null;
            this.cdr.detectChanges();
          },
          error: (err) => {
            this.error = err.message || 'Failed to load test module JSON';
            this.loading = false;
            this.cdr.detectChanges();
          }
        });
      return;
    } else if (currentUrl.includes('fullstack-todo-with-steps')) {
      this.http.get<any>('/assets/modules/fullstack-todo-with-steps.json')
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (json) => {
            const labFromModule = this.labDataService.convertModuleToLab(json);
            this.labData = labFromModule;
            this.extractWidgetsFromLabData();
            this.loading = false;
            this.error = null;
            this.cdr.detectChanges();
          },
          error: (err) => {
            this.error = err.message || 'Failed to load fullstack todo with steps module JSON';
            this.loading = false;
            this.cdr.detectChanges();
          }
        });
      return;
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
    const labels = ['Beginner','Easy','Moderate','Medium','Challenging','Hard','Very Hard','Advanced','Expert','Master'];
    return labels[difficulty - 1] || 'Unknown';
  }

  getDifficultyColor(difficulty: number): string {
    const colors = [
      'text-green-600','text-green-500','text-blue-600','text-blue-500',
      'text-yellow-600','text-yellow-500','text-orange-600','text-orange-500',
      'text-red-600','text-red-500'
    ];
    return colors[difficulty - 1] || 'text-gray-600';
  }

  private extractWidgetsFromLabData(): void {
    if (!this.labData || !this.labData.sections || this.labData.sections.length === 0) {
      console.warn('No labData or sections found');
      return;
    }

    const allWidgets = this.labData.sections.flatMap(section => section.widgets || []);
    this.allWidgets = allWidgets;

    this.allCodeEditorWidgets = allWidgets.filter(w => 
      w.type === 'code-editor' || w.id === 'code-editor' || w.metadata?.id === 'code-editor'
    );
    this.allStepPromptWidgets = allWidgets.filter(w => 
      w.type === 'step-prompt' || w.id === 'step-prompt' || w.metadata?.id === 'step-prompt'
    );
    this.allMultipleChoiceWidgets = allWidgets.filter(w => 
      w.type === 'multiple-choice' || w.id === 'multiple-choice' || w.metadata?.id === 'multiple-choice'
    );

    this.updateCurrentCodeEditor();

    this.hintWidgets = allWidgets.filter(w => 
      w.type === 'hint-panel' || w.id === 'hint-panel' || w.metadata?.id === 'hint-panel'
    );

    const allFeedbackWidgets = allWidgets.filter(w => 
      w.type === 'feedback-box' || w.id === 'feedback-box' || w.metadata?.id === 'feedback-box'
    );

    allFeedbackWidgets.forEach(feedback => {
      let stepKey: number | undefined;
      if (feedback.metadata?.stepId !== undefined) {
        stepKey = feedback.metadata.stepId;
      } else if (feedback.metadata?.position !== undefined) {
        const feedbackPosition = feedback.metadata.position;
        const sortedWidgets = [...allWidgets].sort((a, b) => 
          (a.metadata?.position || 0) - (b.metadata?.position || 0)
        );
        for (let i = sortedWidgets.length - 1; i >= 0; i--) {
          const widget = sortedWidgets[i];
          const widgetPosition = widget.metadata?.position || 0;
          const widgetType = widget.type || widget.metadata?.id || widget.id;
          const isContentWidget = widgetType !== 'feedback-box' && widgetType !== 'confidence-meter' && widgetType !== 'hint-panel';
          if (widgetPosition < feedbackPosition && isContentWidget) {
            stepKey = widget.metadata?.position;
            break;
          }
        }
      }
      if (stepKey !== undefined) {
        this.feedbackByStep.set(stepKey, feedback);
      }
    });

    const allConfidenceWidgets = allWidgets.filter(w => 
      w.type === 'confidence-meter' || w.id === 'confidence-meter' || w.metadata?.id === 'confidence-meter'
    );
    allConfidenceWidgets.forEach(confidence => {
      let stepKey: number | undefined;
      if (confidence.metadata?.stepId !== undefined) {
        stepKey = confidence.metadata.stepId;
      } else if (confidence.metadata?.position !== undefined) {
        const confidencePosition = confidence.metadata.position;
        const sortedWidgets = [...allWidgets].sort((a, b) => 
          (a.metadata?.position || 0) - (b.metadata?.position || 0)
        );
        for (let i = sortedWidgets.length - 1; i >= 0; i--) {
          const widget = sortedWidgets[i];
          const widgetPosition = widget.metadata?.position || 0;
          const widgetType = widget.type || widget.metadata?.id || widget.id;
          const isContentWidget = widgetType !== 'feedback-box' && widgetType !== 'confidence-meter' && widgetType !== 'hint-panel';
          if (widgetPosition < confidencePosition && isContentWidget) {
            stepKey = widget.metadata?.position;
            break;
          }
        }
      }
      if (stepKey !== undefined) {
        this.confidenceByStep.set(stepKey, confidence);
      }
    });

    this.updateCurrentFeedbackWidgets();

    this.feedbackWidgets = allWidgets.filter(w => w.type === 'feedback-panel' || w.id === 'feedback-panel');

    if (this.labData.steps && this.labData.steps.length > 0) {
      this.steps = this.labData.steps.map(step => ({
        id: step.id,
        title: step.title,
        instruction: step.instruction || step.description,
        example: step.example
      }));
    } else {
      const contentWidgets = allWidgets.filter(w => {
        const widgetType = w.type || w.metadata?.id || w.id;
        const isContentWidget = widgetType !== 'feedback-box' && widgetType !== 'confidence-meter' && widgetType !== 'hint-panel';
        const hasPosition = w.metadata?.position !== undefined;
        return hasPosition && isContentWidget;
      });
      if (contentWidgets.length >= 1) {
        this.steps = contentWidgets
          .sort((a, b) => (a.metadata?.position || 0) - (b.metadata?.position || 0))
          .map((w, index) => {
            const widgetType = w.type || w.metadata?.id || w.id;
            return {
              id: index + 1,
              widgetPosition: w.metadata?.position,
              widgetType: widgetType,
              title: w.config?.title || w.metadata?.title || `Step ${index + 1}`,
              instruction: w.config?.prompt || w.metadata?.description,
              example: undefined
            };
          });
      } else {
        this.steps = [];
      }
    }
    this.hasSteps = this.steps.length > 0;

    // Optional: auto-show for non-coding steps
    this.checkAndShowFeedbackForNonCodingStep();
  }

  getSectionLayoutClass(layout?: string): string {
    switch (layout) {
      case 'dynamic': return 'layout-dynamic gap-md';
      case 'grid': return 'layout-grid gap-md';
      case 'stack': return 'layout-stack gap-md';
      case 'custom': return 'layout-dynamic gap-md';
      default: return 'layout-stack gap-md';
    }
  }

  getWidgetClasses(widget: any): string {
    const classes: string[] = [];
    const size = widget.layout?.size || 'auto';
    classes.push(`size-${size}`);
    const widgetType = widget.type.replace(/([A-Z])/g, '-$1').toLowerCase();
    classes.push(`widget-type-${widgetType}`);
    return classes.join(' ');
  }

  isWidgetVisible(widget: any): boolean {
    if (!widget.condition) return true;
    const condition = widget.condition;
    const visibility = condition.visibility || 'always';
    switch (visibility) {
      case 'always':
        return true;
      case 'after-submission':
        if (condition.requiresSubmission) return this.hasSubmittedAnyWidget();
        if (condition.dependsOn?.length) {
          return condition.dependsOn.some((depId: string) => this.widgetStates.get(depId)?.submitted || false);
        }
        return true;
      case 'on-complete':
        if (condition.dependsOn?.length) {
          return condition.dependsOn.every((depId: string) => this.widgetStates.get(depId)?.completed || false);
        }
        return false;
      case 'conditional':
        if (condition.dependsOn?.length) {
          return condition.dependsOn.every((depId: string) => this.widgetStates.get(depId)?.completed || false);
        }
        return true;
      default:
        return true;
    }
  }

  onWidgetStateChange(event: any, widget: any): void {
    const currentState = this.widgetStates.get(widget.id) || { completed: false, submitted: false };
    if (event.type === 'completion' || event.data?.is_completed) currentState.completed = true;
    if (event.type === 'submission' || event.data?.submitted) currentState.submitted = true;
    this.widgetStates.set(widget.id, currentState);
  }

  private hasSubmittedAnyWidget(): boolean {
    for (const [, state] of this.widgetStates) {
      if (state.submitted) return true;
    }
    return false;
  }

  // ===== Tri-panel helpers =====
  get progress(): number {
    return this.steps.length ? (this.completedSteps.length / this.steps.length) * 100 : 0;
  }

  get currentStepWidgetType(): string | null {
    const currentStepData = this.steps[this.currentStep - 1];
    return (currentStepData as any)?.widgetType || null;
  }

  get currentStepWidget(): any {
    const currentStepData = this.steps[this.currentStep - 1];
    const widgetPosition = currentStepData?.widgetPosition;
    const widgetType = currentStepData?.widgetType;
    if (!widgetPosition || !widgetType) return null;
    const widget = this.allWidgets.find(w => {
      const wType = w.type || w.metadata?.id || w.id;
      const wPosition = w.metadata?.position;
      return wType === widgetType && wPosition === widgetPosition;
    }) || null;
    return widget;
  }

  get currentStepMultipleChoiceOptions(): any[] {
    const widget = this.currentStepWidget;
    if (!widget) return [];
    const rawOptions = widget.config?.options || widget.props?.options || [];
    if (rawOptions.length > 0 && typeof rawOptions[0] === 'object' && rawOptions[0].id) {
      return rawOptions;
    }
    if (rawOptions.length > 0 && typeof rawOptions[0] === 'string') {
      return rawOptions.map((option: string, index: number) => ({
        id: `option-${index}`,
        label: option,
        value: `${index}`,
        isCorrect: false
      }));
    }
    return [];
  }

  get algorithmSimulatorDefaultAlgorithm(): Algorithm {
    const widget = this.currentStepWidget;
    const value = widget?.config?.defaultAlgorithm || widget?.props?.defaultAlgorithm || 'bubble';
    return value as Algorithm;
  }

  get algorithmSimulatorEnabledAlgorithms(): Algorithm[] {
    const widget = this.currentStepWidget;
    const value = widget?.config?.enabledAlgorithms || widget?.props?.enabledAlgorithms || ['bubble', 'quick', 'recursion'];
    return value as Algorithm[];
  }

  handleMultipleChoiceSubmit(event: any): void {
    if (event.correct) this.handleCodePassed();
  }

  handleWidgetComplete(event: any): void {
    this.handleCodePassed();
  }

  onStepClick(step: number): void {
    const highest = this.completedSteps.length ? Math.max(...this.completedSteps) : 0;
    const nextUnlock = highest + 1;
    if (step <= nextUnlock) {
      this.currentStep = step;
      this.updateCurrentCodeEditor();
      this.updateCurrentFeedbackWidgets();
      this.cdr.detectChanges();
    }
  }
  
  private updateCurrentCodeEditor(): void {
    const currentStepData = this.steps[this.currentStep - 1];
    const widgetPosition = currentStepData?.widgetPosition || this.currentStep;
    let widgetForStep = null;

    if (this.allCodeEditorWidgets.length > 0) {
      widgetForStep = this.allCodeEditorWidgets.find(w => w.metadata?.stepId === this.currentStep) ||
                      this.allCodeEditorWidgets.find(w => w.metadata?.position === widgetPosition) ||
                      this.allCodeEditorWidgets.find(w => w.metadata?.position === this.currentStep);
      if (!widgetForStep && this.allCodeEditorWidgets.length === 1) {
        widgetForStep = this.allCodeEditorWidgets[0];
      } else if (!widgetForStep && this.currentStep <= this.allCodeEditorWidgets.length) {
        widgetForStep = this.allCodeEditorWidgets[this.currentStep - 1];
      }
    }

    if (!widgetForStep && this.allStepPromptWidgets.length > 0) {
      widgetForStep = this.allStepPromptWidgets.find(w => w.metadata?.stepId === this.currentStep) ||
                      this.allStepPromptWidgets.find(w => w.metadata?.position === widgetPosition) ||
                      this.allStepPromptWidgets.find(w => w.metadata?.position === this.currentStep);
    }

    this.codeEditorWidget = widgetForStep || this.allCodeEditorWidgets[0] || null;
  }
  
  private updateCurrentFeedbackWidgets(): void {
    const currentStepData = this.steps[this.currentStep - 1];
    const widgetPosition = currentStepData?.widgetPosition || currentStepData?.id || this.currentStep;
    this.feedbackWidget = this.feedbackByStep.get(widgetPosition) || null;
    this.confidenceWidget = this.confidenceByStep.get(widgetPosition) || null;
  }

  private checkAndShowFeedbackForNonCodingStep(): void {
    const currentStepData = this.steps[this.currentStep - 1];
    const widgetPosition = currentStepData?.widgetPosition || currentStepData?.id || this.currentStep;
    const hasCodeEditor = this.allCodeEditorWidgets.some(w => w.metadata?.position === widgetPosition);
    const hasFeedback = this.feedbackByStep.has(widgetPosition);
    const hasConfidence = this.confidenceByStep.has(widgetPosition);
    if (!hasCodeEditor && (hasFeedback || hasConfidence)) {
      if (!this.shownFeedbackForSteps.has(widgetPosition)) {
        setTimeout(() => {
          this.handleCodePassed();
          this.cdr.detectChanges();
        }, 500);
      }
    }
  }

  handleCompleteStep(): void {
    if (!this.completedSteps.includes(this.currentStep)) {
      this.completedSteps = [...this.completedSteps, this.currentStep];
    }
    if (this.currentStep < this.steps.length) {
      this.currentStep += 1;
      this.updateCurrentCodeEditor();
      this.updateCurrentFeedbackWidgets();
    }
    this.cdr.detectChanges();
  }

  handleCodePassed(): void {
    this.codePassed = true;
    const currentStepData = this.steps[this.currentStep - 1];
    const widgetPosition = currentStepData?.widgetPosition || currentStepData?.id || this.currentStep;
    if (this.shownFeedbackForSteps.has(widgetPosition)) return;
    this.shownFeedbackForSteps.add(widgetPosition);

    const stepFeedback = this.feedbackByStep.get(widgetPosition);
    const stepConfidence = this.confidenceByStep.get(widgetPosition);
    if (stepFeedback) {
      this.feedbackWidget = stepFeedback;
      this.showFeedbackModal = true;
    } else if (stepConfidence) {
      this.confidenceWidget = stepConfidence;
      this.showConfidenceMeter = true;
    }
    this.cdr.detectChanges();
  }

  handleFeedbackContinue(): void {
    this.showFeedbackModal = false;
    const currentStepData = this.steps[this.currentStep - 1];
    const widgetPosition = currentStepData?.widgetPosition || currentStepData?.id || this.currentStep;
    const stepConfidence = this.confidenceByStep.get(widgetPosition);
    if (stepConfidence) {
      this.confidenceWidget = stepConfidence;
      this.showConfidenceMeter = true;
    } else {
      this.checkIfLabCompleted();
    }
    this.cdr.detectChanges();
  }

  handleConfidenceSubmit(): void {
    this.showConfidenceMeter = false;
    this.checkIfLabCompleted();
    this.cdr.detectChanges();
  }

  private checkIfLabCompleted(): void {
    if (!this.completedSteps.includes(this.currentStep)) {
      this.completedSteps = [...this.completedSteps, this.currentStep];
    }
    const isLastStep = this.currentStep >= this.steps.length;
    if (isLastStep) {
      this.showOutcomeSummary = true;
    }
  }

  handleOutcomeSummaryContinue(): void {
    this.showOutcomeSummary = false;
    this.goBack();
  }

  get completionPercentage(): number {
    return this.steps.length ? Math.round((this.completedSteps.length / this.steps.length) * 100) : 100;
  }

  get labTimeSpent(): number {
    return this.labData?.estimatedTime || 30;
  }

  getLabStrengths(): string[] {
    const strengths: string[] = [];
    if (this.completionPercentage === 100) strengths.push('Completed all exercises');
    if (this.completedSteps.length > 0) strengths.push(`Completed ${this.completedSteps.length} out of ${this.steps.length} steps`);
    if (this.labData?.metadata?.tags?.length) strengths.push(`Practiced ${this.labData.metadata.tags.slice(0, 3).join(', ')}`);
    return strengths;
  }

  goBack(): void {
    this.router.navigate(['/labs']);
  }

  restartLab(): void {
    this.loadLab();
  }
}
