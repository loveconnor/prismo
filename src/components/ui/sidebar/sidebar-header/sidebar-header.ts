import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { cn } from '../../../../lib/utils';

@Component({
  selector: 'app-sidebar-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sidebar-header.html',
  styleUrl: './sidebar-header.css'
})
export class SidebarHeaderComponent {
  @Input() className = '';

  get headerClasses(): string {
    return cn(
      'flex flex-col border-b border-zinc-950/5 p-4 dark:border-white/5 [&>[data-slot=section]+[data-slot=section]]:mt-2.5',
      this.className
    );
  }
}
