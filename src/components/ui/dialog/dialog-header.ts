import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { cn } from '../../../lib/utils';

@Component({
  selector: 'app-dialog-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dialog-header.html',
  styleUrl: './dialog-header.css'
})
export class DialogHeaderComponent {
  @Input() className = '';

  get headerClasses(): string {
    return cn(
      'flex flex-col space-y-1.5 text-center sm:text-left',
      this.className
    );
  }
}
