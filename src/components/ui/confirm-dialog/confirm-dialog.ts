import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogComponent } from '../dialog/dialog';
import { DialogHeaderComponent } from '../dialog/dialog-header';
import { DialogTitleComponent } from '../dialog/dialog-title';
import { DialogDescriptionComponent } from '../dialog/dialog-description';
import { DialogFooterComponent } from '../dialog/dialog-footer';
import { ButtonComponent } from '../button/button';

export type ConfirmDialogVariant = 'default' | 'danger';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [
    CommonModule,
    DialogComponent,
    DialogHeaderComponent,
    DialogTitleComponent,
    DialogDescriptionComponent,
    DialogFooterComponent,
    ButtonComponent
  ],
  templateUrl: './confirm-dialog.html',
  styleUrls: ['./confirm-dialog.css']
})
export class ConfirmDialogComponent {
  @Input() open = false;
  @Input() title = '';
  @Input() description = '';
  @Input() confirmLabel = 'Confirm';
  @Input() cancelLabel = 'Cancel';
  @Input() variant: ConfirmDialogVariant = 'default';
  @Input() loading = false;

  @Output() openChange = new EventEmitter<boolean>();
  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  onOpenChange(open: boolean) {
    this.openChange.emit(open);
  }

  onConfirm() {
    this.confirm.emit();
  }

  onCancel() {
    this.cancel.emit();
    this.openChange.emit(false);
  }

  get confirmButtonColor(): string {
    return this.variant === 'danger' ? 'red' : 'blue';
  }
}