import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonComponent } from '../../ui/button/button';
import { ProgressComponent } from '../../ui/progress/progress';
import { LabCardDropdownComponent } from '../lab-card-dropdown/lab-card-dropdown';
import { LabsService, Lab as ServiceLab } from '../../../services/labs.service';
import { UserProgressService, UserLabProgress } from '../../../services/user-progress.service';
import { takeUntil, combineLatest } from 'rxjs/operators';
import { Subject, forkJoin } from 'rxjs';

export type LabStatus = 'in-progress' | 'completed';
export type LabDifficulty = 'easy' | 'medium' | 'hard';
export type LabsFilter = 'all' | LabStatus;
export type LabsSortBy = 'recent' | 'progress' | 'time' | 'title';

export interface Lab {
  id: string;
  title: string;
  status: LabStatus;
  difficulty: LabDifficulty;
  language: string;
  time: string;
  progress: number;
  icon: 'tree' | 'react' | 'list' | 'monitor' | 'arrows';
  completedDate?: string;
  bookmarked?: boolean;
}

@Component({
  selector: 'app-labs-grid',
  standalone: true,
  imports: [CommonModule, ButtonComponent, ProgressComponent, LabCardDropdownComponent],
  templateUrl: './labs-grid.html',
  styleUrls: ['./labs-grid.css']
})
export class LabsGridComponent implements OnInit, OnDestroy {
  @Input() searchQuery = '';
  @Input() filter: LabsFilter = 'all';
  @Input() sortBy: LabsSortBy = 'recent';

  @Output() labClick = new EventEmitter<Lab>();
  @Output() labAction = new EventEmitter<{ lab: Lab; action: string }>();

  private destroy$ = new Subject<void>();
  private labsService = inject(LabsService);
  private userProgressService = inject(UserProgressService);
  private cdr = inject(ChangeDetectorRef);

  public labs: Lab[] = [];
  public loading = true;
  public error: string | null = null;

