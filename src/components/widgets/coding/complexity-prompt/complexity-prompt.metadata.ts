import { WidgetInputType, WidgetMetadata, WidgetOutputType, WidgetDifficulty } from '../../../../types/widget.types';

export const COMPLEXITY_PROMPT_METADATA: WidgetMetadata = {
  id: 'complexity-prompt',
  title: 'Complexity Prompt',
  description: 'Analyze algorithm complexity by selecting the correct Big-O with hints and visualization',
  skills: ['big-o', 'algorithm-analysis', 'complexity', 'loops', 'recursion'],
  difficulty: WidgetDifficulty.MEDIUM,
  estimated_time: 120,
  input_type: WidgetInputType.MULTIPLE_CHOICE,
  output_type: WidgetOutputType.FEEDBACK,
  dependencies: [],
  adaptive_hooks: {
    difficulty_adjustment: true,
    hint_progression: true,
    time_extension: false,
    alternative_widgets: ['multiple-choice']
  },
  version: '1.0.0',
  category: 'coding'
};


