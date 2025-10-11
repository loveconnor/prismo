import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { provideIcons, NgIconComponent } from '@ng-icons/core';
import { 
  lucidePlus,
  lucideSearch,
  lucideFolder,
  lucidePlay,
  lucideCheck,
  lucideClock,
  lucideBinary,
  lucideMenu,
  lucideCode,
  lucideDatabase,
  lucideX
} from '@ng-icons/lucide';
import { 
  ButtonComponent,
  CardComponent,
  CardContentComponent,
  CardHeaderComponent,
  CardTitleComponent,
  ProgressComponent,
  InputComponent,
  SelectComponent
} from '../../components/ui';

@Component({
  selector: 'app-labs',
  standalone: true,
  providers: [
    provideIcons({
      lucidePlus,
      lucideSearch,
      lucideFolder,
      lucidePlay,
      lucideCheck,
      lucideClock,
      lucideBinary,
      lucideMenu,
      lucideCode,
      lucideDatabase,
      lucideX
    })
  ],
  imports: [
    CommonModule,
    FormsModule,
    NgIconComponent,
    ButtonComponent,
    CardComponent,
    CardContentComponent,
    CardHeaderComponent,
    CardTitleComponent,
    ProgressComponent,
    InputComponent,
    SelectComponent
  ],
  templateUrl: './labs.html',
  styleUrls: ['./labs.css']
})
export class LabsComponent implements OnInit {
  // Search and filter state
  searchQuery = '';
  filter = 'all';
  sortBy = 'recent';

  // Sample lab data
  labs = [
    {
      id: "1",
      title: "Binary Search Tree Implementation",
      status: "in-progress",
      difficulty: "medium",
      language: "Python",
      time: "45 min",
      progress: 65,
      icon: "lucide-binary"
    },
    {
      id: "2",
      title: "React Hooks & State Management",
      status: "completed",
      difficulty: "medium",
      language: "JavaScript",
      time: "82 min",
      progress: 100,
      completedDate: "Oct 1, 2025",
      icon: "lucide-code"
    },
    {
      id: "3",
      title: "SQL Query Optimization",
      status: "in-progress",
      difficulty: "hard",
      language: "SQL",
      time: "60 min",
      progress: 30,
      icon: "lucide-database"
    }
  ];

  stats = [
    {
      label: "Total Labs",
      value: "12",
      trend: "+2 this week",
      icon: "lucide-folder"
    },
    {
      label: "In Progress",
      value: "4",
      trend: "Active now",
      icon: "lucide-play"
    },
    {
      label: "Completed",
      value: "8",
      trend: "67% completion",
      icon: "lucide-check"
    },
    {
      label: "Total Time",
      value: "18h",
      trend: "+3h this week",
      icon: "lucide-clock"
    }
  ];

  filterOptions = [
    { value: 'all', label: 'All' },
    { value: 'in-progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' }
  ];

  sortOptions = [
    { value: 'recent', label: 'Most Recent' },
    { value: 'progress', label: 'Progress' },
    { value: 'time', label: 'Time Spent' },
    { value: 'title', label: 'Title A-Z' }
  ];

  ngOnInit() {
    // Initialize any necessary data
  }

  onSearchChange(value: string) {
    this.searchQuery = value;
  }

  onFilterChange(filter: string) {
    this.filter = filter;
  }

  onSortChange(sortBy: string) {
    this.sortBy = sortBy;
  }

  onResume(labId: string) {
    console.log('Resuming lab:', labId);
  }

  onReview(labId: string) {
    console.log('Reviewing lab:', labId);
  }

  onRestart(labId: string) {
    console.log('Restarting lab:', labId);
  }

  onCreateLab() {
    console.log('Creating new lab');
  }

  getDifficultyClass(difficulty: string, status: string): string {
    if (status === "completed") {
      return "bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400";
    }
    switch (difficulty) {
      case "easy":
        return "bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400";
      case "medium":
        return "bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400";
      case "hard":
        return "bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400";
      default:
        return "bg-muted text-muted-foreground";
    }
  }

  getDifficultyLabel(difficulty: string, status: string): string {
    if (status === "completed") {
      return "Completed";
    }
    return difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
  }

  getStatIcon(stat: any): string {
    return stat.icon;
  }

  getLabIcon(lab: any): string {
    return lab.icon;
  }
}