import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { cn } from '../../../lib/utils';

@Component({
  selector: 'app-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './card.html',
  styleUrl: './card.css'
})
export class CardComponent {
  @Input() className = '';

  get cardClasses(): string {
    return cn(
      'rounded-lg border bg-card text-card-foreground shadow-sm',
      this.className
    );
  }
}
