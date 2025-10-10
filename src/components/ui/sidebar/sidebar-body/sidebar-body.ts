import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { cn } from '../../../../lib/utils';

@Component({
  selector: 'app-sidebar-body',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sidebar-body.html',
  styleUrl: './sidebar-body.css'
})
export class SidebarBodyComponent {
  @Input() className = '';

  get bodyClasses(): string {
    return cn(
      'flex flex-1 flex-col overflow-y-auto p-4 [&>[data-slot=section]+[data-slot=section]]:mt-8',
      this.className
    );
  }
}
