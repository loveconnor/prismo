import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { provideIcons, NgIconComponent } from '@ng-icons/core';
import { lucideSearch, lucideX } from '@ng-icons/lucide';
import { InputComponent } from '../../ui/input/input';
import { ButtonComponent } from '../../ui/button/button';
import { SelectComponent } from '../../ui/select/select';

export type LabFilter = 'all' | 'in-progress' | 'completed';
export type LabSortBy = 'recent' | 'progress' | 'time' | 'title';

@Component({
  selector: 'app-labs-toolbar',
  standalone: true,
  providers: [
    provideIcons({
      lucideSearch,
      lucideX
    })
  ],
  imports: [CommonModule, FormsModule, NgIconComponent, InputComponent, ButtonComponent, SelectComponent],
  templateUrl: './labs-toolbar.html',
  styleUrls: ['./labs-toolbar.css']
})
export class LabsToolbarComponent {
  @Input() searchQuery = '';
  @Input() filter: LabFilter = 'all';
  @Input() sortBy: LabSortBy = 'recent';

  @Output() searchChange = new EventEmitter<string>();
  @Output() filterChange = new EventEmitter<LabFilter>();
  @Output() sortChange = new EventEmitter<LabSortBy>();

  onSearchChange(value: string) {
    this.searchChange.emit(value);
  }

  onFilterChange(filter: string) {
    this.filterChange.emit(filter as LabFilter);
  }

  onSortChange(sortBy: string) {
    this.sortChange.emit(sortBy as LabSortBy);
  }

  onClearFilters() {
    this.searchChange.emit('');
    this.filterChange.emit('all');
    this.sortChange.emit('recent');
  }

  get hasActiveFilters(): boolean {
    return this.searchQuery.trim().length > 0 || this.filter !== 'all' || this.sortBy !== 'recent';
  }

  get filterOptions() {
    return [
      { value: 'all', label: 'All' },
      { value: 'in-progress', label: 'In Progress' },
      { value: 'completed', label: 'Completed' }
    ];
  }

  get sortOptions() {
    return [
      { value: 'recent', label: 'Most Recent' },
      { value: 'progress', label: 'Progress' },
      { value: 'time', label: 'Time Spent' },
      { value: 'title', label: 'Title A-Z' }
    ];
  }
}
