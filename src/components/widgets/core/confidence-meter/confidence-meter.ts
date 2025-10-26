import { Component, Input, Output, EventEmitter, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WidgetBaseComponent } from '../../base/widget-base';
import { CardComponent } from '../../../ui/card/card';
import { CardHeaderComponent } from '../../../ui/card/card-header';
import { CardContentComponent } from '../../../ui/card/card-content';
import { CardFooterComponent } from '../../../ui/card/card-footer';
import { ButtonComponent } from '../../../ui/button/button';
import { AlertComponent } from '../../../ui/alert/alert';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { 
  lucideFrown, 
  lucideMeh, 
  lucideSmile, 
  lucideClock, 
  lucideHeart,
  lucideZap,
  lucideStar,
  lucideCheck,
  lucideTrendingUp,
  lucideTarget
} from '@ng-icons/lucide';
import { gsap } from 'gsap';

@Component({
  selector: 'app-confidence-meter',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule,
    CardComponent,
    CardHeaderComponent,
    CardContentComponent,
    CardFooterComponent,
    ButtonComponent,
    AlertComponent,
    NgIconComponent
  ],
  providers: [
    provideIcons({
      lucideFrown,
      lucideMeh,
      lucideSmile,
      lucideClock,
      lucideHeart,
      lucideZap,
      lucideStar,
      lucideCheck,
      lucideTrendingUp,
      lucideTarget
    })
  ],
  template: `
    <div class="w-full bg-[#0e1318] border border-[#1f2937] rounded-xl overflow-hidden" #cardContent>
      <!-- Header -->
      <div class="flex items-start gap-3 p-6 border-b border-[#1f2937]">
        <div class="flex-shrink-0 w-10 h-10 rounded-lg bg-[#151a20] border border-[#1f2937] flex items-center justify-center mt-0.5">
          <ng-icon name="lucideTarget" class="w-5 h-5 text-blue-400"></ng-icon>
        </div>
        <div class="flex-1">
          <h3 class="text-xl font-semibold text-[#e5e7eb]">{{ title }}</h3>
          <p class="text-sm text-[#a9b1bb] mt-1" *ngIf="description">{{ description }}</p>
        </div>
      </div>
      
      <!-- Content -->
      <div class="p-6">
        <div class="space-y-6">
          <!-- Interactive confidence selection -->
          <div class="space-y-4" *ngIf="!isCompleted">
            <!-- Scale labels -->
            <div class="flex justify-between text-xs font-medium text-[#6b7280]">
              <span class="text-center flex-1" *ngFor="let label of scaleLabels; let i = index">
                {{ label }}
              </span>
            </div>
            
            <!-- Combined slider and confidence display -->
            <div class="space-y-4">
              <input
                type="range"
                class="w-full h-2 bg-[#151a20] rounded-lg appearance-none cursor-pointer slider-thumb"
                [min]="minValue"
                [max]="maxValue"
                [step]="step"
                [(ngModel)]="confidenceLevel"
                [ngModelOptions]="{standalone: true}"
                (input)="onConfidenceChange()"
                [disabled]="isCompleted"
              />
              
              <!-- Current confidence display -->
              <div class="flex items-center justify-center gap-2 bg-[#151a20] border border-[#1f2937] rounded-lg p-4">
                <ng-icon [name]="getConfidenceIcon()" class="w-5 h-5" [class]="getConfidenceIconColor()"></ng-icon>
                <span class="text-2xl font-bold" [class]="getConfidenceTextColor()">{{ confidenceLevel }}</span>
                <span class="text-sm font-medium text-[#a9b1bb]">{{ getConfidenceLabel(confidenceLevel) }}</span>
              </div>
            </div>
          </div>
          
          <!-- Completed state display -->
          <div class="bg-[#151a20] border border-[#1f2937] rounded-lg p-6 text-center" *ngIf="isCompleted">
            <div class="flex items-center justify-center gap-2 mb-3">
              <ng-icon name="lucideCheck" class="w-6 h-6 text-green-500"></ng-icon>
              <h4 class="text-lg font-semibold text-[#e5e7eb]">Confidence Submitted!</h4>
            </div>
            <p class="text-sm text-[#a9b1bb] mb-4">Your response has been recorded</p>
            
            <div class="flex items-center justify-center gap-4 text-sm text-[#a9b1bb]">
              <div class="flex items-center gap-1">
                <ng-icon [name]="getConfidenceIcon()" class="w-4 h-4"></ng-icon>
                <span class="font-semibold">{{ confidenceLevel }} - {{ getConfidenceLabel(confidenceLevel) }}</span>
              </div>
              <div class="w-px h-4 bg-[#1f2937]"></div>
              <div class="flex items-center gap-1">
                <ng-icon name="lucideClock" class="w-4 h-4"></ng-icon>
                <span>{{ submittedAt | date:'short' }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Footer -->
      <div class="flex items-center justify-between p-6 border-t border-[#1f2937] bg-[#0b0f14]" *ngIf="showFooter || showActions">
        <div class="text-xs text-[#6b7280]" *ngIf="showFooter && !isCompleted">
          Rate your confidence level
        </div>
        
        <div class="flex gap-3" [class.ml-auto]="!showFooter || isCompleted" *ngIf="showActions">
          <app-button 
            (click)="submitConfidence()"
            [disabled]="!isValidConfidence || isCompleted"
          >
            <ng-icon name="lucideCheck" class="w-4 h-4 mr-2"></ng-icon>
            {{ isCompleted ? 'Submitted' : 'Submit Confidence' }}
          </app-button>
        </div>
      </div>
    </div>
  `
})
export class ConfidenceMeterComponent extends WidgetBaseComponent implements AfterViewInit {
  @Input() title: string = 'Rate your confidence';
  @Input() description?: string;
  @Input() minValue: number = 1;
  @ViewChild('cardContent') cardContent?: ElementRef;
  @ViewChild('cardFooter') cardFooter?: ElementRef;
  @Input() maxValue: number = 5;
  @Input() step: number = 1;
  @Input() scaleLabels: string[] = ['Not at all', 'Slightly', 'Moderately', 'Very', 'Extremely'];
  @Input() showActions: boolean = true;
  @Input() showFooter: boolean = true;
  @Output() submit = new EventEmitter<number>();

