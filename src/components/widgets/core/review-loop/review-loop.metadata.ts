import { WidgetInputType, WidgetMetadata, WidgetOutputType, WidgetDifficulty } from '../../../../types/widget.types';

export const REVIEW_LOOP_METADATA: WidgetMetadata = {
  id: 'review-loop',
  title: 'Review Loop',
  description: 'Adaptive practice loop across weak skills with timer, progress, and detailed results.',
  skills: ['practice', 'recall', 'metacognition', 'self-assessment'],
  difficulty: WidgetDifficulty.MEDIUM,
  estimated_time: 300,
  input_type: WidgetInputType.MULTIPLE_CHOICE,
  output_type: WidgetOutputType.FEEDBACK,
  dependencies: [],
  adaptive_hooks: {
    difficulty_adjustment: true,
    hint_progression: true,
    time_extension: true,
    alternative_widgets: ['multiple-choice', 'short-answer']
  },
  version: '1.0.0',
  category: 'core'
};


