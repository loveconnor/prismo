import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { cn } from '../../../lib/utils';

@Component({
  selector: 'app-avatar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './avatar.html',
  styleUrl: './avatar.css'
})
export class AvatarComponent {
  @Input() src?: string;
  @Input() alt?: string;
  @Input() fallback?: string;
  @Input() className = '';
  @Input() size: 'sm' | 'md' | 'lg' = 'md';

  get avatarClasses(): string {
    const sizeClasses = {
      'sm': 'h-8 w-8',
      'md': 'h-10 w-10',
      'lg': 'h-12 w-12'
    };

    return cn(
      'relative flex shrink-0 overflow-hidden rounded-full',
      sizeClasses[this.size],
      this.className
    );
  }

  get imageClasses(): string {
    return cn(
      'aspect-square h-full w-full object-cover'
    );
  }

  get fallbackClasses(): string {
    return cn(
      'flex h-full w-full items-center justify-center rounded-full bg-muted text-muted-foreground'
    );
  }
}
