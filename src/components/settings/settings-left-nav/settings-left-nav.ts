import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { provideIcons, NgIconComponent } from '@ng-icons/core';
import {
  lucideUser,
  lucideMoon,
  lucideBell,
  lucideLock,
  lucideShield,
  lucideBrain,
  lucideChartBar,
  lucideBookOpen,
  lucideCode
} from '@ng-icons/lucide';
import { ButtonComponent } from '../../ui/button/button';
import { cn } from '../../../lib/utils';
import { ThemeService } from '../../../services/theme.service';

interface NavItem {
  id: string;
  icon: string;
  label: string;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'General',
    items: [
      { id: 'profile', icon: 'lucideUser', label: 'Profile & Preferences' },
      // { id: 'appearance', icon: 'lucideMoon', label: 'Appearance' },
      { id: 'notifications', icon: 'lucideBell', label: 'Notifications' },
      // { id: 'privacy', icon: 'lucideLock', label: 'Privacy & Data' },
      // { id: 'security', icon: 'lucideShield', label: 'Account Security' }
    ]
  },
  {
    label: 'Learning',
    items: [
      { id: 'adaptive', icon: 'lucideBrain', label: 'Adaptive Learning' },
      // { id: 'progress', icon: 'lucideChartBar', label: 'Progress Tracking' },
      // { id: 'curriculum', icon: 'lucideBookOpen', label: 'Curriculum Access' }
    ]
  },
  {
    label: 'Development',
    items: [
      { id: 'code-execution', icon: 'lucideCode', label: 'Code Execution' }
    ]
  }
];

@Component({
  selector: 'app-settings-left-nav',
  standalone: true,
  imports: [CommonModule, ButtonComponent, NgIconComponent],
  providers: [
    provideIcons({
      lucideUser,
      lucideMoon,
      lucideBell,
      lucideLock,
      lucideShield,
      lucideBrain,
      lucideChartBar,
      lucideBookOpen,
      lucideCode
    })
  ],
  templateUrl: './settings-left-nav.html',
  styleUrls: ['./settings-left-nav.css']
})
export class SettingsLeftNavComponent {
  @Input() activeSection = 'profile';
  @Output() sectionChange = new EventEmitter<string>();

  readonly navGroups = NAV_GROUPS;

  constructor(private themeService: ThemeService) {}

  onSelect(sectionId: string): void {
    this.sectionChange.emit(sectionId);
  }

  buttonClasses(isActive: boolean): string {
    const isDark = this.themeService.isDarkMode();

    return cn(
      'w-full justify-start px-3 py-2 text-sm gap-2 rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#BC78F9]/40',
      isActive
        ? isDark
          ? 'bg-[#1f2937] text-[#e5e7eb]'
          : 'bg-[#e0e7ff] text-[#1e3a8a]'
        : isDark
          ? 'text-[#cbd5f5] hover:bg-white/5 hover:text-white'
          : 'text-[#475569] hover:bg-slate-100 hover:text-[#1f2937]'
    );
  }

  iconClasses(isActive: boolean): string {
    const isDark = this.themeService.isDarkMode();

    return cn(
      'h-4 w-4 shrink-0',
      isActive
        ? 'text-[#BC78F9]'
        : isDark
          ? 'text-[#94a3b8]'
          : 'text-[#94a3b8]'
    );
  }
}
