import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { cn } from '../../../lib/utils';

@Component({
  selector: 'app-card-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './card-header.html',
  styleUrl: './card-header.css'
})
export class CardHeaderComponent {
  @Input() className = '';

  get headerClasses(): string {
    return cn(
      'flex flex-col space-y-1.5 p-6',
      this.className
    );
  }
}
