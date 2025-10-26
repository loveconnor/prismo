import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { provideIcons, NgIconComponent } from '@ng-icons/core';
import {
  lucidePlay,
  lucideRotateCcw,
  lucideCopy,
  lucideShare2,
  lucideFolderPlus,
  lucideBookmark,
  lucideTrash2,
  lucidePlus,
  lucideLoader
} from '@ng-icons/lucide';
import { DropdownMenuComponent } from '../../ui/dropdown-menu/dropdown-menu';
import { ConfirmDialogComponent } from '../../ui/confirm-dialog/confirm-dialog';
import { AddToCollectionModalComponent } from '../../collections/add-to-collection-modal/add-to-collection-modal';
import { ToastService } from '../../../services/toast.service';
import type { Lab } from '../labs-grid/labs-grid';

type LoadingAction = 'restart' | 'duplicate' | 'share' | 'bookmark' | 'delete' | null;

@Component({
  selector: 'app-lab-card-dropdown',
  standalone: true,
  providers: [
    provideIcons({
      lucidePlay,
      lucideRotateCcw,
      lucideCopy,
      lucideShare2,
      lucideFolderPlus,
      lucideBookmark,
      lucideTrash2,
      lucidePlus,
      lucideLoader
    })
  ],
  imports: [CommonModule, DropdownMenuComponent, NgIconComponent, ConfirmDialogComponent, AddToCollectionModalComponent],
  templateUrl: './lab-card-dropdown.html',
  styleUrls: ['./lab-card-dropdown.css']
})
export class LabCardDropdownComponent implements OnChanges {
  @Input({ required: true }) lab!: Lab;
  @Input() isBookmarked = false;

  @Output() action = new EventEmitter<string>();

  @ViewChild(DropdownMenuComponent) dropdownMenu?: DropdownMenuComponent;

  isOpen = false;
  restartDialogOpen = false;
  deleteDialogOpen = false;
  addModalOpen = false;
  bookmarked = false;
  loadingAction: LoadingAction = null;

  constructor(private toastService: ToastService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isBookmarked']) {
      this.bookmarked = !!changes['isBookmarked'].currentValue;
    }
  }

  onOpenChange(open: boolean): void {
    this.isOpen = open;
  }

  resumeLab(): void {
    this.closeMenu();
    this.action.emit('resume');
  }

  queueRestart(): void {
    this.closeMenu();
    this.restartDialogOpen = true;
  }

  queueDelete(): void {
    this.closeMenu();
    this.deleteDialogOpen = true;
  }

  openAddToCollection(): void {
    this.addModalOpen = true;
    this.closeMenu();
  }

  async confirmRestart(): Promise<void> {
    await this.performActionWithToast('restart', 'Lab restarted successfully', 'Failed to restart lab', () => {
      this.restartDialogOpen = false;
      this.action.emit('restart');
    });
  }

  async duplicateLab(): Promise<void> {
    this.closeMenu();
    await this.performActionWithToast('duplicate', 'Lab duplicated successfully', 'Failed to duplicate lab', () => {
      this.action.emit('duplicate');
    });
  }

  async shareLab(): Promise<void> {
    this.closeMenu();
    await this.performActionWithToast('share', 'Share link copied to clipboard', 'Failed to generate share link', async () => {
      const shareLink =
        typeof window !== 'undefined'
          ? `${window.location.origin}/shared-lab/${this.lab.id}`
          : `/shared-lab/${this.lab.id}`;

      if (typeof navigator === 'undefined' || !navigator.clipboard) {
        throw new Error('Clipboard API unavailable');
      }

      await navigator.clipboard.writeText(shareLink);

      this.action.emit('share');
    });
  }

  async toggleBookmark(): Promise<void> {
    this.closeMenu();
    await this.performActionWithToast(
      'bookmark',
      this.bookmarked ? 'Bookmark removed' : 'Lab bookmarked',
      'Failed to update bookmark',
      () => {
        this.bookmarked = !this.bookmarked;
        this.lab.bookmarked = this.bookmarked;
        this.action.emit('bookmark');
      }
    );
  }

  async confirmDelete(): Promise<void> {
    this.deleteDialogOpen = false;
    this.loadingAction = 'delete';
    this.action.emit('delete');
    // Note: The actual deletion and success/error handling is done by the parent component
    // The loading state will be reset by the parent or when the component is destroyed
  }

  onCollectionAdded(name: string): void {
    this.toastService.success('Lab added to collection', `Added to “${name}”.`);
    this.action.emit('add-to-collection');
  }

  onCollectionOpenChange(open: boolean): void {
    this.addModalOpen = open;
  }

  closeRestartDialog(): void {
    this.restartDialogOpen = false;
  }

  closeDeleteDialog(): void {
    this.deleteDialogOpen = false;
  }

  get isRestartLoading(): boolean {
    return this.loadingAction === 'restart';
  }

  get isDuplicateLoading(): boolean {
    return this.loadingAction === 'duplicate';
  }

  get isShareLoading(): boolean {
    return this.loadingAction === 'share';
  }

  get isBookmarkLoading(): boolean {
    return this.loadingAction === 'bookmark';
  }

  get isDeleteLoading(): boolean {
    return this.loadingAction === 'delete';
  }

  private closeMenu(): void {
    this.dropdownMenu?.close();
    this.isOpen = false;
  }

  private async performActionWithToast(
    action: Exclude<LoadingAction, null>,
    successMessage: string,
    errorMessage: string,
    onSuccess: () => void | Promise<void>
  ): Promise<void> {
    this.loadingAction = action;

    try {
      await new Promise(resolve => setTimeout(resolve, action === 'bookmark' ? 500 : 1000));
      await onSuccess();
      this.toastService.success(successMessage);
    } catch (error) {
      this.toastService.error(errorMessage);
    } finally {
      this.loadingAction = null;
    }
  }
}
