import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface LabStat {
  label: string;
  value: string | number;
  trend?: 'up' | 'down' | 'neutral';
  icon?: string;
}

@Component({
  selector: 'app-labs-stats',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './labs-stats.html',
  styleUrls: ['./labs-stats.css']
})
export class LabsStatsComponent {
  @Input() stats: LabStat[] = [];

  trackByLabel(index: number, stat: LabStat): string {
    return stat.label;
  }
}