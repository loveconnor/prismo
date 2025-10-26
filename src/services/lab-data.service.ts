import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ModuleToLabConverterService, ModuleData } from './module-to-lab-converter.service';

// Types for lab configuration
export type WidgetSize = 'small' | 'medium' | 'large' | 'full' | 'auto';
export type WidgetVisibility = 'always' | 'after-submission' | 'on-complete' | 'conditional';

export interface WidgetLayout {
  size?: WidgetSize;
  gridColumn?: string;  // e.g., '1 / 3', 'span 2'
  gridRow?: string;     // e.g., '1 / 2', 'span 1'
  order?: number;       // flexbox order
  minHeight?: string;   // e.g., '400px', '50vh'
  maxHeight?: string;
}

export interface WidgetCondition {
  visibility?: WidgetVisibility;
  dependsOn?: string[];  // IDs of widgets that must be completed
  requiresSubmission?: boolean;
  customCondition?: string;  // For future use
}

export interface LabWidget {
  id: string;
  type: string;
  config: any;
  metadata: any;
  stepId?: number;

  layout?: WidgetLayout;
  condition?: WidgetCondition;
  position?: { x: number; y: number };  // Legacy, kept for compatibility
  size?: { width: number; height: number };  // Legacy, kept for compatibility
}

export interface LabSection {
  id: string;
  title: string;
  description?: string;
  widgets: LabWidget[];
  layout?: 'grid' | 'stack' | 'custom' | 'dynamic';
  gridTemplateColumns?: string;  // e.g., 'repeat(3, 1fr)', '2fr 1fr'
  gap?: string;  // e.g., '1rem', '24px'
}

export interface LabStep {
  id: number;
  title: string;
  description?: string;
  instruction?: string;
  example?: string;
}

export interface LabData {
  id: string;
  title: string;
  description: string;
  difficulty: number;
  estimatedTime: number;
  sections: LabSection[];
  steps?: Array<{
    id: number;
    title: string;
    description?: string;
    instruction?: string;
    example?: string;
  }>;
  metadata: {
    author?: string;
    version?: string;
    tags?: string[];
    prerequisites?: string[];
  };
}

@Injectable({
  providedIn: 'root'
})
export class LabDataService {
  private http = inject(HttpClient);
  private converter = inject(ModuleToLabConverterService);

