import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { cn } from '../../../lib/utils';

@Component({
  selector: 'app-dialog-footer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dialog-footer.html',
  styleUrl: './dialog-footer.css'
})
export class DialogFooterComponent {
  @Input() className = '';

  get footerClasses(): string {
    return cn(
      'flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2',
      this.className
    );
  }
}
