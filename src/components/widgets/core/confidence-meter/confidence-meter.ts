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
    <app-card>
      <app-card-header>
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
              <ng-icon name="lucideTarget" class="w-5 h-5 text-muted-foreground"></ng-icon>
            </div>
            <div>
              <h3 class="text-lg font-semibold text-foreground">{{ title }}</h3>
              <p class="text-sm text-muted-foreground" *ngIf="description">{{ description }}</p>
            </div>
          </div>
          
        </div>
      </app-card-header>
      
      <app-card-content #cardContent>
        <div class="space-y-6">
          <!-- Interactive confidence selection -->
          <div class="space-y-4" *ngIf="!isCompleted">
            <!-- Scale labels -->
            <div class="flex justify-between text-xs font-medium text-muted-foreground">
              <span class="text-center flex-1" *ngFor="let label of scaleLabels; let i = index">
                {{ label }}
              </span>
            </div>
            
            <!-- Combined slider and confidence display -->
            <div class="space-y-3">
              <input
                type="range"
                class="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer"
                [min]="minValue"
                [max]="maxValue"
                [step]="step"
                [(ngModel)]="confidenceLevel"
                [ngModelOptions]="{standalone: true}"
                (input)="onConfidenceChange()"
                [disabled]="isCompleted"
              />
              
              <!-- Current confidence display -->
              <div class="flex items-center justify-center gap-2">
                <ng-icon [name]="getConfidenceIcon()" class="w-5 h-5" [class]="getConfidenceIconColor()"></ng-icon>
                <span class="text-lg font-bold" [class]="getConfidenceTextColor()">{{ confidenceLevel }}</span>
                <span class="text-sm font-medium text-muted-foreground">{{ getConfidenceLabel(confidenceLevel) }}</span>
              </div>
            </div>
          </div>
          
          <!-- Completed state display -->
          <div class="space-y-4" *ngIf="isCompleted">
            <app-alert variant="success" class="text-center">
              <div class="flex items-center justify-center gap-2 mb-2">
                <ng-icon name="lucideCircle" class="w-6 h-6"></ng-icon>
                <h4 class="text-lg font-semibold">Confidence Submitted!</h4>
              </div>
              <p class="text-sm mb-3">Your response has been recorded</p>
              
              <div class="flex items-center justify-center gap-4 text-sm">
                <div class="flex items-center gap-1">
                  <ng-icon [name]="getConfidenceIcon()" class="w-4 h-4"></ng-icon>
                  <span class="font-semibold">{{ confidenceLevel }} - {{ getConfidenceLabel(confidenceLevel) }}</span>
                </div>
                <div class="w-px h-4 bg-current opacity-30"></div>
                <div class="flex items-center gap-1">
                  <ng-icon name="lucideClock" class="w-4 h-4"></ng-icon>
                  <span>{{ submittedAt | date:'short' }}</span>
                </div>
              </div>
            </app-alert>
          </div>
          
          <!-- Action buttons -->
          <div class="flex gap-3 justify-center" *ngIf="showActions">
            <app-button 
              variant="default"
              size="lg"
              (click)="submitConfidence()"
              [disabled]="!isValidConfidence || isCompleted"
            >
              <ng-icon name="lucideCheck" class="w-4 h-4 mr-2"></ng-icon>
              {{ isCompleted ? 'Submitted' : 'Submit Confidence' }}
            </app-button>
            
          </div>
        </div>
      </app-card-content>
      
      <app-card-footer *ngIf="showFooter" #cardFooter>
        <div class="flex items-center justify-between text-xs text-muted-foreground">
          <div class="flex items-center gap-4">
            <span class="font-mono flex items-center gap-1" *ngIf="submittedAt">
              <ng-icon name="lucideClock" class="w-3 h-3"></ng-icon>
              Submitted: {{ submittedAt | date:'short' }}
            </span>
            <span class="font-medium flex items-center gap-1" *ngIf="attempts > 0">
              <ng-icon name="lucideTrendingUp" class="w-3 h-3"></ng-icon>
              Attempts: {{ attempts }}
            </span>
          </div>
          <div class="flex items-center gap-1" *ngIf="isCompleted">
            <ng-icon name="lucideStar" class="w-3 h-3 text-yellow-500"></ng-icon>
            <span class="font-semibold text-yellow-600 dark:text-yellow-400">Completed</span>
          </div>
        </div>
      </app-card-footer>
    </app-card>
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
