import { Component, Input, Output, EventEmitter, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WidgetBaseComponent } from '../../base/widget-base';
import { CardComponent } from '../../../ui/card/card';
import { CardContentComponent } from '../../../ui/card/card-content';
import { CardFooterComponent } from '../../../ui/card/card-footer';
import { ButtonComponent } from '../../../ui/button/button';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucideFrown, lucideMeh, lucideSmile, lucideClock, lucideRotateCcw } from '@ng-icons/lucide';
import { gsap } from 'gsap';

@Component({
  selector: 'app-confidence-meter',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule,
    CardComponent,
    CardContentComponent,
    CardFooterComponent,
    ButtonComponent,
    NgIconComponent
  ],
  providers: [
    provideIcons({
      lucideFrown,
      lucideMeh,
      lucideSmile,
      lucideClock,
      lucideRotateCcw
    })
  ],
  template: `
    <app-card>
      <app-card-content #cardContent>
        <div class="text-center space-y-2">
          <h3 class="text-lg font-semibold text-foreground">{{ title }}</h3>
          <p class="text-sm text-muted-foreground" *ngIf="description">{{ description }}</p>
        </div>
        
        <div class="space-y-6">
          <div class="space-y-4">
            <div class="flex justify-between text-xs text-muted-foreground">
              <span class="text-center flex-1" *ngFor="let label of scaleLabels; let i = index">
                {{ label }}
              </span>
            </div>
            
            <div class="relative">
              <input
                type="range"
                class="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer slider"
                [min]="minValue"
                [max]="maxValue"
                [step]="step"
                [(ngModel)]="confidenceLevel"
                [ngModelOptions]="{standalone: true}"
                (input)="onConfidenceChange()"
                [disabled]="isCompleted"
              />
              
              <div class="absolute top-1/2 left-0 right-0 h-2 bg-muted rounded-lg pointer-events-none" style="transform: translateY(-50%);">
                <div 
                  class="h-full bg-primary rounded-lg transition-all duration-200" 
                  [style.width.%]="sliderFillPercentage"
                ></div>
              </div>
            </div>
            
            <div class="flex items-center justify-center gap-2 text-center">
              <ng-icon [name]="getConfidenceIcon()" class="w-6 h-6 text-primary"></ng-icon>
              <span class="text-2xl font-bold text-primary">{{ confidenceLevel }}</span>
              <span class="text-sm text-muted-foreground">{{ getConfidenceLabel(confidenceLevel) }}</span>
            </div>
          </div>
          
          <div class="flex gap-3 justify-center" *ngIf="showActions">
            <app-button 
              variant="default"
              size="sm"
              (click)="submitConfidence()"
              [disabled]="!isValidConfidence || isCompleted"
            >
              {{ isCompleted ? 'Submitted' : 'Submit' }}
            </app-button>
            
            <app-button 
              variant="outline"
              size="sm"
              (click)="resetConfidence()"
              [disabled]="isCompleted"
              *ngIf="allowReset"
            >
              <ng-icon name="lucideRotateCcw" class="w-4 h-4 mr-2"></ng-icon>
              Reset
            </app-button>
          </div>
        </div>
      </app-card-content>
      
      <app-card-footer *ngIf="showFooter" #cardFooter>
        <div class="flex items-center justify-between text-xs text-muted-foreground">
          <span class="font-mono flex items-center gap-1" *ngIf="submittedAt">
            <ng-icon name="lucideClock" class="w-3 h-3"></ng-icon>
            Submitted: {{ submittedAt | date:'short' }}
          </span>
          <span class="font-medium" *ngIf="attempts > 0">
            Attempts: {{ attempts }}
          </span>
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
  @Input() allowReset: boolean = true;

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

  resetConfidence(): void {
    this.confidenceLevel = this.minValue + Math.floor((this.maxValue - this.minValue) / 2);
    this.submittedAt = undefined;
    this.attempts = 0;
    
    this.setDataValue('submitted', false);
    this.setDataValue('confidence_level', this.confidenceLevel);
    this.setDataValue('final_confidence_level', null);
    this.setDataValue('submitted_at', null);
    this.setDataValue('attempts', 0);

    this.emitStateChange('confidence_reset', { level: this.confidenceLevel });
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

  override ngAfterViewInit(): void {
    if (this.cardContent) {
      // Animate content reveal
      gsap.from(this.cardContent.nativeElement, {
        opacity: 0,
        y: 10,
        duration: 0.3,
        delay: 0.1,
        ease: "power2.out"
      });
    }
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
