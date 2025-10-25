import { WidgetInputType, WidgetMetadata, WidgetOutputType } from '../../../../types/widget.types';

export const GOAL_SETTER_METADATA: WidgetMetadata = {
  id: 'goal-setter',
  title: 'Goal Setter',
  description: 'Create, track, and manage learning goals with priorities, deadlines, and progress',
  skills: ['planning', 'self-regulation', 'time-management'],
  difficulty: 1,
  estimated_time: 60,
  input_type: WidgetInputType.TEXT,
  output_type: WidgetOutputType.PROGRESS,
  dependencies: [],
  adaptive_hooks: {
    difficulty_adjustment: false,
    hint_progression: true,
    time_extension: true,
    alternative_widgets: []
  },
  version: '1.0.0',
  category: 'core'
};


