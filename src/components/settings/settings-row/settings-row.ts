import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-settings-row',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './settings-row.html',
  styleUrls: ['./settings-row.css']
})
export class SettingsRowComponent {
  @Input() label = '';
  @Input() description = '';
}
