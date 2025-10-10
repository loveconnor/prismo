import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { cn } from '../../../../lib/utils';

@Component({
  selector: 'app-navbar-label',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './navbar-label.html',
  styleUrl: './navbar-label.css'
})
export class NavbarLabelComponent {
  @Input() className = '';

  get labelClasses(): string {
    return cn(
      'truncate text-foreground',
      this.className
    );
  }
}
