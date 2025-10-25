/**
 * Short Answer Widget - Metadata Definition
 * 
 * This file defines the metadata for the short answer widget
 * following the ACE (Adaptive Curriculum Engine) specification.
 */

import { 
  WidgetMetadata, 
  WidgetDifficulty, 
  WidgetInputType, 
  WidgetOutputType 
} from '../../../../types/widget.types';

/**
 * Metadata for the short answer widget
 * 
 * This widget provides a text input interface with:
 * - Multiple validation modes (exact, contains, similarity, AI)
 * - Character counting and limits
 * - Real-time feedback
 * - Keyboard shortcuts
 * - Accessibility features
 */
export const SHORT_ANSWER_METADATA: WidgetMetadata = {
  // ==================== CORE IDENTIFICATION ====================
  id: 'short-answer',
  title: 'Short Answer',
  description: 'A text input widget with multiple validation modes, real-time feedback, and character limits for collecting and validating short-form student responses.',
  version: '1.0.0',
  category: 'core',

  // ==================== SKILLS & DIFFICULTY ====================
  /**
   * Skills tags for mastery tracking
   * This widget tests comprehension and written expression
   */
  skills: [
    'comprehension',
    'written-expression',
    'recall',
    'critical-thinking',
    'analysis'
  ],

  /**
   * Difficulty level (1-5 scale)
   * Default is EASY (2), but can be configured per instance
   */
  difficulty: WidgetDifficulty.EASY,

  // ==================== TIME & ESTIMATION ====================
  /**
   * Average completion time in seconds
   * - Simple recall: 30-60s
   * - Short explanation: 60-120s
   * - Detailed answer: 120-180s
   */
  estimated_time: 90, // 1.5 minutes average

  // ==================== INPUT & OUTPUT ====================
  /**
   * Input type - text-based responses
   */
  input_type: WidgetInputType.TEXT,

  /**
   * Output type - provides immediate feedback
   */
  output_type: WidgetOutputType.FEEDBACK,

  // ==================== DEPENDENCIES ====================
  /**
   * Widget dependencies
   * Empty array means this widget has no prerequisites
   */
  dependencies: [],

  // ==================== ADAPTIVE HOOKS ====================
  /**
   * Configuration for ACE (Adaptive Curriculum Engine) integration
   */
  adaptive_hooks: {
    /**
     * Difficulty adjustment: Enable ACE to modify validation strictness
     * When enabled, the system can:
     * - Adjust similarity thresholds
     * - Modify validation modes
     * - Change feedback messages based on performance
     */
    difficulty_adjustment: true,

    /**
     * Hint progression: Enable progressive hint disclosure
     * When enabled, the system can:
     * - Show hints after failed attempts
     * - Provide examples or templates
     * - Offer partial credit feedback
     */
    hint_progression: true,

    /**
     * Time extension: Allow dynamic time adjustments
     * When enabled, the system can:
     * - Extend character limits for struggling learners
     * - Adjust validation strictness over time
     */
    time_extension: false,

    /**
     * Alternative widgets: Specify widget IDs that can substitute this widget
     */
    alternative_widgets: [
      'multiple-choice',
      'fill-in-blank',
      'text-editor'
    ]
  }
};

/**
 * Example configurations for different use cases
 */
