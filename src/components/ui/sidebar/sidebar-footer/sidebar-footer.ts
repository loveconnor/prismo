import { Component, Input, HostBinding } from '@angular/core';
import { CommonModule } from '@angular/common';
import { cn } from '../../../../lib/utils';

@Component({
  selector: 'app-sidebar-footer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sidebar-footer.html',
  styleUrl: './sidebar-footer.css'
})
export class SidebarFooterComponent {
  @Input() className = '';

  @HostBinding('class')
  get hostClasses(): string {
    return cn(
      'mt-auto flex flex-col border-t border-zinc-950/5 p-4 dark:border-white/5 [&>[data-slot=section]+[data-slot=section]]:mt-2.5',
      this.className
    );
  }
}
