import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogComponent } from '../../ui/dialog/dialog';
import { DialogHeaderComponent } from '../../ui/dialog/dialog-header';
import { DialogTitleComponent } from '../../ui/dialog/dialog-title';
import { SettingsLeftNavComponent } from '../settings-left-nav/settings-left-nav';
import { SettingsContentComponent } from '../settings-content/settings-content';

@Component({
  selector: 'app-settings-modal',
  standalone: true,
  imports: [
    CommonModule,
    DialogComponent,
    DialogHeaderComponent,
    DialogTitleComponent,
    SettingsLeftNavComponent,
    SettingsContentComponent
  ],
  templateUrl: './settings-modal.html',
  styleUrls: ['./settings-modal.css']
})
export class SettingsModalComponent {
  @Input() open = false;
  @Output() openChange = new EventEmitter<boolean>();

  activeSection = 'profile';

  onOpenChange(open: boolean): void {
    this.open = open;
    this.openChange.emit(open);
    
    // Reset to profile section when modal opens
    if (open) {
      this.activeSection = 'profile';
    }
  }

  onSectionChange(sectionId: string): void {
    this.activeSection = sectionId;
  }
}
