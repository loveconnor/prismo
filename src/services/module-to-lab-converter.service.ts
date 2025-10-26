import { Injectable } from '@angular/core';
import { LabData, LabSection, LabWidget } from './lab-data.service';

export interface ModuleData {
  id: string;
  title: string;
  description: string;
  skills: string[];
  steps?: ModuleStep[];
  widgets: ModuleWidget[];
  completion_criteria?: {
    required_widgets: string[];
    min_completion_percentage: number;
    max_attempts: number;
    time_limit: number;
  };
  estimated_duration: number; // seconds
  version: string;
}

export interface ModuleStep {
  id: number;
  title: string;
  description: string;
  instruction?: string;
  example?: string;
}

export interface ModuleWidget {
  id: string;
  stepId?: number; // Optional stepId for associating widgets with steps
  metadata: {
    id: string; // widget type identifier (e.g., 'feedback-box', 'code-editor')
    title: string;
    description: string;
    skills: string[];
    difficulty: number;
    estimated_time: number;
    input_type: string;
    output_type: string;
    dependencies: string[];
    adaptive_hooks: any;
    version: string;
    category: string;
  };
  props: any;
  position?: number; // Optional position for step ordering
  dependencies_met: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ModuleToLabConverterService {

  /**
   * Convert module data to lab data format
   */
  convertModuleToLab(moduleData: ModuleData): LabData {
    // Calculate difficulty based on widget difficulties
    const avgDifficulty = this.calculateAverageDifficulty(moduleData.widgets);

    // Convert steps (normalized to lab steps)
    const labSteps = (moduleData.steps ?? []).map(step => ({
      id: step.id,
      title: step.title,
      description: step.description,
      instruction: step.instruction,
      example: step.example
    }));

    // Convert widgets to lab format
    const labWidgets: LabWidget[] = moduleData.widgets.map(widget => {
      // Prefer metadata.id (type), fall back to metadata.name or widget.id
      const widgetType: string =
        widget.metadata?.id ||
        (widget.metadata as any)?.name ||
        widget.id;

      return {
        id: widget.id,
        type: widgetType,
        config: this.convertPropsToConfig(widget.props, widgetType),
        metadata: {
          ...widget.metadata,
          id: widgetType,          // normalize id field to be the type
          position: widget.position, // preserve ordering hint in metadata
          stepId: widget.stepId      // also surface stepId in metadata for compatibility
        },
        stepId: widget.stepId // keep explicit for consumers that read from top-level
      };
    });

    // Group widgets by step if steps exist, else single section
    let sections: LabSection[];
    if (labSteps.length > 0) {
      sections = labSteps.map(step => {
        const stepWidgets = labWidgets.filter(w => w.stepId === step.id);
        return {
          id: `step-${step.id}`,
          title: step.title,
          description: step.instruction || step.description || step.title,
          layout: 'stack',
          widgets: stepWidgets
        };
      });
    } else {
      sections = [{
        id: 'main-section',
        title: 'Learning Activities',
        description: moduleData.description,
        layout: 'stack',
        widgets: labWidgets
      }];
    }

    return {
      id: moduleData.id,
      title: moduleData.title,
      description: moduleData.description,
      difficulty: avgDifficulty,
      estimatedTime: Math.round(moduleData.estimated_duration / 60), // seconds → minutes
      sections,
      steps: labSteps,
      metadata: {
        author: 'Prismo Labs',
        version: moduleData.version,
        tags: moduleData.skills,
        prerequisites: []
      }
    };
  }

  /**
   * Calculate average difficulty from widgets
   */
  private calculateAverageDifficulty(widgets: ModuleWidget[]): number {
    if (widgets.length === 0) return 1;
    const totalDifficulty = widgets.reduce((sum, widget) => sum + (widget.metadata?.difficulty ?? 1), 0);
    return Math.round(totalDifficulty / widgets.length);
  }

  /**
   * Convert module widget props to lab widget config
   */
  private convertPropsToConfig(props: any, widgetType: string): any {
    // Base config with all props (fallback)
    const config = { ...props };

    switch (widgetType) {
      case 'step-prompt':
        return {
          title: props.title,
          prompt: props.prompt ?? props.message,
          estimatedTime: props.estimatedTime
        };

      case 'code-editor':
        return {
          title: props.title,
          language: props.language,
          initialCode: props.initialCode ?? props.starterCode,
          placeholder: props.placeholder,
          testCases: props.testCases,
          width: '100%',
          height: '300px',
          enableSyntaxHighlighting: true,
          enableAutoCompletion: true,
          enableLineNumbers: true
        };

      case 'hint-panel':
        return {
          title: props.title ?? 'Hints',
          hints: props.hints,
          maxHintsPerTier: props.maxHintsPerTier
        };

      case 'feedback-box':
        return {
          type: props.type ?? 'success',
          title: props.title,
          message: props.message ?? props.prompt,
          explanation: props.explanation,
          nextSteps: Array.isArray(props.nextSteps)
            ? props.nextSteps
            : (props.nextSteps ? [props.nextSteps] : []),
          showContinueButton: props.showContinueButton ?? true,
          autoComplete: props.autoComplete
        };

      case 'confidence-meter':
        return {
          title: props.title ?? props.question ?? 'Rate Your Confidence',
          description: props.description ?? props.prompt,
          scaleLabels: props.scaleLabels,
          autoSubmit: props.autoSubmit
        };

      case 'equation-input':
        return {
          title: props.title,
          placeholder: props.placeholder,
          allowVariables: props.allowVariables,
          showSteps: props.showSteps
        };

      case 'text-editor':
        return {
          title: props.title,
          placeholder: props.placeholder,
          maxLength: props.maxLength,
          enableFormatting: props.enableFormatting
        };

      case 'multiple-choice':
        return {
          question: props.question,
          options: props.options,
          correctAnswer: props.correctAnswer,
          explanation: props.explanation
        };

      case 'lab-intro':
        return {
          title: props.title,
          subtitle: props.subtitle,
          objective: props.objective,
          difficulty: props.difficulty,
          estimatedMinutes: props.estimatedMinutes,
          skills: props.skills || [],
          prerequisites: props.prerequisites || [],
          requirements: props.requirements || [],
          miniSyllabus: props.miniSyllabus || [],
          policy: props.policy || {},
          ui: props.ui || {},
          cta: props.cta || {},
          integrations: props.integrations || {}
        };

      case 'short-answer':
        return {
          question: props.title || props.question,
          placeholder: props.placeholder || 'Enter your answer...',
          validation: props.validation,
          maxLength: props.maxLength ?? 500,
          minLength: props.minLength ?? 1,
          ui: props.ui || {},
          showFeedback: props.showFeedback !== false,
          correctFeedback: props.correctFeedback || 'Correct!',
          incorrectFeedback: props.incorrectFeedback || 'Incorrect. Try again.',
          value: props.value,
          defaultValue: props.defaultValue || ''
        };

      case 'coach-chat':
        return {
          coachId: props.coachId || 'coach-1',
          stepId: props.stepId || 'step-1',
          variant: props.variant || 'inline',
          maxTurns: props.maxTurns ?? 12,
          policy: props.policy || {},
          context: props.context || {
            stepPromptMD: props.prompt || 'Complete this step',
            visibleHints: [],
            recentAttempts: 0,
            domain: 'general',
            skillTags: []
          },
          ui: props.ui || {},
          rateLimits: props.rateLimits || {},
          integrations: props.integrations || {}
        };

      case 'reflection-prompt':
        return {
          reflectionId: props.reflectionId || 'reflection-1',
          scope: props.scope || 'step',
          scopeId: props.scopeId || 'step-1',
          promptText: props.prompt || props.promptText || 'Reflect on what you learned',
          minChars: props.minChars ?? 30,
          maxChars: props.maxChars ?? 450,
          placeholder: props.placeholder || 'Share your thoughts...',
          chips: props.chips,
          allowMarkdownLite: props.allowMarkdownLite || false,
          requireBeforeNext: props.requireBeforeNext || false,
          autosaveMs: props.autosaveMs ?? 1200,
          ui: props.ui || {},
          privacy: props.privacy || {},
          integrations: props.integrations || {}
        };

      default:
        // Unknown/legacy widgets: pass through props
        return config;
    }
  }

  /**
   * Convert multiple modules to labs
   */
  convertModulesToLabs(modules: ModuleData[]): LabData[] {
    return modules.map(module => this.convertModuleToLab(module));
  }

  /**
   * Validate module data structure
   */
  validateModuleData(moduleData: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Required fields
    if (!moduleData.id) errors.push('Missing required field: id');
    if (!moduleData.title) errors.push('Missing required field: title');
    if (!moduleData.description) errors.push('Missing required field: description');
    if (!moduleData.widgets || !Array.isArray(moduleData.widgets)) {
      errors.push('Missing or invalid field: widgets');
    }

    // Validate widgets
    if (moduleData.widgets) {
      moduleData.widgets.forEach((widget: any, index: number) => {
        if (!widget.id) errors.push(`Widget ${index}: missing id`);
        if (!widget.metadata) errors.push(`Widget ${index}: missing metadata`);
        if (!widget.props) errors.push(`Widget ${index}: missing props`);
      });
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}
