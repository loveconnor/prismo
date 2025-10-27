import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { provideIcons, NgIconComponent } from '@ng-icons/core';
import { lucidePlus } from '@ng-icons/lucide';
import { ButtonComponent } from '../../components/ui/button/button';
import { LabsStatsComponent, LabsStatItem } from '../../components/labs/labs-stats/labs-stats';
import { LabsToolbarComponent, LabFilter, LabSortBy } from '../../components/labs/labs-toolbar/labs-toolbar';
import { LabsGridComponent, Lab as GridLab } from '../../components/labs/labs-grid/labs-grid';
import { CreateLabModalComponent } from '../../components/utility/create-lab-modal/create-lab-modal';
import { LabsService } from '../../services/labs.service';
import { UserProgressService } from '../../services/user-progress.service';
import { ToastService } from '../../services/toast.service';
import { Subject, forkJoin } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-labs',
  standalone: true,
  providers: [
    provideIcons({
      lucidePlus
    })
  ],
  imports: [
    CommonModule,
    NgIconComponent,
    ButtonComponent,
    LabsStatsComponent,
    LabsToolbarComponent,
    LabsGridComponent,
    CreateLabModalComponent
  ],
  templateUrl: './labs.html',
  styleUrls: ['./labs.css']
})
export class LabsComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private labsService = inject(LabsService);
  private userProgressService = inject(UserProgressService);
  private toastService = inject(ToastService);
  private destroy$ = new Subject<void>();
  
  searchQuery = '';
  filter: LabFilter = 'all';
  sortBy: LabSortBy = 'recent';
  createOpen = false;
  stats: LabsStatItem[] = [];
  labsGridComponent?: LabsGridComponent; // Reference to grid for refreshing

  ngOnInit() {
    this.loadStats();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadStats() {
    // Load labs and progress to calculate stats
    forkJoin({
      labs: this.labsService.getAllLabs(),
      progress: this.userProgressService.getUserLabProgress()
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ({ labs, progress }) => {
          const totalLabs = labs.length;
          const inProgressLabs = progress.filter(p => p.status === 'in_progress').length;
          const completedLabs = progress.filter(p => p.status === 'completed').length;
          
          // Calculate total time from progress with validation
          // Filter out invalid/corrupted time values (e.g., timestamps instead of durations)
          const MAX_REASONABLE_HOURS = 3; // Cap at 100 hours to catch any remaining data issues
          let totalSeconds = 0;
          
          progress.forEach(p => {
            const timeSpent = p.time_spent || 0;
            // If time_spent looks like milliseconds (> 1000000), convert to seconds
            // If it's a timestamp (> current unix timestamp in seconds), skip it
            const currentTimestamp = Date.now() / 1000; // Current time in seconds
            
            if (timeSpent > currentTimestamp) {
              // This looks like a corrupted timestamp, skip it
              console.warn(`Skipping corrupted time_spent value: ${timeSpent} for session`);
              return;
            }
            
            let normalizedSeconds = timeSpent;
            // If value looks like milliseconds, convert to seconds
            if (timeSpent > 1000000) {
              normalizedSeconds = timeSpent / 1000;
            }
            
            totalSeconds += normalizedSeconds;
          });
          
          const totalHours = Math.round(totalSeconds / 3600);
          
          // Additional safety check - cap at reasonable maximum
          const displayHours = Math.min(totalHours, MAX_REASONABLE_HOURS);
          
          // Calculate completion percentage
          const completionPercentage = totalLabs > 0 
            ? Math.round((completedLabs / totalLabs) * 100) 
            : 0;

          // Use setTimeout to avoid ExpressionChangedAfterItHasBeenCheckedError
          setTimeout(() => {
            this.stats = [
              { 
                label: 'Total Labs', 
                value: totalLabs, 
                trend: `${labs.filter(l => l.source === 'module').length} AI-generated`, 
                iconType: 'arrow' 
              },
              { 
                label: 'In Progress', 
                value: inProgressLabs, 
                trend: inProgressLabs > 0 ? 'Active now' : 'No active labs', 
                iconType: 'progress' 
              },
              { 
                label: 'Completed', 
                value: completedLabs, 
                trend: `${completionPercentage}% completion`, 
                iconType: 'check' 
              },
              { 
                label: 'Total Time', 
                value: displayHours > 0 ? `${displayHours}h` : '0h', 
                trend: 'Learning time', 
                iconType: 'arrow' 
              }
            ];
          });
        },
        error: (error) => {
          console.error('Error loading stats:', error);
          // Keep default stats on error
        }
      });
  }

  onSearchChange(value: string) {
    this.searchQuery = value;
  }

  onFilterChange(filter: LabFilter) {
    this.filter = filter;
  }

  onSortChange(sortBy: LabSortBy) {
    this.sortBy = sortBy;
  }

  onLabCardClick(lab: GridLab) {
    this.onResume(lab.id);
  }

  onLabAction(event: { lab: GridLab; action: string }) {
    switch (event.action) {
      case 'resume':
        this.onResume(event.lab.id);
        break;
      case 'review':
        this.onReview(event.lab.id);
        break;
      case 'restart':
        this.onRestart(event.lab.id);
        break;
      case 'delete':
        this.onDelete(event.lab);
        break;
      default:
        console.log(`Lab action "${event.action}" triggered for lab:`, event.lab.id);
    }
  }

  onResume(labId: string) {
    console.log('Resuming lab:', labId);
    this.router.navigate(['/labs', labId]);
  }

  onReview(labId: string) {
    console.log('Reviewing lab:', labId);
    this.router.navigate(['/labs', labId]);
  }

  onRestart(labId: string) {
    console.log('Restarting lab:', labId);
    this.router.navigate(['/labs', labId]);
  }

  onDelete(lab: GridLab) {
    console.log('Deleting lab:', lab.id);
    
    // Determine the source - we need to check if it's a lab or module
    // If the lab object has a source property, use it, otherwise default to 'lab'
    const source = (lab as any).source || 'lab';
    
    this.labsService.deleteLab(lab.id, source)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          console.log('Lab deleted successfully:', lab.id);
          this.toastService.success('Lab deleted successfully');
          // Reload stats after deletion
          this.loadStats();
        },
        error: (error) => {
          console.error('Error deleting lab:', error);
          this.toastService.error('Failed to delete lab', error.error?.error || error.message);
        }
      });
  }

  onCreateLab() {
    this.createOpen = true;
  }

  onLabCreated() {
    console.log('Lab created, refreshing stats and grid...');
    // Reload stats and trigger grid refresh
    this.loadStats();
    // The grid component will automatically reload via its service subscription
  }
}
