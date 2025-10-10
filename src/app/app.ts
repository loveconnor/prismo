import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ButtonComponent } from '../components/ui/button/button';
import { ThemeService } from '../services/theme.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ButtonComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('prismo');

  constructor(public themeService: ThemeService) {}
}
