import { WidgetInputType, WidgetMetadata, WidgetOutputType, WidgetDifficulty } from '../../../../types/widget.types';

export const TEST_FEEDBACK_METADATA: WidgetMetadata = {
  id: 'test-feedback',
  title: 'Test Feedback',
  description: 'Displays grouped test results with pass/fail stats, details, and stack traces',
  skills: ['testing', 'debugging', 'analysis'],
  difficulty: WidgetDifficulty.EASY,
  estimated_time: 60,
  input_type: WidgetInputType.TEXT,
  output_type: WidgetOutputType.FEEDBACK,
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


