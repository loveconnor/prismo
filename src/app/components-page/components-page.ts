import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterOutlet } from '@angular/router';
import { provideIcons, NgIconComponent } from '@ng-icons/core';
import { 
  lucideChevronDown,
  lucideUser,
  lucideSettings,
  lucideLogOut,
  lucidePencil,
  lucideCopy,
  lucideDownload,
  lucideMenu,
  lucideZap,
  lucideCircleCheck,
  lucideInfo,
  lucideTriangleAlert,
  lucideSearch,
  lucideHouse,
  lucideBookOpen,
  lucideFolder,
  lucideGrid3x3,
  lucideFileText,
  lucideChartBar,
  lucideSparkles,
  lucideBeaker,
  lucideClock,
  lucideStar
} from '@ng-icons/lucide';

// Import all UI components
import { ButtonComponent } from '../../components/ui/button/button';
import { InputComponent } from '../../components/ui/input/input';
import { InputGroupComponent } from '../../components/ui/input/input-group';
import { DialogComponent } from '../../components/ui/dialog/dialog';
import { DialogHeaderComponent } from '../../components/ui/dialog/dialog-header';
import { DialogTitleComponent } from '../../components/ui/dialog/dialog-title';
import { DialogDescriptionComponent } from '../../components/ui/dialog/dialog-description';
import { DialogFooterComponent } from '../../components/ui/dialog/dialog-footer';
import { SwitchComponent } from '../../components/ui/switch/switch';
import { CardComponent } from '../../components/ui/card/card';
import { CardHeaderComponent } from '../../components/ui/card/card-header';
import { CardTitleComponent } from '../../components/ui/card/card-title';
import { CardDescriptionComponent } from '../../components/ui/card/card-description';
import { CardContentComponent } from '../../components/ui/card/card-content';
import { CardFooterComponent } from '../../components/ui/card/card-footer';
import { AvatarComponent } from '../../components/ui/avatar/avatar';
import { SelectComponent } from '../../components/ui/select/select';
import { DropdownMenuComponent } from '../../components/ui/dropdown-menu/dropdown-menu';
import { CheckboxComponent } from '../../components/ui/checkbox/checkbox';
import { TextareaComponent } from '../../components/ui/textarea/textarea';
import { RadioComponent } from '../../components/ui/radio/radio';
import { TabsComponent } from '../../components/ui/tabs/tabs';
import { AlertComponent } from '../../components/ui/alert/alert';
import { ProgressComponent } from '../../components/ui/progress/progress';
import { TableComponent } from '../../components/ui/table/table';
import { PaginationComponent } from '../../components/ui/pagination/pagination';
import { NavbarComponent } from '../../components/ui/navbar/navbar';
import { NavbarItemComponent } from '../../components/ui/navbar/navbar-item/navbar-item';
import { NavbarSectionComponent } from '../../components/ui/navbar/navbar-section/navbar-section';
import { NavbarDividerComponent } from '../../components/ui/navbar/navbar-divider/navbar-divider';
import { NavbarSpacerComponent } from '../../components/ui/navbar/navbar-spacer/navbar-spacer';
import { NavbarLabelComponent } from '../../components/ui/navbar/navbar-label/navbar-label';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-components-page',
  providers: [
    provideIcons({
      lucideChevronDown,
      lucideUser,
      lucideSettings,
      lucideLogOut,
      lucidePencil,
      lucideCopy,
      lucideDownload,
      lucideMenu,
      lucideZap,
      lucideCircleCheck,
      lucideInfo,
      lucideTriangleAlert,
      lucideSearch,
      lucideHouse,
      lucideBookOpen,
      lucideFolder,
      lucideGrid3x3,
      lucideFileText,
      lucideChartBar,
      lucideSparkles,
      lucideBeaker,
      lucideClock,
      lucideStar
    })
  ],
  imports: [
    CommonModule,
    FormsModule,
    RouterOutlet,
    NgIconComponent,
    ButtonComponent,
    InputComponent,
    InputGroupComponent,
    DialogComponent,
    DialogHeaderComponent,
    DialogTitleComponent,
    DialogDescriptionComponent,
    DialogFooterComponent,
    SwitchComponent,
    CardComponent,
    CardHeaderComponent,
    CardTitleComponent,
    CardDescriptionComponent,
    CardContentComponent,
    CardFooterComponent,
    AvatarComponent,
    SelectComponent,
    DropdownMenuComponent,
    CheckboxComponent,
    TextareaComponent,
    RadioComponent,
    TabsComponent,
    AlertComponent,
    ProgressComponent,
    TableComponent,
    PaginationComponent,
    NavbarComponent,
    NavbarItemComponent,
    NavbarSectionComponent,
    NavbarDividerComponent,
    NavbarSpacerComponent,
    NavbarLabelComponent,
  ],
  templateUrl: './components-page.html',
  styleUrl: './components-page.css'
})
export class ComponentsPage implements OnInit, OnDestroy {
  // Component state
  switchValue = false;
  checkboxValue = false;
  radioValue = 'option1';
  selectValue = '';
  textareaValue = '';
  progressValue = 65;
  activeTab = 'tab1';
  