export const SHORT_ANSWER_EXAMPLES = {
  /**
   * Simple exact match question
   */
  exactMatch: {
    metadata: {
      ...SHORT_ANSWER_METADATA,
      id: 'short-answer-exact-1',
      skills: ['recall', 'factual-knowledge'],
      difficulty: WidgetDifficulty.VERY_EASY,
      estimated_time: 30
    },
    config: {
      id: 'short-answer-exact-1',
      question: 'What is the capital of France?',
      placeholder: 'Enter your answer...',
      validation: {
        mode: 'exact' as const,
        expected: ['Paris', 'paris'],
        caseSensitive: false,
        ignoreWhitespace: true
      },
      maxLength: 50,
      minLength: 1,
      showFeedback: true,
      correctFeedback: 'Correct! Paris is the capital of France.',
      incorrectFeedback: 'Not quite. Think about major European capitals.'
    }
  },

  /**
   * Contains validation (partial match)
   */
  containsMatch: {
    metadata: {
      ...SHORT_ANSWER_METADATA,
      id: 'short-answer-contains-1',
      skills: ['comprehension', 'analysis', 'written-expression'],
      difficulty: WidgetDifficulty.EASY,
      estimated_time: 60
    },
    config: {
      id: 'short-answer-contains-1',
      question: 'Explain why photosynthesis is important for life on Earth.',
      placeholder: 'Write your explanation...',
      validation: {
        mode: 'contains' as const,
        expected: ['oxygen', 'energy', 'food', 'glucose'],
        caseSensitive: false,
        ignoreWhitespace: true
      },
      maxLength: 200,
      minLength: 20,
      showFeedback: true,
      correctFeedback: 'Good! Your answer mentions key aspects of photosynthesis.',
      incorrectFeedback: 'Think about what photosynthesis produces and why that matters.'
    }
  },

  /**
   * Similarity-based validation (fuzzy matching)
   */
  similarityMatch: {
    metadata: {
      ...SHORT_ANSWER_METADATA,
      id: 'short-answer-similarity-1',
      skills: ['recall', 'spelling', 'vocabulary'],
      difficulty: WidgetDifficulty.MEDIUM,
      estimated_time: 45
    },
    config: {
      id: 'short-answer-similarity-1',
      question: 'Name the process by which plants convert sunlight into chemical energy.',
      placeholder: 'Enter the term...',
      validation: {
        mode: 'similarity' as const,
        expected: ['photosynthesis'],
        caseSensitive: false,
        ignoreWhitespace: true,
        similarityThreshold: 0.8
      },
      maxLength: 100,
      minLength: 5,
      showFeedback: true,
      correctFeedback: 'Correct! Photosynthesis is the process.',
      incorrectFeedback: 'Close! Check your spelling or try again.'
    }
  },

  /**
   * Open-ended with no validation
   */
  openEnded: {
    metadata: {
      ...SHORT_ANSWER_METADATA,
      id: 'short-answer-open-1',
      skills: ['critical-thinking', 'written-expression', 'reflection'],
      difficulty: WidgetDifficulty.MEDIUM,
      estimated_time: 120
    },
    config: {
      id: 'short-answer-open-1',
      question: 'Describe a time when you solved a difficult problem. What strategies did you use?',
      placeholder: 'Share your experience...',
      validation: {
        mode: 'none' as const,
        expected: []
      },
      maxLength: 500,
      minLength: 50,
      ui: {
        variant: 'default' as const,
        showCharCount: true,
        autoResize: true
      },
      showFeedback: true,
      correctFeedback: 'Thank you for sharing your experience!'
    }
  },

  /**
   * Compact variant for inline questions
   */
  compact: {
    metadata: {
      ...SHORT_ANSWER_METADATA,
      id: 'short-answer-compact-1',
      skills: ['recall', 'quick-thinking'],
      difficulty: WidgetDifficulty.VERY_EASY,
      estimated_time: 20
    },
    config: {
      id: 'short-answer-compact-1',
      question: 'What is 7 × 8?',
      placeholder: 'Answer',
      validation: {
        mode: 'exact' as const,
        expected: ['56'],
        caseSensitive: false,
        ignoreWhitespace: true
      },
      maxLength: 10,
      minLength: 1,
      ui: {
        variant: 'compact' as const,
        showCharCount: false,
        autoResize: false
      },
      showFeedback: true,
      correctFeedback: 'Correct!',
      incorrectFeedback: 'Try again.'
    }
  }
};

/**
 * Validation helper for short answer configurations
 */
export function validateShortAnswerConfig(config: any): string[] {
  const errors: string[] = [];

  if (!config.id) {
    errors.push('id is required');
  }

  if (!config.question || config.question.trim().length === 0) {
    errors.push('question is required and cannot be empty');
  }

  if (config.maxLength && config.minLength && config.maxLength < config.minLength) {
    errors.push('maxLength must be greater than or equal to minLength');
  }

  if (config.validation) {
    if (!config.validation.mode) {
      errors.push('validation.mode is required when validation is provided');
    }

    if (config.validation.mode !== 'none' && (!config.validation.expected || config.validation.expected.length === 0)) {
      errors.push('validation.expected must contain at least one value when validation mode is not "none"');
    }

    if (config.validation.similarityThreshold !== undefined) {
      if (config.validation.similarityThreshold < 0 || config.validation.similarityThreshold > 1) {
        errors.push('validation.similarityThreshold must be between 0 and 1');
      }
    }
  }

  return errors;
}

