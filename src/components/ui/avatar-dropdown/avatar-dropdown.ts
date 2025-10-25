import { Component, EventEmitter, HostBinding, Inject, Input, OnInit, AfterViewInit, Output, ViewChild, PLATFORM_ID, ChangeDetectorRef, effect } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { provideIcons, NgIconComponent } from '@ng-icons/core';
import { lucideUser, lucideMoon, lucideSun, lucideLogOut } from '@ng-icons/lucide';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AvatarComponent } from '../avatar/avatar';
import { DropdownMenuComponent } from '../dropdown-menu/dropdown-menu';
import { SwitchComponent } from '../switch/switch';
import { ThemeService } from '../../../services/theme.service';
import { AuthService } from '../../../services/auth.service';
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
    SwitchComponent
  ],
  templateUrl: './avatar-dropdown.html',
  styleUrls: ['./avatar-dropdown.css']
})
export class AvatarDropdownComponent implements OnInit, AfterViewInit {
  @Input() user: AvatarDropdownUser = {
    name: 'Student L.',
    email: 'love.563@buckeyemail.osu.edu',
    role: 'Student'
  };
  @Input() variant: 'icon' | 'sidebar' = 'icon';
  @Input() triggerClassName = '';

  @Output() logout = new EventEmitter<void>();
  @Output() themeChange = new EventEmitter<ThemeVariant>();
  @Output() profileClick = new EventEmitter<void>();

  @ViewChild(DropdownMenuComponent) dropdownMenu?: DropdownMenuComponent;

  isDarkMode = true;
  menuOpen = false;
  
  get dropdownAlign(): 'start' | 'center' | 'end' {
    return this.variant === 'sidebar' ? 'center' : 'end';
  }
  
  get dropdownSide(): 'top' | 'right' | 'bottom' | 'left' {
    return this.variant === 'sidebar' ? 'top' : 'bottom';
  }

  @HostBinding('attr.data-slot') dataSlot = 'avatar';
  @HostBinding('attr.data-variant') get dataVariant(): string {
    return this.variant;
  }

  constructor(
    private router: Router,
    private themeService: ThemeService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    // React to theme changes and trigger change detection
    effect(() => {
      // Access the signal to create a dependency
      this.themeService.isDarkMode();
      // Update local state
      this.isDarkMode = this.themeService.isDarkMode();
      // Trigger change detection to update getters
      this.cdr.detectChanges();
    });
  }

  ngOnInit(): void {
    this.isDarkMode = this.themeService.isDarkMode();
  }

  ngAfterViewInit(): void {
    // Trigger change detection after view initialization to ensure styles are applied
    setTimeout(() => {
      this.cdr.detectChanges();
    }, 0);
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
    this.profileClick.emit();
  }

  handleThemeToggle(checked: boolean): void {
    this.isDarkMode = checked;
    const desiredTheme: ThemeVariant = checked ? 'dark' : 'light';

    if (this.themeService.isDarkMode() !== checked) {
      this.themeService.toggleTheme();
    }

    this.themeChange.emit(desiredTheme);
    
    // Ensure change detection runs after theme change
    this.cdr.markForCheck();
  }

