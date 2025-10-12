import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface LabsStatItem {
  label: string;
  value: string | number;
  trend: string;
  iconType: 'arrow' | 'progress' | 'check';
}

@Component({
  selector: 'app-labs-stats',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './labs-stats.html',
  styleUrls: ['./labs-stats.css']
})
export class LabsStatsComponent {
  @Input() stats?: LabsStatItem[];

  defaultStats: LabsStatItem[] = [
    { label: 'Total Labs', value: '12', trend: '+2 this week', iconType: 'arrow' },
    { label: 'In Progress', value: '4', trend: 'Active now', iconType: 'progress' },
    { label: 'Completed', value: '8', trend: '67% completion', iconType: 'check' },
    { label: 'Total Time', value: '18h', trend: '+3h this week', iconType: 'arrow' }
  ];

  get statsToRender(): LabsStatItem[] {
    return this.stats && this.stats.length > 0 ? this.stats : this.defaultStats;
  }

  trackByLabel(index: number, stat: LabsStatItem): string {
    return stat.label;
  }
}