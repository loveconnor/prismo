import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { cn } from '../../../lib/utils';

@Component({
  selector: 'app-label',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './label.html',
  styleUrls: ['./label.css']
})
export class LabelComponent {
  @Input() for?: string;
  @Input() className = '';

  get labelClasses(): string {
    return cn(
      'text-sm font-medium leading-none text-muted-foreground peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
      this.className
    );
  }
}
