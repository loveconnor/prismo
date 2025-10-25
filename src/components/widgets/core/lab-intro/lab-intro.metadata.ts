import { WidgetMetadata, WidgetDifficulty, WidgetInputType, WidgetOutputType } from '../../../../types/widget.types';
import type { LabDifficulty } from './lab-intro';

/**
 * Lab Introduction Widget Metadata
 * 
 * A comprehensive lab landing page that presents the lab overview, objectives,
 * prerequisites, skills, estimated time, and provides clear CTAs to start or resume.
 * Supports hero, card, and modal variants for different contexts.
 */
export const LAB_INTRO_METADATA: WidgetMetadata = {
  id: 'lab-intro',
  title: 'Lab Introduction',
  description: 'Comprehensive lab landing page with objectives, prerequisites, skills, and start/resume functionality. Supports gated prerequisites and progress tracking.',
  skills: [
    'information-architecture',
    'user-onboarding',
    'prerequisite-gating',
    'progress-tracking',
    'call-to-action',
    'responsive-design'
  ],
  difficulty: WidgetDifficulty.MEDIUM,
  estimated_time: 120, // 2 minutes to read and start
  input_type: WidgetInputType.TEXT,
  output_type: WidgetOutputType.COMPLETION,
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

/**
 * Example usage configurations for the Lab Introduction widget
 */
export const LAB_INTRO_EXAMPLES = {
  /**
   * Basic lab introduction with minimal configuration
   */
  basicLab: {
    metadata: LAB_INTRO_METADATA,
    props: {
      id: 'example-lab-intro-1',
      labId: 'intro-to-python',
      title: 'Introduction to Python Programming',
      subtitle: 'Learn the fundamentals of Python',
      objective: [
        'Understand Python syntax and data types',
        'Write and execute Python programs',
        'Work with variables, conditionals, and loops',
        'Debug simple Python code'
      ],
      difficulty: 'easy' as const,
      estimatedMinutes: 45,
      skills: ['python', 'programming-basics', 'syntax', 'debugging'],
      ui: {
        variant: 'hero' as const,
        showSkillChips: true,
        showMiniSyllabus: false,
        compact: false
      }
    }
  },

  /**
   * Lab with prerequisites and requirements
   */
  advancedLab: {
    metadata: LAB_INTRO_METADATA,
    props: {
      id: 'example-lab-intro-2',
      labId: 'advanced-data-structures',
      title: 'Advanced Data Structures',
      subtitle: 'Master trees, graphs, and heaps',
      objective: [
        'Implement binary trees and balanced trees',
        'Understand graph representations and traversals',
        'Work with heaps and priority queues',
        'Analyze time and space complexity',
        'Solve algorithmic problems using these structures'
      ],
      difficulty: 'hard' as const,
      estimatedMinutes: 120,
      skills: [
        'data-structures',
        'algorithms',
        'trees',
        'graphs',
        'heaps',
        'complexity-analysis'
      ],
      prerequisites: [
        'Basic data structures (arrays, linked lists, stacks, queues)',
        'Big-O notation and complexity analysis',
        'Recursion and iterative algorithms',
        'Object-oriented programming'
      ],
      requirements: [
        { type: 'software' as const, label: 'Python 3.8+', url: 'https://python.org' },
        { type: 'software' as const, label: 'Visual Studio Code', url: 'https://code.visualstudio.com' },
        { type: 'dataset' as const, label: 'Sample graph dataset (provided)' }
      ],
      policy: {
        requirePrereqAck: true,
        showRubricLink: true,
        noAnswerRevealInPreview: true
      },
      ui: {
        variant: 'hero' as const,
        defaultExpanded: true,
        showSkillChips: true,
        showMiniSyllabus: true,
        compact: false
      },
      miniSyllabus: [
        { step: 'Introduction to tree structures', estMin: 10 },
        { step: 'Binary search trees', estMin: 20 },
        { step: 'Balanced trees (AVL, Red-Black)', estMin: 25 },
        { step: 'Graph representations', estMin: 15 },
        { step: 'Graph traversals (BFS, DFS)', estMin: 20 },
        { step: 'Heaps and priority queues', estMin: 20 },
        { step: 'Final project', estMin: 10 }
      ],
      cta: {
        primaryLabel: 'Start lab',
        secondary: [
          { label: 'Preview', action: 'preview' as const },
          { label: 'View rubric', action: 'rubric' as const },
          { label: 'Share', action: 'share' as const }
        ]
      },
      integrations: {
        resumeAvailable: false,
        timerSuggestionMinutes: 120,
        estimationModelOrigin: 'author' as const
      }
    }
  },

  /**
   * Resume scenario with progress
   */
  resumeLab: {
    metadata: LAB_INTRO_METADATA,
    props: {
      id: 'example-lab-intro-3',
      labId: 'web-dev-basics',
      title: 'Web Development Basics',
      subtitle: 'HTML, CSS, and JavaScript fundamentals',
      objective: [
        'Create semantic HTML5 pages',
        'Style pages with modern CSS',
        'Add interactivity with JavaScript',
        'Build a responsive portfolio site'
      ],
      difficulty: 'medium' as const,
      estimatedMinutes: 90,
      skills: ['html', 'css', 'javascript', 'responsive-design'],
      progress: {
        percent: 65,
        lastStepTitle: 'CSS Grid and Flexbox'
      },
      ui: {
        variant: 'card' as const,
        showSkillChips: true,
        showMiniSyllabus: true,
        compact: false
      },
      miniSyllabus: [
        { step: 'HTML structure and semantics', estMin: 15 },
        { step: 'CSS basics and selectors', estMin: 20 },
        { step: 'CSS Grid and Flexbox', estMin: 20 },
        { step: 'JavaScript fundamentals', estMin: 20 },
        { step: 'DOM manipulation', estMin: 15 }
      ],
      integrations: {
        resumeAvailable: true,
        estimationModelOrigin: 'historical' as const
      },
      cta: {
        secondary: [
          { label: 'Start over', action: 'cancel' as const }
        ]
      }
    }
  },

  /**
   * Challenge lab with compact card variant
   */
  challengeLab: {
    metadata: LAB_INTRO_METADATA,
    props: {
      id: 'example-lab-intro-4',
      labId: 'algorithm-challenge',
      title: 'Dynamic Programming Challenge',
      objective: 'Solve 5 dynamic programming problems with optimal solutions',
      difficulty: 'challenge' as const,
      estimatedMinutes: 60,
      skills: ['algorithms', 'dynamic-programming', 'optimization', 'problem-solving'],
      prerequisites: [
        'Strong understanding of recursion',
        'Experience with memoization',
        'Familiarity with time/space complexity'
      ],
      policy: {
        requirePrereqAck: true,
        noAnswerRevealInPreview: true
      },
      ui: {
        variant: 'card' as const,
        showSkillChips: true,
        showMiniSyllabus: false,
        compact: true
      },
      cta: {
        primaryLabel: 'Accept challenge',
        secondary: [
          { label: 'View sample', action: 'sample' as const }
        ]
      },
      integrations: {
        timerSuggestionMinutes: 60,
        estimationModelOrigin: 'ai' as const
      }
    }
  }
};

