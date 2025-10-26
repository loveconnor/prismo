import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonComponent } from '../../ui/button/button';
import { ProgressComponent } from '../../ui/progress/progress';
import { LabCardDropdownComponent } from '../lab-card-dropdown/lab-card-dropdown';

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
export class LabsGridComponent {
  @Input() searchQuery = '';
  @Input() filter: LabsFilter = 'all';
  @Input() sortBy: LabsSortBy = 'recent';

  @Output() labClick = new EventEmitter<Lab>();
  @Output() labAction = new EventEmitter<{ lab: Lab; action: string }>();

  readonly labs: Lab[] = [
    {
      id: '1',
      title: 'Binary Search Tree Implementation',
      status: 'in-progress',
      difficulty: 'medium',
      language: 'Python',
      time: '45 min',
      progress: 65,
      icon: 'tree',
      bookmarked: true
    },
    {
      id: '2',
      title: 'React Hooks & State Management',
      status: 'completed',
      difficulty: 'medium',
      language: 'JavaScript',
      time: '82 min',
      progress: 100,
      completedDate: 'Oct 1, 2025',
      icon: 'react'
    },
    {
      id: '3',
      title: 'SQL Query Optimization',
      status: 'in-progress',
      difficulty: 'hard',
      language: 'SQL',
      time: '60 min',
      progress: 30,
      icon: 'list'
    },
    {
      id: '4',
      title: 'REST API Design Patterns',
      status: 'completed',
      difficulty: 'medium',
      language: 'Node.js',
      time: '95 min',
      progress: 100,
      completedDate: 'Sep 28, 2025',
      icon: 'monitor'
    },
    {
      id: '5',
      title: 'Dynamic Programming Fundamentals',
      status: 'in-progress',
      difficulty: 'hard',
      language: 'Python',
      time: '120 min',
      progress: 15,
      icon: 'tree'
    },
    {
      id: '6',
      title: 'CSS Grid & Flexbox Mastery',
      status: 'completed',
      difficulty: 'easy',
      language: 'CSS',
      time: '50 min',
      progress: 100,
      completedDate: 'Sep 25, 2025',
      icon: 'arrows'
    }
  ];

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
