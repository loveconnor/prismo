import { WidgetInputType, WidgetMetadata, WidgetOutputType } from '../../../../types/widget.types';

export const MATCHING_PAIRS_METADATA: WidgetMetadata = {
  id: 'matching-pairs',
  title: 'Matching Pairs',
  description: 'Interactive matching exercise supporting drag-drop, select, and connect modes with visual feedback and explanations.',
  skills: [
    'associations',
    'pattern-recognition',
    'vocabulary',
    'concepts',
    'relationships',
    'categorization'
  ],
  difficulty: 2,
  estimated_time: 180,
  input_type: WidgetInputType.RADIO,
  output_type: WidgetOutputType.FEEDBACK,
  dependencies: [],
  adaptive_hooks: {
    difficulty_adjustment: true,
    hint_progression: true,
    time_extension: true,
    alternative_widgets: []
  },
  version: '1.0.0',
  category: 'core'
};

