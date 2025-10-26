import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { provideIcons, NgIconComponent } from '@ng-icons/core';
import { lucideCheck, lucideChevronDown, lucideX } from '@ng-icons/lucide';
import { InputComponent } from '../../ui/input/input';
import { ButtonComponent } from '../../ui/button/button';
import { DropdownMenuComponent } from '../../ui/dropdown-menu/dropdown-menu';

export type LabFilter = 'all' | 'in-progress' | 'completed';
export type LabSortBy = 'recent' | 'progress' | 'time' | 'title';

type FilterOption = { value: LabFilter; label: string };
type SortOption = { value: LabSortBy; label: string };

const FILTER_TABS: FilterOption[] = [
  { value: 'all', label: 'All' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' }
];

const SORT_OPTIONS: SortOption[] = [
  { value: 'recent', label: 'Most Recent' },
  { value: 'progress', label: 'Highest Progress' },
  { value: 'time', label: 'Longest Duration' },
  { value: 'title', label: 'Title A-Z' }
];

@Component({
  selector: 'app-labs-toolbar',
  standalone: true,
  providers: [
    provideIcons({
      lucideX,
      lucideCheck,
      lucideChevronDown
    })
  ],
  imports: [CommonModule, FormsModule, NgIconComponent, InputComponent, ButtonComponent, DropdownMenuComponent],
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

  readonly filterTabs = FILTER_TABS;
  readonly sortOptions = SORT_OPTIONS;

  onSearchChange(value: string) {
    this.searchQuery = value;
    this.searchChange.emit(value);
  }

  onFilterChange(filter: LabFilter) {
    this.filter = filter;
    this.filterChange.emit(filter);
  }

  onSortChange(sortBy: LabSortBy) {
    if (this.sortBy === sortBy) {
      return;
    }
    this.sortBy = sortBy;
    this.sortChange.emit(sortBy);
  }

  onClearFilters() {
    this.searchQuery = '';
    this.filter = 'all';
    this.sortBy = 'recent';

    this.searchChange.emit(this.searchQuery);
    this.filterChange.emit(this.filter);
    this.sortChange.emit(this.sortBy);
  }

  get shouldShowClear(): boolean {
    return this.searchQuery.trim().length > 0 || this.filter !== 'all' || this.sortBy !== 'recent';
  }

  getFilterButtonClasses(option: LabFilter): string {
    const baseClasses = 'h-8 whitespace-nowrap px-4 text-sm';
    return this.filter === option
      ? `${baseClasses} bg-primary-custom hover:bg-primary-strong text-white`
      : `${baseClasses} text-muted-foreground hover:bg-muted`;
  }

  trackByFilterIndex(index: number, option: FilterOption): LabFilter {
    return option.value;
  }

  trackBySortValue(index: number, option: SortOption): LabSortBy {
    return option.value;
  }

  getSortLabel(value: LabSortBy): string {
    return this.sortOptions.find(option => option.value === value)?.label ?? 'Sort';
  }
}
