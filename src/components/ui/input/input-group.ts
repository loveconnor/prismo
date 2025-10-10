import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { cn } from '../../../lib/utils';

@Component({
  selector: 'app-input-group',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './input-group.html',
  styleUrl: './input-group.css'
})
export class InputGroupComponent {
  @Input() className = '';

  get groupClasses(): string {
    return cn(
      // Base layout
      'relative isolate block',
      // Icon positioning for first child
      'has-[[data-slot=icon]:first-child]:[&_input]:pl-10 has-[[data-slot=icon]:last-child]:[&_input]:pr-10',
      'sm:has-[[data-slot=icon]:first-child]:[&_input]:pl-8 sm:has-[[data-slot=icon]:last-child]:[&_input]:pr-8',
      // Icon styling - properly centered vertically
      '*:data-[slot=icon]:pointer-events-none *:data-[slot=icon]:absolute *:data-[slot=icon]:top-1/2 *:data-[slot=icon]:-translate-y-1/2 *:data-[slot=icon]:z-10 *:data-[slot=icon]:size-5',
      'sm:*:data-[slot=icon]:size-4',
      // Icon positioning
      '[&>[data-slot=icon]:first-child]:left-3 sm:[&>[data-slot=icon]:first-child]:left-2.5',
      '[&>[data-slot=icon]:last-child]:right-3 sm:[&>[data-slot=icon]:last-child]:right-2.5',
      // Icon colors
      '*:data-[slot=icon]:text-muted-foreground',
      this.className
    );
  }
}
