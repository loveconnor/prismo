import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ButtonComponent } from '../components/ui/button/button';
import { InputComponent } from '../components/ui/input/input';
import { InputGroupComponent } from '../components/ui/input/input-group';
import { ThemeService } from '../services/theme.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ButtonComponent, InputComponent, InputGroupComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('prismo');

  constructor(public themeService: ThemeService) {}
}
