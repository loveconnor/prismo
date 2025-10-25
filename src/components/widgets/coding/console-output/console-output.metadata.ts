import { WidgetInputType, WidgetMetadata, WidgetOutputType, WidgetDifficulty } from '../../../../types/widget.types';

export const CONSOLE_OUTPUT_METADATA: WidgetMetadata = {
  id: 'console-output',
  title: 'Console Output',
  description: 'Streamed console output with copy, download, clear, timestamps, and auto-scroll',
  skills: ['debugging', 'output-reading', 'tooling'],
  difficulty: WidgetDifficulty.EASY,
  estimated_time: 30,
  input_type: WidgetInputType.TEXT,
  output_type: WidgetOutputType.VISUALIZATION,
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


