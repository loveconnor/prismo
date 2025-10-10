import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { cn } from '../../../lib/utils';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css'
})
export class NavbarComponent {
  @Input() className = '';

  get navbarClasses(): string {
    return cn(
      'flex flex-1 items-center gap-4 py-2.5',
      this.className
    );
  }
}
