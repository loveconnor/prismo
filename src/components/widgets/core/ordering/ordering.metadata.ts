import { WidgetInputType, WidgetMetadata, WidgetOutputType } from '../../../../types/widget.types';

export const ORDERING_METADATA: WidgetMetadata = {
  id: 'ordering',
  title: 'Ordering',
  description: 'Interactive sequencing exercise with drag-drop and button modes for arranging items in correct order',
  skills: [
    'sequencing',
    'logical-order',
    'chronology',
    'processes',
    'steps',
    'organization'
  ],
  difficulty: 2,
  estimated_time: 120,
  input_type: WidgetInputType.RADIO,
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

