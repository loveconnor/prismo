import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { ButtonComponent } from '../../components/ui/button/button';
import { CardComponent } from '../../components/ui/card/card';
import { CardHeaderComponent } from '../../components/ui/card/card-header';
import { CardContentComponent } from '../../components/ui/card/card-content';
import { CardFooterComponent } from '../../components/ui/card/card-footer';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucideCode, lucideAtom, lucideDatabase, lucideShield, lucideBookOpen, lucideCalculator, lucideFileText, lucideTreePine, lucideNetwork } from '@ng-icons/lucide';
import { LabsService, Lab } from '../../services/labs.service';

@Component({
  selector: 'app-recommended-labs',
  standalone: true,
  imports: [
    CommonModule,
    ButtonComponent,
    CardComponent,
    CardHeaderComponent,
    CardContentComponent,
    CardFooterComponent,
    NgIconComponent
  ],
  providers: [
    provideIcons({
      lucideCode,
      lucideAtom,
      lucideDatabase,
      lucideShield,
      lucideBookOpen,
      lucideCalculator,
      lucideFileText,
      lucideTreePine,
      lucideNetwork
    })
  ],
  template: `
    <section>
      <div class="mb-4 flex items-center justify-between">
        <h2 class="text-2xl font-semibold text-foreground">Recommended Labs</h2>
      </div>
      
      <!-- Loading State -->
      <div *ngIf="loading" class="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <ng-container *ngFor="let i of [1,2,3,4]">
          <app-card className="group relative flex flex-col shadow-none">
            <app-card-header className="pb-0">
              <div class="flex h-11 w-11 items-center justify-center rounded-lg bg-gray-200 animate-pulse"></div>
            </app-card-header>
            <app-card-content className="flex-1 flex flex-col gap-3 pt-4">
              <div class="h-4 bg-gray-200 rounded animate-pulse"></div>
              <div class="h-3 bg-gray-200 rounded animate-pulse w-3/4"></div>
              <div class="mt-auto flex items-center gap-2 flex-wrap">
                <div class="h-5 bg-gray-200 rounded-full w-16 animate-pulse"></div>
                <div class="h-4 bg-gray-200 rounded w-12 animate-pulse"></div>
              </div>
            </app-card-content>
            <app-card-footer className="mt-auto">
              <div class="h-9 bg-gray-200 rounded w-full animate-pulse"></div>
            </app-card-footer>
          </app-card>
        </ng-container>
      </div>

      <!-- Error State -->
      <div *ngIf="error" class="text-center py-8">
        <p class="text-red-500 mb-4">{{ error }}</p>
        <app-button (click)="loadLabs()">Retry</app-button>
      </div>

      <!-- Labs Grid -->
      <div *ngIf="!loading && !error && labs.length > 0" class="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <ng-container *ngFor="let lab of labs; let i = index">
          <app-card
            className="group relative flex flex-col shadow-none hover:shadow-sm transition-colors hover:bg-white/5 focus-within:ring-1 focus-within:ring-[#bc78f9]/30"
          >
            <app-card-header className="pb-0">
              <div class="flex h-11 w-11 items-center justify-center rounded-lg bg-[#E978FA15] text-[#bc78f9]">
                <ng-icon [name]="labsService.getLabIcon(lab)" class="h-6 w-6" aria-hidden="true"></ng-icon>
              </div>
            </app-card-header>
            <app-card-content className="flex-1 flex flex-col gap-3 pt-4">
              <h3 class="text-base font-semibold leading-tight text-foreground line-clamp-2">{{ lab.title }}</h3>
              <p class="text-sm text-muted-foreground line-clamp-2">{{ lab.description }}</p>
              <div class="mt-auto flex items-center gap-2 flex-wrap">
                <span
                  [class]="'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ' + labsService.getDifficultyColor(lab.difficulty)"
                >
                  {{ labsService.getDifficultyLabel(lab.difficulty) }}
                </span>
                <span class="flex items-center gap-1 text-xs text-muted-foreground">
                  <!-- Clock icon -->
                  <svg class="h-3 w-3" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M12 1.75A10.25 10.25 0 1 0 22.25 12 10.262 10.262 0 0 0 12 1.75zm0 18.5A8.25 8.25 0 1 1 20.25 12 8.259 8.259 0 0 1 12 20.25zm.75-12.5a.75.75 0 0 0-1.5 0V12a.75.75 0 0 0 .22.53l3 3a.75.75 0 0 0 1.06-1.06l-2.78-2.78z"></path>
                  </svg>
                  {{ labsService.formatDuration(lab.estimated_duration) }}
                </span>
              </div>
            </app-card-content>
            <app-card-footer className="mt-auto">
              <app-button className="w-full" (click)="navigateToLab(lab.id)">Start Lab</app-button>
            </app-card-footer>
          </app-card>
        </ng-container>
      </div>

      <!-- Empty State -->
      <div *ngIf="!loading && !error && labs.length === 0" class="text-center py-8">
        <p class="text-muted-foreground">No recommended labs available at the moment.</p>
      </div>
    </section>
  `
})
export class RecommendedLabsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  labs: Lab[] = [];
  loading = true;
  error: string | null = null;

  constructor(
    private router: Router,
    public labsService: LabsService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadLabs();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadLabs() {
    this.loading = true;
    this.error = null;
    
    this.labsService.getRecommendedLabs()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (labs) => {
          this.labs = labs;
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error loading recommended labs:', error);
          this.error = 'Failed to load recommended labs';
          this.loading = false;
        }
      });
  }

  navigateToLab(labId: string): void {
    this.router.navigate(['/labs', labId]);
  }
}