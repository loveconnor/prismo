import { WidgetInputType, WidgetMetadata, WidgetOutputType } from '../../../../types/widget.types';

export const ERROR_EXPLAIN_METADATA: WidgetMetadata = {
  id: 'error-explain',
  title: 'Error Explain',
  description: 'Interactive error explanation widget with fix steps, code examples, and related concepts for debugging support',
  skills: [
    'debugging',
    'error-analysis',
    'problem-solving',
    'code-comprehension',
    'troubleshooting',
    'pattern-recognition'
  ],
  difficulty: 2,
  estimated_time: 120,
  input_type: WidgetInputType.TEXT,
  output_type: WidgetOutputType.SCAFFOLD,
  dependencies: [],
  adaptive_hooks: {
    difficulty_adjustment: false,
    hint_progression: true,
    time_extension: false,
    alternative_widgets: []
  },
  version: '1.0.0',
  category: 'core'
};

