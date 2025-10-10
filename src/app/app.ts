import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, Router } from '@angular/router';
import { SidebarComponent } from '../components/ui/sidebar/sidebar';
import { SidebarHeaderComponent } from '../components/ui/sidebar/sidebar-header/sidebar-header';
import { SidebarBodyComponent } from '../components/ui/sidebar/sidebar-body/sidebar-body';
import { SidebarFooterComponent } from '../components/ui/sidebar/sidebar-footer/sidebar-footer';
import { SidebarSectionComponent } from '../components/ui/sidebar/sidebar-section/sidebar-section';
import { SidebarItemComponent } from '../components/ui/sidebar/sidebar-item/sidebar-item';
import { SidebarDividerComponent } from '../components/ui/sidebar/sidebar-divider/sidebar-divider';
import { SidebarHeadingComponent } from '../components/ui/sidebar/sidebar-heading/sidebar-heading';
import { SidebarLabelComponent } from '../components/ui/sidebar/sidebar-label/sidebar-label';
import { AvatarComponent } from '../components/ui/avatar/avatar';
import { ThemeService } from '../services/theme.service';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    RouterLink,
    SidebarComponent,
    SidebarHeaderComponent,
    SidebarBodyComponent,
    SidebarFooterComponent,
    SidebarSectionComponent,
    SidebarItemComponent,
    SidebarDividerComponent,
    SidebarHeadingComponent,
    SidebarLabelComponent,
    AvatarComponent
  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  constructor(public themeService: ThemeService, private router: Router) {}

  isActive(route: string): boolean {
    return this.router.url === route;
  }

  toggleTheme() {
    this.themeService.toggleTheme();
  }
}