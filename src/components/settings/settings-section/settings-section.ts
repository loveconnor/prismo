import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

type SettingsSectionVariant = 'default' | 'danger';

@Component({
  selector: 'app-settings-section',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './settings-section.html',
  styleUrls: ['./settings-section.css']
})
export class SettingsSectionComponent {
  @Input() title = '';
  @Input() variant: SettingsSectionVariant = 'default';

  get titleClasses(): string {
    return this.variant === 'danger'
      ? 'text-xs font-bold uppercase tracking-wide text-[#dc2626]'
      : 'text-xs font-bold uppercase tracking-wide text-[#6b7280]';
  }
}
