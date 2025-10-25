import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { takeUntil } from 'rxjs/operators';
import { BehaviorSubject } from 'rxjs';
import { CardComponent } from '../../../components/ui/card/card';
import { CardHeaderComponent } from '../../../components/ui/card/card-header';
import { CardContentComponent } from '../../../components/ui/card/card-content';
import { CardFooterComponent } from '../../../components/ui/card/card-footer';
import { ButtonComponent } from '../../../components/ui/button/button';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucideCode, lucidePlay, lucideCircleCheck, lucideLightbulb, lucideArrowLeft } from '@ng-icons/lucide';

// Import coding widgets
import { CodeEditorComponent } from '../../../components/widgets/coding/code-editor/code-editor';
import { ConsoleOutputComponent } from '../../../components/widgets/coding/console-output/console-output';
import { TestFeedbackComponent } from '../../../components/widgets/coding/test-feedback/test-feedback';
import { StepPromptComponent } from '../../../components/widgets/core/step-prompt/step-prompt';
import { HintPanelComponent } from '../../../components/widgets/core/hint-panel/hint-panel';
import { FeedbackBoxComponent } from '../../../components/widgets/core/feedback-box/feedback-box';
import { ConfidenceMeterComponent } from '../../../components/widgets/core/confidence-meter/confidence-meter';

