import { WidgetInputType, WidgetMetadata, WidgetOutputType } from '../../../../types/widget.types';

export const NUMERIC_INPUT_METADATA: WidgetMetadata = {
  id: 'numeric-input',
  title: 'Numeric Input',
  description: 'Numeric input field with multiple validation modes including exact match, range, tolerance, and multiples',
  skills: [
    'mathematics',
    'calculation',
    'precision',
    'numeric-reasoning',
    'estimation',
    'problem-solving'
  ],
  difficulty: 2,
  estimated_time: 60,
  input_type: WidgetInputType.NUMERIC,
  output_type: WidgetOutputType.FEEDBACK,
  dependencies: [],
  adaptive_hooks: {
    difficulty_adjustment: true,
    hint_progression: true,
    time_extension: false,
    alternative_widgets: []
  },
  version: '1.0.0',
  category: 'core'
};

