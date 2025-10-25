import { 
  WidgetMetadata, 
  WidgetDifficulty, 
  WidgetInputType, 
  WidgetOutputType 
} from '../../../../types/widget.types';

export const COACH_CHAT_METADATA: WidgetMetadata = {
  id: 'coach-chat',
  title: 'Coach Chat',
  description: 'AI-powered coaching interface with Socratic dialogue, policy controls, and contextual help for adaptive learning',
  version: '1.0.0',
  category: 'core',
  
  skills: [
    'problem-solving',
    'critical-thinking',
    'metacognition',
    'self-guided-learning',
    'conceptual-understanding'
  ],
  
  difficulty: WidgetDifficulty.MEDIUM,
  estimated_time: 300, // 5 minutes average interaction
  
  input_type: WidgetInputType.TEXT,
  output_type: WidgetOutputType.SCAFFOLD,
  
  dependencies: [],
  
  adaptive_hooks: {
    difficulty_adjustment: true,
    hint_progression: true,
    time_extension: true,
    alternative_widgets: ['hint-panel', 'feedback-box', 'worked-example']
  }
};

