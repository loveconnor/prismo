import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardComponent } from '../../ui/card/card';
import { CardContentComponent } from '../../ui/card/card-content';
import { ButtonComponent } from '../../ui/button/button';
import { ProgressComponent } from '../../ui/progress/progress';

export interface Lab {
  id: string;
  title: string;
  description: string;
  progress: number;
  timeSpent: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  status: 'not-started' | 'in-progress' | 'completed';
  tags: string[];
  lastAccessed?: Date;
}

@Component({
  selector: 'app-labs-grid',
  standalone: true,
  imports: [CommonModule, CardComponent, CardContentComponent, ButtonComponent, ProgressComponent],
  templateUrl: './labs-grid.html',
  styleUrls: ['./labs-grid.css']
})
export class LabsGridComponent {
  @Input() labs: Lab[] = [];
  @Output() labClick = new EventEmitter<Lab>();
  @Output() labAction = new EventEmitter<{lab: Lab, action: string}>();

  onLabClick(lab: Lab) {
    this.labClick.emit(lab);
  }

  onLabAction(lab: Lab, action: string) {
    this.labAction.emit({lab, action});
  }

  getDifficultyColor(difficulty: string): string {
    switch (difficulty) {
      case 'beginner': return 'green';
      case 'intermediate': return 'yellow';
      case 'advanced': return 'red';
      default: return 'gray';
    }
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'completed': return 'green';
      case 'in-progress': return 'blue';
      case 'not-started': return 'gray';
      default: return 'gray';
    }
  }

  trackByLabId(index: number, lab: Lab): string {
    return lab.id;
  }
}