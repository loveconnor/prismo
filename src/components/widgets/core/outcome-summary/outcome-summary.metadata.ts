import { WidgetInputType, WidgetMetadata, WidgetOutputType } from '../../../../types/widget.types';

export const OUTCOME_SUMMARY_METADATA: WidgetMetadata = {
  id: 'outcome-summary',
  title: 'Outcome Summary',
  description: 'Summarizes lab outcomes with completion stats, skill improvements, and recommended next steps',
  skills: ['reflection', 'progress-tracking', 'planning'],
  difficulty: 1,
  estimated_time: 30,
  input_type: WidgetInputType.TEXT,
  output_type: WidgetOutputType.COMPLETION,
  dependencies: [],
  adaptive_hooks: {
    difficulty_adjustment: false,
    hint_progression: false,
    time_extension: false,
    alternative_widgets: []
  },
  version: '1.0.0',
  category: 'core'
};


