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
  viewCount: number;
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
    <div class="space-y-3">
      <!-- Header -->
      <div class="flex items-center justify-between px-1">
        <div class="flex items-center gap-2">
          <div class="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500/20 to-amber-600/20 border border-amber-500/30">
            <ng-icon name="lucideLightbulb" class="w-4 h-4 text-amber-400"></ng-icon>
          </div>
          <h3 class="text-base font-semibold text-[#e5e7eb]">Hints</h3>
        </div>
        <div class="text-xs text-[#9ca3af] font-medium px-2.5 py-1 rounded-md bg-[#1f2937]/50">
          {{ hintsUsed }}/{{ totalHints }}
        </div>
      </div>
      
      <!-- Hints List - Grouped by Tier -->
      <div class="space-y-4">
        <!-- Debug info -->
        <div *ngIf="totalHints === 0" class="text-center py-8 text-sm text-[#9ca3af]">
          No hints available for this exercise
        </div>
        
        <!-- Try tier-based grouping first -->
        <ng-container *ngIf="totalHints > 0 && hasAnyTierHints()">
          <div *ngFor="let tier of [1, 2, 3]" class="space-y-2">
            <ng-container *ngIf="getHintsByTier(tier).length > 0">
              <!-- Tier Header -->
              <div class="flex items-center gap-2 px-1">
                <span class="inline-flex items-center justify-center w-6 h-6 rounded-md text-xs font-bold"
                      [class]="getTierBadgeClass(tier)">
                  {{ tier }}
                </span>
                <span class="text-xs font-medium"
                      [class]="getTierTextColor(tier)">
                  {{ getTierLabel(tier) }}
                </span>
              </div>
            
            <!-- Hints for this tier -->
            <div class="space-y-2">
              <div 
                *ngFor="let hint of getHintsByTier(tier); trackBy: trackByHintId" 
                class="group relative rounded-lg border transition-all duration-300 overflow-hidden"
                [class]="hint.revealed 
                  ? 'bg-gradient-to-br border-[#BC78F9]/40 shadow-sm shadow-[#BC78F9]/10' + getTierGradient(hint.tier)
                  : 'bg-[#1a1d24] border-[#2a2e38] hover:border-[#3a3e48]'"
              >
                <!-- Hint Content -->
                <div class="px-3 py-3 animate-fadeIn" *ngIf="hint.revealed">
                  <div class="flex items-start justify-between gap-2">
                    <p class="text-sm text-[#e5e7eb] leading-relaxed flex-1">
                      {{ hint.text }}
                    </p>
                    <div *ngIf="hint.viewCount > 0" 
                         class="flex items-center gap-1 text-[10px] text-[#9ca3af] flex-shrink-0">
                      <ng-icon name="lucideEye" class="w-3 h-3"></ng-icon>
                      <span>{{ hint.viewCount }}</span>
                    </div>
                  </div>
                </div>
                
                <!-- Reveal Button -->
                <div class="px-3 py-3" *ngIf="!hint.revealed && canRevealHint(hint.tier)">
                  <button
                    (click)="revealHint(hint.id)"
                    [disabled]="isRevealing"
                    class="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 border"
                    [class]="isRevealing 
                      ? 'bg-[#2a2e38] border-[#3a3e48] text-[#6b7280] cursor-not-allowed'
                      : 'bg-[#1f2937] border-[#3a3e48] text-[#d1d5db] hover:bg-[#2a2e38] hover:border-[#BC78F9]/40 hover:text-[#BC78F9] active:scale-[0.98]'"
                  >
                    <ng-icon name="lucideEye" class="w-4 h-4"></ng-icon>
                    <span>{{ isRevealing ? 'Revealing...' : 'Reveal Hint' }}</span>
                  </button>
                </div>
                
                <!-- Locked State -->
                <div class="px-3 py-3" *ngIf="!hint.revealed && !canRevealHint(hint.tier)">
                  <div class="text-xs text-[#6b7280] text-center py-1">
                    Unlock previous tier first
                  </div>
                </div>
              </div>
            </div>
          </ng-container>
        </div>
        </ng-container>
        
        <!-- Fallback: Show all hints if tier grouping doesn't work -->
        <div *ngIf="totalHints > 0 && !hasAnyTierHints()" class="space-y-2">
          <div 
            *ngFor="let hint of filteredHints; trackBy: trackByHintId" 
            class="group relative rounded-lg border transition-all duration-300 overflow-hidden"
            [class]="hint.revealed 
              ? 'bg-gradient-to-br from-[#BC78F9]/5 to-transparent border-[#BC78F9]/40 shadow-sm shadow-[#BC78F9]/10'
              : 'bg-[#1a1d24] border-[#2a2e38] hover:border-[#3a3e48]'"
          >
            <!-- Hint Content -->
            <div class="px-3 py-3 animate-fadeIn" *ngIf="hint.revealed">
              <div class="flex items-start justify-between gap-2">
                <p class="text-sm text-[#e5e7eb] leading-relaxed flex-1">
                  {{ hint.text }}
                </p>
                <div *ngIf="hint.viewCount > 0" 
                     class="flex items-center gap-1 text-[10px] text-[#9ca3af] flex-shrink-0">
                  <ng-icon name="lucideEye" class="w-3 h-3"></ng-icon>
                  <span>{{ hint.viewCount }}</span>
                </div>
              </div>
            </div>
            
            <!-- Reveal Button -->
            <div class="px-3 py-3" *ngIf="!hint.revealed">
              <button
                (click)="revealHint(hint.id)"
                [disabled]="isRevealing"
                class="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 border"
                [class]="isRevealing 
                  ? 'bg-[#2a2e38] border-[#3a3e48] text-[#6b7280] cursor-not-allowed'
                  : 'bg-[#1f2937] border-[#3a3e48] text-[#d1d5db] hover:bg-[#2a2e38] hover:border-[#BC78F9]/40 hover:text-[#BC78F9] active:scale-[0.98]'"
              >
                <ng-icon name="lucideEye" class="w-4 h-4"></ng-icon>
                <span>{{ isRevealing ? 'Revealing...' : 'Reveal Hint' }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Progress Footer -->
      <div class="pt-2 px-1" *ngIf="showProgress && totalHints > 0">
        <div class="space-y-1.5">
          <div class="h-1.5 bg-[#1f2937] rounded-full overflow-hidden">
            <div 
              class="h-full bg-gradient-to-r from-[#BC78F9] to-[#9d5fd6] transition-all duration-500 ease-out rounded-full"
              [style.width.%]="hintProgress"
            ></div>
          </div>
          <div class="flex justify-between items-center text-[10px] text-[#9ca3af]">
            <span>Progress</span>
            <span class="font-medium">{{ hintProgress }}%</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateY(-8px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .animate-fadeIn {
      animation: fadeIn 0.3s ease-out;
    }
  `]
})
export class HintPanelComponent extends WidgetBaseComponent {
  @Input() hints: Hint[] = [];
  @Input() showProgress: boolean = true;
  @Input() maxHintsPerTier: number = 1;
  @Input() currentStep!: number;

  public isRevealing = false;

  get filteredHints(): Hint[] {
    // Filter hints to show only those for the current step
    // Assuming 3 hints per step (tier 1, 2, 3)
    const hintsPerStep = 3;
    const step = this.currentStep || 1; // Default to step 1 if not set
    const startIndex = (step - 1) * hintsPerStep;
    const endIndex = startIndex + hintsPerStep;
    
    const filtered = this.hints.slice(startIndex, endIndex);
    console.log(`[HintPanel] Filtering hints for step ${step}: showing ${filtered.length} hints (indices ${startIndex}-${endIndex})`);
    return filtered;
  }

  get totalHints(): number {
    return this.filteredHints.length;
  }

  get hintsUsed(): number {
    return this.filteredHints.filter(h => h.revealed).length;
  }

  get hintProgress(): number {
    return this.totalHints > 0 ? Math.round((this.hintsUsed / this.totalHints) * 100) : 0;
  }

  trackByHintId(index: number, hint: Hint): string {
    return hint.id;
  }

  getHintsByTier(tier: number): Hint[] {
    const filtered = this.filteredHints.filter(h => h.tier === tier);
    console.log(`[HintPanel] getHintsByTier(${tier}):`, filtered.length, 'hints');
    return filtered;
  }

  hasAnyTierHints(): boolean {
    // Check if any hints have tier property set to 1, 2, or 3
    return this.filteredHints.some(h => h.tier === 1 || h.tier === 2 || h.tier === 3);
  }

  canRevealHint(tier: number): boolean {
    const tierHintsRevealed = this.filteredHints.filter(h => h.tier === tier && h.revealed).length;
    return tierHintsRevealed < this.maxHintsPerTier;
  }

  getTierLabel(tier: number): string {
    const labels: { [key: number]: string } = {
      1: 'Basic Hint',
      2: 'Intermediate Hint',
      3: 'Advanced Hint'
    };
    return labels[tier] || `Tier ${tier}`;
  }

  getTierBadgeClass(tier: number): string {
    const classes: { [key: number]: string } = {
      1: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
      2: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
      3: 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
    };
    return classes[tier] || 'bg-[#2a2e38] text-[#9ca3af] border border-[#3a3e48]';
  }

  getTierTextColor(tier: number): string {
    const colors: { [key: number]: string } = {
      1: 'text-emerald-400',
      2: 'text-amber-400',
      3: 'text-rose-400'
    };
    return colors[tier] || 'text-[#9ca3af]';
  }

  getTierBorderColor(tier: number): string {
    const colors: { [key: number]: string } = {
      1: 'border-emerald-500/20',
      2: 'border-amber-500/20',
      3: 'border-rose-500/20'
    };
    return colors[tier] || 'border-[#2a2e38]';
  }

  getTierGradient(tier: number): string {
    const gradients: { [key: number]: string } = {
      1: ' from-emerald-500/5 to-transparent',
      2: ' from-amber-500/5 to-transparent',
      3: ' from-rose-500/5 to-transparent'
    };
    return gradients[tier] || '';
  }

  revealHint(hintId: string): void {
    this.isRevealing = true;
    this.incrementAttempts();

    // Toggle hint visibility and track view count
    const hint = this.hints.find(h => h.id === hintId);
    if (hint) {
      if (!hint.revealed) {
        // Revealing hint for the first time
        hint.revealed = true;
        hint.viewCount = (hint.viewCount || 0) + 1;
        this.setDataValue('total_hints_used', this.hintsUsed);
        this.setDataValue('last_hint_revealed', new Date());
        
        // Emit state change for interaction tracking
        this.emitStateChange('hint_revealed', {
          hintId: hint.id,
          hintTier: hint.tier,
          viewCount: hint.viewCount,
          totalHintsUsed: this.hintsUsed,
          totalHints: this.totalHints
        });
      } else {
        // Hiding hint
        hint.revealed = false;
        
        // Emit state change for interaction tracking
        this.emitStateChange('hint_hidden', {
          hintId: hint.id,
          hintTier: hint.tier
        });
      }
      
      this.setDataValue('hints_revealed', this.hints.filter(h => h.revealed).map(h => h.id));
      this.setDataValue('hint_view_counts', this.hints.map(h => ({ id: h.id, viewCount: h.viewCount || 0 })));
      
      // Check if all hints are revealed
      if (this.hintsUsed === this.totalHints) {
        this.completeWidget();
      }
    }
    this.isRevealing = false;
  }

  protected initializeWidgetData(): void {
    // Initialize hints if not provided directly
    if (this.hints.length === 0) {
      this.hints = this.getConfigValue('hints', []);
    }

    console.log('[HintPanel] Initialized with hints:', this.hints);

    // Initialize viewCount for all hints
    this.hints.forEach(hint => {
      if (hint.viewCount === undefined) {
        hint.viewCount = 0;
      }
      if (hint.revealed === undefined) {
        hint.revealed = false;
      }
    });

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
