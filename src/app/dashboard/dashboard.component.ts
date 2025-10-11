import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonComponent } from '../../components/ui/button/button';
import { CardComponent } from '../../components/ui/card/card';
import { CardContentComponent } from '../../components/ui/card/card-content';
import { ProgressComponent } from '../../components/ui/progress/progress';
import { AvatarComponent } from '../../components/ui/avatar/avatar';
import { NgIcon } from '@ng-icons/core';
import { HeroCardsComponent } from './hero-cards.component';
import { RecommendedLabsComponent } from './recommended-labs.component';
import { RecentLabsComponent } from './recent-labs.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    ButtonComponent,
    CardComponent,
    CardContentComponent,
    ProgressComponent,
    AvatarComponent,
    NgIcon,
    HeroCardsComponent,
    RecommendedLabsComponent,
    RecentLabsComponent
  ],
  template: `
    <div class="p-6">
      <div class="flex flex-col gap-6">
        <!-- Welcome Section -->
        <div>
          <div class="flex items-center justify-between mb-2">
            <h1 class="text-3xl font-semibold text-foreground">Welcome back, Student</h1>
            <span class="inline-flex items-center gap-2 rounded-full bg-[rgba(245,158,11,0.15)] px-3 py-1 text-xs font-semibold text-[#fcd34d]">
              <ng-icon name="lucideStar" class="h-3.5 w-3.5"></ng-icon>
              3 days active
            </span>
          </div>
          <p class="text-muted-foreground">Ready to pick up where you left off?</p>
        </div>

        <!-- Hero Cards -->
        <app-hero-cards />

        <!-- Recommended Labs -->
        <app-recommended-labs />

        <!-- Recent Labs -->
        <app-recent-labs />
      </div>
    </div>
  `
})
export class DashboardComponent {}
