import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { takeUntil } from 'rxjs/operators';
import { BehaviorSubject } from 'rxjs';
import { ModuleContainerComponent } from '../../components/modules/module-container/module-container';
import { ModuleDefinition } from '../../types/widget.types';
import { CardComponent } from '../../components/ui/card/card';
import { CardHeaderComponent } from '../../components/ui/card/card-header';
import { CardContentComponent } from '../../components/ui/card/card-content';
import { CardFooterComponent } from '../../components/ui/card/card-footer';
import { ButtonComponent } from '../../components/ui/button/button';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucideLaptop, lucideStar, lucideArrowLeft, lucidePlay } from '@ng-icons/lucide';

// Import individual widgets for demo
import { StepPromptComponent } from '../../components/widgets/core/step-prompt/step-prompt';
import { HintPanelComponent } from '../../components/widgets/core/hint-panel/hint-panel';
import { FeedbackBoxComponent } from '../../components/widgets/core/feedback-box/feedback-box';
import { ConfidenceMeterComponent } from '../../components/widgets/core/confidence-meter/confidence-meter';
import { CodeEditorComponent } from '../../components/widgets/coding/code-editor/code-editor';
import { EquationInputComponent } from '../../components/widgets/math/equation-input/equation-input';
import { TextEditorComponent } from '../../components/widgets/writing/text-editor/text-editor';

