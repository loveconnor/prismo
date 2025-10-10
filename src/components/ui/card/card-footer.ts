import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { cn } from '../../../lib/utils';

@Component({
  selector: 'app-card-footer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './card-footer.html',
  styleUrl: './card-footer.css'
})
export class CardFooterComponent {
  @Input() className = '';

  get footerClasses(): string {
    return cn(
      'flex items-center p-6 pt-0',
      this.className
    );
  }
}
