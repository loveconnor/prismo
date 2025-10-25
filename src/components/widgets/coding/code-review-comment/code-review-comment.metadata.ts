import { WidgetInputType, WidgetMetadata, WidgetOutputType, WidgetDifficulty } from '../../../../types/widget.types';

export const CODE_REVIEW_COMMENT_METADATA: WidgetMetadata = {
  id: 'code-review-comment',
  title: 'Code Review Comment',
  description: 'Theme-aware code review comment card with replies, likes, and resolve actions',
  skills: ['code-review', 'communication', 'feedback'],
  difficulty: WidgetDifficulty.EASY,
  estimated_time: 60,
  input_type: WidgetInputType.TEXT,
  output_type: WidgetOutputType.FEEDBACK,
  dependencies: [],
  adaptive_hooks: {
    difficulty_adjustment: false,
    hint_progression: false,
    time_extension: false
  },
  version: '1.0.0',
  category: 'coding'
};


