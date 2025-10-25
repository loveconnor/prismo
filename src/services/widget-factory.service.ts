import { Injectable, Type } from '@angular/core';

// Import all available widget components
import { StepPromptComponent } from '../components/widgets/core/step-prompt/step-prompt';
import { HintPanelComponent } from '../components/widgets/core/hint-panel/hint-panel';
import { FeedbackBoxComponent } from '../components/widgets/core/feedback-box/feedback-box';
import { ConfidenceMeterComponent } from '../components/widgets/core/confidence-meter/confidence-meter';
import { CodeEditorComponent } from '../components/widgets/coding/code-editor/code-editor';
import { ConsoleOutputComponent } from '../components/widgets/coding/console-output/console-output';
import { TestFeedbackComponent } from '../components/widgets/coding/test-feedback/test-feedback';
import { EquationInputComponent } from '../components/widgets/math/equation-input/equation-input';
import { TextEditorComponent } from '../components/widgets/writing/text-editor/text-editor';
import { MultipleChoiceComponent } from '../components/widgets/core/multiple-choice/multiple-choice';

export interface WidgetType {
  type: string;
  component: Type<any>;
  category: 'core' | 'coding' | 'math' | 'writing' | 'assessment';
  description: string;
  supportedConfigs: string[];
}

@Injectable({
  providedIn: 'root'
})
export class WidgetFactoryService {
  private widgetRegistry: Map<string, WidgetType> = new Map();

  constructor() {
    this.registerWidgets();
  }

  private registerWidgets(): void {
    // Core widgets
    this.registerWidget({
      type: 'step-prompt',
      component: StepPromptComponent,
      category: 'core',
      description: 'Step-by-step instruction widget',
      supportedConfigs: ['title', 'prompt', 'estimatedTime']
    });

    this.registerWidget({
      type: 'hint-panel',
      component: HintPanelComponent,
      category: 'core',
      description: 'Collapsible hint panel',
      supportedConfigs: ['title', 'hints', 'showByDefault']
    });

    this.registerWidget({
      type: 'feedback-box',
      component: FeedbackBoxComponent,
      category: 'core',
      description: 'Feedback display widget',
      supportedConfigs: ['type', 'title', 'message', 'explanation', 'nextSteps', 'showContinueButton']
    });

    this.registerWidget({
      type: 'confidence-meter',
      component: ConfidenceMeterComponent,
      category: 'core',
      description: 'Self-assessment slider',
      supportedConfigs: ['title', 'description', 'scaleLabels']
    });

    this.registerWidget({
      type: 'multiple-choice',
      component: MultipleChoiceComponent,
      category: 'core',
      description: 'Multiple choice question widget',
      supportedConfigs: ['question', 'options', 'correctAnswer', 'explanation']
    });

    // Coding widgets
    this.registerWidget({
      type: 'code-editor',
      component: CodeEditorComponent,
      category: 'coding',
      description: 'Interactive code editor',
      supportedConfigs: ['language', 'initialCode', 'width', 'height', 'enableSyntaxHighlighting', 'enableAutoCompletion', 'enableLineNumbers', 'enableBracketMatching', 'enableCodeFolding', 'enableSearch', 'enableIndentation', 'enableWordWrap', 'enableMinimap', 'allowUserSettings', 'showSettingsPanel']
    });

    this.registerWidget({
      type: 'console-output',
      component: ConsoleOutputComponent,
      category: 'coding',
      description: 'Code execution output display',
      supportedConfigs: ['title', 'placeholder', 'showTimestamp']
    });

    this.registerWidget({
      type: 'test-feedback',
      component: TestFeedbackComponent,
      category: 'coding',
      description: 'Test results and feedback',
      supportedConfigs: ['title', 'tests', 'showDetails']
    });

    // Math widgets
    this.registerWidget({
      type: 'equation-input',
      component: EquationInputComponent,
      category: 'math',
      description: 'Mathematical equation input and solver',
      supportedConfigs: ['title', 'placeholder', 'allowVariables', 'showSteps']
    });

    // Writing widgets
    this.registerWidget({
      type: 'text-editor',
      component: TextEditorComponent,
      category: 'writing',
      description: 'Rich text editor for writing exercises',
      supportedConfigs: ['title', 'placeholder', 'maxLength', 'enableFormatting']
    });
  }

