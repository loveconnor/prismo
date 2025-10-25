import { 
  WidgetMetadata, 
  WidgetDifficulty, 
  WidgetInputType, 
  WidgetOutputType 
} from '../../../../types/widget.types';

export const REFLECTION_PROMPT_METADATA: WidgetMetadata = {
  id: 'reflection-prompt',
  title: 'Reflection Prompt',
  description: 'Self-reflection and metacognition tool with sentiment analysis, autosave, and adaptive feedback triggers',
  version: '1.0.0',
  category: 'core',
  
  skills: [
    'metacognition',
    'self-reflection',
    'self-assessment',
    'emotional-awareness',
    'learning-synthesis'
  ],
  
  difficulty: WidgetDifficulty.EASY,
  estimated_time: 180, // 3 minutes average
  
  input_type: WidgetInputType.TEXT,
  output_type: WidgetOutputType.FEEDBACK,
  
  dependencies: [],
  
  adaptive_hooks: {
    difficulty_adjustment: false,
    hint_progression: true, // Suggests hints based on confusion signals
    time_extension: false,
    alternative_widgets: []
  }
};

