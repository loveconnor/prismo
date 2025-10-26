import { Injectable } from '@angular/core';
import { LabData, LabSection, LabWidget } from './lab-data.service';

export interface ModuleData {
  id: string;
  title: string;
  description: string;
  skills: string[];
  widgets: ModuleWidget[];
  completion_criteria?: {
    required_widgets: string[];
    min_completion_percentage: number;
    max_attempts: number;
    time_limit: number;
  };
  estimated_duration: number;
  version: string;
}

export interface ModuleWidget {
  id: string;
  metadata: {
    id: string;
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
    
    // Convert widgets to lab format
    const labWidgets: LabWidget[] = moduleData.widgets.map(widget => ({
      id: widget.id,
      type: widget.id, // Use the widget ID as the type
      config: this.convertPropsToConfig(widget.props, widget.id),
      metadata: {
        ...widget.metadata,
        position: widget.position // Preserve position for step ordering
      }
    }));

    // Create a single section containing all widgets
    const section: LabSection = {
      id: 'main-section',
      title: 'Learning Activities',
      description: moduleData.description,
      layout: 'stack',
      widgets: labWidgets
    };

    return {
      id: moduleData.id,
      title: moduleData.title,
      description: moduleData.description,
      difficulty: avgDifficulty,
      estimatedTime: Math.round(moduleData.estimated_duration / 60), // Convert seconds to minutes
      sections: [section],
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
    
    const totalDifficulty = widgets.reduce((sum, widget) => sum + widget.metadata.difficulty, 0);
    return Math.round(totalDifficulty / widgets.length);
  }

  /**
   * Convert module widget props to lab widget config
   */
  private convertPropsToConfig(props: any, widgetType: string): any {
    // Base config with all props
    let config = { ...props };

    // Widget-specific transformations
    switch (widgetType) {
      case 'step-prompt':
        return {
          title: props.title,
          prompt: props.prompt,
          estimatedTime: props.estimatedTime
        };

      case 'code-editor':
        return {
          title: props.title,
          language: props.language,
          initialCode: props.starterCode,
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
          title: 'Hints',
          hints: props.hints,
          maxHintsPerTier: props.maxHintsPerTier
        };

      case 'feedback-box':
        return {
          type: props.type,
          title: props.title,
          message: props.message,
          explanation: props.explanation,
          nextSteps: props.nextSteps,
          showContinueButton: props.showContinueButton,
          autoComplete: props.autoComplete
        };

      case 'confidence-meter':
        return {
          title: props.title,
          description: props.description,
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

      default:
        // For unknown widget types, return all props as config
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
