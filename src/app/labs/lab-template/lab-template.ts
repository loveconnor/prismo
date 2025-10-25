import { Component, OnInit, OnDestroy, inject } from '@angular/core';
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

// UI Components
import { CardComponent } from '../../../components/ui/card/card';
import { CardHeaderComponent } from '../../../components/ui/card/card-header';
import { CardContentComponent } from '../../../components/ui/card/card-content';
import { CardFooterComponent } from '../../../components/ui/card/card-footer';
import { ButtonComponent } from '../../../components/ui/button/button';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucideArrowLeft, lucidePlay, lucideBookOpen, lucideLightbulb, lucideCode, lucideCircle } from '@ng-icons/lucide';

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
      lucideCircle
    })
  ],
  template: `
    <div class="min-h-screen bg-background p-6">
      <!-- Header -->
      <div class="max-w-6xl mx-auto mb-8">
        <div class="flex items-center gap-4 mb-6">
          <app-button variant="outline" size="sm" (click)="goBack()">
            <ng-icon name="lucideArrowLeft" class="w-4 h-4 mr-2"></ng-icon>
            Back to Labs
          </app-button>
        </div>
        
        <div class="text-center space-y-4" *ngIf="labData">
          <div class="flex items-center justify-center gap-3">
            <div class="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
              <ng-icon name="lucideBookOpen" class="h-6 w-6"></ng-icon>
            </div>
            <h1 class="text-4xl font-bold text-foreground">{{ labData.title }}</h1>
          </div>
          <p class="text-lg text-muted-foreground max-w-3xl mx-auto">
            {{ labData.description }}
          </p>
          <div class="flex items-center justify-center gap-4 text-sm text-muted-foreground">
            <span>Difficulty: {{ getDifficultyLabel(labData.difficulty) }}</span>
            <span>•</span>
            <span>~{{ labData.estimatedTime }} min</span>
            <span *ngIf="labData.metadata.author">•</span>
            <span *ngIf="labData.metadata.author">By {{ labData.metadata.author }}</span>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div class="max-w-6xl mx-auto" *ngIf="loading">
        <div class="text-center space-y-4">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p class="text-muted-foreground">Loading lab...</p>
        </div>
      </div>

      <!-- Error State -->
      <div class="max-w-6xl mx-auto" *ngIf="error">
        <app-card>
          <app-card-content>
            <div class="text-center space-y-4">
              <div class="text-red-500 text-4xl">⚠️</div>
              <h2 class="text-xl font-semibold text-foreground">Lab Not Found</h2>
              <p class="text-muted-foreground">{{ error }}</p>
              <app-button variant="outline" (click)="goBack()">
                <ng-icon name="lucideArrowLeft" class="w-4 h-4 mr-2"></ng-icon>
                Back to Labs
              </app-button>
            </div>
          </app-card-content>
        </app-card>
      </div>

      <!-- Lab Content -->
      <div class="max-w-6xl mx-auto space-y-8" *ngIf="labData && !loading && !error">
        <div *ngFor="let section of labData.sections; let i = index" class="space-y-6">
          <!-- Section Header -->
          <div class="flex items-center gap-3">
            <div class="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 text-sm font-semibold">
              {{ i + 1 }}
            </div>
            <h2 class="text-xl font-semibold text-foreground">{{ section.title }}</h2>
          </div>
          
          <p class="text-muted-foreground" *ngIf="section.description">{{ section.description }}</p>

          <!-- Widgets Container -->
          <div class="space-y-6" [ngClass]="getSectionLayoutClass(section.layout)">
            <div *ngFor="let widget of section.widgets" class="widget-container">
              <!-- Dynamic Widget Rendering -->
              <ng-container [ngSwitch]="widget.type">
                <!-- Step Prompt Widget -->
                <app-step-prompt
                  *ngSwitchCase="'step-prompt'"
                  [metadata]="widget.metadata"
                  [title]="widget.config.title"
                  [prompt]="widget.config.prompt"
                  [estimatedTime]="widget.config.estimatedTime"
                ></app-step-prompt>

                <!-- Hint Panel Widget -->
                <app-hint-panel
                  *ngSwitchCase="'hint-panel'"
                  [metadata]="widget.metadata"
                  [config]="widget.config"
                ></app-hint-panel>

                <!-- Feedback Box Widget -->
                <app-feedback-box
                  *ngSwitchCase="'feedback-box'"
                  [metadata]="widget.metadata"
                  [type]="widget.config.type"
                  [title]="widget.config.title"
                  [message]="widget.config.message"
                  [explanation]="widget.config.explanation"
                  [nextSteps]="widget.config.nextSteps"
                  [showContinueButton]="widget.config.showContinueButton"
                ></app-feedback-box>

                <!-- Confidence Meter Widget -->
                <app-confidence-meter
                  *ngSwitchCase="'confidence-meter'"
                  [metadata]="widget.metadata"
                  [config]="widget.config"
                ></app-confidence-meter>

                <!-- Code Editor Widget -->
                <app-code-editor
                  *ngSwitchCase="'code-editor'"
                  [metadata]="widget.metadata"
                  [config]="widget.config"
                  [width]="widget.config.width || '100%'"
                  [height]="widget.config.height || '300px'"
                  [minHeight]="widget.config.minHeight || '250px'"
                  [enableSyntaxHighlighting]="widget.config.enableSyntaxHighlighting !== false"
                  [enableAutoCompletion]="widget.config.enableAutoCompletion !== false"
                  [enableLineNumbers]="widget.config.enableLineNumbers !== false"
                  [enableBracketMatching]="widget.config.enableBracketMatching !== false"
                  [enableCodeFolding]="widget.config.enableCodeFolding !== false"
                  [enableSearch]="widget.config.enableSearch !== false"
                  [enableIndentation]="widget.config.enableIndentation !== false"
                  [enableWordWrap]="widget.config.enableWordWrap !== false"
                  [enableMinimap]="widget.config.enableMinimap !== false"
                  [allowUserSettings]="widget.config.allowUserSettings !== false"
                  [showSettingsPanel]="widget.config.showSettingsPanel !== false"
                ></app-code-editor>

                <!-- Console Output Widget -->
                <app-console-output
                  *ngSwitchCase="'console-output'"
                  [metadata]="widget.metadata"
                  [config]="widget.config"
                ></app-console-output>

                <!-- Test Feedback Widget -->
                <app-test-feedback
                  *ngSwitchCase="'test-feedback'"
                  [metadata]="widget.metadata"
                  [config]="widget.config"
                ></app-test-feedback>

                <!-- Equation Input Widget -->
                <app-equation-input
                  *ngSwitchCase="'equation-input'"
                  [metadata]="widget.metadata"
                  [config]="widget.config"
                ></app-equation-input>

                <!-- Text Editor Widget -->
                <app-text-editor
                  *ngSwitchCase="'text-editor'"
                  [metadata]="widget.metadata"
                  [config]="widget.config"
                ></app-text-editor>

                <!-- Multiple Choice Widget -->
                <app-multiple-choice
                  *ngSwitchCase="'multiple-choice'"
                  [metadata]="widget.metadata"
                  [config]="widget.config"
                ></app-multiple-choice>

                <!-- Unknown Widget Type -->
                <div *ngSwitchDefault class="p-4 border border-dashed border-muted-foreground/25 rounded-lg">
                  <p class="text-muted-foreground text-center">
                    Unknown widget type: {{ widget.type }}
                  </p>
                </div>
              </ng-container>
            </div>
          </div>
        </div>

        <!-- Lab Completion -->
        <app-card *ngIf="labData.sections.length > 0">
          <app-card-header>
            <div class="flex items-center gap-3">
              <ng-icon name="lucideCircle" class="h-6 w-6 text-green-600"></ng-icon>
              <h2 class="text-xl font-semibold text-foreground">Lab Complete!</h2>
            </div>
          </app-card-header>
          <app-card-content>
            <div class="space-y-4">
              <p class="text-muted-foreground">
                Congratulations! You've completed the {{ labData.title }} lab.
              </p>
            </div>
          </app-card-content>
          <app-card-footer>
            <div class="flex gap-3">
              <app-button variant="default" (click)="restartLab()">
                <ng-icon name="lucidePlay" class="w-4 h-4 mr-2"></ng-icon>
                Restart Lab
              </app-button>
              <app-button variant="outline" (click)="goBack()">
                Back to Labs
              </app-button>
            </div>
          </app-card-footer>
        </app-card>
      </div>
    </div>
  `,
})
export class LabTemplateComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private labDataService = inject(LabDataService);

  public labData: LabData | null = null;
  public loading = true;
  public error: string | null = null;

  constructor() {
    // Component initialization
  }

  ngOnInit(): void {
    this.loadLab();
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

    // Handle specific routes
    let actualLabId = labId;
    if (currentUrl.includes('pt01')) {
      actualLabId = 'example-coding-module';
    } else if (currentUrl.includes('javascript-array-methods')) {
      actualLabId = 'javascript-array-methods';
    }

    this.labDataService.getLab(actualLabId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (labData) => {
          this.labData = labData;
          this.loading = false;
          this.error = null;
        },
        error: (err) => {
          this.error = err.message || 'Failed to load lab';
          this.loading = false;
        }
      });
  }

  getDifficultyLabel(difficulty: number): string {
    const labels = ['Beginner', 'Easy', 'Medium', 'Hard', 'Expert'];
    return labels[difficulty - 1] || 'Unknown';
  }

  getSectionLayoutClass(layout?: string): string {
    switch (layout) {
      case 'grid':
        return 'grid gap-6 lg:grid-cols-2';
      case 'stack':
        return 'space-y-6';
      default:
        return 'space-y-6';
    }
  }

  goBack(): void {
    this.router.navigate(['/labs']);
  }

  restartLab(): void {
    // Reset any lab state if needed
    this.loadLab();
  }
}
