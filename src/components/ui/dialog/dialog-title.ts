import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { cn } from '../../../lib/utils';

@Component({
  selector: 'app-dialog-title',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dialog-title.html',
  styleUrl: './dialog-title.css'
})
export class DialogTitleComponent {
  @Input() className = '';

  get titleClasses(): string {
    return cn(
      'text-lg font-semibold leading-none tracking-tight',
      this.className
    );
  }
}
