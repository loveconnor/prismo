import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { cn } from '../../../../lib/utils';
import { ThemeService } from '../../../../services/theme.service';

@Component({
  selector: 'app-sidebar-divider',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sidebar-divider.html',
  styleUrl: './sidebar-divider.css'
})
export class SidebarDividerComponent {
  @Input() className = '';

  constructor(private themeService: ThemeService) {}

  get dividerClasses(): string {
    const isDark = this.themeService.isDarkMode();
    
    return cn(
      'my-4 border-t lg:-mx-4',
      isDark ? 'border-white/5' : 'border-zinc-950/10',
      this.className
    );
  }
}
