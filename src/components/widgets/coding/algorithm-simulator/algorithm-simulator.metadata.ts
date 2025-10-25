import { WidgetInputType, WidgetMetadata, WidgetOutputType, WidgetDifficulty } from '../../../../types/widget.types';

export const ALGORITHM_SIMULATOR_METADATA: WidgetMetadata = {
  id: 'algorithm-simulator',
  title: 'Algorithm Simulator',
  description: 'Interactive visualizations for bubble sort, quick sort, and recursion tree',
  skills: ['sorting', 'recursion', 'visualization', 'algorithms'],
  difficulty: WidgetDifficulty.MEDIUM,
  estimated_time: 300,
  input_type: WidgetInputType.TEXT,
  output_type: WidgetOutputType.VISUALIZATION,
  dependencies: [],
  adaptive_hooks: {
    difficulty_adjustment: false,
    hint_progression: false,
    time_extension: false
  },
  version: '1.0.0',
  category: 'coding'
};


