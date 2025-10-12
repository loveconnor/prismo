import { Component, signal } from '@angular/core';
import { RouterOutlet, RouterLink, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { provideIcons, NgIconComponent } from '@ng-icons/core';
import {
  lucideHouse,
  lucideBookOpen,
  lucideBeaker,
  lucideSettings,
  lucideGrid3x3,
  lucideFileText,
  lucideChartBar
} from '@ng-icons/lucide';
import { SidebarComponent } from '../components/ui/sidebar/sidebar';
import { SidebarHeaderComponent } from '../components/ui/sidebar/sidebar-header/sidebar-header';
import { SidebarBodyComponent } from '../components/ui/sidebar/sidebar-body/sidebar-body';
import { SidebarFooterComponent } from '../components/ui/sidebar/sidebar-footer/sidebar-footer';
import { SidebarSectionComponent } from '../components/ui/sidebar/sidebar-section/sidebar-section';
import { SidebarItemComponent } from '../components/ui/sidebar/sidebar-item/sidebar-item';
import { SidebarDividerComponent } from '../components/ui/sidebar/sidebar-divider/sidebar-divider';
import { SidebarHeadingComponent } from '../components/ui/sidebar/sidebar-heading/sidebar-heading';
import { SidebarLabelComponent } from '../components/ui/sidebar/sidebar-label/sidebar-label';
import { AvatarDropdownComponent } from '../components/ui/avatar-dropdown/avatar-dropdown';
import { SettingsModalComponent } from '../components/settings/settings-modal/settings-modal';
import { ThemeService } from '../services/theme.service';

@Component({
  selector: 'app-root',
  providers: [
    provideIcons({
      lucideHouse,
      lucideBookOpen,
      lucideBeaker,
      lucideSettings,
      lucideGrid3x3,
      lucideFileText,
      lucideChartBar
    })
  ],
  imports: [
    RouterOutlet,
    RouterLink,
    NgIconComponent,
    SidebarComponent,
    SidebarHeaderComponent,
    SidebarBodyComponent,
    SidebarFooterComponent,
    SidebarSectionComponent,
    SidebarItemComponent,
    SidebarDividerComponent,
    SidebarHeadingComponent,
    SidebarLabelComponent,
    AvatarDropdownComponent,
    SettingsModalComponent
  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  settingsOpen = false;
  currentUrl = signal('');

  constructor(public themeService: ThemeService, private router: Router) {
    // Update currentUrl signal on navigation
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.currentUrl.set(event.url);
      });
    
    // Set initial URL
    this.currentUrl.set(this.router.url);
  }

  isActive(route: string): boolean {
    return this.router.url === route;
  }

  isAuthPage(): boolean {
    const authRoutes = ['/login', '/register', '/forgot-password'];
    const url = this.currentUrl();
    return authRoutes.some(route => url.startsWith(route));
  }

  toggleTheme() {
    this.themeService.toggleTheme();
  }

  openSettings(event?: Event): void {
    event?.preventDefault();
    event?.stopPropagation();
    this.settingsOpen = true;
  }
}