  // Internal state
  confidenceLevel: number = 3;
  submittedAt?: Date;
  attempts: number = 0;

  get isValidConfidence(): boolean {
    return this.confidenceLevel >= this.minValue && this.confidenceLevel <= this.maxValue;
  }

  get sliderFillPercentage(): number {
    return ((this.confidenceLevel - this.minValue) / (this.maxValue - this.minValue)) * 100;
  }

  override get isCompleted(): boolean {
    return this.getDataValue('submitted') === true;
  }

  onConfidenceChange(): void {
    this.setDataValue('confidence_level', this.confidenceLevel);
    this.emitStateChange('confidence_changed', { 
      level: this.confidenceLevel,
      label: this.getConfidenceLabel(this.confidenceLevel)
    });
  }

  submitConfidence(): void {
    if (!this.isValidConfidence) return;

    this.submittedAt = new Date();
    this.attempts++;
    
    this.setDataValue('submitted', true);
    this.setDataValue('final_confidence_level', this.confidenceLevel);
    this.setDataValue('confidence_label', this.getConfidenceLabel(this.confidenceLevel));
    this.setDataValue('submitted_at', this.submittedAt);
    this.setDataValue('attempts', this.attempts);

    this.submit.emit(this.confidenceLevel);
    this.emitStateChange('confidence_submitted', {
      level: this.confidenceLevel,
      label: this.getConfidenceLabel(this.confidenceLevel),
      attempts: this.attempts
    });

    this.completeWidget();
  }


  getConfidenceLabel(level: number): string {
    const index = Math.floor((level - this.minValue) / this.step);
    return this.scaleLabels[index] || 'Unknown';
  }

  getConfidenceIcon(): string {
    if (this.confidenceLevel <= 2) return 'lucideFrown';
    if (this.confidenceLevel <= 3) return 'lucideMeh';
    return 'lucideSmile';
  }

  getConfidenceIconColor(): string {
    if (this.confidenceLevel <= 2) return 'text-red-500';
    if (this.confidenceLevel <= 3) return 'text-yellow-500';
    return 'text-green-500';
  }

  getConfidenceTextColor(): string {
    if (this.confidenceLevel <= 2) return 'text-red-600 dark:text-red-400';
    if (this.confidenceLevel <= 3) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-green-600 dark:text-green-400';
  }

  override ngAfterViewInit(): void {
    // Guard for SSR and ensure element exists
    if (typeof window === 'undefined') return;
    if (!this.cardContent) return;

    gsap.from(this.cardContent.nativeElement, {
      opacity: 0,
      y: 20,
      duration: 0.6,
      delay: 0.2,
      ease: "power3.out"
    });
  }

  protected initializeWidgetData(): void {
    // Initialize with middle value
    this.confidenceLevel = this.minValue + Math.floor((this.maxValue - this.minValue) / 2);
    this.setDataValue('confidence_level', this.confidenceLevel);
    this.setDataValue('submitted_at', null);
    this.setDataValue('attempts', 0);
  }

  protected validateInput(): boolean {
    return this.isValidConfidence;
  }

  protected processCompletion(): void {
    // Confidence meter completion processing
    this.setDataValue('completion_processed', true);
    this.setDataValue('completion_timestamp', new Date());
  }

  protected override completeWidget(): void {
    this.setDataValue('final_confidence_level', this.confidenceLevel);
    this.setDataValue('confidence_label', this.getConfidenceLabel(this.confidenceLevel));
    this.setDataValue('submitted_at', this.submittedAt);
    this.setDataValue('attempts', this.attempts);
    
    super.completeWidget();
  }
}
