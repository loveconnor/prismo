import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonComponent } from '../../components/ui/button/button';
import { CardComponent } from '../../components/ui/card/card';
import { CardContentComponent } from '../../components/ui/card/card-content';
import { ProgressComponent } from '../../components/ui/progress/progress';
import { AvatarComponent } from '../../components/ui/avatar/avatar';
import { HeroCardsComponent } from './hero-cards.component';
import { RecommendedLabsComponent } from './recommended-labs.component';
import { RecentLabsComponent } from './recent-labs.component';
import { PublicLabsComponent } from './public-labs.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    HeroCardsComponent,
    RecommendedLabsComponent,
    RecentLabsComponent,
    PublicLabsComponent
  ],
  template: `
    <div class="p-6">
      <div class="flex flex-col gap-6">
        <!-- Welcome Section -->
        <div>
          <div class="flex items-center justify-between mb-2">
            <h1 class="text-3xl font-semibold text-foreground">Welcome back, Student</h1>
            <span class="inline-flex items-center gap-2 rounded-full bg-[rgba(245,158,11,0.15)] px-3 py-1 text-xs font-semibold text-[#fcd34d]">
              <svg class="h-3.5 w-3.5 fill-current" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
              </svg>
              3 days active
            </span>
          </div>
          <p class="text-muted-foreground">Ready to pick up where you left off?</p>
        </div>

        <!-- Hero Cards -->
        <app-hero-cards />

        <!-- Public Labs -->
        <app-public-labs />

        <!-- Recommended Labs -->
        <app-recommended-labs />

        <!-- Recent Labs -->
        <app-recent-labs />
      </div>
    </div>
  `
})
export class DashboardComponent {}
