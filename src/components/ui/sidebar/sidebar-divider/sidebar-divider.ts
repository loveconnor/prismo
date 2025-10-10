import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { cn } from '../../../../lib/utils';

@Component({
  selector: 'app-sidebar-divider',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sidebar-divider.html',
  styleUrl: './sidebar-divider.css'
})
export class SidebarDividerComponent {
  @Input() className = '';

  get dividerClasses(): string {
    return cn(
      'my-4 border-t border-zinc-950/5 lg:-mx-4 dark:border-white/5',
      this.className
    );
  }
}
