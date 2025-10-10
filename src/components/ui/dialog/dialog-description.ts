import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { cn } from '../../../lib/utils';

@Component({
  selector: 'app-dialog-description',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dialog-description.html',
  styleUrl: './dialog-description.css'
})
export class DialogDescriptionComponent {
  @Input() className = '';

  get descriptionClasses(): string {
    return cn(
      'text-sm text-muted-foreground',
      this.className
    );
  }
}