  private registerWidget(widgetType: WidgetType): void {
    this.widgetRegistry.set(widgetType.type, widgetType);
  }

  /**
   * Get widget component by type
   */
  getWidgetComponent(type: string): Type<any> | null {
    const widgetType = this.widgetRegistry.get(type);
    return widgetType ? widgetType.component : null;
  }

  /**
   * Get widget type information
   */
  getWidgetType(type: string): WidgetType | null {
    return this.widgetRegistry.get(type) || null;
  }

  /**
   * Get all available widget types
   */
  getAllWidgetTypes(): WidgetType[] {
    return Array.from(this.widgetRegistry.values());
  }

  /**
   * Get widget types by category
   */
  getWidgetTypesByCategory(category: string): WidgetType[] {
    return this.getAllWidgetTypes().filter(widget => widget.category === category);
  }

  /**
   * Check if a widget type is supported
   */
  isWidgetTypeSupported(type: string): boolean {
    return this.widgetRegistry.has(type);
  }

  /**
   * Get supported configuration keys for a widget type
   */
  getSupportedConfigs(type: string): string[] {
    const widgetType = this.widgetRegistry.get(type);
    return widgetType ? widgetType.supportedConfigs : [];
  }

  /**
   * Validate widget configuration
   */
  validateWidgetConfig(type: string, config: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const supportedConfigs = this.getSupportedConfigs(type);

    if (!this.isWidgetTypeSupported(type)) {
      errors.push(`Widget type '${type}' is not supported`);
      return { valid: false, errors };
    }

    // Check for required configurations based on widget type
    const requiredConfigs = this.getRequiredConfigs(type);
    for (const required of requiredConfigs) {
      if (!config[required]) {
        errors.push(`Required configuration '${required}' is missing for widget type '${type}'`);
      }
    }

    // Check for unsupported configurations
    for (const key of Object.keys(config)) {
      if (!supportedConfigs.includes(key)) {
        errors.push(`Configuration '${key}' is not supported for widget type '${type}'`);
      }
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Get required configuration keys for a widget type
   */
  private getRequiredConfigs(type: string): string[] {
    const requiredConfigs: Record<string, string[]> = {
      'step-prompt': ['title', 'prompt'],
      'hint-panel': ['title'],
      'feedback-box': ['type', 'title', 'message'],
      'confidence-meter': ['title'],
      'multiple-choice': ['question', 'options'],
      'code-editor': ['title'],
      'console-output': ['title'],
      'test-feedback': ['title'],
      'equation-input': ['title'],
      'text-editor': ['title']
    };

    return requiredConfigs[type] || [];
  }

  /**
   * Create a widget instance with default configuration
   */
  createWidgetWithDefaults(type: string, customConfig: any = {}): any {
    const defaultConfigs: Record<string, any> = {
      'step-prompt': {
        title: 'Step',
        prompt: 'Complete this step',
        estimatedTime: 60
      },
      'hint-panel': {
        title: 'Hints',
        hints: ['Try this approach'],
        showByDefault: false
      },
      'feedback-box': {
        type: 'info',
        title: 'Feedback',
        message: 'Here is your feedback',
        showContinueButton: false
      },
      'confidence-meter': {
        title: 'Rate Your Understanding',
        description: 'How confident are you?',
        scaleLabels: ['Not at all', 'Slightly', 'Moderately', 'Very well', 'Completely']
      },
      'multiple-choice': {
        question: 'Choose the correct answer',
        options: ['Option A', 'Option B', 'Option C', 'Option D'],
        correctAnswer: 0
      },
      'code-editor': {
        title: 'Code Editor',
        language: 'javascript',
        initialCode: '// Your code here',
        width: '100%',
        height: '300px',
        enableSyntaxHighlighting: true,
        enableLineNumbers: true
      },
      'console-output': {
        title: 'Output',
        placeholder: 'Output will appear here...'
      },
      'test-feedback': {
        title: 'Test Results',
        tests: [],
        showDetails: true
      },
      'equation-input': {
        title: 'Equation Input',
        placeholder: 'Enter your equation here',
        allowVariables: true,
        showSteps: true
      },
      'text-editor': {
        title: 'Text Editor',
        placeholder: 'Enter your text here...',
        maxLength: 1000,
        enableFormatting: true
      }
    };

    const defaultConfig = defaultConfigs[type] || {};
    return { ...defaultConfig, ...customConfig };
  }
}