  // Sample lab data - in production, this would come from an API
  private sampleLabs: Record<string, LabData> = {
    'javascript-basics': {
      id: 'javascript-basics',
      title: 'JavaScript Basics Lab',
      description: 'Learn the fundamentals of JavaScript programming through interactive exercises.',
      difficulty: 2,
      estimatedTime: 45,
      sections: [
        {
          id: 'intro',
          title: 'Introduction to JavaScript',
          description: 'Get started with JavaScript basics',
          widgets: [
            {
              id: 'welcome-prompt',
              type: 'step-prompt',
              config: {
                title: 'Welcome to JavaScript!',
                prompt: 'JavaScript is a programming language that runs in web browsers. Let\'s start with some basic concepts.',
                estimatedTime: 120
              },
              metadata: {
                id: 'welcome-prompt',
                title: 'Step Prompt',
                description: 'Introduction step',
                skills: ['javascript', 'basics'],
                difficulty: 1,
                estimated_time: 120,
                input_type: 'none',
                output_type: 'instruction',
                dependencies: [],
                adaptive_hooks: {},
                version: '1.0.0',
                category: 'core'
              }
            }
          ]
        },
        {
          id: 'coding-exercise',
          title: 'Your First Code',
          description: 'Write your first JavaScript function',
          layout: 'grid',
          widgets: [
            {
              id: 'code-editor-1',
              type: 'code-editor',
              config: {
                title: 'Write a greeting function',
                language: 'javascript',
                initialCode: '// Write a function called greet that takes a name and returns "Hello, " + name\n\nfunction greet(name) {\n  // Your code here\n}',
                width: '100%',
                height: '300px',
                enableSyntaxHighlighting: true,
                enableAutoCompletion: true,
                enableLineNumbers: true
              },
              metadata: {
                id: 'code-editor-1',
                title: 'Code Editor',
                description: 'Interactive code editor',
                skills: ['javascript', 'functions'],
                difficulty: 2,
                estimated_time: 300,
                input_type: 'code',
                output_type: 'execution',
                dependencies: [],
                adaptive_hooks: {},
                version: '1.0.0',
                category: 'coding'
              }
            },
            {
              id: 'console-output-1',
              type: 'console-output',
              config: {
                title: 'Test your function',
                placeholder: 'Your function output will appear here...'
              },
              metadata: {
                id: 'console-output-1',
                title: 'Console Output',
                description: 'Code execution output',
                skills: ['debugging'],
                difficulty: 1,
                estimated_time: 60,
                input_type: 'execution',
                output_type: 'feedback',
                dependencies: ['code-editor-1'],
                adaptive_hooks: {},
                version: '1.0.0',
                category: 'coding'
              }
            }
          ]
        },
        {
          id: 'reflection',
          title: 'Reflection & Feedback',
          description: 'Assess your learning progress',
          layout: 'grid',
          widgets: [
            {
              id: 'confidence-meter-1',
              type: 'confidence-meter',
              config: {
                title: 'Rate Your Understanding',
                description: 'How confident are you with JavaScript basics?',
                scaleLabels: ['Not at all', 'Slightly', 'Moderately', 'Very well', 'Completely']
              },
              metadata: {
                id: 'confidence-meter-1',
                title: 'Confidence Meter',
                description: 'Self-assessment widget',
                skills: ['self-assessment'],
                difficulty: 1,
                estimated_time: 60,
                input_type: 'slider',
                output_type: 'progress',
                dependencies: [],
                adaptive_hooks: {},
                version: '1.0.0',
                category: 'core'
              }
            },
            {
              id: 'feedback-box-1',
              type: 'feedback-box',
              config: {
                type: 'success',
                title: 'Great Progress!',
                message: 'You\'ve completed the JavaScript Basics Lab.',
                explanation: 'You\'ve learned the fundamentals of JavaScript programming. Keep practicing to build your skills!',
                nextSteps: ['Try more complex functions', 'Explore DOM manipulation', 'Learn about objects and arrays'],
                showContinueButton: true
              },
              metadata: {
                id: 'feedback-box-1',
                title: 'Feedback Box',
                description: 'Learning feedback',
                skills: ['reflection'],
                difficulty: 1,
                estimated_time: 45,
                input_type: 'completion',
                output_type: 'feedback',
                dependencies: [],
                adaptive_hooks: {},
                version: '1.0.0',
                category: 'core'
              }
            }
          ]
        }
      ],
      metadata: {
        author: 'Prismo Labs',
        version: '1.0.0',
        tags: ['javascript', 'programming', 'basics'],
        prerequisites: []
      }
    },
    'math-equations': {
      id: 'math-equations',
      title: 'Mathematical Equations Lab',
      description: 'Practice solving mathematical equations with interactive tools.',
      difficulty: 3,
      estimatedTime: 60,
      sections: [
        {
          id: 'intro',
          title: 'Introduction to Equations',
          description: 'Learn about different types of equations',
          widgets: [
            {
              id: 'equation-intro',
              type: 'step-prompt',
              config: {
                title: 'Understanding Equations',
                prompt: 'An equation is a mathematical statement that shows two expressions are equal. Let\'s explore different types of equations.',
                estimatedTime: 180
              },
              metadata: {
                id: 'equation-intro',
                title: 'Step Prompt',
                description: 'Introduction to equations',
                skills: ['mathematics', 'equations'],
                difficulty: 2,
                estimated_time: 180,
                input_type: 'none',
                output_type: 'instruction',
                dependencies: [],
                adaptive_hooks: {},
                version: '1.0.0',
                category: 'core'
              }
            }
          ]
        },
        {
          id: 'practice',
          title: 'Practice Equations',
          description: 'Solve equations using the equation input widget',
          widgets: [
            {
              id: 'equation-input-1',
              type: 'equation-input',
              config: {
                title: 'Solve Linear Equations',
                placeholder: 'Enter your equation here (e.g., 2x + 3 = 7)',
                allowVariables: true,
                showSteps: true
              },
              metadata: {
                id: 'equation-input-1',
                title: 'Equation Input',
                description: 'Interactive equation solver',
                skills: ['mathematics', 'algebra'],
                difficulty: 3,
                estimated_time: 600,
                input_type: 'equation',
                output_type: 'solution',
                dependencies: [],
                adaptive_hooks: {},
                version: '1.0.0',
                category: 'math'
              }
            }
          ]
        }
      ],
      metadata: {
        author: 'Prismo Labs',
        version: '1.0.0',
        tags: ['mathematics', 'equations', 'algebra'],
        prerequisites: ['basic-algebra']
      }
    },
    'example-coding-module': {
      id: 'example-coding-module',
      title: 'Introduction to C++ Printing',
      description: 'Learn the basics of C++ through printing to the console.',
      difficulty: 2,
      estimatedTime: 30,
      sections: [
        {
          id: 'intro',
          title: 'Welcome to C++',
          description: 'Get started with your first C++ program',
          layout: 'stack',
          widgets: [
            {
              id: 'step-prompt-1',
              type: 'step-prompt',
              layout: {
                size: 'full'
              },
              config: {
                title: 'Welcome to C++ Printing!',
                prompt: 'In this module, you\'ll learn how to create your first C++ program! It will print out text into the console.',
                estimatedTime: 30
              },
              metadata: {
                id: 'step-prompt-1',
                title: 'Step Prompt',
                description: 'Introduction to C++',
                skills: ['comprehension', 'reading'],
                difficulty: 2,
                estimated_time: 30,
                input_type: 'text',
                output_type: 'scaffold',
                dependencies: [],
                adaptive_hooks: {
                  difficulty_adjustment: true,
                  hint_progression: false
                },
                version: '1.0.0',
                category: 'core'
              }
            }
          ]
        },
        {
          id: 'coding-exercise',
          title: 'Your First C++ Program',
          description: 'Write your first C++ program that prints to the console',
          layout: 'dynamic',
          gridTemplateColumns: '2fr 1fr',
          widgets: [
            {
              id: 'code-editor-1',
              type: 'code-editor',
              layout: {
                size: 'large',
                minHeight: '600px',
                gridColumn: '1',
                gridRow: '1 / span 2'
              },
              config: {
                title: 'Create Your First Program',
                language: 'cpp',
                initialCode: '// Create the int main function that prints out "Hello, human! How are you?"\n\n',
                placeholder: 'Write your code here...',
                testCases: [
                  {
                    id: 'test-1',
                    input: 'main()',
                    expectedOutput: 'Hello, human! How are you?',
                    description: 'Function should print "Hello, human! How are you?"'
                  }
                ],
                width: '100%',
                height: '100%',
                enableSyntaxHighlighting: true,
                enableAutoCompletion: true,
                enableLineNumbers: true
              },
              metadata: {
                id: 'code-editor-1',
                title: 'Code Editor',
                description: 'Interactive C++ code editor',
                skills: ['programming', 'debugging', 'syntax'],
                difficulty: 3,
                estimated_time: 300,
                input_type: 'code',
                output_type: 'visualization',
                dependencies: [],
                adaptive_hooks: {
                  difficulty_adjustment: true,
                  hint_progression: true,
                  alternative_widgets: ['step-prompt']
                },
                version: '1.0.0',
                category: 'coding'
              }
            },
            {
              id: 'hint-panel-1',
              type: 'hint-panel',
              layout: {
                size: 'small',
                gridColumn: '2',
                gridRow: '1',
                minHeight: '300px'
              },
              config: {
                title: 'Need Help?',
                hints: [
                  {
                    id: 'hint-1',
                    tier: 1,
                    text: 'Remember to include <iostream> at the top of your program.',
                    revealed: false
                  },
                  {
                    id: 'hint-2',
                    tier: 2,
                    text: 'Put your code inside the main function: int main() { ... }',
                    revealed: false
                  },
                  {
                    id: 'hint-3',
                    tier: 3,
                    text: 'Use cout to print: cout << "Hello, human! How are you?" << endl;',
                    revealed: false
                  }
                ],
                maxHintsPerTier: 1
              },
              metadata: {
                id: 'hint-panel-1',
                title: 'Hint Panel',
                description: 'Progressive hint disclosure',
                skills: ['problem-solving', 'guidance'],
                difficulty: 2,
                estimated_time: 60,
                input_type: 'checkbox',
                output_type: 'scaffold',
                dependencies: [],
                adaptive_hooks: {
                  hint_progression: true,
                  time_extension: true
                },
                version: '1.0.0',
                category: 'core'
              }
            },
            {
              id: 'console-output-1',
              type: 'console-output',
              layout: {
                size: 'medium',
                gridColumn: '2',
                gridRow: '2',
                minHeight: '250px'
              },
              condition: {
                visibility: 'after-submission',
                dependsOn: ['code-editor-1'],
                requiresSubmission: true
              },
              config: {
                title: 'Console Output',
                placeholder: 'Your code output will appear here after running...',
                showLineNumbers: false
              },
              metadata: {
                id: 'console-output-1',
                title: 'Console Output',
                description: 'Shows code execution results',
                skills: ['debugging'],
                difficulty: 1,
                estimated_time: 60,
                input_type: 'execution',
                output_type: 'feedback',
                dependencies: ['code-editor-1'],
                adaptive_hooks: {},
                version: '1.0.0',
                category: 'coding'
              }
            }
          ]
        },
        {
          id: 'reflection',
          title: 'Reflection & Feedback',
          description: 'Assess your learning progress',
          layout: 'dynamic',
          gridTemplateColumns: '3fr 2fr',
          widgets: [
            {
              id: 'feedback-box-1',
              type: 'feedback-box',
              layout: {
                size: 'large',
                gridColumn: '1',
                minHeight: '200px'
              },
              condition: {
                visibility: 'after-submission',
                dependsOn: ['code-editor-1'],
                requiresSubmission: true
              },
              config: {
                type: 'success',
                title: 'Great Job!',
                message: 'You\'ve successfully completed the C++ printing module!',
                explanation: 'You\'ve learned how to create your first C++ program and print to the console. This is the foundation of C++ programming.',
                nextSteps: [
                  'Try printing different messages',
                  'Learn about variables in C++',
                  'Explore more complex C++ features'
                ],
                showContinueButton: true,
                autoComplete: true
              },
              metadata: {
                id: 'feedback-box-1',
                title: 'Feedback Box',
                description: 'Learning feedback',
                skills: ['reflection', 'learning'],
                difficulty: 2,
                estimated_time: 45,
                input_type: 'text',
                output_type: 'feedback',
                dependencies: [],
                adaptive_hooks: {
                  difficulty_adjustment: true
                },
                version: '1.0.0',
                category: 'core'
              }
            },
            {
              id: 'confidence-meter-1',
              type: 'confidence-meter',
              layout: {
                size: 'medium',
                gridColumn: '2',
                minHeight: '200px'
              },
              condition: {
                visibility: 'after-submission',
                dependsOn: ['code-editor-1'],
                requiresSubmission: true
              },
              config: {
                title: 'Rate Your Confidence',
                description: 'How confident do you feel about C++ printing now?',
                scaleLabels: ['Not confident', 'Slightly confident', 'Moderately confident', 'Very confident', 'Extremely confident'],
                autoSubmit: true
              },
              metadata: {
                id: 'confidence-meter-1',
                title: 'Confidence Meter',
                description: 'Self-assessment widget',
                skills: ['self-assessment', 'metacognition'],
                difficulty: 2,
                estimated_time: 20,
                input_type: 'slider',
                output_type: 'progress',
                dependencies: [],
                adaptive_hooks: {
                  difficulty_adjustment: true
                },
                version: '1.0.0',
                category: 'core'
              }
            }
          ]
        }
      ],
      metadata: {
        author: 'Prismo Labs',
        version: '1.0.0',
        tags: ['c++', 'programming', 'printing', 'console'],
        prerequisites: []
      }
    },
    'javascript-array-methods': {
      id: 'javascript-array-methods-97389c51',
      title: 'Introduction to JavaScript Array Methods',
      description: 'Learn the fundamentals of JavaScript Array Methods through interactive exercises.',
      difficulty: 2,
      estimatedTime: 30,
      sections: [
        {
          id: 'intro',
          title: 'Welcome to JavaScript Array Methods',
          description: 'Get started with JavaScript Array Methods',
          widgets: [
            {
              id: 'step-prompt-1',
              type: 'step-prompt',
              config: {
                title: 'Welcome to JavaScript Array Methods!',
                prompt: 'In this module, you\'ll explore JavaScript Array Methods. Take your time and practice as much as you need.',
                estimatedTime: 30
              },
              metadata: {
                id: 'step-prompt-1',
                title: 'Step Prompt',
                description: 'Introduction to JavaScript Array Methods',
                skills: ['comprehension', 'reading'],
                difficulty: 2,
                estimated_time: 30,
                input_type: 'text',
                output_type: 'scaffold',
                dependencies: [],
                adaptive_hooks: {
                  difficulty_adjustment: true,
                  hint_progression: false
                },
                version: '1.0.0',
                category: 'core'
              }
            }
          ]
        }
      ],
      metadata: {
        author: 'Prismo Labs',
        version: '1.0.0',
        tags: ['javascript', 'programming', 'arrays', 'problem-solving'],
        prerequisites: []
      }
    }
  };

