import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { cn } from '../../../lib/utils';

@Component({
  selector: 'app-card-description',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './card-description.html',
  styleUrl: './card-description.css'
})
export class CardDescriptionComponent {
  @Input() className = '';

  get descriptionClasses(): string {
    return cn(
      'text-sm text-muted-foreground',
      this.className
    );
  }
}