@Component({
  selector: 'app-demo-lab',
  standalone: true,
  imports: [
    CommonModule,
    CodeEditorComponent,
    ConsoleOutputComponent,
    TestFeedbackComponent,
    StepPromptComponent,
    HintPanelComponent,
    FeedbackBoxComponent,
    ConfidenceMeterComponent,
    CardComponent,
    CardHeaderComponent,
    CardContentComponent,
    CardFooterComponent,
    ButtonComponent,
    NgIconComponent
  ],
  providers: [
    provideIcons({
      lucideCode,
      lucidePlay,
      lucideCircleCheck,
      lucideLightbulb,
      lucideArrowLeft
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
        
        <div class="text-center space-y-4">
          <div class="flex items-center justify-center gap-3">
            <div class="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
              <ng-icon name="lucideCode" class="h-6 w-6"></ng-icon>
            </div>
            <h1 class="text-4xl font-bold text-foreground">JavaScript Functions Demo Lab</h1>
          </div>
          <p class="text-lg text-muted-foreground max-w-3xl mx-auto">
            Learn JavaScript functions through interactive coding exercises with real-time feedback, 
            testing, and progressive difficulty. This demo showcases the Prismo coding widget system.
          </p>
        </div>
      </div>

      <!-- Lab Content -->
      <div class="max-w-6xl mx-auto space-y-8">
        
        <!-- Step 1: Introduction -->
        <app-card>
          <app-card-header>
            <div class="flex items-center gap-3">
              <div class="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 text-sm font-semibold">
                1
              </div>
              <h2 class="text-xl font-semibold text-foreground">Introduction to Functions</h2>
            </div>
          </app-card-header>
          <app-card-content>
            <app-step-prompt
              [metadata]="stepPromptMetadata"
              [title]="'Understanding JavaScript Functions'"
              [prompt]="'Functions are reusable blocks of code that perform specific tasks. In JavaScript, you can create functions using the function keyword or arrow functions. Let\\'s start with a simple example.'"
              [estimatedTime]="120"
            ></app-step-prompt>
          </app-card-content>
        </app-card>

        <!-- Step 2: Code Editor Exercise -->
        <app-card>
          <app-card-header>
            <div class="flex items-center gap-3">
              <div class="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400 text-sm font-semibold">
                2
              </div>
              <h2 class="text-xl font-semibold text-foreground">Write Your First Function</h2>
            </div>
          </app-card-header>
          <app-card-content>
            <div class="space-y-6">
              <p class="text-muted-foreground">
                Create a function called <code class="bg-muted px-2 py-1 rounded">greet</code> that takes a name parameter 
                and returns a greeting message. The function should return "Hello, [name]!".
              </p>
              
              <div class="grid gap-6 lg:grid-cols-2">
                <!-- Code Editor -->
                <div>
                  <h3 class="text-lg font-semibold text-foreground mb-3">Code Editor</h3>
                  <app-code-editor
                    [metadata]="codeEditorMetadata"
                    [config]="codeEditorConfig"
                    [width]="'100%'"
                    [height]="'300px'"
                    [minHeight]="'250px'"
                    [enableSyntaxHighlighting]="true"
                    [enableAutoCompletion]="true"
                    [enableLineNumbers]="true"
                    [enableBracketMatching]="true"
                    [enableCodeFolding]="true"
                    [enableSearch]="true"
                    [enableIndentation]="true"
                    [enableWordWrap]="false"
                    [enableMinimap]="false"
                    [allowUserSettings]="true"
                    [showSettingsPanel]="true"
                  ></app-code-editor>
                </div>

                <!-- Console Output -->
                <div>
                  <h3 class="text-lg font-semibold text-foreground mb-3">Console Output</h3>
                  <app-console-output
                    [metadata]="consoleOutputMetadata"
                    [config]="consoleOutputConfig"
                  ></app-console-output>
                </div>
              </div>

              <!-- Test Feedback -->
              <div>
                <h3 class="text-lg font-semibold text-foreground mb-3">Test Results</h3>
                <app-test-feedback
                  [metadata]="testFeedbackMetadata"
                  [config]="testFeedbackConfig"
                ></app-test-feedback>
              </div>
            </div>
          </app-card-content>
        </app-card>

        <!-- Step 3: Advanced Exercise -->
        <app-card>
          <app-card-header>
            <div class="flex items-center gap-3">
              <div class="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400 text-sm font-semibold">
                3
              </div>
              <h2 class="text-xl font-semibold text-foreground">Advanced Function Practice</h2>
            </div>
          </app-card-header>
          <app-card-content>
            <div class="space-y-6">
              <p class="text-muted-foreground">
                Now let's create a more complex function. Write a function called <code class="bg-muted px-2 py-1 rounded">calculateArea</code> 
                that takes width and height parameters and returns the area of a rectangle.
              </p>

              <!-- Hint Panel -->
              <div>
                <h3 class="text-lg font-semibold text-foreground mb-3">Need Help?</h3>
                <app-hint-panel
                  [metadata]="hintPanelMetadata"
                  [config]="hintPanelConfig"
                ></app-hint-panel>
              </div>

              <div class="grid gap-6 lg:grid-cols-2">
                <!-- Advanced Code Editor -->
                <div>
                  <h3 class="text-lg font-semibold text-foreground mb-3">Advanced Code Editor</h3>
                  <app-code-editor
                    [metadata]="advancedCodeEditorMetadata"
                    [config]="advancedCodeEditorConfig"
                    [width]="'100%'"
                    [height]="'350px'"
                    [minHeight]="'300px'"
                    [enableSyntaxHighlighting]="true"
                    [enableAutoCompletion]="true"
                    [enableLineNumbers]="true"
                    [enableBracketMatching]="true"
                    [enableCodeFolding]="true"
                    [enableSearch]="true"
                    [enableIndentation]="true"
                    [enableWordWrap]="false"
                    [enableMinimap]="true"
                    [allowUserSettings]="true"
                    [showSettingsPanel]="true"
                  ></app-code-editor>
                </div>

                <!-- Advanced Console Output -->
                <div>
                  <h3 class="text-lg font-semibold text-foreground mb-3">Test Your Function</h3>
                  <app-console-output
                    [metadata]="advancedConsoleOutputMetadata"
                    [config]="advancedConsoleOutputConfig"
                  ></app-console-output>
                </div>
              </div>

              <!-- Advanced Test Feedback -->
              <div>
                <h3 class="text-lg font-semibold text-foreground mb-3">Advanced Test Results</h3>
                <app-test-feedback
                  [metadata]="advancedTestFeedbackMetadata"
                  [config]="advancedTestFeedbackConfig"
                ></app-test-feedback>
              </div>
            </div>
          </app-card-content>
        </app-card>

        <!-- Step 4: Reflection and Feedback -->
        <app-card>
          <app-card-header>
            <div class="flex items-center gap-3">
              <div class="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400 text-sm font-semibold">
                4
              </div>
              <h2 class="text-xl font-semibold text-foreground">Reflection & Feedback</h2>
            </div>
          </app-card-header>
          <app-card-content>
            <div class="space-y-6">
              <p class="text-muted-foreground">
                How confident are you with JavaScript functions? Rate your understanding and get personalized feedback.
              </p>

              <div class="grid gap-6 lg:grid-cols-2">
                <!-- Confidence Meter -->
                <div>
                  <h3 class="text-lg font-semibold text-foreground mb-3">Self-Assessment</h3>
                  <app-confidence-meter
                    [metadata]="confidenceMeterMetadata"
                    [config]="confidenceMeterConfig"
                  ></app-confidence-meter>
                </div>

                <!-- Feedback Box -->
                <div>
                  <h3 class="text-lg font-semibold text-foreground mb-3">Learning Feedback</h3>
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
              </div>
            </div>
          </app-card-content>
        </app-card>

        <!-- Completion Summary -->
        <app-card>
          <app-card-header>
            <div class="flex items-center gap-3">
              <ng-icon name="lucideCircleCheck" class="h-6 w-6 text-green-600"></ng-icon>
              <h2 class="text-xl font-semibold text-foreground">Lab Complete!</h2>
            </div>
          </app-card-header>
          <app-card-content>
            <div class="space-y-4">
              <p class="text-muted-foreground">
                Congratulations! You've completed the JavaScript Functions Demo Lab. You've learned about:
              </p>
              <ul class="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Creating basic JavaScript functions</li>
                <li>Using parameters and return values</li>
                <li>Testing your code with console output</li>
                <li>Getting real-time feedback on your solutions</li>
                <li>Using hints when you need help</li>
              </ul>
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
export class DemoLabComponent implements OnInit, OnDestroy {
  private destroy$ = new BehaviorSubject<void>(void 0);

  // Widget metadata and configurations
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
    title: 'Write Your Function',
    language: 'javascript',
    starterCode: '// Write your greet function here\nfunction greet(name) {\n  // Your code goes here\n}\n\n// Test your function\nconsole.log(greet("World"));',
    placeholder: 'Write your function here...',
    width: '100%',
    height: '300px',
    minHeight: '250px',
    enableSyntaxHighlighting: true,
    enableAutoCompletion: true,
    enableLineNumbers: true,
    enableBracketMatching: true,
    enableCodeFolding: true,
    enableSearch: true,
    enableIndentation: true,
    enableWordWrap: false,
    enableMinimap: false,
    allowUserSettings: true,
    showSettingsPanel: true
  };

  public consoleOutputMetadata = {
    id: 'console-output',
    title: 'Console Output',
    description: 'Displays code execution results',
    skills: ['debugging'],
    difficulty: 2,
    estimated_time: 30,
    input_type: 'code' as any,
    output_type: 'execution_result' as any,
    dependencies: [],
    adaptive_hooks: {},
    version: '1.0.0',
    category: 'coding' as any
  };

  public consoleOutputConfig = {
    title: 'Console Output',
    placeholder: 'Run your code to see output here...',
    showTimestamp: true,
    maxLines: 50
  };

  public testFeedbackMetadata = {
    id: 'test-feedback',
    title: 'Test Feedback',
    description: 'Shows test results and feedback',
    skills: ['testing'],
    difficulty: 3,
    estimated_time: 60,
    input_type: 'code' as any,
    output_type: 'feedback' as any,
    dependencies: [],
    adaptive_hooks: {},
    version: '1.0.0',
    category: 'coding' as any
  };

  public testFeedbackConfig = {
    title: 'Function Tests',
    tests: [
      {
        id: 'test-1',
        description: 'Function should return greeting with name',
        status: 'pending' as 'pending' | 'pass' | 'fail',
        expected: 'Hello, World!',
        actual: ''
      },
      {
        id: 'test-2',
        description: 'Function should handle different names',
        status: 'pending' as 'pending' | 'pass' | 'fail',
        expected: 'Hello, Alice!',
        actual: ''
      }
    ],
    showDetails: true
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
        text: 'Remember: area = width × height',
        revealed: false
      },
      {
        id: 'hint-2',
        tier: 2,
        text: 'Use the multiplication operator (*) to calculate the area',
        revealed: false
      },
      {
        id: 'hint-3',
        tier: 3,
        text: 'Your function should look like: function calculateArea(width, height) { return width * height; }',
        revealed: false
      }
    ],
    maxHintsPerTier: 1
  };

  public advancedCodeEditorMetadata = {
    id: 'advanced-code-editor',
    title: 'Advanced Code Editor',
    description: 'Enhanced code editor with more features',
    skills: ['programming'],
    difficulty: 4,
    estimated_time: 300,
    input_type: 'code' as any,
    output_type: 'visualization' as any,
    dependencies: [],
    adaptive_hooks: {},
    version: '1.0.0',
    category: 'coding' as any
  };

  public advancedCodeEditorConfig = {
    title: 'Advanced Function Practice',
    language: 'javascript',
    starterCode: '// Write your calculateArea function here\nfunction calculateArea(width, height) {\n  // Your code goes here\n}\n\n// Test your function\nconsole.log(calculateArea(5, 3)); // Should output 15\nconsole.log(calculateArea(10, 4)); // Should output 40',
    placeholder: 'Write your function here...',
    width: '100%',
    height: '350px',
    minHeight: '300px',
    enableSyntaxHighlighting: true,
    enableAutoCompletion: true,
    enableLineNumbers: true,
    enableBracketMatching: true,
    enableCodeFolding: true,
    enableSearch: true,
    enableIndentation: true,
    enableWordWrap: false,
    enableMinimap: true,
    allowUserSettings: true,
    showSettingsPanel: true
  };

  public advancedConsoleOutputMetadata = {
    id: 'advanced-console-output',
    title: 'Advanced Console Output',
    description: 'Enhanced console output display',
    skills: ['debugging'],
    difficulty: 3,
    estimated_time: 30,
    input_type: 'code' as any,
    output_type: 'execution_result' as any,
    dependencies: [],
    adaptive_hooks: {},
    version: '1.0.0',
    category: 'coding' as any
  };

  public advancedConsoleOutputConfig = {
    title: 'Advanced Console Output',
    placeholder: 'Run your advanced function to see results...',
    showTimestamp: true,
    maxLines: 100
  };

  public advancedTestFeedbackMetadata = {
    id: 'advanced-test-feedback',
    title: 'Advanced Test Feedback',
    description: 'Comprehensive test results',
    skills: ['testing'],
    difficulty: 4,
    estimated_time: 90,
    input_type: 'code' as any,
    output_type: 'feedback' as any,
    dependencies: [],
    adaptive_hooks: {},
    version: '1.0.0',
    category: 'coding' as any
  };

  public advancedTestFeedbackConfig = {
    title: 'Advanced Function Tests',
    tests: [
      {
        id: 'test-1',
        description: 'Function should calculate area correctly',
        status: 'pending' as 'pending' | 'pass' | 'fail',
        expected: '15',
        actual: ''
      },
      {
        id: 'test-2',
        description: 'Function should handle different dimensions',
        status: 'pending' as 'pending' | 'pass' | 'fail',
        expected: '40',
        actual: ''
      },
      {
        id: 'test-3',
        description: 'Function should handle edge cases',
        status: 'pending' as 'pending' | 'pass' | 'fail',
        expected: '0',
        actual: ''
      }
    ],
    showDetails: true
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
    description: 'How confident are you with JavaScript functions?',
    scaleLabels: ['Not at all', 'Slightly', 'Moderately', 'Very well', 'Completely']
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
    title: 'Great Progress!',
    message: 'You\'ve successfully completed the JavaScript Functions Demo Lab.',
    explanation: 'You\'ve learned the fundamentals of JavaScript functions, including how to create them, use parameters, and return values. This foundation will help you in more advanced programming concepts.',
    nextSteps: ['Try more complex functions', 'Explore arrow functions', 'Learn about function scope'],
    showContinueButton: true
  };

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    // Component initialization
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  goBack(): void {
    // Navigate back to labs page
    window.history.back();
  }

  restartLab(): void {
    // Restart the lab - reload the page
    window.location.reload();
  }
}
