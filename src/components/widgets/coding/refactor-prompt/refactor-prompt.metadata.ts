import { WidgetInputType, WidgetMetadata, WidgetOutputType, WidgetDifficulty } from '../../../../types/widget.types';

export const REFACTOR_PROMPT_METADATA: WidgetMetadata = {
  id: 'refactor-prompt',
  title: 'Refactor Prompt',
  description: 'Refactor code with guided suggestions, comparison view, and best-practices hints',
  skills: ['refactoring', 'readability', 'maintainability', 'performance', 'correctness'],
  difficulty: WidgetDifficulty.MEDIUM,
  estimated_time: 300,
  input_type: WidgetInputType.CODE,
  output_type: WidgetOutputType.FEEDBACK,
  dependencies: [],
  adaptive_hooks: {
    difficulty_adjustment: true,
    hint_progression: true,
    time_extension: true,
    alternative_widgets: ['code-editor']
  },
  version: '1.0.0',
  category: 'coding'
};