@Component({
  selector: 'app-widget-lab',
  standalone: true,
  imports: [
    CommonModule,
    ModuleContainerComponent,
    StepPromptComponent,
    HintPanelComponent,
    FeedbackBoxComponent,
    ConfidenceMeterComponent,
    CodeEditorComponent,
    EquationInputComponent,
    TextEditorComponent,
    CardComponent,
    CardHeaderComponent,
    CardContentComponent,
    CardFooterComponent,
    ButtonComponent,
    NgIconComponent
  ],
  providers: [
    provideIcons({
      lucideLaptop,
      lucideStar,
      lucideArrowLeft,
      lucidePlay
    })
  ],
  template: `
    <div class="min-h-screen bg-background p-6">
      <!-- Header -->
      <div class="max-w-4xl mx-auto mb-8">
        <div class="text-center space-y-4">
          <h1 class="text-4xl font-bold text-foreground">Widget System Demo Lab</h1>
          <p class="text-lg text-muted-foreground max-w-2xl mx-auto">
            This demo showcases the Prismo widget system with reusable,
            atomic learning interactions that can be composed into modules and labs.
          </p>
        </div>
      </div>

      <!-- Module Selection -->
      <div class="max-w-4xl mx-auto" *ngIf="!selectedModule">
        <h2 class="text-2xl font-semibold text-foreground mb-6 text-center">Choose a Module to Explore</h2>
        <div class="grid gap-6 md:grid-cols-2">
          <!-- JavaScript Functions Module -->
          <app-card
            className="group cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02]"
            (click)="loadModule('example-coding-module')"
          >
            <app-card-header>
              <div class="flex items-center gap-4">
                <div class="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                  <ng-icon name="lucideLaptop" class="h-6 w-6"></ng-icon>
                </div>
                <div>
                  <h3 class="text-xl font-semibold text-foreground">JavaScript Functions</h3>
                  <p class="text-sm text-muted-foreground">Interactive coding exercises</p>
                </div>
              </div>
            </app-card-header>
            <app-card-content>
              <p class="text-muted-foreground leading-relaxed">
                Learn JavaScript functions through interactive coding exercises with real-time feedback and progressive difficulty.
              </p>
            </app-card-content>
            <app-card-footer>
              <div class="flex items-center justify-between w-full">
                <span class="text-sm text-muted-foreground">~30 min • Medium</span>
                <app-button variant="default" size="sm">
                  <ng-icon name="lucidePlay" class="w-4 h-4 mr-2"></ng-icon>
                  Start Module
                </app-button>
              </div>
            </app-card-footer>
          </app-card>

          <!-- Individual Widgets Module -->
          <app-card
            className="group cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02]"
            (click)="loadModule('individual-widgets')"
          >
            <app-card-header>
              <div class="flex items-center gap-4">
                <div class="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400">
                  <ng-icon name="lucideStar" class="h-6 w-6"></ng-icon>
                </div>
                <div>
                  <h3 class="text-xl font-semibold text-foreground">Individual Widgets</h3>
                  <p class="text-sm text-muted-foreground">Widget showcase</p>
                </div>
              </div>
            </app-card-header>
            <app-card-content>
              <p class="text-muted-foreground leading-relaxed">
                Explore individual widgets in isolation to understand their capabilities and use cases.
              </p>
            </app-card-content>
            <app-card-footer>
              <div class="flex items-center justify-between w-full">
                <span class="text-sm text-muted-foreground">~15 min • Easy</span>
                <app-button variant="default" size="sm">
                  <ng-icon name="lucidePlay" class="w-4 h-4 mr-2"></ng-icon>
                  Explore Widgets
                </app-button>
              </div>
            </app-card-footer>
          </app-card>
        </div>
      </div>

      <!-- Module Container -->
      <div class="max-w-6xl mx-auto" *ngIf="selectedModule && moduleDefinition">
        <div class="mb-6">
          <app-button variant="outline" size="sm" (click)="goBack()" class="mb-4">
            <ng-icon name="lucideArrowLeft" class="w-4 h-4 mr-2"></ng-icon>
            Back to Modules
          </app-button>
        </div>
        <app-module-container
          [moduleDefinition]="moduleDefinition"
        ></app-module-container>
      </div>

      <!-- Individual Widgets Demo -->
      <div class="max-w-6xl mx-auto" *ngIf="selectedModule === 'individual-widgets'">
        <div class="mb-6">
          <app-button variant="outline" size="sm" (click)="goBack()" class="mb-4">
            <ng-icon name="lucideArrowLeft" class="w-4 h-4 mr-2"></ng-icon>
            Back to Modules
          </app-button>
          <h2 class="text-3xl font-bold text-foreground mb-4">Individual Widgets Demo</h2>
          <p class="text-lg text-muted-foreground mb-8">
            Here you can test individual widgets in isolation. Each widget
            manages its own state and reports back to the parent system.
          </p>
        </div>

        <div class="grid gap-8 lg:grid-cols-2">
          <!-- Core Widgets -->
          <div class="space-y-6">
            <div>
              <h3 class="text-lg font-semibold text-foreground mb-3">Step Prompt</h3>
              <app-step-prompt
                [metadata]="stepPromptMetadata"
                [title]="stepPromptConfig.title"
                [prompt]="stepPromptConfig.prompt"
                [estimatedTime]="stepPromptConfig.estimatedTime"
              ></app-step-prompt>
            </div>

            <div>
              <h3 class="text-lg font-semibold text-foreground mb-3">Hint Panel</h3>
              <app-hint-panel
                [metadata]="hintPanelMetadata"
                [config]="hintPanelConfig"
              ></app-hint-panel>
            </div>

            <div>
              <h3 class="text-lg font-semibold text-foreground mb-3">Feedback Box</h3>
              <app-feedback-box
                [metadata]="feedbackBoxMetadata"
                [type]="feedbackBoxConfig.type"
                [title]="feedbackBoxConfig.title"
                [message]="feedbackBoxConfig.message"
                [explanation]="feedbackBoxConfig.explanation"
                [nextSteps]="feedbackBoxConfig.nextSteps"
                [showContinueButton]="feedbackBoxConfig.showContinueButton"
              ></app-feedback-box>
            </div>

            <div>
              <h3 class="text-lg font-semibold text-foreground mb-3">Confidence Meter</h3>
              <app-confidence-meter
                [metadata]="confidenceMeterMetadata"
                [config]="confidenceMeterConfig"
              ></app-confidence-meter>
            </div>
          </div>

          <!-- Category Widgets -->
          <div class="space-y-6">
            <div>
              <h3 class="text-lg font-semibold text-foreground mb-3">Code Editor</h3>
              <app-code-editor
                [metadata]="codeEditorMetadata"
                [config]="codeEditorConfig"
              ></app-code-editor>
            </div>

            <div>
              <h3 class="text-lg font-semibold text-foreground mb-3">Equation Input</h3>
              <app-equation-input
                [metadata]="equationInputMetadata"
                [config]="equationInputConfig"
              ></app-equation-input>
            </div>

            <div>
              <h3 class="text-lg font-semibold text-foreground mb-3">Text Editor</h3>
              <app-text-editor
                [metadata]="textEditorMetadata"
                [config]="textEditorConfig"
              ></app-text-editor>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class WidgetLabComponent implements OnInit, OnDestroy {
  public selectedModule: string | null = null;
  public moduleDefinition: ModuleDefinition | null = null;
  private destroy$ = new BehaviorSubject<void>(void 0);

  // Individual widget metadata and configs
  public stepPromptMetadata = {
    id: 'step-prompt',
    title: 'Step Prompt',
    description: 'Displays task or question text',
    skills: ['comprehension'],
    difficulty: 2,
    estimated_time: 30,
    input_type: 'text' as any,
    output_type: 'scaffold' as any,
    dependencies: [],
    adaptive_hooks: {},
    version: '1.0.0',
    category: 'core' as any
  };

  public stepPromptConfig = {
    title: 'Welcome to the Widget System!',
    prompt: 'This is a Step Prompt widget. It displays instructional text and can include media. Widgets are the atomic building blocks of the Prismo learning system.',
    estimatedTime: 30
  };

  public hintPanelMetadata = {
    id: 'hint-panel',
    title: 'Hint Panel',
    description: 'Progressive hint disclosure',
    skills: ['problem-solving'],
    difficulty: 2,
    estimated_time: 60,
    input_type: 'checkbox' as any,
    output_type: 'scaffold' as any,
    dependencies: [],
    adaptive_hooks: {},
    version: '1.0.0',
    category: 'core' as any
  };

  public hintPanelConfig = {
    hints: [
      {
        id: 'hint-1',
        tier: 1,
        text: 'This is a tier 1 hint - the most basic level of help.',
        revealed: false
      },
      {
        id: 'hint-2',
        tier: 2,
        text: 'This is a tier 2 hint - more specific guidance.',
        revealed: false
      },
      {
        id: 'hint-3',
        tier: 3,
        text: 'This is a tier 3 hint - the most detailed assistance.',
        revealed: false
      }
    ],
    maxHintsPerTier: 1
  };

  public feedbackBoxMetadata = {
    id: 'feedback-box',
    title: 'Feedback Box',
    description: 'Shows correctness and explanation',
    skills: ['reflection'],
    difficulty: 2,
    estimated_time: 45,
    input_type: 'text' as any,
    output_type: 'feedback' as any,
    dependencies: [],
    adaptive_hooks: {},
    version: '1.0.0',
    category: 'core' as any
  };

  public feedbackBoxConfig = {
    type: 'success' as 'success' | 'error' | 'warning' | 'info',
    title: 'Widget System Working!',
    message: 'The widget system is functioning correctly.',
    explanation: 'This feedback box demonstrates how widgets can provide immediate feedback to learners.',
    nextSteps: ['Try other widgets', 'Explore module composition', 'Test adaptive features'],
    showContinueButton: true
  };

  public confidenceMeterMetadata = {
    id: 'confidence-meter',
    title: 'Confidence Meter',
    description: 'Self-rating slider',
    skills: ['self-assessment'],
    difficulty: 2,
    estimated_time: 20,
    input_type: 'slider' as any,
    output_type: 'progress' as any,
    dependencies: [],
    adaptive_hooks: {},
    version: '1.0.0',
    category: 'core' as any
  };

  public confidenceMeterConfig = {
    title: 'Rate Your Understanding',
    description: 'How well do you understand the widget system?',
    scaleLabels: ['Not at all', 'Slightly', 'Moderately', 'Very well', 'Completely']
  };

  public codeEditorMetadata = {
    id: 'code-editor',
    title: 'Code Editor',
    description: 'Interactive code editor',
    skills: ['programming'],
    difficulty: 3,
    estimated_time: 300,
    input_type: 'code' as any,
    output_type: 'visualization' as any,
    dependencies: [],
    adaptive_hooks: {},
    version: '1.0.0',
    category: 'coding' as any
  };

  public codeEditorConfig = {
    title: 'Try the Code Editor',
    language: 'javascript',
    starterCode: '// Write a simple function\nfunction greet(name) {\n  return "Hello, " + name + "!";\n}\n\nconsole.log(greet("World"));',
    placeholder: 'Write your code here...'
  };

  public equationInputMetadata = {
    id: 'equation-input',
    title: 'Equation Input',
    description: 'Mathematical expression input',
    skills: ['mathematics'],
    difficulty: 3,
    estimated_time: 120,
    input_type: 'equation' as any,
    output_type: 'feedback' as any,
    dependencies: [],
    adaptive_hooks: {},
    version: '1.0.0',
    category: 'math' as any
  };

  public equationInputConfig = {
    title: 'Mathematical Expression',
    inputLabel: 'Enter a mathematical expression:',
    placeholder: 'e.g., x^2 + 2*x + 1 or a/b + c/d',
    formatHint: 'Use * for multiplication, / for fractions, ^ for powers'
  };

  public textEditorMetadata = {
    id: 'text-editor',
    title: 'Text Editor',
    description: 'Rich text input with metrics',
    skills: ['writing'],
    difficulty: 3,
    estimated_time: 180,
    input_type: 'rich-text' as any,
    output_type: 'feedback' as any,
    dependencies: [],
    adaptive_hooks: {},
    version: '1.0.0',
    category: 'writing' as any
  };

  public textEditorConfig = {
    title: 'Writing Exercise',
    inputLabel: 'Write a short paragraph:',
    placeholder: 'Describe what you learned about widgets...',
    minWords: 10,
    maxWords: 100
  };

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    // Component initialization
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  async loadModule(moduleId: string): Promise<void> {
    this.selectedModule = moduleId;

    if (moduleId === 'individual-widgets') {
      // Individual widgets mode - no module definition needed
      return;
    }

    try {
      const moduleData = await this.http.get<ModuleDefinition>(`/assets/modules/${moduleId}.json`).toPromise();
      this.moduleDefinition = moduleData || null;
    } catch (error) {
      console.error('Failed to load module:', error);
      // Handle error - could show error message to user
    }
  }

  goBack(): void {
    this.selectedModule = null;
    this.moduleDefinition = null;
  }
}
