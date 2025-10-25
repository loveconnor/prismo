import { WidgetInputType, WidgetMetadata, WidgetOutputType } from '../../../../types/widget.types';

export const CHECKPOINT_METADATA: WidgetMetadata = {
  id: 'checkpoint',
  title: 'Checkpoint',
  description: 'Auto-save progress indicator with manual save, retry, and restore controls',
  skills: ['progress-tracking', 'persistence', 'time-management'],
  difficulty: 1,
  estimated_time: 10,
  input_type: WidgetInputType.TEXT,
  output_type: WidgetOutputType.PROGRESS,
  dependencies: [],
  adaptive_hooks: {
    difficulty_adjustment: false,
    hint_progression: false,
    time_extension: true,
    alternative_widgets: []
  },
  version: '1.0.0',
  category: 'core'
};