  /**
   * Get lab data by ID
   */
  getLab(labId: string): Observable<LabData> {
    // In production, this would be: return this.http.get<LabData>(`/api/labs/${labId}`)
    const lab = this.sampleLabs[labId];

    if (lab) {
      return of(lab);
    } else {
      return throwError(() => new Error(`Lab with ID "${labId}" not found`));
    }
  }

  /**
   * Get all available labs
   */
  getAllLabs(): Observable<LabData[]> {
    // In production, this would be: return this.http.get<LabData[]>('/api/labs')
    return of(Object.values(this.sampleLabs));
  }

  /**
   * Create a new lab from JSON data
   */
  createLabFromJson(jsonData: any): LabData {
    // Validate and transform JSON data into LabData format
    return {
      id: jsonData.id || 'custom-lab',
      title: jsonData.title || 'Custom Lab',
      description: jsonData.description || 'A custom lab created from JSON data',
      difficulty: jsonData.difficulty || 1,
      estimatedTime: jsonData.estimatedTime || 30,
      sections: jsonData.sections || [],
      steps: jsonData.steps || [],
      metadata: {
        author: jsonData.metadata?.author || 'Custom Author',
        version: jsonData.metadata?.version || '1.0.0',
        tags: jsonData.metadata?.tags || ['custom'],
        prerequisites: jsonData.metadata?.prerequisites || []
      }
    };
  }

