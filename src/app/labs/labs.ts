import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { provideIcons, NgIconComponent } from '@ng-icons/core';
import { lucidePlus } from '@ng-icons/lucide';
import { ButtonComponent } from '../../components/ui/button/button';
import { LabsStatsComponent } from '../../components/labs/labs-stats/labs-stats';
import { LabsToolbarComponent, LabFilter, LabSortBy } from '../../components/labs/labs-toolbar/labs-toolbar';
import { LabsGridComponent, Lab as GridLab } from '../../components/labs/labs-grid/labs-grid';
import { CreateLabModalComponent } from '../../components/utility/create-lab-modal/create-lab-modal';

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
export class LabsComponent {
  private router = inject(Router);
  
  searchQuery = '';
  filter: LabFilter = 'all';
  sortBy: LabSortBy = 'recent';
  createOpen = false;

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

  onCreateLab() {
    this.createOpen = true;
  }
}
