import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { cn } from '../../../../lib/utils';

@Component({
  selector: 'app-navbar-spacer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './navbar-spacer.html',
  styleUrl: './navbar-spacer.css'
})
export class NavbarSpacerComponent {
  @Input() className = '';

  get spacerClasses(): string {
    return cn(
      '-ml-4 flex-1',
      this.className
    );
  }
}