  async handleLogout(): Promise<void> {
    this.closeMenu();

    // if (this.isBrowser() && typeof window !== 'undefined' && typeof window.confirm === 'function') {
    //   const confirmed = window.confirm('Are you sure you want to sign out?');
    //   if (!confirmed) {
    //     return;
    //   }
    // }

    // Use the auth service to handle logout
    // This will clear cookies, clear user state, and redirect to login
    this.authService.logout();
    
    // Emit the logout event for any parent components that need to know
    this.logout.emit();
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
        'flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-all justify-start w-full max-w-[220px]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
        isDark
          ? 'text-zinc-300 hover:bg-white/5 hover:text-white focus-visible:ring-offset-zinc-950'
          : 'text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 focus-visible:ring-offset-white',
        this.triggerClassName
      );
    }

    return cn(
      'inline-flex h-9 w-9 items-center justify-center rounded-full border transition-all',
      'hover:shadow-[0_0_0_3px_rgba(59,130,246,0.1)] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
      isDark
        ? 'border-white/10 bg-zinc-800 focus:ring-offset-zinc-950'
        : 'border-zinc-200 bg-white focus:ring-offset-white',
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

  get userInfoClasses(): string {
    return 'flex flex-col items-start flex-1 min-w-0';
  }

  get nameClasses(): string {
    const isDark = this.themeService.isDarkMode();

    return cn(
      'truncate text-sm font-medium w-full text-left',
      isDark ? 'text-zinc-100' : 'text-zinc-900'
    );
  }

  get emailClasses(): string {
    const isDark = this.themeService.isDarkMode();

    return cn(
      'truncate text-xs w-full text-left',
      isDark ? 'text-zinc-400' : 'text-zinc-600'
    );
  }

  get triggerAriaLabel(): string {
    return this.variant === 'sidebar'
      ? `Account menu for ${this.user?.name ?? 'user'}`
      : 'Account menu';
  }

  get dropdownClasses(): string {
    const isDark = this.themeService.isDarkMode();
    
    return cn(
      'w-[280px] rounded-xl p-2 shadow-2xl',
      isDark
        ? 'border border-zinc-800 bg-zinc-900'
        : 'border border-zinc-200 bg-white'
    );
  }

  get contentClasses(): string {
    const isDark = this.themeService.isDarkMode();
    
    return cn(
      'text-xs',
      isDark ? 'text-zinc-100' : 'text-zinc-900'
    );
  }

  get headerCardClasses(): string {
    const isDark = this.themeService.isDarkMode();
    
    return cn(
      'mb-2 rounded-lg p-3',
      isDark ? 'bg-zinc-950/50' : 'bg-zinc-50'
    );
  }

  get headerAvatarClasses(): string {
    const isDark = this.themeService.isDarkMode();
    
    return cn(
      'border',
      isDark ? 'border-zinc-700' : 'border-zinc-200'
    );
  }

  get nameTextClasses(): string {
    const isDark = this.themeService.isDarkMode();
    
    return cn(
      'truncate text-sm font-semibold',
      isDark ? 'text-zinc-100' : 'text-zinc-900'
    );
  }

  get emailTextClasses(): string {
    const isDark = this.themeService.isDarkMode();
    
    return cn(
      'truncate text-xs',
      isDark ? 'text-zinc-400' : 'text-zinc-600'
    );
  }

  get badgeClasses(): string {
    return 'inline-flex items-center rounded-full bg-blue-500/15 px-2.5 py-0.5 text-[11px] font-medium text-blue-500';
  }

  get dividerClasses(): string {
    const isDark = this.themeService.isDarkMode();
    
    return cn(
      'my-1.5 h-px',
      isDark ? 'bg-zinc-800' : 'bg-zinc-200'
    );
  }

  get menuItemClasses(): string {
    const isDark = this.themeService.isDarkMode();
    
    return cn(
      'mt-1 flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors focus:outline-none',
      isDark
        ? 'text-zinc-100 hover:bg-zinc-800 focus:bg-zinc-800'
        : 'text-zinc-900 hover:bg-zinc-100 focus:bg-zinc-100'
    );
  }

  get themeToggleClasses(): string {
    const isDark = this.themeService.isDarkMode();
    
    return cn(
      'mt-1 flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium',
      isDark ? 'text-zinc-100' : 'text-zinc-900'
    );
  }

  get signOutButtonClasses(): string {
    return 'mt-1 flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium text-red-500 transition-colors hover:bg-red-500/10 focus:bg-red-500/10 focus:outline-none';
  }

  get chevronClasses(): string {
    const isDark = this.themeService.isDarkMode();
    
    return cn(
      'h-4 w-4 transition-transform flex-shrink-0',
      this.menuOpen && 'rotate-180',
      isDark ? 'text-zinc-400' : 'text-zinc-500'
    );
  }
}
