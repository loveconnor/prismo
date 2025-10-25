import { WidgetInputType, WidgetMetadata, WidgetOutputType } from '../../../../types/widget.types';

export const ADAPTIVE_SUMMARY_METADATA: WidgetMetadata = {
  id: 'adaptive-summary',
  title: 'Adaptive Summary',
  description: 'Summarizes performance and recommends adaptive changes with previews of next section',
  skills: ['meta-learning', 'self-regulation', 'planning'],
  difficulty: 2,
  estimated_time: 60,
  input_type: WidgetInputType.TEXT,
  output_type: WidgetOutputType.SCAFFOLD,
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


