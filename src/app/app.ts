import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ButtonComponent } from '../components/ui/button/button';
import { InputComponent } from '../components/ui/input/input';
import { InputGroupComponent } from '../components/ui/input/input-group';
import { DialogComponent } from '../components/ui/dialog/dialog';
import { DialogHeaderComponent } from '../components/ui/dialog/dialog-header';
import { DialogTitleComponent } from '../components/ui/dialog/dialog-title';
import { DialogDescriptionComponent } from '../components/ui/dialog/dialog-description';
import { DialogFooterComponent } from '../components/ui/dialog/dialog-footer';
import { SwitchComponent } from '../components/ui/switch/switch';
import { DropdownMenuComponent } from '../components/ui/dropdown-menu/dropdown-menu';
import { CardComponent } from '../components/ui/card/card';
import { CardHeaderComponent } from '../components/ui/card/card-header';
import { CardTitleComponent } from '../components/ui/card/card-title';
import { CardDescriptionComponent } from '../components/ui/card/card-description';
import { CardContentComponent } from '../components/ui/card/card-content';
import { CardFooterComponent } from '../components/ui/card/card-footer';
import { AvatarComponent } from '../components/ui/avatar/avatar';
import { SelectComponent } from '../components/ui/select/select';
import { CheckboxComponent } from '../components/ui/checkbox/checkbox';
import { TextareaComponent } from '../components/ui/textarea/textarea';
import { RadioComponent } from '../components/ui/radio/radio';
import { TabsComponent } from '../components/ui/tabs/tabs';
import { AlertComponent } from '../components/ui/alert/alert';
import { ProgressComponent } from '../components/ui/progress/progress';
import { TableComponent } from '../components/ui/table/table';
import { PaginationComponent } from '../components/ui/pagination/pagination';
import { NavbarComponent } from '../components/ui/navbar/navbar';
import { NavbarItemComponent } from '../components/ui/navbar/navbar-item/navbar-item';
import { NavbarSectionComponent } from '../components/ui/navbar/navbar-section/navbar-section';
import { NavbarDividerComponent } from '../components/ui/navbar/navbar-divider/navbar-divider';
import { NavbarSpacerComponent } from '../components/ui/navbar/navbar-spacer/navbar-spacer';
import { NavbarLabelComponent } from '../components/ui/navbar/navbar-label/navbar-label';
import { ThemeService } from '../services/theme.service';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    FormsModule,
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
    NavbarLabelComponent
  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('prismo');
  
  // Dialog state
  openDialog = false;
  openTopDialog = false;
  openBottomDialog = false;
  openLargeDialog = false;
  openConfirmDialog = false;

  // Component demo state
  switchValue = false;
  checkboxValue = false;
  radioValue = 'option1';
  selectValue = '';
  textareaValue = '';
  progressValue = 65;
  activeTab = 'tab1';
  
  // Select options
  selectOptions = [
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2' },
    { value: 'option3', label: 'Option 3' }
  ];

  // Tab items
  tabItems = [
    { id: 'tab1', label: 'Tab 1' },
    { id: 'tab2', label: 'Tab 2' },
    { id: 'tab3', label: 'Tab 3' }
  ];

  // Table data
  tableData = [
    { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Admin' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'User' },
    { id: 3, name: 'Bob Johnson', email: 'bob@example.com', role: 'User' },
    { id: 4, name: 'Alice Brown', email: 'alice@example.com', role: 'Moderator' }
  ];

  // Pagination state
  currentPage = 1;
  totalPages = 10;

  // Form data
  formData = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    country: '',
    experience: '',
    skills: {
      angular: false,
      react: false,
      vue: false,
      node: false
    },
    emailNotifications: false,
    smsNotifications: false,
    marketingEmails: false,
    bio: '',
    progress: 75
  };

  // Country options for select
  countryOptions = [
    { value: 'us', label: 'United States' },
    { value: 'ca', label: 'Canada' },
    { value: 'uk', label: 'United Kingdom' },
    { value: 'de', label: 'Germany' },
    { value: 'fr', label: 'France' },
    { value: 'jp', label: 'Japan' },
    { value: 'au', label: 'Australia' }
  ];

  constructor(public themeService: ThemeService) {
  
  }

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
      experience: '',
      skills: {
        angular: false,
        react: false,
        vue: false,
        node: false
      },
      emailNotifications: false,
      smsNotifications: false,
      marketingEmails: false,
      bio: '',
      progress: 75
    };
  }

  saveDraft(): void {
    console.log('Saving draft...', this.formData);
    // In a real app, this would save to localStorage or send to server
  }

  submitForm(): void {
    console.log('Submitting form...', this.formData);
    // In a real app, this would validate and submit to server
    alert('Form submitted successfully! Check console for data.');
  }
}
