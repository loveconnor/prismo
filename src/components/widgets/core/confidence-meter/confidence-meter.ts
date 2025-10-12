import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WidgetBaseComponent } from '../../base/widget-base';

@Component({
  selector: 'app-confidence-meter',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="w-full space-y-4">
      <div class="text-center space-y-2">
        <h3 class="text-lg font-semibold text-gray-900">{{ title }}</h3>
        <p class="text-sm text-gray-500" *ngIf="description">{{ description }}</p>
      </div>
      
      <div class="space-y-6">
        <div class="space-y-4">
          <div class="flex justify-between text-xs text-gray-500">
            <span class="text-center flex-1" *ngFor="let label of scaleLabels; let i = index">
              {{ label }}
            </span>
          </div>
          
          <div class="relative">
            <input
              type="range"
              class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              [min]="minValue"
              [max]="maxValue"
              [step]="step"
              [(ngModel)]="confidenceLevel"
              [ngModelOptions]="{standalone: true}"
              (input)="onConfidenceChange()"
              [disabled]="isCompleted"
            />
            
            <div class="absolute top-1/2 left-0 right-0 h-2 bg-gray-200 rounded-lg pointer-events-none" style="transform: translateY(-50%);">
              <div 
                class="h-full bg-blue-600 rounded-lg transition-all duration-200" 
                [style.width.%]="sliderFillPercentage"
              ></div>
            </div>
          </div>
          
          <div class="flex items-center justify-center gap-2 text-center">
            <span class="text-2xl font-bold text-blue-600">{{ confidenceLevel }}</span>
            <span class="text-sm text-gray-500">{{ getConfidenceLabel(confidenceLevel) }}</span>
          </div>
        </div>
        
        <div class="flex gap-3 justify-center" *ngIf="showActions">
          <button 
            class="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            (click)="submitConfidence()"
            [disabled]="!isValidConfidence || isCompleted"
          >
            {{ isCompleted ? 'Submitted' : 'Submit' }}
          </button>
          
          <button 
            class="px-6 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            (click)="resetConfidence()"
            [disabled]="isCompleted"
            *ngIf="allowReset"
          >
            Reset
          </button>
        </div>
      </div>
      
      <div class="border-t border-gray-200 pt-3" *ngIf="showFooter">
        <div class="flex items-center justify-between text-xs text-gray-500">
          <span class="font-mono" *ngIf="submittedAt">
            Submitted: {{ submittedAt | date:'short' }}
          </span>
          <span class="font-medium" *ngIf="attempts > 0">
            Attempts: {{ attempts }}
          </span>
        </div>
      </div>
    </div>
  `
})
export class ConfidenceMeterComponent extends WidgetBaseComponent {
  @Input() title: string = 'Rate your confidence';
  @Input() description?: string;
  @Input() minValue: number = 1;
  @Input() maxValue: number = 5;
  @Input() step: number = 1;
  @Input() scaleLabels: string[] = ['Not at all', 'Slightly', 'Moderately', 'Very', 'Extremely'];
  @Input() showActions: boolean = true;
  @Input() showFooter: boolean = true;
  @Input() allowReset: boolean = true;
  @Input() autoSubmit: boolean = false;

  @Output() confidenceSubmitted = new EventEmitter<number>();

  public confidenceLevel: number = 3;
  public submittedAt?: Date;
  public attempts = 0;

  get isValidConfidence(): boolean {
    return this.confidenceLevel >= this.minValue && this.confidenceLevel <= this.maxValue;
  }

  get sliderFillPercentage(): number {
    const range = this.maxValue - this.minValue;
    const position = this.confidenceLevel - this.minValue;
    return (position / range) * 100;
  }

  override get isCompleted(): boolean {
    return this.getDataValue('submitted') === true;
  }

  onConfidenceChange(): void {
    this.setDataValue('confidence_level', this.confidenceLevel);
    this.setDataValue('confidence_changed_at', new Date());
    
    if (this.autoSubmit) {
      this.submitConfidence();
    }
  }

  submitConfidence(): void {
    if (!this.isValidConfidence || this.isCompleted) return;

    this.attempts++;
    this.submittedAt = new Date();
    
    this.setDataValue('submitted', true);
    this.setDataValue('final_confidence', this.confidenceLevel);
    this.setDataValue('submitted_at', this.submittedAt);
    this.setDataValue('attempts', this.attempts);
    
    this.confidenceSubmitted.emit(this.confidenceLevel);
    this.completeWidget();
  }

  resetConfidence(): void {
    this.confidenceLevel = this.minValue + Math.floor((this.maxValue - this.minValue) / 2);
    this.submittedAt = undefined;
    this.attempts = 0;
    
    this.setDataValue('submitted', false);
    this.setDataValue('confidence_level', this.confidenceLevel);
    this.setDataValue('submitted_at', null);
    this.setDataValue('attempts', 0);
  }

  getConfidenceLabel(level: number): string {
    const index = Math.floor((level - this.minValue) / this.step);
    return this.scaleLabels[index] || 'Unknown';
  }

  protected initializeWidgetData(): void {
    // Initialize with middle value
    this.confidenceLevel = this.minValue + Math.floor((this.maxValue - this.minValue) / 2);
    this.setDataValue('confidence_level', this.confidenceLevel);
    this.setDataValue('min_value', this.minValue);
    this.setDataValue('max_value', this.maxValue);
    this.setDataValue('scale_labels', this.scaleLabels);
  }

  protected validateInput(): boolean {
    return this.scaleLabels.length >= (this.maxValue - this.minValue + 1);
  }

  protected processCompletion(): void {
    this.setDataValue('completion_time', new Date());
    this.setDataValue('final_confidence_level', this.confidenceLevel);
    this.setDataValue('confidence_label', this.getConfidenceLabel(this.confidenceLevel));
  }
}
