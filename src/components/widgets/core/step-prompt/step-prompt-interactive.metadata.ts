/**
 * Step Prompt Interactive Widget - Metadata Definition
 * 
 * This file defines the metadata for the interactive step prompt widget
 * following the ACE (Adaptive Curriculum Engine) specification.
 */

import { 
  WidgetMetadata, 
  WidgetDifficulty, 
  WidgetInputType, 
  WidgetOutputType 
} from '../../../../types/widget.types';

/**
 * Metadata for the interactive step prompt widget
 * 
 * This widget provides a rich, interactive prompt interface with:
 * - Multiple prompt types (task, question, instruction)
 * - User input collection (text, textarea, code)
 * - Progressive hints and coaching
 * - Timer integration
 * - Keyboard shortcuts
 * - Comprehensive telemetry
 */
export const STEP_PROMPT_INTERACTIVE_METADATA: WidgetMetadata = {
  // ==================== CORE IDENTIFICATION ====================
  id: 'step-prompt-interactive',
  title: 'Interactive Step Prompt',
  description: 'An advanced step prompt widget with interactive features, user input collection, hints, and comprehensive telemetry for adaptive learning experiences.',
  version: '1.0.0',
  category: 'core',

  // ==================== SKILLS & DIFFICULTY ====================
  /**
   * Skills tags for mastery tracking
   * This widget can be configured for any skill set, but these are common use cases
   */
  skills: [
    'comprehension',
    'reading',
    'problem-solving',
    'critical-thinking',
    'self-assessment',
    'metacognition'
  ],

  /**
   * Difficulty level (1-5 scale)
   * Default is EASY (2), but can be configured per instance
   */
  difficulty: WidgetDifficulty.EASY,

  // ==================== TIME & ESTIMATION ====================
  /**
   * Average completion time in seconds
   * This is a baseline - actual time depends on configuration
   * - Simple prompt (no input): 30-60s
   * - With text input: 120-180s
   * - With code input: 300-600s
   */
  estimated_time: 120, // 2 minutes average

  // ==================== INPUT & OUTPUT ====================
  /**
   * Input type - configurable per instance
   * Supports: TEXT, CODE, TEXTAREA
   */
  input_type: WidgetInputType.TEXT,

  /**
   * Output type - what the widget provides
   * SCAFFOLD: Provides structure and guidance for learning
   */
  output_type: WidgetOutputType.SCAFFOLD,

  // ==================== DEPENDENCIES ====================
  /**
   * Widget dependencies
   * Empty array means this widget has no prerequisites
   * Can be configured to depend on other widgets in a learning sequence
   */
  dependencies: [],

  // ==================== ADAPTIVE HOOKS ====================
  /**
   * Configuration for ACE (Adaptive Curriculum Engine) integration
   * These hooks allow the system to adapt the learning experience
   */
  adaptive_hooks: {
    /**
     * Difficulty adjustment: Enable ACE to modify difficulty based on performance
     * When enabled, the system can:
     * - Simplify prompts for struggling learners
     * - Add complexity for advanced learners
     * - Adjust time limits dynamically
     */
    difficulty_adjustment: true,

    /**
     * Hint progression: Enable progressive hint disclosure
     * When enabled, the system can:
     * - Show hints based on time spent
     * - Reveal more specific hints after failed attempts
     * - Track hint usage for performance analysis
     */
    hint_progression: true,

    /**
     * Time extension: Allow dynamic time adjustments
     * When enabled, the system can:
     * - Extend time for learners who need it
     * - Reduce time pressure based on performance patterns
     */
    time_extension: true,

    /**
     * Alternative widgets: Specify widget IDs that can substitute this widget
     * Useful for A/B testing or providing alternative learning paths
     */
    alternative_widgets: [
      'step-prompt', // Simple non-interactive version
      'video-prompt', // Video-based alternative
      'interactive-demo' // Hands-on demo alternative
    ]
  }
};

/**
 * Example configurations for different use cases
 */
