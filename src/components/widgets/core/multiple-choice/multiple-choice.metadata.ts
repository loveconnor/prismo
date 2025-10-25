import { WidgetMetadata, WidgetDifficulty, WidgetInputType, WidgetOutputType } from '../../../../types/widget.types';

/**
 * Multiple Choice Widget Metadata
 * 
 * A versatile multiple choice question widget supporting single or multiple selection modes,
 * option shuffling, rationale display, and automatic correctness validation.
 */
export const MULTIPLE_CHOICE_METADATA: WidgetMetadata = {
  id: 'multiple-choice',
  title: 'Multiple Choice',
  description: 'Interactive multiple choice questions with single or multiple selection modes, shuffling, rationale display, and validation',
  skills: [
    'comprehension',
    'knowledge-recall',
    'critical-thinking',
    'decision-making',
    'pattern-recognition'
  ],
  difficulty: WidgetDifficulty.EASY,
  estimated_time: 60, // 1 minute per question
  input_type: WidgetInputType.MULTIPLE_CHOICE,
  output_type: WidgetOutputType.FEEDBACK,
  dependencies: [],
  adaptive_hooks: {
    difficulty_adjustment: true,
    hint_progression: false,
    time_extension: false,
    alternative_widgets: ['true-false', 'matching', 'fill-in-blank']
  },
  version: '1.0.0',
  category: 'core'
};

/**
 * Example usage configurations for the Multiple Choice widget
 */
export const MULTIPLE_CHOICE_EXAMPLES = {
  /**
   * Basic single choice question
   */
  singleChoice: {
    metadata: MULTIPLE_CHOICE_METADATA,
    props: {
      id: 'example-mc-1',
      question: 'What is the capital of France?',
      options: [
        { id: '1', label: 'London', value: 'london', isCorrect: false },
        { id: '2', label: 'Berlin', value: 'berlin', isCorrect: false },
        { id: '3', label: 'Paris', value: 'paris', isCorrect: true },
        { id: '4', label: 'Madrid', value: 'madrid', isCorrect: false }
      ],
      selectionMode: 'single' as const,
      correctAnswers: ['paris'],
      required: true,
      ui: {
        variant: 'default' as const,
        emphasizeCorrect: true
      }
    }
  },

  /**
   * Multiple selection with rationale
   */
  multipleChoiceWithRationale: {
    metadata: MULTIPLE_CHOICE_METADATA,
    props: {
      id: 'example-mc-2',
      question: 'Which of the following are programming languages?',
      options: [
        { 
          id: '1', 
          label: 'Python', 
          value: 'python', 
          isCorrect: true,
          rationale: 'Python is a high-level, interpreted programming language.'
        },
        { 
          id: '2', 
          label: 'HTML', 
          value: 'html', 
          isCorrect: false,
          rationale: 'HTML is a markup language, not a programming language.'
        },
        { 
          id: '3', 
          label: 'JavaScript', 
          value: 'javascript', 
          isCorrect: true,
          rationale: 'JavaScript is a programming language commonly used for web development.'
        },
        { 
          id: '4', 
          label: 'CSS', 
          value: 'css', 
          isCorrect: false,
          rationale: 'CSS is a stylesheet language, not a programming language.'
        },
        { 
          id: '5', 
          label: 'Java', 
          value: 'java', 
          isCorrect: true,
          rationale: 'Java is an object-oriented programming language.'
        }
      ],
      selectionMode: 'multiple' as const,
      correctAnswers: ['python', 'javascript', 'java'],
      showRationale: true,
      required: true,
      ui: {
        variant: 'default' as const,
        emphasizeCorrect: true,
        showCheckboxes: true
      }
    }
  },

  /**
   * Assessment variant with shuffling
   */
  assessmentQuestion: {
    metadata: MULTIPLE_CHOICE_METADATA,
    props: {
      id: 'example-mc-3',
      question: 'What is the time complexity of binary search in a sorted array?',
      options: [
        { 
          id: '1', 
          label: 'O(n)', 
          value: 'on', 
          isCorrect: false,
          rationale: 'O(n) is linear time complexity, which is slower than binary search.'
        },
        { 
          id: '2', 
          label: 'O(log n)', 
          value: 'ologn', 
          isCorrect: true,
          rationale: 'Binary search divides the search space in half each iteration, resulting in O(log n).'
        },
        { 
          id: '3', 
          label: 'O(n log n)', 
          value: 'onlogn', 
          isCorrect: false,
          rationale: 'O(n log n) is typical for efficient sorting algorithms, not searching.'
        },
        { 
          id: '4', 
          label: 'O(n²)', 
          value: 'on2', 
          isCorrect: false,
          rationale: 'O(n²) is quadratic time complexity, much slower than binary search.'
        }
      ],
      selectionMode: 'single' as const,
      correctAnswers: ['ologn'],
      shuffleOptions: true,
      showRationale: true,
      required: true,
      ui: {
        variant: 'assessment' as const,
        emphasizeCorrect: true
      }
    }
  },

  /**
   * Compact variant without required answer
   */
  compactOptional: {
    metadata: MULTIPLE_CHOICE_METADATA,
    props: {
      id: 'example-mc-4',
      question: 'How would you rate your understanding of this topic?',
      options: [
        { id: '1', label: 'Not confident at all', value: '1' },
        { id: '2', label: 'Slightly confident', value: '2' },
        { id: '3', label: 'Moderately confident', value: '3' },
        { id: '4', label: 'Very confident', value: '4' },
        { id: '5', label: 'Extremely confident', value: '5' }
      ],
      selectionMode: 'single' as const,
      required: false,
      allowDeselect: true,
      ui: {
        variant: 'compact' as const,
        emphasizeCorrect: false
      }
    }
  },

  /**
   * Multiple selection with many options
   */
  complexMultipleChoice: {
    metadata: MULTIPLE_CHOICE_METADATA,
    props: {
      id: 'example-mc-5',
      question: 'Which of the following are valid HTTP methods? (Select all that apply)',
      options: [
        { id: '1', label: 'GET', value: 'get', isCorrect: true },
        { id: '2', label: 'POST', value: 'post', isCorrect: true },
        { id: '3', label: 'SEND', value: 'send', isCorrect: false },
        { id: '4', label: 'PUT', value: 'put', isCorrect: true },
        { id: '5', label: 'DELETE', value: 'delete', isCorrect: true },
        { id: '6', label: 'REMOVE', value: 'remove', isCorrect: false },
        { id: '7', label: 'PATCH', value: 'patch', isCorrect: true },
        { id: '8', label: 'UPDATE', value: 'update', isCorrect: false }
      ],
      selectionMode: 'multiple' as const,
      correctAnswers: ['get', 'post', 'put', 'delete', 'patch'],
      showRationale: false,
      required: true,
      ui: {
        variant: 'default' as const,
        emphasizeCorrect: true
      }
    }
  }
};