  ngOnInit(): void {
    this.loadLabs();
    
    // Subscribe to labs$ observable to auto-refresh when data changes
    this.labsService.labs$
      .pipe(takeUntil(this.destroy$))
      .subscribe(labs => {
        if (labs.length > 0) {
          // Reload progress and update display
          this.userProgressService.getUserLabProgress()
            .pipe(takeUntil(this.destroy$))
            .subscribe(progress => {
              this.labs = labs.map(lab => this.convertServiceLabToLab(lab, progress));
              this.loading = false;
              this.cdr.detectChanges();
            });
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  public loadLabs(): void {
    this.loading = true;
    this.error = null;
    
    // Fetch both labs and user progress in parallel
    forkJoin({
      labs: this.labsService.getAllLabs(),
      progress: this.userProgressService.getUserLabProgress()
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ({ labs, progress }) => {
          // Convert ServiceLab to Lab format with real progress data
          this.labs = labs.map(lab => this.convertServiceLabToLab(lab, progress));
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error loading labs:', error);
          this.error = 'Failed to load labs';
          this.loading = false;
          this.cdr.detectChanges();
        }
      });
  }

  private convertServiceLabToLab(serviceLab: ServiceLab, userProgress: UserLabProgress[]): Lab {
    // Convert difficulty number to string
    const difficultyMap: { [key: number]: LabDifficulty } = {
      1: 'easy',
      2: 'easy', 
      3: 'medium',
      4: 'hard',
      5: 'hard'
    };

    // Convert estimated duration from seconds to minutes
    const durationMinutes = Math.round((serviceLab.estimated_duration || 0) / 60);
    const timeString = `${durationMinutes} min`;

    // Determine language from skills/tags
    const language = this.extractLanguageFromSkills(serviceLab.skills || []);

    // Find user progress for this lab
    const labProgress = userProgress.find(p => p.lab_id === serviceLab.id);
    
    // Use real progress data or defaults
    const status = this.userProgressService.getLabStatusForDisplay(labProgress);
    const progress = this.userProgressService.getProgressPercentage(labProgress);
    const completedDate = this.userProgressService.getCompletionDate(labProgress);

    return {
      id: serviceLab.id,
      title: serviceLab.title,
      status,
      difficulty: difficultyMap[serviceLab.difficulty] || 'medium',
      language,
      time: timeString,
      progress,
      icon: this.getIconFromSkills(serviceLab.skills || []),
      completedDate,
      bookmarked: Math.random() > 0.7 // Could be tracked in user preferences
    };
  }

  private extractLanguageFromSkills(skills: string[]): string {
    const languageMap: { [key: string]: string } = {
      'python': 'Python',
      'javascript': 'JavaScript',
      'typescript': 'TypeScript',
      'java': 'Java',
      'cpp': 'C++',
      'c': 'C',
      'sql': 'SQL',
      'css': 'CSS',
      'html': 'HTML',
      'react': 'React',
      'node': 'Node.js',
      'angular': 'Angular'
    };

    for (const skill of skills) {
      const lowerSkill = skill.toLowerCase();
      for (const [key, value] of Object.entries(languageMap)) {
        if (lowerSkill.includes(key)) {
          return value;
        }
      }
    }

    return 'General';
  }

  private getIconFromSkills(skills: string[]): Lab['icon'] {
    const skillString = skills.join(' ').toLowerCase();
    
    if (skillString.includes('tree') || skillString.includes('algorithm')) return 'tree';
    if (skillString.includes('react') || skillString.includes('frontend')) return 'react';
    if (skillString.includes('sql') || skillString.includes('database')) return 'list';
    if (skillString.includes('api') || skillString.includes('backend')) return 'monitor';
    if (skillString.includes('css') || skillString.includes('layout')) return 'arrows';
    
    return 'tree'; // default
  }


  onLabClick(lab: Lab) {
    this.labClick.emit(lab);
  }

  onLabAction(lab: Lab, action: string) {
    this.labAction.emit({ lab, action });
  }

  getBadgeClasses(lab: Lab): string {
    if (lab.status === 'completed') {
      return 'rounded-full px-2.5 py-1 font-medium bg-[#22c55e]/10 text-[#22c55e]';
    }

    switch (lab.difficulty) {
      case 'easy':
        return 'rounded-full px-2.5 py-1 font-medium bg-[#22c55e]/10 text-[#22c55e]';
      case 'medium':
        return 'rounded-full px-2.5 py-1 font-medium bg-[#f59e0b]/10 text-[#f59e0b]';
      case 'hard':
        return 'rounded-full px-2.5 py-1 font-medium bg-[#ef4444]/10 text-[#ef4444]';
      default:
        return 'rounded-full px-2.5 py-1 font-medium bg-muted text-foreground';
    }
  }

  getProgressBarClass(lab: Lab): string {
    return lab.status === 'completed' ? 'bg-[#22c55e]' : 'bg-[#BC78F9]';
  }

  getProgressNote(lab: Lab): string {
    if (lab.status === 'completed') {
      return lab.completedDate ? `Completed on ${lab.completedDate}` : 'Completed';
    }

    return `${lab.progress}% complete`;
  }

  trackByLabId(index: number, lab: Lab): string {
    return lab.id;
  }

  get visibleLabs(): Lab[] {
    if (this.loading || this.error) {
      return [];
    }

    const query = this.searchQuery.trim().toLowerCase();

    const filtered = this.labs.filter((lab) => {
      const matchesSearch = query.length === 0
        ? true
        : [lab.title, lab.language, lab.difficulty, lab.status].join(' ').toLowerCase().includes(query);

      const matchesFilter = this.filter === 'all' ? true : lab.status === this.filter;

      return matchesSearch && matchesFilter;
    });

    const parseMinutes = (time: string): number => {
      const value = parseInt(time.split(' ')[0], 10);
      return Number.isNaN(value) ? 0 : value;
    };

    switch (this.sortBy) {
      case 'progress':
        return [...filtered].sort((a, b) => b.progress - a.progress);
      case 'time':
        return [...filtered].sort((a, b) => parseMinutes(b.time) - parseMinutes(a.time));
      case 'title':
        return [...filtered].sort((a, b) => a.title.localeCompare(b.title));
      case 'recent':
      default:
        return filtered;
    }
  }
}
