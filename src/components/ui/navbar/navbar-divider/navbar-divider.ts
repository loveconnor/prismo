import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { cn } from '../../../../lib/utils';

@Component({
  selector: 'app-navbar-divider',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './navbar-divider.html',
  styleUrl: './navbar-divider.css'
})
export class NavbarDividerComponent {
  @Input() className = '';

  get dividerClasses(): string {
    return cn(
      'h-6 w-px bg-border',
      this.className
    );
  }
}
