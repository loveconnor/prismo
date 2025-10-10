import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { cn } from '../../../../lib/utils';

@Component({
  selector: 'app-sidebar-label',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sidebar-label.html',
  styleUrl: './sidebar-label.css'
})
export class SidebarLabelComponent {
  @Input() className = '';

  get labelClasses(): string {
    return cn(
      'truncate',
      this.className
    );
  }
}
