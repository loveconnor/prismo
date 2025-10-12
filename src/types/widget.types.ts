export enum WidgetInputType {
  TEXT = 'text',
  CODE = 'code',
  NUMERIC = 'numeric',
  MULTIPLE_CHOICE = 'multiple-choice',
  EQUATION = 'equation',
  RICH_TEXT = 'rich-text',
  SLIDER = 'slider',
  CHECKBOX = 'checkbox',
  RADIO = 'radio'
}

export enum WidgetOutputType {
  FEEDBACK = 'feedback',
  VISUALIZATION = 'visualization',
  SCAFFOLD = 'scaffold',
  PROGRESS = 'progress',
  COMPLETION = 'completion'
}

export enum WidgetDifficulty {
  VERY_EASY = 1,
  EASY = 2,
  MEDIUM = 3,
  HARD = 4,
  VERY_HARD = 5
}

export interface WidgetMetadata {
  id: string;
  skills: string[];
  difficulty: WidgetDifficulty;
  estimated_time: number; // seconds
  input_type: WidgetInputType;
  output_type: WidgetOutputType;
  dependencies: string[];
  adaptive_hooks: AdaptiveHooks;
  version: string;
  title: string;
  description: string;
  category: 'core' | 'coding' | 'math' | 'writing';
}

export interface AdaptiveHooks {
  difficulty_adjustment?: boolean;
  hint_progression?: boolean;
  time_extension?: boolean;
  alternative_widgets?: string[];
}

export interface WidgetState {
  id: string;
  is_completed: boolean;
  is_loading: boolean;
  has_error: boolean;
  time_spent: number; // seconds
  attempts: number;
  last_updated: Date;
  data: Record<string, any>; // Widget-specific data
}

export interface WidgetConfig {
  id: string;
  metadata: WidgetMetadata;
  props: Record<string, any>;
  position?: number;
  dependencies_met?: boolean;
}

export interface ModuleDefinition {
  id: string;
  title: string;
  description: string;
  skills: string[];
  widgets: WidgetConfig[];
  completion_criteria: CompletionCriteria;
  estimated_duration: number;
  version: string;
}

export interface CompletionCriteria {
  required_widgets: string[];
  min_completion_percentage: number;
  max_attempts?: number;
  time_limit?: number;
}

export interface WidgetEvent {
  widget_id: string;
  event_type: 'state_change' | 'completion' | 'error' | 'attempt';
  data: any;
  timestamp: Date;
}
