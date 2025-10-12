import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { takeUntil } from 'rxjs/operators';
import { BehaviorSubject } from 'rxjs';
import { ModuleContainerComponent } from '../../components/modules/module-container/module-container';
import { ModuleDefinition } from '../../types/widget.types';

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
    TextEditorComponent
  ],
  template: `
    <div class="widget-lab">
      <div class="lab-header">
        <h1>Widget System Demo Lab</h1>
        <p class="lab-description">
          This demo showcases the Prismo widget system with reusable, 
          atomic learning interactions that can be composed into modules and labs.
        </p>
      </div>
      
      <div class="lab-content">
        <!-- Module Selection -->
        <div class="module-selection" *ngIf="!selectedModule">
          <h2>Choose a Module to Explore</h2>
          <div class="module-options">
            <div 
              class="module-option"
              (click)="loadModule('example-coding-module')"
            >
              <div class="module-card">
                <div class="module-icon">💻</div>
                <h3>JavaScript Functions</h3>
                <p>Learn JavaScript functions through interactive coding exercises</p>
                <div class="module-meta">
                  <span class="module-duration">~30 min</span>
                  <span class="module-difficulty">Medium</span>
                </div>
              </div>
            </div>
            
            <div 
              class="module-option"
              (click)="loadModule('individual-widgets')"
            >
              <div class="module-card">
                <div class="module-icon">🧩</div>
                <h3>Individual Widgets</h3>
                <p>Explore individual widgets in isolation</p>
                <div class="module-meta">
                  <span class="module-duration">~15 min</span>
                  <span class="module-difficulty">Easy</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Module Container -->
        <div class="module-container" *ngIf="selectedModule && moduleDefinition">
          <app-module-container 
            [moduleDefinition]="moduleDefinition"
          ></app-module-container>
        </div>
        
        <!-- Individual Widgets Demo -->
        <div class="individual-widgets" *ngIf="selectedModule === 'individual-widgets'">
          <h2>Individual Widgets Demo</h2>
          <p class="demo-description">
            Here you can test individual widgets in isolation. Each widget 
            manages its own state and reports back to the parent system.
          </p>
          
          <div class="widgets-grid">
            <!-- Core Widgets -->
            <div class="widget-demo">
              <h3>Step Prompt</h3>
              <app-step-prompt
                [metadata]="stepPromptMetadata"
                [config]="stepPromptConfig"
              ></app-step-prompt>
            </div>
            
            <div class="widget-demo">
              <h3>Hint Panel</h3>
              <app-hint-panel
                [metadata]="hintPanelMetadata"
                [config]="hintPanelConfig"
              ></app-hint-panel>
            </div>
            
            <div class="widget-demo">
              <h3>Feedback Box</h3>
              <app-feedback-box
                [metadata]="feedbackBoxMetadata"
                [config]="feedbackBoxConfig"
              ></app-feedback-box>
            </div>
            
            <div class="widget-demo">
              <h3>Confidence Meter</h3>
              <app-confidence-meter
                [metadata]="confidenceMeterMetadata"
                [config]="confidenceMeterConfig"
              ></app-confidence-meter>
            </div>
            
            <!-- Category Widgets -->
            <div class="widget-demo">
              <h3>Code Editor</h3>
              <app-code-editor
                [metadata]="codeEditorMetadata"
                [config]="codeEditorConfig"
              ></app-code-editor>
            </div>
            
            <div class="widget-demo">
              <h3>Equation Input</h3>
              <app-equation-input
                [metadata]="equationInputMetadata"
                [config]="equationInputConfig"
              ></app-equation-input>
            </div>
            
            <div class="widget-demo">
              <h3>Text Editor</h3>
              <app-text-editor
                [metadata]="textEditorMetadata"
                [config]="textEditorConfig"
              ></app-text-editor>
            </div>
          </div>
        </div>
        
        <!-- Back Button -->
        <div class="lab-actions" *ngIf="selectedModule">
          <button 
            class="back-button"
            (click)="goBack()"
          >
            ← Back to Module Selection
          </button>
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
    type: 'success',
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
    inputLabel: 'Enter a simple equation:',
    placeholder: 'e.g., x^2 + 2x + 1',
    formatHint: 'Use LaTeX notation'
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
