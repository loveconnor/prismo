import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WidgetBaseComponent } from '../../base/widget-base';
import { ButtonComponent } from '../../../ui/button/button';

export type FeedbackType = 'success' | 'error' | 'warning' | 'info';

@Component({
  selector: 'app-feedback-box',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="w-full border rounded-lg p-4 space-y-4"
         [class]="type === 'success' ? 'border-green-200 bg-green-50' : 
                  type === 'error' ? 'border-red-200 bg-red-50' : 
                  type === 'warning' ? 'border-yellow-200 bg-yellow-50' : 
                  'border-blue-200 bg-blue-50'">
      <div class="flex items-start gap-3">
        <div class="text-2xl flex-shrink-0">
          <span *ngIf="type === 'success'">✅</span>
          <span *ngIf="type === 'error'">❌</span>
          <span *ngIf="type === 'warning'">⚠️</span>
          <span *ngIf="type === 'info'">ℹ️</span>
        </div>
        <h3 class="text-lg font-semibold"
            [class]="type === 'success' ? 'text-green-800' : 
                     type === 'error' ? 'text-red-800' : 
                     type === 'warning' ? 'text-yellow-800' : 
                     'text-blue-800'">{{ title }}</h3>
      </div>
      
      <div class="space-y-4">
        <div class="text-base leading-relaxed"
             [class]="type === 'success' ? 'text-green-700' : 
                      type === 'error' ? 'text-red-700' : 
                      type === 'warning' ? 'text-yellow-700' : 
                      'text-blue-700'" 
             [innerHTML]="formattedMessage"></div>
        
        <div class="bg-white/50 rounded-md p-3" *ngIf="explanation">
          <h4 class="text-sm font-semibold mb-2">Explanation:</h4>
          <div class="text-sm leading-relaxed" [innerHTML]="formattedExplanation"></div>
        </div>
        
        <div class="bg-white/50 rounded-md p-3" *ngIf="nextSteps && nextSteps.length > 0">
          <h4 class="text-sm font-semibold mb-2">Next Steps:</h4>
          <ul class="space-y-1">
            <li *ngFor="let step of nextSteps" class="text-sm leading-relaxed">
              {{ step }}
            </li>
          </ul>
        </div>
      </div>
      
      <div class="border-t pt-3" *ngIf="showActions">
        <div class="flex gap-2 mb-3">
          <button 
            *ngIf="showRetryButton"
            class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            (click)="onRetry()"
          >
            Try Again
          </button>
          
          <button 
            *ngIf="showContinueButton"
            class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            (click)="onContinue()"
          >
            Continue
          </button>
          
          <button 
            *ngIf="showAcknowledgeButton"
            class="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
            (click)="onAcknowledge()"
          >
            Got it
          </button>
        </div>
        
        <div class="flex items-center justify-between text-xs text-gray-500" *ngIf="showMeta">
          <span class="font-mono">
            {{ timestamp | date:'short' }}
          </span>
          <span class="font-medium" *ngIf="attemptNumber > 0">
            Attempt {{ attemptNumber }}
          </span>
        </div>
      </div>
    </div>
  `
})
export class FeedbackBoxComponent extends WidgetBaseComponent {
  @Input() type: FeedbackType = 'info';
  @Input() title!: string;
  @Input() message!: string;
  @Input() explanation?: string;
  @Input() nextSteps?: string[];
  @Input() showActions: boolean = true;
  @Input() showRetryButton: boolean = false;
  @Input() showContinueButton: boolean = true;
  @Input() showAcknowledgeButton: boolean = false;
  @Input() showMeta: boolean = true;
  @Input() autoComplete: boolean = false;

  public timestamp = new Date();
  public attemptNumber = 0;
  public acknowledged = false;

  get formattedMessage(): string {
    return this.message?.replace(/\n/g, '<br>') || '';
  }

  get formattedExplanation(): string {
    return this.explanation?.replace(/\n/g, '<br>') || '';
  }

  onRetry(): void {
    this.setDataValue('retry_clicked', true);
    this.setDataValue('retry_time', new Date());
    this.emitStateChange('retry', { timestamp: new Date() });
  }

  onContinue(): void {
    this.setDataValue('continue_clicked', true);
    this.setDataValue('continue_time', new Date());
    this.acknowledgeAndComplete();
  }

  onAcknowledge(): void {
    this.acknowledgeAndComplete();
  }

  private acknowledgeAndComplete(): void {
    this.acknowledged = true;
    this.setDataValue('acknowledged', true);
    this.setDataValue('acknowledged_at', new Date());
    
    if (this.autoComplete) {
      this.completeWidget();
    }
  }

  protected initializeWidgetData(): void {
    this.attemptNumber = this.getDataValue('attempt_number') || 0;
    this.attemptNumber++;
    this.setDataValue('attempt_number', this.attemptNumber);
    
    // Auto-complete for success feedback
    if (this.type === 'success' && this.autoComplete) {
      setTimeout(() => {
        this.completeWidget();
      }, 2000);
    }
  }

  protected validateInput(): boolean {
    return !!(this.title && this.message);
  }

  protected processCompletion(): void {
    this.setDataValue('completion_time', new Date());
    this.setDataValue('feedback_type', this.type);
    this.setDataValue('was_acknowledged', this.acknowledged);
  }
}