  /**
   * Convert module data to lab data
   */
  convertModuleToLab(moduleData: ModuleData): LabData {
    return this.converter.convertModuleToLab(moduleData);
  }

  /**
   * Load lab from module JSON file
   */
  loadLabFromModule(moduleId: string): Observable<LabData> {
    // In production, this would fetch the module JSON from the server
    // For now, we'll return the example-coding-module lab as an example
    if (moduleId === 'pt01' || moduleId === 'example-coding-module') {
      return this.getLab('example-coding-module');
    } else if (moduleId === 'binary-search-tree') {
      return this.getLab('binary-search-tree');
    }

    return throwError(() => new Error(`Module with ID "${moduleId}" not found`));
  }

  /**
   * Save lab data (for future use)
   */
  saveLab(labData: LabData): Observable<LabData> {
    // In production, this would be: return this.http.post<LabData>('/api/labs', labData)
    return of(labData);
  }

  /**
   * Update lab data (for future use)
   */
  updateLab(labId: string, labData: LabData): Observable<LabData> {
    // In production, this would be: return this.http.put<LabData>(`/api/labs/${labId}`, labData)
    return of(labData);
  }

  /**
   * Delete lab (for future use)
   */
  deleteLab(labId: string): Observable<void> {
    // In production, this would be: return this.http.delete<void>(`/api/labs/${labId}`)
    return of(void 0);
  }
}
