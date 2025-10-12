import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WidgetBaseComponent } from '../../base/widget-base';
import { ButtonComponent } from '../../../ui/button/button';

interface Hint {
  id: string;
  tier: number;
  text: string;
  revealed: boolean;
}

@Component({
  selector: 'app-hint-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="w-full space-y-4">
      <div class="flex items-center justify-between border-b border-gray-200 pb-2">
        <h3 class="text-lg font-semibold text-gray-900">Hints</h3>
        <div class="text-sm text-gray-500">
          <span class="font-medium">{{ hintsUsed }}/{{ totalHints }}</span>
        </div>
      </div>
      
      <div class="space-y-3">
        <div 
          *ngFor="let hint of hints; trackBy: trackByHintId" 
          class="border border-gray-200 rounded-lg p-4 transition-all duration-200"
          [class.bg-gray-50]="hint.revealed"
          [class.border-blue-500]="hint.revealed"
          [class.border-l-4]="true"
          [class.border-l-green-500]="hint.tier === 1"
          [class.border-l-yellow-500]="hint.tier === 2"
          [class.border-l-red-500]="hint.tier === 3"
        >
          <div class="inline-block px-2 py-1 text-xs font-medium rounded-full mb-2"
               [class]="hint.tier === 1 ? 'bg-green-100 text-green-800' : 
                        hint.tier === 2 ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-red-100 text-red-800'">
            Tier {{ hint.tier }}
          </div>
          
          <div class="text-sm text-gray-900 leading-relaxed" *ngIf="hint.revealed">
            {{ hint.text }}
          </div>
          
          <button 
            *ngIf="!hint.revealed && canRevealHint(hint.tier)"
            class="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            (click)="revealHint(hint.id)"
            [disabled]="isRevealing"
          >
            <span *ngIf="!isRevealing">Reveal Hint</span>
            <span *ngIf="isRevealing">Revealing...</span>
          </button>
        </div>
      </div>
      
      <div class="border-t border-gray-200 pt-3" *ngIf="showProgress">
        <div class="space-y-2">
          <div class="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              class="h-full bg-blue-600 transition-all duration-300" 
              [style.width.%]="hintProgress"
            ></div>
          </div>
          <span class="text-xs text-gray-500 text-center block">{{ hintProgress }}% revealed</span>
        </div>
      </div>
    </div>
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

    // Simulate reveal delay
    setTimeout(() => {
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
    }, 500);
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
