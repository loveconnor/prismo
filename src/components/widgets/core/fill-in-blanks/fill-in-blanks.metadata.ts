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
 * This widget provides a template-based exercise with:
 * - Multiple blank types (text, number, select)
 * - Flexible validation options
 * - Inline hints
 * - Comprehensive feedback
 * - Score calculation
 */
export const FILL_IN_BLANKS_METADATA: WidgetMetadata = {
  // ==================== CORE IDENTIFICATION ====================
  id: 'fill-in-blanks',
  title: 'Fill in the Blanks',
  description: 'Interactive template-based exercises with multiple blank types, validation modes, hints, and comprehensive feedback for contextualized learning.',
  version: '1.0.0',
  category: 'core',

  // ==================== SKILLS & DIFFICULTY ====================
  /**
   * Skills tags for mastery tracking
   */
  skills: [
    'comprehension',
    'vocabulary',
    'recall',
    'application',
    'pattern-recognition',
    'context-clues'
  ],

  /**
   * Difficulty level (1-5 scale)
   * Default is EASY (2), but can be configured per instance
   */
  difficulty: WidgetDifficulty.EASY,

  // ==================== TIME & ESTIMATION ====================
  /**
   * Average completion time in seconds
   * Depends on:
   * - Number of blanks (typically 2-10)
   * - Complexity of content
   * - Type of blanks (select is faster than text)
   */
  estimated_time: 120, // 2 minutes average

  // ==================== INPUT & OUTPUT ====================
  /**
   * Input type - multiple inputs within a template
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
     * - Adjust case sensitivity based on performance
     * - Modify acceptable answers
     * - Add or remove hints dynamically
     */
    difficulty_adjustment: true,

    /**
     * Hint progression: Enable progressive hint disclosure
     * When enabled, the system can:
     * - Show hints after failed attempts
     * - Provide more specific hints over time
     * - Track hint usage for performance analysis
     */
    hint_progression: true,

    /**
     * Time extension: Not applicable for this widget
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

