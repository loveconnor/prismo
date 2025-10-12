import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { WidgetMetadata, WidgetDifficulty, WidgetInputType, WidgetOutputType } from '../types/widget.types';

@Injectable({
  providedIn: 'root'
})
export class WidgetRegistryService {
  private widgetsSubject = new BehaviorSubject<WidgetMetadata[]>([]);
  public widgets$ = this.widgetsSubject.asObservable();

  private registryLoaded = false;

  constructor(private http: HttpClient) {
    this.loadRegistry();
  }

  /**
   * Load widget registry from JSON file
   */
  private loadRegistry(): void {
    this.http.get<WidgetMetadata[]>('/assets/widgets/registry.json')
      .pipe(
        catchError(error => {
          console.warn('Failed to load widget registry, using fallback data:', error);
          return of(this.getFallbackRegistry());
        })
      )
      .subscribe(widgets => {
        this.widgetsSubject.next(widgets);
        this.registryLoaded = true;
      });
  }

  /**
   * Get all widgets
   */
  public getAllWidgets(): Observable<WidgetMetadata[]> {
    return this.widgets$;
  }

  /**
   * Get widget by ID
   */
  public getWidgetById(id: string): Observable<WidgetMetadata | undefined> {
    return this.widgets$.pipe(
      map(widgets => widgets.find(w => w.id === id))
    );
  }

  /**
   * Get widgets by category
   */
  public getWidgetsByCategory(category: 'core' | 'coding' | 'math' | 'writing'): Observable<WidgetMetadata[]> {
    return this.widgets$.pipe(
      map(widgets => widgets.filter(w => w.category === category))
    );
  }

  /**
   * Get widgets by skill tags
   */
  public getWidgetsBySkills(skills: string[]): Observable<WidgetMetadata[]> {
    return this.widgets$.pipe(
      map(widgets => widgets.filter(w => 
        skills.some(skill => w.skills.includes(skill))
      ))
    );
  }

  /**
   * Get widgets by difficulty range
   */
  public getWidgetsByDifficulty(min: WidgetDifficulty, max: WidgetDifficulty): Observable<WidgetMetadata[]> {
    return this.widgets$.pipe(
      map(widgets => widgets.filter(w => 
        w.difficulty >= min && w.difficulty <= max
      ))
    );
  }

  /**
   * Get widgets by input type
   */
  public getWidgetsByInputType(inputType: WidgetInputType): Observable<WidgetMetadata[]> {
    return this.widgets$.pipe(
      map(widgets => widgets.filter(w => w.input_type === inputType))
    );
  }

  /**
   * Get widgets by output type
   */
  public getWidgetsByOutputType(outputType: WidgetOutputType): Observable<WidgetMetadata[]> {
    return this.widgets$.pipe(
      map(widgets => widgets.filter(w => w.output_type === outputType))
    );
  }

  /**
   * Search widgets by criteria
   */
  public searchWidgets(criteria: {
    category?: 'core' | 'coding' | 'math' | 'writing';
    skills?: string[];
    difficulty?: { min: WidgetDifficulty; max: WidgetDifficulty };
    inputType?: WidgetInputType;
    outputType?: WidgetOutputType;
    estimatedTime?: { max: number };
  }): Observable<WidgetMetadata[]> {
    return this.widgets$.pipe(
      map(widgets => {
        return widgets.filter(widget => {
          // Category filter
          if (criteria.category && widget.category !== criteria.category) {
            return false;
          }

          // Skills filter
          if (criteria.skills && criteria.skills.length > 0) {
            const hasMatchingSkill = criteria.skills.some(skill => 
              widget.skills.includes(skill)
            );
            if (!hasMatchingSkill) return false;
          }

          // Difficulty filter
          if (criteria.difficulty) {
            if (widget.difficulty < criteria.difficulty.min || 
                widget.difficulty > criteria.difficulty.max) {
              return false;
            }
          }

          // Input type filter
          if (criteria.inputType && widget.input_type !== criteria.inputType) {
            return false;
          }

          // Output type filter
          if (criteria.outputType && widget.output_type !== criteria.outputType) {
            return false;
          }

          // Estimated time filter
          if (criteria.estimatedTime && widget.estimated_time > criteria.estimatedTime.max) {
            return false;
          }

          return true;
        });
      })
    );
  }

  /**
   * Validate widget dependencies
   */
  public validateDependencies(widgetId: string, availableWidgets: string[]): Observable<boolean> {
    return this.getWidgetById(widgetId).pipe(
      map(widget => {
        if (!widget) return false;
        return widget.dependencies.every(dep => availableWidgets.includes(dep));
      })
    );
  }

