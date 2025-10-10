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
    ProgressComponent
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

  constructor(public themeService: ThemeService) {}
}
