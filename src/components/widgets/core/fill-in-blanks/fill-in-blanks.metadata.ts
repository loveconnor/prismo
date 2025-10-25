/**
 * Fill-in-the-Blanks Widget - Metadata Definition
 * 
 * This file defines the metadata for the fill-in-the-blanks widget
 * following the ACE (Adaptive Curriculum Engine) specification.
 */

import { 
  WidgetMetadata, 
  WidgetDifficulty, 
  WidgetInputType, 
  WidgetOutputType 
} from '../../../../types/widget.types';

/**
 * Metadata for the fill-in-the-blanks widget
 * 
 * This widget provides an interactive template with:
 * - Multiple blank types (text, number, select)
 * - Case-sensitive or insensitive validation
 * - Hints for each blank
 * - Comprehensive feedback
 * - Scoring and results display
 */
export const FILL_IN_BLANKS_METADATA: WidgetMetadata = {
  // ==================== CORE IDENTIFICATION ====================
  id: 'fill-in-blanks',
  title: 'Fill in the Blanks',
  description: 'An interactive template-based widget for fill-in-the-blank exercises with multiple blank types, hints, validation, and comprehensive feedback.',
  version: '1.0.0',
  category: 'core',

  // ==================== SKILLS & DIFFICULTY ====================
  /**
   * Skills tags for mastery tracking
   */
  skills: [
    'comprehension',
    'recall',
    'vocabulary',
    'grammar',
    'attention-to-detail'
  ],

  /**
   * Difficulty level (1-5 scale)
   * Default is EASY (2)
   */
  difficulty: WidgetDifficulty.EASY,

  // ==================== TIME & ESTIMATION ====================
  /**
   * Average completion time in seconds
   * - Simple fill-in-blank: 60-120s
   * - Multiple blanks: 120-240s
   * - Complex template: 240-360s
   */
  estimated_time: 120, // 2 minutes average

  // ==================== INPUT & OUTPUT ====================
  /**
   * Input type - text-based with structured blanks
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
     */
    difficulty_adjustment: true,

    /**
     * Hint progression: Enable progressive hint disclosure
     */
    hint_progression: true,

    /**
     * Time extension: Allow dynamic time adjustments
     */
    time_extension: false,

    /**
     * Alternative widgets: Specify widget IDs that can substitute this widget
     */
    alternative_widgets: [
      'short-answer',
      'multiple-choice',
      'matching'
    ]
  }
};

/**
 * Example configurations for different use cases
 */
export const FILL_IN_BLANKS_EXAMPLES = {
  /**
   * Simple grammar exercise
   */
  grammar: {
    id: 'fill-blanks-grammar-1',
    template: 'The quick brown {{animal}} jumps over the lazy {{animal2}}.',
    blanks: [
      {
        id: 'animal',
        placeholder: 'animal',
        type: 'text' as const,
        correctAnswers: ['fox'],
        caseSensitive: false,
        hint: 'A small wild canine'
      },
      {
        id: 'animal2',
        placeholder: 'animal',
        type: 'text' as const,
        correctAnswers: ['dog'],
        caseSensitive: false,
        hint: 'A common domestic pet'
      }
    ]
  },

  /**
   * Math equation
   */
  math: {
    id: 'fill-blanks-math-1',
    template: 'The equation x + {{num1}} = {{num2}} can be solved by subtracting {{num3}} from both sides, giving x = {{answer}}.',
    blanks: [
      {
        id: 'num1',
        placeholder: 'number',
        type: 'number' as const,
        correctAnswers: ['5'],
        hint: 'A small positive integer'
      },
      {
        id: 'num2',
        placeholder: 'result',
        type: 'number' as const,
        correctAnswers: ['12'],
        hint: 'The sum'
      },
      {
        id: 'num3',
        placeholder: 'operation',
        type: 'number' as const,
        correctAnswers: ['5'],
        hint: 'Same as the first number'
      },
      {
        id: 'answer',
        placeholder: 'x value',
        type: 'number' as const,
        correctAnswers: ['7'],
        hint: 'The final result'
      }
    ]
  },

  /**
   * Multiple choice with select dropdowns
   */
  selectBlanks: {
    id: 'fill-blanks-select-1',
    template: 'JavaScript is a {{type}} language that runs in the {{environment}}.',
    blanks: [
      {
        id: 'type',
        placeholder: 'type',
        type: 'select' as const,
        correctAnswers: ['interpreted'],
        options: ['compiled', 'interpreted', 'assembly', 'markup'],
        hint: 'Executed line by line'
      },
      {
        id: 'environment',
        placeholder: 'where',
        type: 'select' as const,
        correctAnswers: ['browser'],
        options: ['browser', 'database', 'filesystem', 'kernel'],
        hint: 'Web-based environment'
      }
    ]
  },

  /**
   * Science vocabulary
   */
  science: {
    id: 'fill-blanks-science-1',
    template: 'Photosynthesis occurs in the {{organelle}} of plant cells, where {{pigment}} absorbs light energy to convert {{gas}} and water into {{sugar}} and oxygen.',
    blanks: [
      {
        id: 'organelle',
        placeholder: 'cell structure',
        type: 'text' as const,
        correctAnswers: ['chloroplast', 'chloroplasts'],
        caseSensitive: false,
        hint: 'Green organelles in plants'
      },
      {
        id: 'pigment',
        placeholder: 'green pigment',
        type: 'text' as const,
        correctAnswers: ['chlorophyll'],
        caseSensitive: false,
        hint: 'Makes plants green'
      },
      {
        id: 'gas',
        placeholder: 'atmospheric gas',
        type: 'text' as const,
        correctAnswers: ['carbon dioxide', 'CO2'],
        caseSensitive: false,
        hint: 'What we exhale'
      },
      {
        id: 'sugar',
        placeholder: 'product',
        type: 'text' as const,
        correctAnswers: ['glucose'],
        caseSensitive: false,
        hint: 'Simple sugar'
      }
    ]
  }
};

/**
 * Validation helper for fill-in-blanks configurations
 */
export function validateFillInBlanksConfig(config: any): string[] {
  const errors: string[] = [];

  if (!config.id) {
    errors.push('id is required');
  }

  if (!config.template || config.template.trim().length === 0) {
    errors.push('template is required and cannot be empty');
  }

  if (!config.blanks || !Array.isArray(config.blanks) || config.blanks.length === 0) {
    errors.push('blanks array is required and must contain at least one blank');
  }

  if (config.blanks) {
    config.blanks.forEach((blank: any, index: number) => {
      if (!blank.id) {
        errors.push(`blank at index ${index} must have an id`);
      }
      if (!blank.placeholder) {
        errors.push(`blank at index ${index} must have a placeholder`);
      }
      if (!blank.type) {
        errors.push(`blank at index ${index} must have a type`);
      }
      if (!blank.correctAnswers || !Array.isArray(blank.correctAnswers) || blank.correctAnswers.length === 0) {
        errors.push(`blank at index ${index} must have at least one correct answer`);
      }
      if (blank.type === 'select' && (!blank.options || !Array.isArray(blank.options) || blank.options.length === 0)) {
        errors.push(`blank at index ${index} with type 'select' must have options array`);
      }
    });
  }

  return errors;
}

