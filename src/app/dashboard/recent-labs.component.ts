import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subject, forkJoin, of } from 'rxjs';
import { takeUntil, switchMap, map } from 'rxjs/operators';
import { ButtonComponent } from '../../components/ui/button/button';
import { ProgressComponent } from '../../components/ui/progress/progress';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucideTreePine, lucideZap, lucidePalette, lucideNetwork, lucideBookOpen } from '@ng-icons/lucide';
import { UserProgressService, ModuleSession } from '../../services/user-progress.service';
import { LabsService } from '../../services/labs.service';

type RecentLab = {
  title: string;
  progress: number;
  time: string;
  status: 'in-progress' | 'completed';
  path: string;
  icon: string;
};

@Component({
  selector: 'app-recent-labs',
  standalone: true,
  imports: [CommonModule, ButtonComponent, ProgressComponent, NgIconComponent],
  providers: [
    provideIcons({
      lucideTreePine,
      lucideZap,
      lucidePalette,
      lucideNetwork,
      lucideBookOpen
    })
  ],
  template: `
    <section *ngIf="recentLabs.length > 0">
      <div class="mb-4 flex items-center justify-between">
        <h2 class="text-2xl font-semibold text-foreground">Continue Where You Left Off</h2>
      </div>
      <div class="overflow-hidden rounded-xl border bg-card">
        <ng-container *ngFor="let lab of recentLabs; let i = index">
          <div
            class="flex items-center gap-4 border-b p-4 transition-colors hover:bg-white/5 last:border-b-0"
          >
            <!-- Title with icon -->
            <div class="flex min-w-0 flex-1 items-center gap-3">
              <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-[#E978FA15] text-[#bc78f9]" aria-hidden="true">
                <ng-icon [name]="getLabIcon(lab.title)" class="h-5 w-5"></ng-icon>
              </div>
              <h3 class="truncate text-base font-medium text-foreground">{{ lab.title }}</h3>
            </div>

            <!-- Progress (desktop) -->
            <div class="hidden w-[260px] flex-col md:flex">
              <app-progress [value]="lab.progress" className="h-1.5"></app-progress>
              <span class="mt-1 text-xs text-muted-foreground">
                {{ lab.progress === 100 ? 'Completed' : (lab.progress + '% complete') }}
              </span>
            </div>

            <!-- Time -->
            <div class="w-[80px] text-right text-sm text-muted-foreground">{{ lab.time }}</div>

            <!-- Action -->
            <ng-container *ngIf="lab.status === 'completed'; else resumeTpl">
              <app-button variant="outline" className="min-w-[100px]" (click)="navigateToLab(lab.path)">Review</app-button>
            </ng-container>
            <ng-template #resumeTpl>
              <app-button className="min-w-[100px]" (click)="navigateToLab(lab.path)">Resume</app-button>
            </ng-template>
          </div>
        </ng-container>
      </div>
    </section>
  `
})
export class RecentLabsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  recentLabs: RecentLab[] = [];
  
  constructor(
    private router: Router,
    private userProgressService: UserProgressService,
    private labsService: LabsService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    // Load labs first, then recent labs
    this.labsService.getAllLabs()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loadRecentLabs();
        },
        error: (error) => {
          console.error('[RecentLabs] Error loading labs:', error);
          this.loadRecentLabs(); // Still try to load recent labs even if labs fail
        }
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadRecentLabs() {
    this.userProgressService.getUserLabProgress()
      .pipe(
        takeUntil(this.destroy$),
        switchMap(sessions => {
          // Filter for in-progress and completed sessions only, sort by last activity
          const activeSessions = sessions
            .filter(s => (s.status === 'in_progress' || s.status === 'started' || s.status === 'completed') && s.lab_id)
            .sort((a, b) => {
              const dateA = new Date(a.last_activity_at || 0).getTime();
              const dateB = new Date(b.last_activity_at || 0).getTime();
              return dateB - dateA;
            })
            .slice(0, 4); // Show top 4  labs

          // For each session, try to get the module details
          const labObservables = activeSessions.map(session => {
            const cachedLab = this.labsService.getCachedLabs().find(l => l.id === session.lab_id);
            
            if (cachedLab) {
              // Lab found in cache
              return of({
                session,
                title: cachedLab.title
              });
            } else {
              // Fetch module by ID
              return this.labsService.getModuleById(session.lab_id).pipe(
                map(module => ({
                  session,
                  title: module?.title || this.formatLabId(session.lab_id)
                }))
              );
            }
          });

          return labObservables.length > 0 ? forkJoin(labObservables) : of([]);
        })
      )
      .subscribe({
        next: (labsData) => {
          this.recentLabs = labsData.map(data => ({
            title: data.title,
            progress: Math.round(data.session.progress),
            time: this.formatTime(data.session.time_spent),
            status: data.session.status === 'completed' ? 'completed' as const : 'in-progress' as const,
            path: data.session.lab_id,
            icon: 'lucideBookOpen'
          }));

          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error loading recent labs:', error);
          this.recentLabs = [];
          this.cdr.detectChanges();
        }
      });
  }

  formatLabId(labId: string): string {
    // Create a more readable title from the ID
    // Handle special formats like "coding---java-89f30415"
    if (labId.includes('---')) {
      // Format: "coding---java-89f30415" -> "Coding Java Lab"
      const parts = labId.split('---');
      const mainParts = parts.slice(0, -1); // Remove the hash at the end
      return mainParts
        .flatMap(p => p.split('-'))
        .filter(word => word && word.length > 2) // Remove empty and very short words
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ') + ' Lab';
    }
    
    // Standard format: split by dashes and capitalize
    return labId.split('-')
      .filter(word => word && word.length > 2) // Remove empty strings and short IDs
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ') || 'Untitled Lab';
  }

  getLabTitle(labId: string): string {
    // Try to get from loaded labs cache
    const cachedLabs = this.labsService.getCachedLabs();
    
    // Try exact match first
    let lab = cachedLabs.find(l => l.id === labId);
    
    // If no exact match, try to match by the end part (after the last dash)
    if (!lab && labId.includes('-')) {
      const parts = labId.split('-').filter(p => p); // Remove empty parts
      const lastPart = parts[parts.length - 1];
      
      lab = cachedLabs.find(l => l.id.endsWith(lastPart) || l.id.includes(lastPart));
    }
    
    // If still no match, try matching by any significant part
    if (!lab && labId.includes('-')) {
      const normalizedId = labId.toLowerCase();
      lab = cachedLabs.find(l => {
        const normalizedLabId = l.id.toLowerCase();
        return normalizedLabId === normalizedId || 
               normalizedLabId.includes(normalizedId) || 
               normalizedId.includes(normalizedLabId);
      });
    }
    
    if (lab && lab.title) {
      return lab.title;
    }
    
    // Fallback: Create a more readable title from the ID
    // Handle special formats like "coding---java-89f30415"
    if (labId.includes('---')) {
      // Format: "coding---java-89f30415" -> "Coding Java Lab"
      const parts = labId.split('---');
      const mainParts = parts.slice(0, -1); // Remove the hash at the end
      return mainParts
        .flatMap(p => p.split('-'))
        .filter(word => word && word.length > 2) // Remove empty and very short words
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ') + ' Lab';
    }
    
    // Standard format: split by dashes and capitalize
    return labId.split('-')
      .filter(word => word && word.length > 2) // Remove empty strings and short IDs
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ') || 'Untitled Lab';
  }

  formatTime(seconds?: number): string {
    if (!seconds) return '0 min';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  }

  navigateToLab(labPath: string): void {
    this.router.navigate(['/labs', labPath]);
  }

  getLabIcon(title: string): string {
    if (title.includes('Binary Search') || title.includes('Tree')) return 'lucideTreePine';
    if (title.includes('Async') || title.includes('JavaScript')) return 'lucideZap';
    if (title.includes('CSS') || title.includes('Grid') || title.includes('Flexbox')) return 'lucidePalette';
    if (title.includes('Graph') || title.includes('Algorithm')) return 'lucideNetwork';
    return 'lucideBookOpen';
  }
}


