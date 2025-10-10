import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { cn } from '../../../../lib/utils';

@Component({
  selector: 'app-sidebar-heading',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sidebar-heading.html',
  styleUrl: './sidebar-heading.css'
})
export class SidebarHeadingComponent {
  @Input() className = '';

  get headingClasses(): string {
    return cn(
      'mb-1 px-2 text-xs/6 font-medium text-zinc-500 dark:text-zinc-400',
      this.className
    );
  }
}
