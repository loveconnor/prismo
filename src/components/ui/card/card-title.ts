import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { cn } from '../../../lib/utils';

@Component({
  selector: 'app-card-title',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './card-title.html',
  styleUrl: './card-title.css'
})
export class CardTitleComponent {
  @Input() className = '';

  get titleClasses(): string {
    return cn(
      'text-2xl font-semibold leading-none tracking-tight',
      this.className
    );
  }
}
