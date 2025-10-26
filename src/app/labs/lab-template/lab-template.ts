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
import { OutcomeSummaryComponent } from '../../../components/widgets/core/outcome-summary/outcome-summary';
import { StepPromptInteractiveComponent, StepPromptConfig } from '../../../components/widgets/core/step-prompt/step-prompt-interactive';
// Tri-panel components
import { StepsPanelComponent } from '../../../components/widgets/core/steps-panel/steps-panel';
import { EditorPanelComponent } from '../../../components/widgets/coding/editor-panel/editor-panel';
import { SupportPanelComponent } from '../../../components/widgets/core/support-panel/support-panel';

// Services
import { StepContextService, StepContext } from '../../../services/step-context.service';

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
    StepPromptInteractiveComponent,
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
    OutcomeSummaryComponent,
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
        <div class="min-w-0 overflow-hidden flex flex-col">
          <!-- Lab Background Condensed Card (shown after initial modal is closed) -->
          <div *ngIf="labBackgroundContext && !showStepContext && hasShownLabBackground" 
               class="bg-[#0e1318] border-b border-[#1f2937] p-3 cursor-pointer hover:bg-[#151a20] transition-colors"
               (click)="reopenLabBackground()">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <ng-icon name="lucideBookOpen" class="h-4 w-4 text-blue-400"></ng-icon>
                <div>
                  <p class="text-sm font-medium text-[#e5e7eb]">Lab Background</p>
                  <p class="text-xs text-[#6b7280]">Click to review lab overview and key concepts</p>
                </div>
              </div>
              <div class="flex items-center gap-2 text-xs text-[#6b7280]">
                <span class="px-2 py-1 rounded bg-[#1f2937]">{{ labBackgroundContext.keyConcepts?.length || 0 }} concepts</span>
                <span class="px-2 py-1 rounded bg-[#1f2937]">{{ labBackgroundContext.estimatedTime }} min</span>
              </div>
            </div>
          </div>

          <app-editor-panel
            *ngIf="currentStepWidgetType === 'code-editor'"
            [currentStep]="currentStep"
            [totalSteps]="steps.length || 1"
            [shiftHeader]="leftPanelCollapsed || !hasSteps"
            [editorConfig]="codeEditorWidget?.config"
            (completeStep)="handleCompleteStep()"
            (completeLab)="handleCompleteLab()"
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
          <ng-container *ngIf="currentStepWidgetType === 'multiple-choice'">
            <div class="flex h-full flex-col bg-[#12161b]" [attr.data-step]="currentStep">
              <div class="border-b border-[#1f2937] bg-[#151a20] px-4 py-3 flex items-center justify-between" [class.pl-16]="leftPanelCollapsed || !hasSteps">
                <div class="absolute left-3 top-1/2 -translate-y-1/2" *ngIf="hasSteps && leftPanelCollapsed">
                  <button
                    (click)="leftPanelCollapsed = false"
                    class="flex h-9 w-9 items-center justify-center rounded-full text-[#e5e7eb] hover:bg-white/10"
                    aria-label="Expand steps panel"
                  >
                    <ng-icon name="lucideChevronRight" class="h-5 w-5"></ng-icon>
                  </button>
                </div>

                <div class="flex items-center gap-3 text-sm text-[#a9b1bb]">
                  <div class="flex items-center gap-1.5 rounded-md border border-[#BC78F9]/30 bg-[#BC78F9]/15 px-2 py-1 text-xs font-semibold text-[#bc78f9]">
                    Multiple Choice
                  </div>
                  <span>Step {{ currentStep }} of {{ steps.length || 1 }}</span>
                  <!-- Debug info -->
                  <span class="text-xs text-gray-500">
                    [Debug: completed={{ completedSteps.includes(currentStep) }}, isFinal={{ currentStep === steps.length }}, completedSteps={{ completedSteps.join(',') }}]
                  </span>
                </div>

                <div class="flex items-center gap-2">
                  <!-- Continue button for non-final steps -->
                  <app-button 
                    *ngIf="currentStep < steps.length && completedSteps.includes(currentStep)" 
                    (click)="handleCompleteStep()"
                    className="bg-[#16a34a] hover:bg-[#15803d] text-white border-[#16a34a] font-medium shadow-sm">
                    Continue to Step {{ currentStep + 1 }}
                  </app-button>
                  <!-- Complete Lab button for final step -->
                  <app-button 
                    *ngIf="currentStep === steps.length && completedSteps.includes(currentStep)" 
                    (click)="handleCompleteLab()"
                    className="bg-[#bc78f9] hover:bg-[#a865e0] text-white border-[#bc78f9] font-medium shadow-sm">
                    Complete Lab
                  </app-button>
                </div>
              </div>

              <!-- Multiple Choice Content -->
              <div class="flex-1 overflow-y-auto p-6">
                <!-- Force component recreation by using ngFor with trackBy on currentStep -->
                <ng-container *ngFor="let step of [currentStep]; trackBy: trackByStep">
                  <app-multiple-choice
                    [id]="'mc-step-' + step + '-' + (codeEditorWidget?.id || '')"
                    [metadata]="codeEditorWidget.metadata"
                    [config]="codeEditorWidget.config"
                    [sessionId]="currentSession?.id || ''"
                    [moduleId]="labData?.id || ''"
                    [question]="(codeEditorWidget.config?.question || codeEditorWidget.props?.question || '')"
                    [options]="getMultipleChoiceOptions(codeEditorWidget)"
                    [correctAnswers]="getMultipleChoiceCorrectAnswers(codeEditorWidget)"
                    [selectionMode]="getMultipleChoiceSelectionMode(codeEditorWidget)"
                    [showRationale]="true"
                    (answerSubmitted)="handleMultipleChoiceSubmitted($event)"
                  ></app-multiple-choice>
                </ng-container>
              </div>
            </div>
          </ng-container>

          <!-- Step Prompt Widget (for step-prompt widgets) -->
          <div 
            *ngIf="currentStepWidgetType === 'step-prompt'"
            class="flex h-full flex-col overflow-hidden rounded-lg border border-border bg-card"
          >
            <!-- Header -->
            <div class="flex items-center justify-between border-b border-border bg-muted/50 px-4 py-3">
              <div class="flex items-center gap-3">
                <ng-icon name="lucideBookOpen" class="h-5 w-5 text-primary"></ng-icon>
                <span class="text-sm font-medium text-foreground">
                  Step {{ currentStep }} of {{ steps.length || 1 }}
                </span>
              </div>
              <div expandControl *ngIf="hasSteps && leftPanelCollapsed">
                <button
                  (click)="leftPanelCollapsed = false"
                  class="flex h-9 w-9 items-center justify-center rounded-full text-[#e5e7eb] hover:bg-white/10"
                  aria-label="Expand steps panel"
                >
                  <ng-icon name="lucideChevronRight" class="h-5 w-5"></ng-icon>
                </button>
              </div>
            </div>
            
            <!-- Content -->
            <div class="flex-1 overflow-y-auto p-6">
              <ng-container *ngFor="let step of [currentStep]; trackBy: trackByStep">
                <app-step-prompt
                  [title]="getStepPromptTitle()"
                  [prompt]="getStepPromptText()"
                  [estimatedTime]="getStepPromptEstimatedTime()"
                  [showFooter]="true"
                ></app-step-prompt>
              </ng-container>
            </div>
            
            <!-- Footer with Continue Button -->
            <div class="border-t border-border bg-muted/50 px-6 py-4">
              <!-- Continue button for non-final steps -->
              <button
                *ngIf="currentStep < steps.length"
                (click)="handleCodePassed()"
                class="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Continue to Step {{ currentStep + 1 }}
              </button>
              <!-- Complete Lab button for final step -->
              <button
                *ngIf="currentStep === steps.length"
                (click)="handleCompleteLab()"
                class="w-full rounded-md bg-[#bc78f9] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#a865e0] transition-colors"
              >
                Complete Lab
              </button>
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

    <!-- Step Context Modal (shows AI-generated background for each step) -->
    <div *ngIf="showStepContext" 
         class="fixed inset-0 z-[9998] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
         style="margin: 0; top: 0; left: 0; right: 0; bottom: 0; position: fixed;"
         (click)="closeStepContext()">
      <div class="max-w-3xl w-full mx-auto flex flex-col" 
           style="position: relative; z-index: 10000; max-height: calc(100vh - 4rem);" 
           (click)="$event.stopPropagation()">
        <!-- Loading State -->
        <div *ngIf="stepContextLoading" class="bg-[#12161b] border border-[#1f2937] rounded-lg p-8 text-center">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p class="text-[#a9b1bb] text-lg">Generating lab overview...</p>
          <p class="text-[#6b7280] text-sm mt-2">AI is preparing your learning context</p>
        </div>
        
        <!-- Content with Pagination -->
        <div *ngIf="!stepContextLoading && stepContextConfig && stepContextMetadata" class="flex flex-col bg-[#12161b] border border-[#1f2937] rounded-lg overflow-hidden" style="max-height: calc(100vh - 4rem);">
          <!-- Page Indicator Dots -->
          <div class="flex justify-center gap-2 pt-4 pb-3 bg-[#0e1318]" *ngIf="totalModalPages > 1">
            <button
              *ngFor="let page of modalPages; let i = index"
              (click)="goToModalPage(i)"
              [attr.aria-label]="'Go to page ' + (i + 1)"
              class="transition-all duration-200"
              [class.w-8]="i === currentModalPage"
              [class.w-2]="i !== currentModalPage"
              [class.bg-[#bc78f9]]="i === currentModalPage"
              [class.bg-[#374151]]="i !== currentModalPage"
              [class.hover:bg-[#bc78f9]/60]="i !== currentModalPage"
              style="height: 8px; border-radius: 4px;"
            ></button>
          </div>

          <!-- Modal Content (scrollable) -->
          <div class="flex-1 overflow-y-auto">
            <app-step-prompt-interactive
              [metadata]="stepContextMetadata"
              [promptConfig]="stepContextConfig"
              (primaryAction)="handleStepContextContinue()"
              (stepViewComplete)="onStepContextViewed()"
            ></app-step-prompt-interactive>
          </div>

          <!-- Navigation Footer -->
          <div class="flex items-center justify-between px-6 py-3 bg-[#0e1318] border-t border-[#1f2937]" *ngIf="totalModalPages > 1">
            <button
              (click)="previousModalPage()"
              [disabled]="currentModalPage === 0"
              [class.opacity-40]="currentModalPage === 0"
              [class.cursor-not-allowed]="currentModalPage === 0"
              class="flex items-center gap-2 text-sm text-[#a9b1bb] hover:text-[#e5e7eb] transition-colors disabled:hover:text-[#a9b1bb]"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
              </svg>
              Previous
            </button>
            
            <span class="text-xs text-[#6b7280]">
              {{ currentModalPage + 1 }} / {{ totalModalPages }}
            </span>
            
            <button
              (click)="nextModalPage()"
              [disabled]="currentModalPage === totalModalPages - 1"
              [class.opacity-40]="currentModalPage === totalModalPages - 1"
              [class.cursor-not-allowed]="currentModalPage === totalModalPages - 1"
              class="flex items-center gap-2 text-sm text-[#a9b1bb] hover:text-[#e5e7eb] transition-colors disabled:hover:text-[#a9b1bb]"
            >
              Next
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Completion Summary Modal -->
    <div *ngIf="showCompletionSummary && labData" 
         class="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
         style="margin: 0; top: 0; left: 0; right: 0; bottom: 0; position: fixed;">
      <div class="max-w-4xl w-full mx-auto max-h-[90vh] overflow-y-auto" style="position: relative; z-index: 10001;" (click)="$event.stopPropagation()">
        <app-outcome-summary
          [id]="'completion-' + labData.id"
          [labId]="labData.id"
          [labTitle]="labData.title"
          [outcomeType]="'completion'"
          [completionPercent]="getCompletionPercent()"
          [labTimeSpent]="getLabTimeSpent()"
          [score]="getLabScore()"
          [keyTakeaways]="labData.metadata?.tags || []"
          [ui]="{ variant: 'celebration', showSkillProgress: false, showNextSteps: true }"
          (nextLabSelect)="handleNextLabSelect($event)"
          (share)="handleShareAchievement()"
        ></app-outcome-summary>
        
        <!-- Close button and Back to Labs button -->
        <div class="flex justify-center gap-3 mt-6 pb-6">
          <app-button 
            variant="outline" 
            (click)="showCompletionSummary = false"
            className="border-[#1f2937] text-[#a9b1bb] hover:bg-[#0e1318]">
            Close
          </app-button>
          <app-button 
            (click)="goBack()"
            className="bg-[#bc78f9] hover:bg-[#BC78F9] text-white border-[#bc78f9]">
            Back to Labs
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
  private moduleSessionService = inject(ModuleSessionService);
  private widgetInteractionService = inject(WidgetInteractionService);
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);
  private stepContextService = inject(StepContextService);

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
  public allMultipleChoiceWidgets: any[] = [];
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
  public showCompletionSummary = false;
  
  // Step context modal
  public showStepContext = false;
  public stepContextConfig: StepPromptConfig | null = null;
  public stepContextMetadata: any = null;
  public stepContextLoading = false;
  public labBackgroundContext: StepContext | null = null; // Store lab background for later access
  public hasShownLabBackground = false; // Track if we've shown the lab background
  public currentModalPage = 0; // Track current page in multi-page modal
  public totalModalPages = 0; // Total pages in modal
  public modalPages: Array<{title: string, content: string}> = []; // Store paginated content
  private stepContextCache = new Map<number, StepContext>();
  
  // Current step widget properties
  public currentStepWidget: any = null;
  public currentStepWidgetType: string | null = null;
  public currentStepMultipleChoiceOptions: ChoiceOption[] = [];
  
  // Session tracking
  public currentSession: ModuleSession | null = null;
  public sessionStartTime: number = 0;
  private sessionUpdateInterval: any = null;
  
  // Step-specific widgets (indexed by stepId)
  private feedbackByStep = new Map<number, any>();
  private confidenceByStep = new Map<number, any>();
  private shownFeedbackForSteps = new Set<number>();
  
  // Quiz scoring tracking
  private quizResults = new Map<number, { correct: boolean; attempts: number }>();
  private totalQuizQuestions = 0;
  
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
    
    // Show lab background modal once before starting
    if (!this.hasShownLabBackground && this.labData) {
      console.log('[LabTemplate] Lab loaded, showing lab background overview');
      // Use setTimeout to ensure the view is fully initialized
      setTimeout(() => {
        this.showLabBackground();
      }, 500);
    }
    
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
    
    // Find all multiple-choice widgets
    this.allMultipleChoiceWidgets = allWidgets.filter(w => 
      w.type === 'multiple-choice' || 
      w.id === 'multiple-choice' || 
      w.metadata?.id === 'multiple-choice'
    );
    console.log('Found multiple-choice widgets:', this.allMultipleChoiceWidgets);
    
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
      // Clear the current widget type to force re-render
      this.currentStepWidgetType = null;
      this.codeEditorWidget = null;
      const previousStep = this.currentStep;
      this.currentStep = step;
      this.updateCurrentCodeEditor();
      this.updateCurrentFeedbackWidgets();
      
      // Don't show step context modal anymore - only show lab background once at start
      
      // Update session with new step
      this.updateModuleSession({
        current_step: step,
        status: 'in_progress'
      });
      
      this.cdr.detectChanges();
      
      this.currentStep = step;
      
      // Use setTimeout to ensure the widget update happens in the next tick
      setTimeout(() => {
        // Now update with the new step's widgets
        this.updateCurrentCodeEditor();
        this.updateCurrentFeedbackWidgets();
        
        // Update session with new step
        this.updateModuleSession({
          current_step: step,
          status: 'in_progress'
        });
        
        this.cdr.detectChanges();
      }, 0);
    }
  }
  
  // ===== Lab Background Modal Methods =====
  
  private showLabBackground(): void {
    // Only show once
    if (this.hasShownLabBackground) {
      return;
    }
    
    // Show loading state
    this.stepContextLoading = true;
    this.showStepContext = true;
    
    console.log('[LabTemplate] Generating lab background overview');
    
    // Extract skills/tags from metadata to use as topic
    const skills = this.labData?.metadata?.tags || [];
    const topicFromSkills = skills.length > 0 ? skills.join(', ') : this.labData?.title;
    
    // Generate comprehensive lab background using AI
    this.stepContextService.generateLabBackground({
      labTitle: this.labData?.title || 'Lab',
      labDescription: this.labData?.description || '',
      totalSteps: this.steps.length,
      difficulty: this.getDifficultyLabel(this.labData?.difficulty),
      topic: topicFromSkills || this.labData?.title,
      estimatedTime: this.labData?.estimatedTime
    }).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (context) => {
        console.log('[LabTemplate] Lab background received:', context);
        this.stepContextLoading = false;
        console.log('[LabTemplate] Loading set to false, about to display background');
        this.labBackgroundContext = context; // Store for later access
        this.displayLabBackground(context);
        this.hasShownLabBackground = true;
        this.cdr.detectChanges(); // Ensure view updates
      },
      error: (error) => {
        console.error('[LabTemplate] Error loading lab background:', error);
        this.stepContextLoading = false;
        // Still show the modal with fallback content
        const fallbackContext: StepContext = {
          stepNumber: 1,
          background: this.labData?.description || 'Welcome to this learning lab. Follow the steps to complete the exercises.',
          keyConcepts: [],
          estimatedTime: this.labData?.estimatedTime || 30,
          difficulty: 'medium'
        };
        this.labBackgroundContext = fallbackContext; // Store for later access
        this.displayLabBackground(fallbackContext);
        this.hasShownLabBackground = true;
      }
    });
  }
  
  private displayLabBackground(context: StepContext): void {
    // Split content into pages first to analyze it
    this.splitContentIntoPages(context);
    
    // Create metadata for the widget
    this.stepContextMetadata = {
      id: 'step-prompt-interactive',
      title: 'Lab Overview',
      description: 'AI-generated background information for this lab',
      skills: ['comprehension', 'reading', 'context-building'],
      difficulty: context.difficulty === 'easy' ? 2 : context.difficulty === 'hard' ? 4 : 3,
      estimated_time: context.estimatedTime * 60, // convert to seconds
      input_type: 'text' as const,
      output_type: 'scaffold' as const,
      dependencies: [],
      adaptive_hooks: {
        difficulty_adjustment: false,
        hint_progression: false
      },
      version: '1.0.0',
      category: 'core'
    };
    
    // Create config for step-prompt-interactive
    this.stepContextConfig = {
      title: undefined, // Don't show title - content will have its own headers
      stepNumber: undefined,
      totalSteps: undefined,
      promptType: 'instruction',
      bodyMD: this.formatLabBackgroundBody(context),
      difficulty: context.difficulty,
      estimatedMinutes: context.estimatedTime,
      ctaPrimary: {
        label: this.currentModalPage === this.totalModalPages - 1 ? 'Begin Lab' : 'Next',
        action: this.currentModalPage === this.totalModalPages - 1 ? 'start' : 'next'
      },
      variant: 'default',
      allowMarkdownHtml: true
    };
    
    console.log('[LabTemplate] Displaying lab background:', {
      metadata: this.stepContextMetadata,
      config: this.stepContextConfig,
      showStepContext: this.showStepContext
    });
    
    this.showStepContext = true;
    console.log('[LabTemplate] Modal should now be visible. showStepContext =', this.showStepContext);
    this.cdr.detectChanges(); // Force change detection
  }
  
  private formatLabBackgroundBody(context: StepContext): string {
    // The AI now generates properly formatted markdown in the background field
    // We'll split this into pages for better UX
    this.splitContentIntoPages(context);
    
    // Return the current page's content
    if (this.modalPages.length > 0 && this.currentModalPage < this.modalPages.length) {
      return this.modalPages[this.currentModalPage].content;
    }
    
    // Fallback: return everything if pagination fails
    return context.background || '';
  }
  
  private splitContentIntoPages(context: StepContext): void {
    this.modalPages = [];
    this.currentModalPage = 0;
    
    const background = context.background || '';
    
    // Split by markdown headers (### for h3)
    const sections = background.split(/(?=^###\s)/m);
    
    if (sections.length <= 1) {
      // No clear sections, try splitting by h2 as fallback
      const h2Sections = background.split(/(?=^##\s)/m);
      if (h2Sections.length <= 1) {
        // No headers at all, use whole content as one page
        this.modalPages = [{
          title: 'Overview',
          content: background
        }];
      } else {
        // Has h2 headers
        h2Sections.forEach((section, index) => {
          const trimmed = section.trim();
          if (!trimmed) return;
          
          const headerMatch = trimmed.match(/^##\s+(.+)$/m);
          const title = headerMatch ? headerMatch[1] : `Section ${index + 1}`;
          
          this.modalPages.push({
            title: title,
            content: trimmed
          });
        });
      }
    } else {
      // Create pages from h3 sections
      sections.forEach((section, index) => {
        const trimmed = section.trim();
        if (!trimmed) return;
        
        // Extract title from h3 header
        const headerMatch = trimmed.match(/^###\s+(.+)$/m);
        const title = headerMatch ? headerMatch[1] : `Section ${index + 1}`;
        
        this.modalPages.push({
          title: title,
          content: trimmed
        });
      });
    }
    
    // Add key concepts as final page if not already included
    const hasKeyConceptsPage = this.modalPages.some(page => 
      page.title.toLowerCase().includes('key concept') || 
      page.content.toLowerCase().includes('### key concept') ||
      page.content.toLowerCase().includes('## key concept')
    );
    
    if (!hasKeyConceptsPage && context.keyConcepts && context.keyConcepts.length > 0) {
      let conceptsContent = '### Key Concepts\n\n';
      conceptsContent += 'Master these essential concepts:\n\n';
      context.keyConcepts.forEach(concept => {
        conceptsContent += `- **${concept}**\n`;
      });
      
      this.modalPages.push({
        title: 'Key Concepts',
        content: conceptsContent
      });
    }
    
    this.totalModalPages = this.modalPages.length;
  }
  
  nextModalPage(): void {
    if (this.currentModalPage < this.totalModalPages - 1) {
      this.currentModalPage++;
      this.updateModalContent();
    }
  }
  
  previousModalPage(): void {
    if (this.currentModalPage > 0) {
      this.currentModalPage--;
      this.updateModalContent();
    }
  }
  
  goToModalPage(pageIndex: number): void {
    if (pageIndex >= 0 && pageIndex < this.totalModalPages) {
      this.currentModalPage = pageIndex;
      this.updateModalContent();
    }
  }
  
  private updateModalContent(): void {
    if (this.labBackgroundContext && this.modalPages.length > 0) {
      // Update the body content for current page
      if (this.stepContextConfig) {
        this.stepContextConfig.bodyMD = this.modalPages[this.currentModalPage].content;
        
        // Update CTA based on page position
        if (this.currentModalPage === this.totalModalPages - 1) {
          this.stepContextConfig.ctaPrimary = {
            label: 'Begin Lab',
            action: 'start'
          };
        } else {
          this.stepContextConfig.ctaPrimary = {
            label: 'Next',
            action: 'next'
          };
        }
        
        this.cdr.detectChanges();
      }
    }
  }
  
  handleStepContextContinue(): void {
    // If there are more pages, go to next page
    if (this.currentModalPage < this.totalModalPages - 1) {
      this.nextModalPage();
    } else {
      // On last page, close the modal
      this.closeStepContext();
    }
  }
  
  closeStepContext(): void {
    this.showStepContext = false;
    this.stepContextConfig = null;
    this.stepContextMetadata = null;
    this.currentModalPage = 0; // Reset to first page
    // Don't clear labBackgroundContext - we want to keep it for the condensed card
  }
  
  reopenLabBackground(): void {
    if (this.labBackgroundContext) {
      console.log('[LabTemplate] Reopening lab background modal');
      this.displayLabBackground(this.labBackgroundContext);
    }
  }
  
  onStepContextViewed(): void {
    // Track that the user viewed the step context
    console.log('Step context viewed for step', this.currentStep);
  }
  
  private updateCurrentCodeEditor(): void {
    // Find the widget for the current step - could be code editor, step-prompt, or multiple-choice
    
    // Get the current step data to find the widget position
    const currentStepData = this.steps[this.currentStep - 1];
    const widgetPosition = currentStepData?.widgetPosition || this.currentStep;
    
    console.log(`[updateCurrentCodeEditor] Looking for widget for step ${this.currentStep}, widgetPosition: ${widgetPosition}`);
    
    // First try to find a code editor for this step
    let widgetForStep = null;
    let widgetType: string | null = null;
    
    if (this.allCodeEditorWidgets.length > 0) {
      // Try to match by stepId first, then widgetPosition, then currentStep
      widgetForStep = this.allCodeEditorWidgets.find(w => w.metadata?.stepId === this.currentStep) ||
                      this.allCodeEditorWidgets.find(w => w.metadata?.position === widgetPosition) ||
                      this.allCodeEditorWidgets.find(w => w.metadata?.position === this.currentStep);
      
      if (widgetForStep) {
        widgetType = 'code-editor';
        console.log(`[updateCurrentCodeEditor] Found code-editor widget:`, widgetForStep);
      }
    }
    
    // If no code editor found, try multiple-choice widgets
    if (!widgetForStep && this.allMultipleChoiceWidgets.length > 0) {
      widgetForStep = this.allMultipleChoiceWidgets.find(w => w.metadata?.stepId === this.currentStep) ||
                      this.allMultipleChoiceWidgets.find(w => w.metadata?.position === widgetPosition) ||
                      this.allMultipleChoiceWidgets.find(w => w.metadata?.position === this.currentStep);
      
      if (widgetForStep) {
        widgetType = 'multiple-choice';
        console.log(`[updateCurrentCodeEditor] Found multiple-choice widget:`, widgetForStep);
      }
    }
    
    // If no code editor or multiple-choice found, try step-prompt widgets (like congratulations screens)
    if (!widgetForStep && this.allStepPromptWidgets.length > 0) {
      widgetForStep = this.allStepPromptWidgets.find(w => w.metadata?.stepId === this.currentStep) ||
                      this.allStepPromptWidgets.find(w => w.metadata?.position === widgetPosition) ||
                      this.allStepPromptWidgets.find(w => w.metadata?.position === this.currentStep);
      
      if (widgetForStep) {
        widgetType = 'step-prompt';
        console.log(`[updateCurrentCodeEditor] Found step-prompt widget:`, widgetForStep);
      }
    }
    
    this.codeEditorWidget = widgetForStep;
    this.currentStepWidgetType = widgetType;
    console.log(`[updateCurrentCodeEditor] Final result - widgetType: ${this.currentStepWidgetType}, widget:`, this.codeEditorWidget);
    
    // Auto-complete step-prompt widgets since they're just informational
    if (widgetType === 'step-prompt' && !this.completedSteps.includes(this.currentStep)) {
      setTimeout(() => {
        this.completedSteps = [...this.completedSteps, this.currentStep];
        this.cdr.detectChanges();
      }, 100);
    }
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
    
    // Check if this step has a code editor or multiple-choice widget
    const hasCodeEditor = this.allCodeEditorWidgets.some(w => w.metadata?.position === widgetPosition);
    const hasMultipleChoice = this.allMultipleChoiceWidgets.some(w => w.metadata?.position === widgetPosition);
    
    // Check if this step has feedback or confidence widgets
    const hasFeedback = this.feedbackByStep.has(widgetPosition);
    const hasConfidence = this.confidenceByStep.has(widgetPosition);
    
    console.log(`checkAndShowFeedbackForNonCodingStep - Step ${this.currentStep}:`);
    console.log(`  widgetPosition: ${widgetPosition}`);
    console.log(`  hasCodeEditor: ${hasCodeEditor}`);
    console.log(`  hasMultipleChoice: ${hasMultipleChoice}`);
    console.log(`  hasFeedback: ${hasFeedback}`);
    console.log(`  hasConfidence: ${hasConfidence}`);
    console.log(`  feedbackByStep map:`, this.feedbackByStep);
    console.log(`  confidenceByStep map:`, this.confidenceByStep);
    console.log(`  already shown:`, this.shownFeedbackForSteps.has(widgetPosition));
    
    // If it's a non-coding/non-quiz step with feedback/confidence, auto-trigger after a short delay
    // Exclude code editors AND multiple-choice since they need user interaction
    if (!hasCodeEditor && !hasMultipleChoice && (hasFeedback || hasConfidence)) {
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
      console.log(`Step ${this.currentStep} is a coding/quiz step or has no feedback/confidence widgets`);
    }
  }

  handleCompleteStep(): void {
    if (!this.completedSteps.includes(this.currentStep)) {
      this.completedSteps = [...this.completedSteps, this.currentStep];
    }
    
    // Check if all steps are completed
    const allStepsCompleted = this.completedSteps.length === this.steps.length;
    
    if (this.currentStep < this.steps.length) {
      // Clear the current widget type to force re-render
      this.currentStepWidgetType = null;
      this.codeEditorWidget = null;
      this.cdr.detectChanges();
      
      // Increment step
      this.currentStep += 1;
      
      // Use setTimeout to ensure the widget update happens in the next tick
      setTimeout(() => {
        // Now update with the new step's widgets
        this.updateCurrentCodeEditor();
        this.updateCurrentFeedbackWidgets();
        this.cdr.detectChanges();
      }, 0);
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
  }

  handleCodePassed(): void {
    console.log('Code passed! Showing feedback widgets for step', this.currentStep);
    this.codePassed = true;
    
    // Mark the current step as completed so the Continue button shows up
    if (!this.completedSteps.includes(this.currentStep)) {
      this.completedSteps = [...this.completedSteps, this.currentStep];
      console.log('[handleCodePassed] Marked step as complete. CompletedSteps:', this.completedSteps);
      console.log('[handleCodePassed] Current step:', this.currentStep, 'Total steps:', this.steps.length);
      console.log('[handleCodePassed] Is final step?', this.currentStep === this.steps.length);
      // Force UI update immediately so button appears
      this.cdr.detectChanges();
    }
    
    // Get the actual step data to find its widget position
    const currentStepData = this.steps[this.currentStep - 1];
    const widgetPosition = currentStepData?.widgetPosition || currentStepData?.id || this.currentStep;
    
    // Check if we've already shown feedback for this step
    if (this.shownFeedbackForSteps.has(widgetPosition)) {
      console.log('Feedback already shown for this step, skipping feedback modals but step is marked complete');
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
   * Handle lab completion - show summary with analytics
   */
  handleCompleteLab(): void {
    console.log('[LabTemplate] Lab completion triggered');
    console.log('[LabTemplate] Current session:', this.currentSession);
    console.log('[LabTemplate] Completed steps:', this.completedSteps);
    console.log('[LabTemplate] Total steps:', this.steps.length);
    console.log('[LabTemplate] Lab data:', this.labData);
    
    // Complete the module session
    this.completeModuleSession();
    
    // Show the completion summary
    this.showCompletionSummary = true;
    console.log('[LabTemplate] showCompletionSummary set to:', this.showCompletionSummary);
    
    this.cdr.detectChanges();
    console.log('[LabTemplate] Change detection triggered');
  }

  /**
   * Calculate completion percentage based on completed steps
   */
  getCompletionPercent(): number {
    if (!this.steps.length) return 100;
    return Math.round((this.completedSteps.length / this.steps.length) * 100);
  }

  /**
   * Get lab time spent in minutes
   */
  getLabTimeSpent(): number {
    if (!this.sessionStartTime) return 0;
    const timeSpentSeconds = Math.floor((Date.now() - this.sessionStartTime) / 1000);
    return Math.round(timeSpentSeconds / 60);
  }

  /**
   * Get lab score (based on completion and quiz performance)
   */
  getLabScore(): number {
    const completionScore = this.getCompletionPercent() / 100;
    
    // If there are no quiz questions, just return completion score
    if (this.quizResults.size === 0) {
      return completionScore;
    }
    
    // Calculate quiz score based on correct answers and attempts
    let quizScore = 0;
    let totalQuizWeight = 0;
    
    this.quizResults.forEach((result, stepNumber) => {
      totalQuizWeight += 1;
      
      if (result.correct) {
        // Award full points for first attempt, reduce for multiple attempts
        if (result.attempts === 1) {
          quizScore += 1.0;
        } else if (result.attempts === 2) {
          quizScore += 0.75;
        } else if (result.attempts === 3) {
          quizScore += 0.5;
        } else {
          quizScore += 0.25;
        }
      }
      // No points if incorrect
    });
    
    // Average the quiz score
    const averageQuizScore = totalQuizWeight > 0 ? quizScore / totalQuizWeight : 1;
    
    // Weighted average: 50% completion, 50% quiz performance
    const finalScore = (completionScore * 0.5) + (averageQuizScore * 0.5);
    
    console.log('[getLabScore] Completion:', completionScore, 'Quiz:', averageQuizScore, 'Final:', finalScore);
    
    return finalScore;
  }

  /**
   * Handle next lab selection from summary
   */
  handleNextLabSelect(labId: string): void {
    console.log('[LabTemplate] Next lab selected:', labId);
    this.showCompletionSummary = false;
    this.router.navigate(['/labs', labId]);
  }

  /**
   * Handle share achievement
   */
  handleShareAchievement(): void {
    console.log('[LabTemplate] Share achievement clicked');
    // TODO: Implement sharing functionality
    alert('Share functionality coming soon!');
  }

  /**
   * TrackBy function to force component recreation when step changes
   */
  trackByStep(index: number, step: number): number {
    return step; // Return the step number as the unique identifier
  }

  /**
   * Get step prompt widget for current step
   */
  getStepPromptWidget(): any {
    const currentStepData = this.steps[this.currentStep - 1];
    const widgetPosition = currentStepData?.widgetPosition || currentStepData?.id || this.currentStep;
    
    return this.allStepPromptWidgets.find(w => w.metadata?.stepId === this.currentStep) ||
           this.allStepPromptWidgets.find(w => w.metadata?.position === widgetPosition) ||
           this.allStepPromptWidgets.find(w => w.metadata?.position === this.currentStep);
  }

  /**
   * Get step prompt title
   */
  getStepPromptTitle(): string {
    const widget = this.getStepPromptWidget();
    const config = widget?.config || widget?.props || {};
    return config.title || '';
  }

  /**
   * Get step prompt text
   */
  getStepPromptText(): string {
    const widget = this.getStepPromptWidget();
    const config = widget?.config || widget?.props || {};
    return config.prompt || config.text || '';
  }

  /**
   * Get step prompt difficulty
   */
  getStepPromptDifficulty(): number {
    const widget = this.getStepPromptWidget();
    return widget?.metadata?.difficulty || 2;
  }

  /**
   * Get step prompt estimated time
   */
  getStepPromptEstimatedTime(): number | undefined {
    const widget = this.getStepPromptWidget();
    const config = widget?.config || widget?.props || {};
    return config.estimatedTime;
  }

   /**
   * Transform module-format multiple choice options to component format
   */
  getMultipleChoiceOptions(configOrWidget: any): any[] {
    // Handle both widget object and direct config object
    const config = configOrWidget?.config || configOrWidget?.props || configOrWidget;
    
    if (!config || !config.options) {
      console.warn('No options found in multiple choice config:', configOrWidget);
      return [];
    }
    
    const options = config.options;
    const explanation = config.explanation || '';
    
    // Determine which answers are correct
    let correctIndices: number[] = [];
    let correctIds: string[] = [];
    
    // Handle correctAnswers as array of indices
    if (Array.isArray(config.correctAnswers)) {
      if (typeof config.correctAnswers[0] === 'number') {
        correctIndices = config.correctAnswers;
      } else {
        correctIds = config.correctAnswers;
      }
    }
    // Handle correctAnswer (single or array)
    else if (config.correctAnswer !== undefined) {
      if (Array.isArray(config.correctAnswer)) {
        if (typeof config.correctAnswer[0] === 'number') {
          correctIndices = config.correctAnswer;
        } else {
          correctIds = config.correctAnswer;
        }
      } else if (typeof config.correctAnswer === 'number') {
        correctIndices = [config.correctAnswer];
      } else {
        correctIds = [config.correctAnswer];
      }
    }
    
    console.log('[getMultipleChoiceOptions] Correct indices:', correctIndices);
    console.log('[getMultipleChoiceOptions] Correct IDs:', correctIds);
    
    // Handle two different option formats:
    // 1. Array of strings: ["option1", "option2", "option3"]
    // 2. Array of objects: [{id: "a", text: "option1"}, ...]
    
    if (typeof options[0] === 'string') {
      // Format 1: Simple string array
      return options.map((option: string, index: number) => {
        const isCorrect = correctIndices.includes(index);
        return {
          id: `option-${index}`,
          label: option,
          value: `option-${index}`,
          rationale: isCorrect ? explanation : undefined,
          isCorrect: isCorrect
        };
      });
    } else {
      // Format 2: Object array with id and text
      return options.map((option: any, index: number) => {
        const optionId = option.id || `option-${index}`;
        const optionText = option.text || option.label || option.value || '';
        const isCorrect = correctIds.includes(optionId) || correctIndices.includes(index);
        
        return {
          id: optionId,
          label: optionText,
          value: optionId,
          rationale: isCorrect ? explanation : undefined,
          isCorrect: isCorrect
        };
      });
    }
  }

  /**
   * Transform module-format correct answer (index or array or IDs) to component format (array of IDs)
   */
  getMultipleChoiceCorrectAnswers(configOrWidget: any): string[] {
    // Handle both widget object and direct config object
    const config = configOrWidget?.config || configOrWidget?.props || configOrWidget;
    
    if (!config) {
      console.warn('No config found in multiple choice config:', configOrWidget);
      return [];
    }
    
    // Handle array of correct answers
    if (Array.isArray(config.correctAnswers)) {
      // If they're numbers (indices), convert to option-N format
      if (typeof config.correctAnswers[0] === 'number') {
        return config.correctAnswers.map((index: number) => `option-${index}`);
      }
      // If they're strings (IDs), return as-is
      return config.correctAnswers;
    }
    
    // Handle single or array in correctAnswer field
    if (config.correctAnswer !== undefined) {
      if (Array.isArray(config.correctAnswer)) {
        // Array of answers
        if (typeof config.correctAnswer[0] === 'number') {
          return config.correctAnswer.map((index: number) => `option-${index}`);
        }
        return config.correctAnswer;
      } else {
        // Single answer
        if (typeof config.correctAnswer === 'number') {
          return [`option-${config.correctAnswer}`];
        }
        return [config.correctAnswer];
      }
    }
    
    console.warn('No correctAnswer or correctAnswers found in config:', config);
    return [];
  }

  /**
   * Get selection mode for multiple choice (single or multiple)
   */
  getMultipleChoiceSelectionMode(configOrWidget: any): 'single' | 'multiple' {
    const config = configOrWidget?.config || configOrWidget?.props || configOrWidget;
    
    console.log('[getMultipleChoiceSelectionMode] Config:', config);
    
    // Check if multiple correct answers exist in correctAnswers array
    if (config?.correctAnswers && Array.isArray(config.correctAnswers) && config.correctAnswers.length > 1) {
      console.log('[getMultipleChoiceSelectionMode] Multiple correct answers detected:', config.correctAnswers);
      return 'multiple';
    }
    
    // Check if correctAnswer is an array with multiple items
    if (config?.correctAnswer && Array.isArray(config.correctAnswer) && config.correctAnswer.length > 1) {
      console.log('[getMultipleChoiceSelectionMode] Multiple correct answers in correctAnswer array:', config.correctAnswer);
      return 'multiple';
    }
    
    // Check explicit allowMultiple flag
    if (config?.allowMultiple === true || config?.selectionMode === 'multiple') {
      console.log('[getMultipleChoiceSelectionMode] Explicit multiple selection mode');
      return 'multiple';
    }
    
    console.log('[getMultipleChoiceSelectionMode] Single selection mode');
    return 'single';
  }

  /**
   * Handle multiple choice submission with scoring
   */
  handleMultipleChoiceSubmitted(event: { selected: string[]; correct: boolean }): void {
    console.log('[handleMultipleChoiceSubmitted] Event:', event);
    
    // Track the result for this step
    const existingResult = this.quizResults.get(this.currentStep);
    const attempts = existingResult ? existingResult.attempts + 1 : 1;
    
    this.quizResults.set(this.currentStep, {
      correct: event.correct,
      attempts: attempts
    });
    
    console.log('[handleMultipleChoiceSubmitted] Quiz results:', Array.from(this.quizResults.entries()));
    
    // Only mark step as complete if answer is correct
    if (event.correct) {
      this.handleCodePassed();
    } else {
      console.log('[handleMultipleChoiceSubmitted] Incorrect answer, not marking step complete');
    }
  }
}
