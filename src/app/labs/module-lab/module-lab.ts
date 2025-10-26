import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntil } from 'rxjs/operators';
import { BehaviorSubject } from 'rxjs';
import { LabDataService } from '../../../services/lab-data.service';
import { LabData } from '../../../services/lab-data.service';

@Component({
  selector: 'app-module-lab',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-background p-6">
      <div class="max-w-6xl mx-auto">
        <h1 class="text-3xl font-bold text-foreground mb-4">Module Lab Loader</h1>
        <p class="text-muted-foreground mb-6">
          This component demonstrates loading a lab from module JSON format.
        </p>
        
        <div class="space-y-4">
          <button 
            (click)="loadCppLab()"
            class="px-4 py-2 bg-primary-custom text-white rounded hover:bg-primary-strong"
          >
            Load C++ Printing Lab
          </button>
          
          <button 
            (click)="loadJavaScriptLab()"
            class="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Load JavaScript Lab
          </button>
        </div>
        
        <div *ngIf="currentLab" class="mt-8 p-4 border rounded-lg">
          <h2 class="text-xl font-semibold mb-2">{{ currentLab.title }}</h2>
          <p class="text-muted-foreground mb-4">{{ currentLab.description }}</p>
          <p class="text-sm text-muted-foreground">
            Difficulty: {{ getDifficultyLabel(currentLab.difficulty) }} | 
            Duration: {{ currentLab.estimatedTime }} min | 
            Sections: {{ currentLab.sections.length }}
          </p>
        </div>
      </div>
    </div>
  `,
})
export class ModuleLabComponent implements OnInit, OnDestroy {
  private destroy$ = new BehaviorSubject<void>(void 0);
  private labDataService = inject(LabDataService);
  private router = inject(Router);

  public currentLab: LabData | null = null;

  ngOnInit(): void {
    // Component initialization
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadCppLab(): void {
    this.labDataService.getLab('example-coding-module')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (lab) => {
          this.currentLab = lab;
          console.log('Loaded C++ lab:', lab);
        },
        error: (err) => {
          console.error('Failed to load C++ lab:', err);
        }
      });
  }

  loadJavaScriptLab(): void {
    this.labDataService.getLab('javascript-basics')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (lab) => {
          this.currentLab = lab;
          console.log('Loaded JavaScript lab:', lab);
        },
        error: (err) => {
          console.error('Failed to load JavaScript lab:', err);
        }
      });
  }

  getDifficultyLabel(difficulty: number): string {
    const labels = ['Beginner', 'Easy', 'Medium', 'Hard', 'Expert'];
    return labels[difficulty - 1] || 'Unknown';
  }
}
