import { Component, EventEmitter, Input, OnInit, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { provideIcons, NgIconComponent } from '@ng-icons/core';
import { lucidePlus } from '@ng-icons/lucide';
import { DialogComponent } from '../../ui/dialog/dialog';
import { DialogHeaderComponent } from '../../ui/dialog/dialog-header';
import { DialogTitleComponent } from '../../ui/dialog/dialog-title';
import { DialogDescriptionComponent } from '../../ui/dialog/dialog-description';
import { DialogFooterComponent } from '../../ui/dialog/dialog-footer';
import { ButtonComponent } from '../../ui/button/button';
import { InputComponent } from '../../ui/input/input';

@Component({
  selector: 'app-add-to-collection-modal',
  standalone: true,
  providers: [provideIcons({ lucidePlus })],
  imports: [
    CommonModule,
    FormsModule,
    DialogComponent,
    DialogHeaderComponent,
    DialogTitleComponent,
    DialogDescriptionComponent,
    DialogFooterComponent,
    ButtonComponent,
    InputComponent,
    NgIconComponent
  ],
  templateUrl: './add-to-collection-modal.html',
  styleUrls: ['./add-to-collection-modal.css']
})
export class AddToCollectionModalComponent implements OnInit {
  @Input() open = false;
  @Input() labId = '';

  @Output() openChange = new EventEmitter<boolean>();
  @Output() added = new EventEmitter<string>();

  private readonly storageKey = 'labs.collections';
  private readonly collectionsSignal = signal<string[]>([]);
  readonly collections = this.collectionsSignal.asReadonly();
  selectedCollection = signal<string | null>(null);
  newCollectionName = '';

  ngOnInit(): void {
    this.loadCollections();
  }

  onOpenChange(value: boolean): void {
    this.open = value;
    this.openChange.emit(value);

    if (!value) {
      this.newCollectionName = '';
      this.selectedCollection.set(null);
    }
  }

  onSelectCollection(name: string): void {
    this.selectedCollection.set(name);
  }

  createCollection(): void {
    const name = this.newCollectionName.trim();
    if (!name) {
      return;
    }

    const current = this.collectionsSignal();
    if (!current.includes(name)) {
      this.collectionsSignal.set([name, ...current]);
      this.persistCollections();
    }

    this.selectedCollection.set(name);
    this.newCollectionName = '';
  }

  confirmSelection(): void {
    const selection = this.selectedCollection();
    if (!selection) {
      return;
    }

    this.added.emit(selection);
    this.onOpenChange(false);
  }

  trackByCollection(index: number, item: string): string {
    return `${item}-${index}`;
  }

  private loadCollections(): void {
    if (typeof window === 'undefined') {
      this.collectionsSignal.set(this.getDefaultCollections());
      return;
    }

    try {
      const stored = window.localStorage.getItem(this.storageKey);
      if (stored) {
        const parsed = JSON.parse(stored) as string[];
        this.collectionsSignal.set(parsed);
      } else {
        this.collectionsSignal.set(this.getDefaultCollections());
      }
    } catch {
      this.collectionsSignal.set(this.getDefaultCollections());
    }
  }

  private persistCollections(): void {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      window.localStorage.setItem(this.storageKey, JSON.stringify(this.collectionsSignal()));
    } catch {
      // ignore storage errors
    }
  }

  private getDefaultCollections(): string[] {
    return ['Frontend Mastery', 'Backend Fundamentals', 'Interview Prep', 'Data Structures'];
  }
}
