import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { cn } from '../../../../lib/utils';

@Component({
  selector: 'app-sidebar-spacer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sidebar-spacer.html',
  styleUrl: './sidebar-spacer.css'
})
export class SidebarSpacerComponent {
  @Input() className = '';

  get spacerClasses(): string {
    return cn(
      'mt-8 flex-1',
      this.className
    );
  }
}
