import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonComponent } from '../../components/ui/button/button';
import { CardComponent } from '../../components/ui/card/card';
import { CardHeaderComponent } from '../../components/ui/card/card-header';
import { CardTitleComponent } from '../../components/ui/card/card-title';
import { CardContentComponent } from '../../components/ui/card/card-content';
import { CardFooterComponent } from '../../components/ui/card/card-footer';
import { CardDescriptionComponent } from '../../components/ui/card/card-description';
import { ProgressComponent } from '../../components/ui/progress/progress';
import { DialogComponent } from '../../components/ui/dialog/dialog';
import { DialogHeaderComponent } from '../../components/ui/dialog/dialog-header';
import { DialogTitleComponent } from '../../components/ui/dialog/dialog-title';
import { DialogDescriptionComponent } from '../../components/ui/dialog/dialog-description';
import { DialogFooterComponent } from '../../components/ui/dialog/dialog-footer';
import { NgIcon } from '@ng-icons/core';
import { provideIcons } from '@ng-icons/core';
import { lucideSparkles, lucideBeaker } from '@ng-icons/lucide';

@Component({
  selector: 'app-hero-cards',
  standalone: true,
  imports: [
    CommonModule,
    ButtonComponent,
    CardComponent,
    CardHeaderComponent,
    CardTitleComponent,
    CardContentComponent,
    CardFooterComponent,
    CardDescriptionComponent,
    ProgressComponent,
    DialogComponent,
    DialogHeaderComponent,
    DialogTitleComponent,
    DialogDescriptionComponent,
    DialogFooterComponent,
    NgIcon
  ],
  providers: [provideIcons({ lucideSparkles, lucideBeaker })],
  template: `
    <div class="grid gap-4 md:grid-cols-2 items-stretch">
      <!-- Continue Learning Card -->
      <app-card className="h-full flex flex-col">
        <app-card-header>
          <span class="text-xs font-semibold uppercase tracking-wider text-[#60a5fa]">Continue Learning</span>
          <app-card-title className="text-xl text-foreground">Continue Last Lab</app-card-title>
        </app-card-header>
        <app-card-content className="space-y-3">
          <div>
            <div class="mb-2 text-base font-medium text-foreground">Binary Search Tree Implementation</div>
            <div class="flex items-center gap-2 text-xs text-muted-foreground">
              <span class="inline-flex items-center gap-1">
                <ng-icon name="lucideBeaker" class="h-3.5 w-3.5"></ng-icon>
                Python
              </span>
              <span>&bull;</span>
              <span>Medium</span>
            </div>
          </div>
          <div class="space-y-2">
            <app-progress [value]="65" className="h-1.5"></app-progress>
            <div class="flex items-center gap-2 text-xs text-muted-foreground">
              <span>65% complete</span>
              <span>&bull;</span>
              <span>45 min spent</span>
            </div>
          </div>
        </app-card-content>
        <app-card-footer className="justify-center">
          <app-button className="w-full sm:w-2/3 md:w-1/2">Resume Lab</app-button>
        </app-card-footer>
      </app-card>

      <!-- Create New Lab Card -->
      <app-card
        className="group relative cursor-pointer transition-all hover:-translate-y-0.5 hover:bg-white/5 hover:shadow-md hover:shadow-black/20 dark:hover:bg-white/5 outline-none focus-within:ring-2 focus-within:ring-[#60a5fa]/40 py-4 h-full flex flex-col"
        (click)="isModalOpen = true"
        role="button"
        tabindex="0"
        (keydown)="onCardKeyDown($event)"
        aria-label="Create a new lab"
      >
        <app-card-header className="pb-2">
          <div class="flex items-start gap-3">
            <div class="flex h-11 w-11 items-center justify-center rounded-lg bg-[rgba(96,165,250,0.15)] text-[#60a5fa]">
              <ng-icon name="lucideSparkles" class="h-5 w-5"></ng-icon>
            </div>
            <div>
              <span class="text-xs font-semibold uppercase tracking-wider text-[#60a5fa]">Create New</span>
              <app-card-title className="mt-1 text-xl text-foreground">Start New Lab</app-card-title>
            </div>
          </div>
        </app-card-header>
        <app-card-content className="pt-0 pb-2">
          <app-card-description>
            Choose a subject and generate a personalized lab based on your learning goals.
          </app-card-description>
          <!-- Decorative sparkles accent (non-interactive) -->
          <span class="pointer-events-none absolute bottom-3 right-3 text-[#60a5fa]/40 group-hover:text-[#60a5fa]/70" aria-hidden="true">
            <ng-icon name="lucideSparkles" class="h-5 w-5"></ng-icon>
          </span>
        </app-card-content>
      </app-card>
    </div>

    <!-- Create Lab Modal -->
    <app-dialog [(open)]="isModalOpen" size="lg">
      <app-dialog-header>
        <app-dialog-title>Start a New Lab</app-dialog-title>
        <app-dialog-description>
          Pick a subject to generate a customized lab. This is a placeholder modal using the built-in dialog component.
        </app-dialog-description>
      </app-dialog-header>
      <div class="mt-4 space-y-3">
        <div class="rounded-md border border-border p-4 text-sm text-muted-foreground">Form fields go here.</div>
      </div>
      <app-dialog-footer className="mt-6 flex justify-end gap-2">
        <app-button variant="outline" (click)="isModalOpen = false">Cancel</app-button>
        <app-button (click)="isModalOpen = false">Create</app-button>
      </app-dialog-footer>
    </app-dialog>
  `
})
export class HeroCardsComponent {
  isModalOpen = false;

  onCardKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.isModalOpen = true;
    }
  }
}