  /**
   * Get recommended widgets based on skills and difficulty
   */
  public getRecommendedWidgets(
    targetSkills: string[], 
    currentDifficulty: WidgetDifficulty,
    maxResults: number = 5
  ): Observable<WidgetMetadata[]> {
    return this.widgets$.pipe(
      map(widgets => {
        return widgets
          .filter(widget => {
            // Must have at least one target skill
            const hasTargetSkill = targetSkills.some(skill => 
              widget.skills.includes(skill)
            );
            if (!hasTargetSkill) return false;

            // Difficulty should be appropriate (within 1 level)
            const difficultyDiff = Math.abs(widget.difficulty - currentDifficulty);
            return difficultyDiff <= 1;
          })
          .sort((a, b) => {
            // Prioritize by skill match count, then by difficulty proximity
            const aSkillMatches = targetSkills.filter(skill => a.skills.includes(skill)).length;
            const bSkillMatches = targetSkills.filter(skill => b.skills.includes(skill)).length;
            
            if (aSkillMatches !== bSkillMatches) {
              return bSkillMatches - aSkillMatches;
            }
            
            const aDifficultyDiff = Math.abs(a.difficulty - currentDifficulty);
            const bDifficultyDiff = Math.abs(b.difficulty - currentDifficulty);
            return aDifficultyDiff - bDifficultyDiff;
          })
          .slice(0, maxResults);
      })
    );
  }

  /**
   * Check if registry is loaded
   */
  public isRegistryLoaded(): boolean {
    return this.registryLoaded;
  }

  /**
   * Fallback registry data for development
   */
  private getFallbackRegistry(): WidgetMetadata[] {
    return [
      // Core Widgets
      {
        id: 'step-prompt',
        title: 'Step Prompt',
        description: 'Displays task or question text with optional formatting',
        skills: ['comprehension', 'reading'],
        difficulty: WidgetDifficulty.EASY,
        estimated_time: 30,
        input_type: WidgetInputType.TEXT,
        output_type: WidgetOutputType.SCAFFOLD,
        dependencies: [],
        adaptive_hooks: {
          difficulty_adjustment: true,
          hint_progression: false
        },
        version: '1.0.0',
        category: 'core'
      },
      {
        id: 'hint-panel',
        title: 'Hint Panel',
        description: 'Progressive hint disclosure with multiple tiers',
        skills: ['problem-solving', 'guidance'],
        difficulty: WidgetDifficulty.EASY,
        estimated_time: 60,
        input_type: WidgetInputType.CHECKBOX,
        output_type: WidgetOutputType.SCAFFOLD,
        dependencies: [],
        adaptive_hooks: {
          hint_progression: true,
          time_extension: true
        },
        version: '1.0.0',
        category: 'core'
      },
      {
        id: 'feedback-box',
        title: 'Feedback Box',
        description: 'Shows correctness, explanation, and next steps',
        skills: ['reflection', 'learning'],
        difficulty: WidgetDifficulty.EASY,
        estimated_time: 45,
        input_type: WidgetInputType.TEXT,
        output_type: WidgetOutputType.FEEDBACK,
        dependencies: [],
        adaptive_hooks: {
          difficulty_adjustment: true
        },
        version: '1.0.0',
        category: 'core'
      },
      {
        id: 'confidence-meter',
        title: 'Confidence Meter',
        description: 'Self-rating slider for confidence assessment',
        skills: ['self-assessment', 'metacognition'],
        difficulty: WidgetDifficulty.EASY,
        estimated_time: 20,
        input_type: WidgetInputType.SLIDER,
        output_type: WidgetOutputType.PROGRESS,
        dependencies: [],
        adaptive_hooks: {
          difficulty_adjustment: true
        },
        version: '1.0.0',
        category: 'core'
      },
      // Coding Widget
      {
        id: 'code-editor',
        title: 'Code Editor',
        description: 'Interactive code editor with run and reset functionality',
        skills: ['programming', 'debugging', 'syntax'],
        difficulty: WidgetDifficulty.MEDIUM,
        estimated_time: 300,
        input_type: WidgetInputType.CODE,
        output_type: WidgetOutputType.VISUALIZATION,
        dependencies: [],
        adaptive_hooks: {
          difficulty_adjustment: true,
          hint_progression: true,
          alternative_widgets: ['step-prompt']
        },
        version: '1.0.0',
        category: 'coding'
      },
      // Math Widget
      {
        id: 'equation-input',
        title: 'Equation Input',
        description: 'LaTeX input with mathematical expression validation',
        skills: ['algebra', 'mathematics', 'symbolic-reasoning'],
        difficulty: WidgetDifficulty.MEDIUM,
        estimated_time: 120,
        input_type: WidgetInputType.EQUATION,
        output_type: WidgetOutputType.FEEDBACK,
        dependencies: [],
        adaptive_hooks: {
          difficulty_adjustment: true,
          hint_progression: true
        },
        version: '1.0.0',
        category: 'math'
      },
      // Writing Widget
      {
        id: 'text-editor',
        title: 'Text Editor',
        description: 'Rich text input with word count and structure awareness',
        skills: ['writing', 'composition', 'communication'],
        difficulty: WidgetDifficulty.MEDIUM,
        estimated_time: 180,
        input_type: WidgetInputType.RICH_TEXT,
        output_type: WidgetOutputType.FEEDBACK,
        dependencies: [],
        adaptive_hooks: {
          difficulty_adjustment: true,
          time_extension: true
        },
        version: '1.0.0',
        category: 'writing'
      }
    ];
  }
}
