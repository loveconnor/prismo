import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonComponent } from '../../components/ui/button/button';
import { CardComponent } from '../../components/ui/card/card';
import { CardContentComponent } from '../../components/ui/card/card-content';
import { ProgressComponent } from '../../components/ui/progress/progress';
import { AvatarComponent } from '../../components/ui/avatar/avatar';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    ButtonComponent,
    CardComponent,
    CardContentComponent,
    ProgressComponent,
    AvatarComponent
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
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <app-card class="cursor-pointer hover:shadow-lg transition-shadow">
            <app-card-content class="p-6">
              <div class="flex items-center gap-3">
                <div class="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                  <svg class="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                </div>
                <div class="flex-1 min-w-0">
                  <h3 class="font-semibold text-foreground">Continue Learning</h3>
                  <p class="text-sm text-muted-foreground">Pick up where you left off</p>
                </div>
              </div>
            </app-card-content>
          </app-card>

          <app-card class="cursor-pointer hover:shadow-lg transition-shadow">
            <app-card-content class="p-6">
              <div class="flex items-center gap-3">
                <div class="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                  <svg class="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                  </svg>
                </div>
                <div class="flex-1 min-w-0">
                  <h3 class="font-semibold text-foreground">Quick Start</h3>
                  <p class="text-sm text-muted-foreground">Start a new lab</p>
                </div>
              </div>
            </app-card-content>
          </app-card>

          <app-card class="cursor-pointer hover:shadow-lg transition-shadow">
            <app-card-content class="p-6">
              <div class="flex items-center gap-3">
                <div class="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                  <svg class="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                  </svg>
                </div>
                <div class="flex-1 min-w-0">
                  <h3 class="font-semibold text-foreground">Progress</h3>
                  <p class="text-sm text-muted-foreground">Track your learning</p>
                </div>
              </div>
            </app-card-content>
          </app-card>
        </div>

        <!-- Recommended Labs -->
        <section>
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-xl font-semibold text-foreground">Recommended for you</h2>
            <app-button variant="outline" size="sm">View all</app-button>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <app-card class="cursor-pointer hover:shadow-lg transition-shadow">
              <app-card-content class="p-6">
                <div class="flex items-start justify-between mb-3">
                  <div class="flex items-center gap-2">
                    <span class="inline-flex items-center rounded-full bg-green-100 dark:bg-green-900/20 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:text-green-200">
                      Beginner
                    </span>
                  </div>
                  <span class="text-xs text-muted-foreground">2h 30m</span>
                </div>
                <h3 class="font-semibold text-foreground mb-2">React Fundamentals</h3>
                <p class="text-sm text-muted-foreground mb-4">Learn the basics of React development with hands-on exercises.</p>
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <app-avatar size="sm" src="https://github.com/monster0506.png" alt="Instructor" />
                    <span class="text-xs text-muted-foreground">TJ Raklovits</span>
                  </div>
                  <app-button variant="outline" size="sm">Start</app-button>
                </div>
              </app-card-content>
            </app-card>

            <app-card class="cursor-pointer hover:shadow-lg transition-shadow">
              <app-card-content class="p-6">
                <div class="flex items-start justify-between mb-3">
                  <div class="flex items-center gap-2">
                    <span class="inline-flex items-center rounded-full bg-yellow-100 dark:bg-yellow-900/20 px-2.5 py-0.5 text-xs font-medium text-yellow-800 dark:text-yellow-200">
                      Intermediate
                    </span>
                  </div>
                  <span class="text-xs text-muted-foreground">4h 15m</span>
                </div>
                <h3 class="font-semibold text-foreground mb-2">Advanced TypeScript</h3>
                <p class="text-sm text-muted-foreground mb-4">Master advanced TypeScript patterns and best practices.</p>
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <app-avatar size="sm" src="https://github.com/vercel.png" alt="Instructor" />
                    <span class="text-xs text-muted-foreground">Alex Rodriguez</span>
                  </div>
                  <app-button variant="outline" size="sm">Start</app-button>
                </div>
              </app-card-content>
            </app-card>

            <app-card class="cursor-pointer hover:shadow-lg transition-shadow">
              <app-card-content class="p-6">
                <div class="flex items-start justify-between mb-3">
                  <div class="flex items-center gap-2">
                    <span class="inline-flex items-center rounded-full bg-red-100 dark:bg-red-900/20 px-2.5 py-0.5 text-xs font-medium text-red-800 dark:text-red-200">
                      Advanced
                    </span>
                  </div>
                  <span class="text-xs text-muted-foreground">6h 45m</span>
                </div>
                <h3 class="font-semibold text-foreground mb-2">System Design Patterns</h3>
                <p class="text-sm text-muted-foreground mb-4">Design scalable systems with modern architecture patterns.</p>
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <app-avatar size="sm" src="https://github.com/nextjs.png" alt="Instructor" />
                    <span class="text-xs text-muted-foreground">Maria Garcia</span>
                  </div>
                  <app-button variant="outline" size="sm">Start</app-button>
                </div>
              </app-card-content>
            </app-card>
          </div>
        </section>

        <!-- Recent Labs -->
        <section>
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-xl font-semibold text-foreground">Recent labs</h2>
            <app-button variant="outline" size="sm">View all</app-button>
          </div>
          <div class="space-y-4">
            <app-card>
              <app-card-content class="p-6">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                      <svg class="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path>
                      </svg>
                    </div>
                    <div>
                      <h3 class="font-semibold text-foreground">JavaScript Fundamentals</h3>
                      <p class="text-sm text-muted-foreground">Started 2 days ago</p>
                    </div>
                  </div>
                  <div class="flex items-center gap-4">
                    <div class="text-right">
                      <div class="text-sm font-medium text-foreground">75%</div>
                      <div class="w-20">
                        <app-progress [value]="75" />
                      </div>
                    </div>
                    <app-button variant="outline" class="min-w-[100px]">
                      Continue
                    </app-button>
                  </div>
                </div>
              </app-card-content>
            </app-card>

            <app-card>
              <app-card-content class="p-6">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                      <svg class="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                    </div>
                    <div>
                      <h3 class="font-semibold text-foreground">CSS Grid Mastery</h3>
                      <p class="text-sm text-muted-foreground">Completed 1 week ago</p>
                    </div>
                  </div>
                  <div class="flex items-center gap-4">
                    <div class="text-right">
                      <div class="text-sm font-medium text-foreground">100%</div>
                      <div class="w-20">
                        <app-progress [value]="100" />
                      </div>
                    </div>
                    <app-button variant="outline" class="min-w-[100px]">
                      Review
                    </app-button>
                  </div>
                </div>
              </app-card-content>
            </app-card>
          </div>
        </section>
      </div>
    </div>
  `
})
export class DashboardComponent {}
