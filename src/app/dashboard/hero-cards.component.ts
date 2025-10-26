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
import { CreateLabModalComponent } from '../../components/utility/create-lab-modal/create-lab-modal';

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
    CreateLabModalComponent
  ],
  template: `
    <div class="grid gap-4 md:grid-cols-2 items-stretch">
      <!-- Continue Learning Card -->
      <app-card className="h-full flex flex-col">
        <app-card-header>
          <span class="text-xs font-semibold uppercase tracking-wider text-[#bc78f9]">Continue Learning</span>
          <app-card-title className="text-xl text-foreground">Continue Last Lab</app-card-title>
        </app-card-header>
        <app-card-content className="space-y-3">
          <div>
            <div class="mb-2 text-base font-medium text-foreground">Binary Search Tree Implementation</div>
            <div class="flex items-center gap-2 text-xs text-muted-foreground">
              <span class="inline-flex items-center gap-1">
                <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M14.25.18l.9.2.73.26.59.3.45.32.34.34.25.34.16.33.1.3.04.26.02.2-.01.13V8.5l-.05.63-.13.55-.21.46-.26.38-.3.31-.33.25-.35.19-.35.14-.33.1-.3.07-.26.04-.21.02H8.77l-.69.05-.59.14-.5.22-.41.27-.33.32-.27.35-.2.36-.15.37-.1.35-.07.32-.04.27-.02.21v3.06H3.17l-.21-.03-.28-.07-.32-.12-.35-.18-.36-.26-.36-.36-.35-.46-.32-.59-.28-.73-.21-.88-.14-1.05-.05-1.23.06-1.22.16-1.04.24-.87.32-.71.36-.57.4-.44.42-.33.42-.24.4-.16.36-.1.32-.05.24-.01h.16l.06.01h8.16v-.83H6.18l-.01-2.75-.02-.37.05-.34.11-.31.17-.28.25-.26.31-.23.38-.2.44-.18.51-.15.58-.12.64-.1.71-.06.77-.04.84-.02 1.27.05zm-6.3 1.98l-.23.33-.08.41.08.41.23.34.33.22.41.09.41-.09.33-.22.23-.34.08-.41-.08-.41-.23-.33-.33-.22-.41-.09-.41.09zm13.09 3.95l.28.06.32.12.35.18.36.27.36.35.35.47.32.59.28.73.21.88.14 1.04.05 1.23-.06 1.23-.16 1.04-.24.86-.32.71-.36.57-.4.45-.42.33-.42.24-.4.16-.36.09-.32.05-.24.02-.16-.01h-8.22v.82h5.84l.01 2.76.02.36-.05.34-.11.31-.17.29-.25.25-.31.24-.38.2-.44.17-.51.15-.58.13-.64.09-.71.07-.77.04-.84.01-1.27-.04-1.07-.14-.9-.2-.73-.25-.59-.3-.45-.33-.34-.34-.25-.34-.16-.33-.1-.3-.04-.25-.02-.2.01-.13v-5.34l.05-.64.13-.54.21-.46.26-.38.3-.32.33-.24.35-.2.35-.14.33-.1.3-.06.26-.04.21-.02.13-.01h5.84l.69-.05.59-.14.5-.21.41-.28.33-.32.27-.35.2-.36.15-.36.1-.35.07-.32.04-.28.02-.21V6.07h2.09l.14.01zm-6.47 14.25l-.23.33-.08.41.08.41.23.33.33.23.41.08.41-.08.33-.23.23-.33.08-.41-.08-.41-.23-.33-.33-.23-.41-.08-.41.08z" />
                </svg>
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
        className="group relative cursor-pointer transition-all hover:-translate-y-0.5 hover:bg-white/5 hover:shadow-md hover:shadow-black/20 dark:hover:bg-white/5 outline-none focus-within:ring-2 focus-within:ring-[#bc78f9]/40 py-4 h-full flex flex-col"
        (click)="isModalOpen = true"
        role="button"
        tabindex="0"
        (keydown)="onCardKeyDown($event)"
        aria-label="Create a new lab"
      >
        <app-card-header className="pb-2">
          <div class="flex items-start gap-3">
            <div class="flex h-11 w-11 items-center justify-center rounded-lg bg-[#E978FA15] text-[#bc78f9]">
              <!-- Sparkles icon -->
              <svg class="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M5 3l2 5 5 2-5 2-2 5-2-5-5-2 5-2 2-5zM19 11l1 3 3 1-3 1-1 3-1-3-3-1 3-1 1-3z" />
              </svg>
            </div>
            <div>
              <span class="text-xs font-semibold uppercase tracking-wider text-[#bc78f9]">Create New</span>
              <app-card-title className="mt-1 text-xl text-foreground">Start New Lab</app-card-title>
            </div>
          </div>
        </app-card-header>
        <app-card-content className="pt-0 pb-2">
          <app-card-description>
            Choose a subject and generate a personalized lab based on your learning goals.
          </app-card-description>
          <!-- Decorative sparkles accent (non-interactive) -->
          <span class="pointer-events-none absolute bottom-3 right-3 text-[#bc78f9]/40 group-hover:text-[#bc78f9]/70" aria-hidden="true">
            <svg class="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M5 3l2 5 5 2-5 2-2 5-2-5-5-2 5-2 2-5z" />
            </svg>
          </span>
        </app-card-content>
      </app-card>
    </div>

    <!-- Create Lab Modal -->
    <app-create-lab-modal [open]="isModalOpen" (openChange)="isModalOpen = $event"></app-create-lab-modal>
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