export const STEP_PROMPT_EXAMPLES = {
  /**
   * Simple reading comprehension prompt
   */
  simpleReading: {
    metadata: {
      ...STEP_PROMPT_INTERACTIVE_METADATA,
      id: 'step-prompt-interactive-reading-1',
      skills: ['reading', 'comprehension'],
      difficulty: WidgetDifficulty.VERY_EASY,
      estimated_time: 45,
      input_type: WidgetInputType.TEXT
    },
    config: {
      title: 'Understanding Variables',
      promptType: 'instruction' as const,
      bodyMD: '# What is a Variable?\n\nA variable is a container that holds data. Think of it like a labeled box where you can store information.',
      estimatedMinutes: 1,
      ctaPrimary: {
        label: 'Continue',
        action: 'next' as const
      },
      variant: 'default' as const
    }
  },

  /**
   * Interactive coding exercise
   */
  codingChallenge: {
    metadata: {
      ...STEP_PROMPT_INTERACTIVE_METADATA,
      id: 'step-prompt-interactive-coding-1',
      skills: ['programming', 'python', 'loops', 'problem-solving'],
      difficulty: WidgetDifficulty.MEDIUM,
      estimated_time: 300,
      input_type: WidgetInputType.CODE
    },
    config: {
      title: 'Write a For Loop',
      stepNumber: 2,
      totalSteps: 5,
      promptType: 'task' as const,
      bodyMD: 'Write a `for` loop that prints numbers from 1 to 10.',
      example: 'for i in range(1, 11):\n    print(i)',
      tip: 'Remember: range(1, 11) generates numbers from 1 to 10 (inclusive)',
      requiresSubmission: true,
      inputType: 'code' as const,
      inputPlaceholder: '# Write your code here...',
      inputLabel: 'Your Solution',
      skillTags: ['loops', 'range', 'print'],
      difficulty: 'medium' as const,
      estimatedMinutes: 5,
      ctaPrimary: {
        label: 'Submit Answer',
        action: 'submit' as const
      },
      ctaSecondary: {
        showHint: true,
        openCoach: true
      },
      integrations: {
        showHintPanel: true,
        showFeedbackBox: true,
        showCoach: true
      },
      variant: 'default' as const
    }
  },

  /**
   * Timed assessment question
   */
  timedAssessment: {
    metadata: {
      ...STEP_PROMPT_INTERACTIVE_METADATA,
      id: 'step-prompt-interactive-assessment-1',
      skills: ['algebra', 'problem-solving', 'mathematics'],
      difficulty: WidgetDifficulty.HARD,
      estimated_time: 180,
      input_type: WidgetInputType.TEXT
    },
    config: {
      title: 'Solve the Equation',
      stepNumber: 3,
      totalSteps: 10,
      promptType: 'question' as const,
      bodyMD: 'Solve for x: `3x + 7 = 22`',
      requiresSubmission: true,
      inputType: 'text' as const,
      inputPlaceholder: 'x = ?',
      inputLabel: 'Your Answer',
      validateInput: (value: string) => {
        const trimmed = value.trim();
        if (!trimmed) return 'Please enter an answer';
        if (!/^-?\d+(\.\d+)?$/.test(trimmed)) return 'Please enter a valid number';
        return null;
      },
      difficulty: 'hard' as const,
      estimatedMinutes: 3,
      timeRemainingMs: 180000, // 3 minutes
      skillTags: ['linear-equations', 'algebra', 'solving'],
      ctaPrimary: {
        label: 'Submit Answer',
        action: 'submit' as const
      },
      ctaSecondary: {
        showHint: false // No hints in assessment mode
      },
      variant: 'assessment' as const,
      telemetry: {
        cohort: 'fall-2025',
        abBucket: 'control'
      }
    }
  },

  /**
   * Emphatic instruction with media
   */
  emphaticWithMedia: {
    metadata: {
      ...STEP_PROMPT_INTERACTIVE_METADATA,
      id: 'step-prompt-interactive-media-1',
      skills: ['data-structures', 'visualization', 'comprehension'],
      difficulty: WidgetDifficulty.MEDIUM,
      estimated_time: 90,
      input_type: WidgetInputType.TEXT
    },
    config: {
      title: 'Understanding Binary Trees',
      promptType: 'instruction' as const,
      bodyMD: '# Binary Trees\n\nA **binary tree** is a hierarchical data structure where each node has at most two children.',
      assets: [
        '/assets/images/binary-tree-diagram.png',
        '/assets/images/binary-tree-example.png'
      ],
      tip: 'Binary trees are fundamental for many algorithms like binary search and heap operations.',
      difficulty: 'medium' as const,
      estimatedMinutes: 2,
      skillTags: ['binary-trees', 'data-structures', 'algorithms'],
      ctaPrimary: {
        label: 'Next Step',
        action: 'next' as const
      },
      ctaSecondary: {
        openCoach: true
      },
      integrations: {
        showCoach: true
      },
      variant: 'emphatic' as const
    }
  }
};

/**
 * Validation helper for step prompt configurations
 */
export function validateStepPromptConfig(config: any): string[] {
  const errors: string[] = [];

  if (!config.promptType) {
    errors.push('promptType is required');
  }

  if (!config.bodyMD || config.bodyMD.trim().length === 0) {
    errors.push('bodyMD is required and cannot be empty');
  }

  if (!config.ctaPrimary) {
    errors.push('ctaPrimary is required');
  } else {
    if (!config.ctaPrimary.label) {
      errors.push('ctaPrimary.label is required');
    }
    if (!config.ctaPrimary.action) {
      errors.push('ctaPrimary.action is required');
    }
  }

  if (config.requiresSubmission) {
    if (!config.inputType) {
      errors.push('inputType is required when requiresSubmission is true');
    }
    if (config.ctaPrimary?.action !== 'submit') {
      errors.push('ctaPrimary.action should be "submit" when requiresSubmission is true');
    }
  }

  if (config.stepNumber && !config.totalSteps) {
    errors.push('totalSteps is required when stepNumber is provided');
  }

  if (config.totalSteps && !config.stepNumber) {
    errors.push('stepNumber is required when totalSteps is provided');
  }

  if (config.stepNumber && config.totalSteps && config.stepNumber > config.totalSteps) {
    errors.push('stepNumber cannot be greater than totalSteps');
  }

  return errors;
}