  // Form data
  formData = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    country: '',
    newsletter: false,
    notifications: 'all',
    bio: '',
    experience: 'intermediate',
    skills: {
      angular: false,
      react: false,
      vue: false,
      node: false
    },
    emailNotifications: false,
    smsNotifications: false,
    marketingEmails: false
  };
  
  // Options
  selectOptions = [
    { value: 'us', label: 'United States' },
    { value: 'ca', label: 'Canada' },
    { value: 'uk', label: 'United Kingdom' },
    { value: 'de', label: 'Germany' },
    { value: 'fr', label: 'France' }
  ];
  
  countryOptions = [
    { value: 'us', label: 'United States' },
    { value: 'ca', label: 'Canada' },
    { value: 'uk', label: 'United Kingdom' },
    { value: 'de', label: 'Germany' },
    { value: 'fr', label: 'France' }
  ];
  
  tabItems = [
    { id: 'tab1', label: 'Overview' },
    { id: 'tab2', label: 'Details' },
    { id: 'tab3', label: 'Settings' }
  ];
  
  // Table data
  tableData = [
    { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Admin' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'User' },
    { id: 3, name: 'Bob Johnson', email: 'bob@example.com', role: 'User' }
  ];
  
  // Pagination
  currentPage = 1;
  totalPages = 5;
  
  // Dialog states
  openDialog = false;
  openTopDialog = false;
  openBottomDialog = false;
  openLargeDialog = false;
  openConfirmDialog = false;
  
  // Scroll spy
  activeSection = 'buttons';

  constructor(public themeService: ThemeService) {}

  ngOnInit(): void {
    // Avoid SSR errors when document/window are not available
    if (typeof document !== 'undefined') {
      this.updateActiveSection();
    }
  }

  ngOnDestroy(): void {
    // Cleanup if needed
  }

  @HostListener('window:scroll')
  onScroll(): void {
    if (typeof window === 'undefined') return;
    this.updateActiveSection();
  }

  private updateActiveSection(): void {
    if (typeof document === 'undefined') return;
    const sections = ['buttons', 'inputs', 'dialogs', 'forms', 'alerts', 'cards', 'toggles', 'tabs', 'progess', 'table', 'pagination', 'navbar'];
    
    for (const section of sections) {
      const element = document.getElementById(section);
      if (element) {
        const rect = element.getBoundingClientRect();
        if (rect.top <= 100 && rect.bottom >= 100) {
          this.activeSection = section;
          break;
        }
      }
    }
  }

  navigateToSection(sectionId: string): void {
    if (typeof document === 'undefined') return;
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  }

  // Event handlers
  onTabChange(tabId: string): void {
    this.activeTab = tabId;
  }

  onPageChange(page: number): void {
    this.currentPage = page;
  }

  // Form methods
  resetForm(): void {
    this.formData = {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      country: '',
      newsletter: false,
      notifications: 'all',
      bio: '',
      experience: 'intermediate',
      skills: {
        angular: false,
        react: false,
        vue: false,
        node: false
      },
      emailNotifications: false,
      smsNotifications: false,
      marketingEmails: false
    };
  }

  saveDraft(): void {
    console.log('Saving draft...', this.formData);
  }

  submitForm(): void {
    console.log('Submitting form...', this.formData);
  }
}
