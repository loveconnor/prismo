import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { cn } from '../../../lib/utils';

@Component({
  selector: 'app-card-content',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './card-content.html',
  styleUrl: './card-content.css'
})
export class CardContentComponent {
  @Input() className = '';

  get contentClasses(): string {
    return cn(
      'p-6 pt-0',
      this.className
    );
  }
}
