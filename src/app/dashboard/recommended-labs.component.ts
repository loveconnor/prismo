import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subject, of } from 'rxjs';
import { takeUntil, catchError } from 'rxjs/operators';
import { ButtonComponent } from '../../components/ui/button/button';
import { CardComponent } from '../../components/ui/card/card';
import { CardHeaderComponent } from '../../components/ui/card/card-header';
import { CardContentComponent } from '../../components/ui/card/card-content';
import { CardFooterComponent } from '../../components/ui/card/card-footer';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucideCode, lucideAtom, lucideDatabase, lucideShield, lucideBookOpen, lucideCalculator, lucideFileText, lucideTreePine, lucideNetwork, lucideSparkles, lucideRefreshCw } from '@ng-icons/lucide';
import { LabsService } from '../../services/labs.service';
import { ModuleGeneratorService } from '../../services/module-generator.service';
import { ToastService } from '../../services/toast.service';

interface AIRecommendation {
  title: string;
  description: string;
  skills: string[];
  difficulty: number;
  reasoning?: string;
  module_id?: string;  // For existing labs
  is_existing?: boolean;  // Flag to indicate if this is an existing lab or needs generation
}

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
      lucideNetwork,
      lucideSparkles,
      lucideRefreshCw
    })
  ],
  template: `
    <section>
      <div class="mb-4 flex items-center justify-between">
        <h2 class="text-2xl font-semibold text-foreground">AI-Recommended Labs</h2>
        <app-button 
          variant="outline" 
          size="sm"
          (click)="refreshRecommendations()"
          [disabled]="loading"
          className="gap-2"
        >
          <ng-icon 
            name="lucideRefreshCw" 
            class="h-4 w-4"
            [class.animate-spin]="loading"
          ></ng-icon>
          Refresh
        </app-button>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading" class="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <ng-container *ngFor="let i of [1,2,3]">
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
      <div *ngIf="error && !loading" class="text-center py-8">
        <p class="text-red-500 mb-4">{{ error }}</p>
        <app-button (click)="loadRecommendations()">Retry</app-button>
      </div>

      <!-- Recommendations Grid -->
      <div *ngIf="!loading && !error && recommendations.length > 0" class="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <ng-container *ngFor="let recommendation of recommendations; let i = index">
          <app-card
            className="group relative flex flex-col h-full shadow-none hover:shadow-sm transition-colors hover:bg-white/5 focus-within:ring-1 focus-within:ring-[#bc78f9]/30"
          >
            <app-card-header className="pb-0 flex-shrink-0">
              <div class="flex h-11 w-11 items-center justify-center rounded-lg bg-[#E978FA15] text-[#bc78f9]">
                <ng-icon name="lucideSparkles" class="h-6 w-6" aria-hidden="true"></ng-icon>
              </div>
            </app-card-header>
            <app-card-content className="flex-1 flex flex-col pt-4 min-h-0">
              <div class="flex flex-col gap-3 flex-shrink-0">
                <h3 class="text-base font-semibold leading-tight text-foreground line-clamp-2">{{ recommendation.title }}</h3>
                <p class="text-sm text-muted-foreground line-clamp-3">{{ recommendation.description }}</p>
                <div class="flex items-center gap-2 flex-wrap">
                  <span
                    [class]="'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ' + getDifficultyColor(recommendation.difficulty)"
                  >
                    {{ getDifficultyLabel(recommendation.difficulty) }}
                  </span>
                  <span class="flex items-center gap-1 text-xs text-muted-foreground" *ngIf="recommendation.skills && recommendation.skills.length > 0">
                    {{ recommendation.skills[0] }}
                    <span *ngIf="recommendation.skills.length > 1">+{{ recommendation.skills.length - 1 }}</span>
                  </span>
                </div>
              </div>
              <div class="flex-1 min-h-[2rem] mt-3" *ngIf="recommendation.reasoning">
                <p class="text-xs text-[#bc78f9]/80 italic line-clamp-2">
                  {{ recommendation.reasoning }}
                </p>
              </div>
              <div class="flex-1 min-h-[2rem]" *ngIf="!recommendation.reasoning"></div>
            </app-card-content>
            <app-card-footer className="mt-auto flex-shrink-0">
              <app-button 
                className="w-full" 
                (click)="generateLab(recommendation, i)"
                [disabled]="isGenerating(i)"
              >
                <ng-icon 
                  [name]="recommendation.is_existing ? 'lucideBookOpen' : 'lucideSparkles'" 
                  class="h-4 w-4"
                ></ng-icon>
                <ng-container *ngIf="recommendation.is_existing">
                  Start Lab
                </ng-container>
                <ng-container *ngIf="!recommendation.is_existing">
                  {{ isGenerating(i) ? 'Generating...' : 'Generate Lab' }}
                </ng-container>
              </app-button>
            </app-card-footer>
          </app-card>
        </ng-container>
      </div>

      <!-- Empty State -->
      <div *ngIf="!loading && !error && recommendations.length === 0" class="text-center py-8">
        <p class="text-muted-foreground">No recommendations available at the moment.</p>
      </div>
    </section>
  `
})
export class RecommendedLabsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  recommendations: AIRecommendation[] = [];
  generatingLabs: Set<number> = new Set();
  loading = true;
  error: string | null = null;

  constructor(
    private router: Router,
    public labsService: LabsService,
    private moduleGenerator: ModuleGeneratorService,
    private toastService: ToastService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadRecommendations();
    
    // Subscribe to lab creation events to refresh recommendations
    this.labsService.labCreated$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        console.log('[RecommendedLabs] Lab created, refreshing recommendations...');
        this.loadRecommendations(true);
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadRecommendations(forceRefresh: boolean = false) {
    this.loading = true;
    this.error = null;
    
    this.labsService.getAIRecommendations(3, forceRefresh)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success && response.recommendations) {
            this.recommendations = response.recommendations;
            console.log('[RecommendedLabs] AI Recommendations:', this.recommendations);
            
            // Log whether from cache or fresh fetch
            if (response.source === 'cache') {
              console.log('[RecommendedLabs] Loaded from cache');
            } else {
              console.log('[RecommendedLabs] Loaded fresh from API');
            }
          } else {
            this.error = 'No recommendations available';
          }
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error loading AI recommendations:', error);
          this.error = 'Failed to load recommendations';
          this.loading = false;
          this.cdr.detectChanges();
        }
      });
  }

  refreshRecommendations() {
    this.toastService.info('Refreshing recommendations...');
    this.loadRecommendations(true);
  }

  generateLab(recommendation: AIRecommendation, index: number) {
    // If it's an existing lab, navigate directly to it
    if (recommendation.is_existing && recommendation.module_id) {
      this.router.navigate(['/labs', recommendation.module_id]);
      return;
    }
    
    // Otherwise, generate a new lab
    this.generatingLabs.add(index);
    
    const request = {
      topic: recommendation.title,
      subject: 'coding',
      difficulty: this.getDifficultyString(recommendation.difficulty),
      skills: recommendation.skills,
      goal: recommendation.description
    };

    console.log('[RecommendedLabs] Generating lab from recommendation:', request);

    this.moduleGenerator.generateModule(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success && response.module_id) {
            this.toastService.success('Lab generated successfully!');
            this.router.navigate(['/labs', response.module_id]);
          } else {
            this.toastService.error('Failed to generate lab', response.error || 'Unknown error');
          }
          this.generatingLabs.delete(index);
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error generating lab:', error);
          this.toastService.error('Failed to generate lab', error.message);
          this.generatingLabs.delete(index);
          this.cdr.detectChanges();
        }
      });
  }

  getDifficultyString(difficulty: number): string {
    const map: { [key: number]: string } = {
      1: 'beginner',
      2: 'beginner',
      3: 'practice',
      4: 'challenge',
      5: 'challenge'
    };
    return map[difficulty] || 'practice';
  }

  getDifficultyLabel(difficulty: number): string {
    const labels: { [key: number]: string } = {
      1: 'Beginner',
      2: 'Easy',
      3: 'Medium',
      4: 'Hard',
      5: 'Expert'
    };
    return labels[difficulty] || 'Medium';
  }

  getDifficultyColor(difficulty: number): string {
    if (difficulty <= 2) {
      return 'bg-green-500/15 text-green-400';
    } else if (difficulty === 3) {
      return 'bg-yellow-500/15 text-yellow-400';
    } else {
      return 'bg-red-500/15 text-red-400';
    }
  }

  isGenerating(index: number): boolean {
    return this.generatingLabs.has(index);
  }
}