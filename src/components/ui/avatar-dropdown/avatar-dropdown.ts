import { Component, EventEmitter, HostBinding, Inject, Input, OnInit, Output, ViewChild, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { provideIcons, NgIconComponent } from '@ng-icons/core';
import { lucideUser, lucideMoon, lucideSun, lucideLogOut } from '@ng-icons/lucide';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AvatarComponent } from '../avatar/avatar';
import { DropdownMenuComponent } from '../dropdown-menu/dropdown-menu';
import { SwitchComponent } from '../switch/switch';
import { DialogComponent } from '../dialog/dialog';
import { DialogHeaderComponent } from '../dialog/dialog-header';
import { DialogTitleComponent } from '../dialog/dialog-title';
import { DialogDescriptionComponent } from '../dialog/dialog-description';
import { DialogFooterComponent } from '../dialog/dialog-footer';
import { ButtonComponent } from '../button/button';
import { ThemeService } from '../../../services/theme.service';
import { cn } from '../../../lib/utils';

export interface AvatarDropdownUser {
  name: string;
  email: string;
  role: string;
  avatarUrl?: string;
}

type ThemeVariant = 'light' | 'dark';

@Component({
  selector: 'app-avatar-dropdown',
  standalone: true,
  providers: [
    provideIcons({
      lucideUser,
      lucideMoon,
      lucideSun,
      lucideLogOut
    })
  ],
  imports: [
    CommonModule,
    FormsModule,
    NgIconComponent,
    AvatarComponent,
    DropdownMenuComponent,
    SwitchComponent,
    DialogComponent,
    DialogHeaderComponent,
    DialogTitleComponent,
    DialogDescriptionComponent,
    DialogFooterComponent,
    ButtonComponent
  ],
  templateUrl: './avatar-dropdown.html',
  styleUrls: ['./avatar-dropdown.css']
})
export class AvatarDropdownComponent implements OnInit {
  @Input() user: AvatarDropdownUser = {
    name: 'Student L.',
    email: 'love.563@buckeyemail.osu.edu',
    role: 'Student'
  };
  @Input() variant: 'icon' | 'sidebar' = 'icon';
  @Input() triggerClassName = '';

  @Output() logout = new EventEmitter<void>();
  @Output() themeChange = new EventEmitter<ThemeVariant>();

  @ViewChild(DropdownMenuComponent) dropdownMenu?: DropdownMenuComponent;

  isDarkMode = true;
  menuOpen = false;
  settingsOpen = false;

  @HostBinding('attr.data-slot') dataSlot = 'avatar';
  @HostBinding('attr.data-variant') get dataVariant(): string {
    return this.variant;
  }

  constructor(
    private router: Router,
    private themeService: ThemeService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    this.isDarkMode = this.themeService.isDarkMode();
  }

  get initials(): string {
    return this.user.name
      .split(' ')
      .filter(Boolean)
      .map((segment) => segment[0]?.toUpperCase() ?? '')
      .join('')
      .slice(0, 2) || 'SL';
  }

  get triggerAvatarSrc(): string | undefined {
    return this.user.avatarUrl || undefined;
  }

  onOpenChange(open: boolean): void {
    this.menuOpen = open;
  }

  openProfile(): void {
    this.closeMenu();
    this.settingsOpen = true;
  }

  handleThemeToggle(checked: boolean): void {
    this.isDarkMode = checked;
    const desiredTheme: ThemeVariant = checked ? 'dark' : 'light';

    if (this.themeService.isDarkMode() !== checked) {
      this.themeService.toggleTheme();
    }

    this.themeChange.emit(desiredTheme);
  }

  async handleLogout(): Promise<void> {
    this.closeMenu();

    if (this.isBrowser() && typeof window !== 'undefined' && typeof window.confirm === 'function') {
      const confirmed = window.confirm('Are you sure you want to sign out?');
      if (!confirmed) {
        return;
      }
    }

    this.logout.emit();
    await this.router.navigate(['/']);
  }

  closeSettings(): void {
    this.settingsOpen = false;
  }

  private closeMenu(): void {
    this.dropdownMenu?.close();
  }

  private isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  get triggerClasses(): string {
    const isDark = this.themeService.isDarkMode();

    if (this.variant === 'sidebar') {
      return cn(
        'flex w-full items-center justify-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors text-center',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3b82f6] focus-visible:ring-offset-2',
        isDark
          ? 'text-[#a9b1bb] hover:bg-white/5 focus-visible:ring-offset-[#0b0f14]'
          : 'text-zinc-700 hover:bg-zinc-950/5 focus-visible:ring-offset-white',
        this.triggerClassName
      );
    }

    return cn(
      'inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-[#111827] transition-all',
      'hover:shadow-[0_0_0_3px_rgba(59,130,246,0.1)] focus:outline-none focus:ring-2 focus:ring-[#3b82f6] focus:ring-offset-2 focus:ring-offset-[#0b0f14]',
      this.triggerClassName
    );
  }

  get avatarClasses(): string {
    const isDark = this.themeService.isDarkMode();

    if (this.variant === 'sidebar') {
      return cn(
        'shrink-0 border',
        isDark ? 'border-white/10' : 'border-zinc-200'
      );
    }

    return 'h-full w-full';
  }

  get nameClasses(): string {
    const isDark = this.themeService.isDarkMode();

    return cn(
      'truncate text-sm font-medium text-center',
      isDark ? 'text-[#e5e7eb]' : 'text-zinc-900'
    );
  }

  get triggerAriaLabel(): string {
    return this.variant === 'sidebar'
      ? `Account menu for ${this.user?.name ?? 'user'}`
      : 'Account menu';
  }
}
