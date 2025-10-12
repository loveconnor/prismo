import { Component, Input, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WidgetBaseComponent } from '../../base/widget-base';
import { CardComponent } from '../../../ui/card/card';
import { CardContentComponent } from '../../../ui/card/card-content';
import { ButtonComponent } from '../../../ui/button/button';
import { ProgressComponent } from '../../../ui/progress/progress';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucideLightbulb, lucideInfo, lucideTriangle, lucideEye, lucideEyeOff } from '@ng-icons/lucide';
import { gsap } from 'gsap';

interface Hint {
  id: string;
  tier: number;
  text: string;
  revealed: boolean;
}

@Component({
  selector: 'app-hint-panel',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule,
    CardComponent,
    CardContentComponent,
    ButtonComponent,
    ProgressComponent,
    NgIconComponent
  ],
  providers: [
    provideIcons({
      lucideLightbulb,
      lucideInfo,
      lucideTriangle,
      lucideEye,
      lucideEyeOff
    })
  ],
  template: `
    <app-card>
      <app-card-content>
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold text-foreground flex items-center gap-2">
              <ng-icon name="lucideLightbulb" class="w-5 h-5 text-yellow-500"></ng-icon>
              Hints
            </h3>
            <div class="text-sm text-muted-foreground">
              <span class="font-medium">{{ hintsUsed }}/{{ totalHints }}</span>
            </div>
          </div>
          
          <div class="space-y-3">
            <div 
              *ngFor="let hint of hints; trackBy: trackByHintId" 
              class="border rounded-lg p-4 transition-all duration-200"
              [class.bg-muted/50]="hint.revealed"
              [class.border-primary]="hint.revealed"
              [class.border-l-4]="true"
              [class.border-l-green-500]="hint.tier === 1"
              [class.border-l-yellow-500]="hint.tier === 2"
              [class.border-l-red-500]="hint.tier === 3"
            >
              <div class="inline-block px-2 py-1 text-xs font-medium rounded-full mb-2"
                   [class]="hint.tier === 1 ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' : 
                            hint.tier === 2 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' : 
                            'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'">
                Tier {{ hint.tier }}
              </div>
              
              <div class="text-sm text-foreground leading-relaxed" *ngIf="hint.revealed">
                {{ hint.text }}
              </div>
              
              <app-button 
                *ngIf="!hint.revealed && canRevealHint(hint.tier)"
                variant="outline"
                size="sm"
                (click)="revealHint(hint.id)"
                [disabled]="isRevealing"
                className="w-full"
              >
                <ng-icon name="lucideEye" class="w-4 h-4 mr-2"></ng-icon>
                <span *ngIf="!isRevealing">Reveal Hint</span>
                <span *ngIf="isRevealing">Revealing...</span>
              </app-button>
            </div>
          </div>
          
          <div class="border-t pt-3" *ngIf="showProgress">
            <div class="space-y-2">
              <app-progress [value]="hintProgress" className="h-2"></app-progress>
              <span class="text-xs text-muted-foreground text-center block">{{ hintProgress }}% revealed</span>
            </div>
          </div>
        </div>
      </app-card-content>
    </app-card>
  `
})
export class HintPanelComponent extends WidgetBaseComponent {
  @Input() hints: Hint[] = [];
  @Input() showProgress: boolean = true;
  @Input() maxHintsPerTier: number = 1;

  public isRevealing = false;

  get totalHints(): number {
    return this.hints.length;
  }

  get hintsUsed(): number {
    return this.hints.filter(h => h.revealed).length;
  }

  get hintProgress(): number {
    return this.totalHints > 0 ? Math.round((this.hintsUsed / this.totalHints) * 100) : 0;
  }

  trackByHintId(index: number, hint: Hint): string {
    return hint.id;
  }

  canRevealHint(tier: number): boolean {
    const tierHintsRevealed = this.hints.filter(h => h.tier === tier && h.revealed).length;
    return tierHintsRevealed < this.maxHintsPerTier;
  }

  revealHint(hintId: string): void {
    this.isRevealing = true;
    this.incrementAttempts();

    // Reveal hint immediately
    const hint = this.hints.find(h => h.id === hintId);
    if (hint) {
      hint.revealed = true;
      this.setDataValue('hints_revealed', this.hints.filter(h => h.revealed).map(h => h.id));
      this.setDataValue('total_hints_used', this.hintsUsed);
      this.setDataValue('last_hint_revealed', new Date());
      
      // Check if all hints are revealed
      if (this.hintsUsed === this.totalHints) {
        this.completeWidget();
      }
    }
    this.isRevealing = false;
  }

  protected initializeWidgetData(): void {
    // Initialize hints if not provided
    if (this.hints.length === 0) {
      this.hints = this.getConfigValue('hints', []);
    }

    // Mark initial state
    this.setDataValue('hints_available', this.totalHints);
    this.setDataValue('max_hints_per_tier', this.maxHintsPerTier);
  }

  protected validateInput(): boolean {
    return this.hints.length > 0;
  }

  protected processCompletion(): void {
    this.setDataValue('completion_time', new Date());
    this.setDataValue('hints_used_at_completion', this.hintsUsed);
  }
}
