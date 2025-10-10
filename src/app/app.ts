import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ButtonComponent } from '../components/ui/button/button';
import { InputComponent } from '../components/ui/input/input';
import { InputGroupComponent } from '../components/ui/input/input-group';
import { DialogComponent } from '../components/ui/dialog/dialog';
import { DialogHeaderComponent } from '../components/ui/dialog/dialog-header';
import { DialogTitleComponent } from '../components/ui/dialog/dialog-title';
import { DialogDescriptionComponent } from '../components/ui/dialog/dialog-description';
import { DialogFooterComponent } from '../components/ui/dialog/dialog-footer';
import { ThemeService } from '../services/theme.service';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet, 
    ButtonComponent, 
    InputComponent, 
    InputGroupComponent,
    DialogComponent,
    DialogHeaderComponent,
    DialogTitleComponent,
    DialogDescriptionComponent,
    DialogFooterComponent
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

  constructor(public themeService: ThemeService) {}
}
