import { 
  WidgetMetadata, 
  WidgetDifficulty, 
  WidgetInputType, 
  WidgetOutputType 
} from '../../../../types/widget.types';

export const TIMER_METADATA: WidgetMetadata = {
  id: 'timer',
  title: 'Timer',
  description: 'Stopwatch and countdown timer with alerts, pacing, and auto-submit for time-based learning activities',
  version: '1.0.0',
  category: 'core',
  
  skills: [
    'time-management',
    'pacing',
    'focus',
    'self-regulation'
  ],
  
  difficulty: WidgetDifficulty.EASY,
  estimated_time: 60, // 1 minute to configure/start
  
  input_type: WidgetInputType.TEXT,
  output_type: WidgetOutputType.PROGRESS,
  
  dependencies: [],
  
  adaptive_hooks: {
    difficulty_adjustment: false,
    hint_progression: false,
    time_extension: true, // Allows extending time dynamically
    alternative_widgets: []
  }
};

