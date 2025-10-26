import { Component, Input, Output, EventEmitter, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WidgetBaseComponent } from '../../base/widget-base';
import { AlertComponent } from '../../../ui/alert/alert';
import { ButtonComponent } from '../../../ui/button/button';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucideCheck, lucideX, lucideTriangle, lucideInfo } from '@ng-icons/lucide';
import { gsap } from 'gsap';

export type FeedbackType = 'success' | 'error' | 'warning' | 'info';

@Component({
  selector: 'app-feedback-box',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule,
    AlertComponent,
    ButtonComponent,
    NgIconComponent
  ],
  providers: [
    provideIcons({
      lucideCheck,
      lucideX,
      lucideTriangle,
      lucideInfo
    })
  ],
  template: `
    <div class="w-full bg-[#0e1318] border border-[#1f2937] rounded-xl overflow-hidden" #feedbackAlert>
      <!-- Header -->
      <div class="flex items-start gap-3 p-6 border-b border-[#1f2937]">
        <div class="flex-shrink-0 mt-0.5" [ngClass]="{
          'text-green-500': type === 'success',
          'text-red-500': type === 'error',
          'text-yellow-500': type === 'warning',
          'text-blue-500': type === 'info'
        }">
          <ng-icon [name]="getFeedbackIcon()" class="w-6 h-6"></ng-icon>
        </div>
        <div class="flex-1">
          <h3 class="text-xl font-semibold text-[#e5e7eb]">{{ title }}</h3>
          <p class="text-[#a9b1bb] mt-1.5 leading-relaxed" [innerHTML]="formattedMessage"></p>
        </div>
      </div>
      
      <!-- Content -->
      <div class="p-6 space-y-4">
        <div *ngIf="explanation" class="bg-[#151a20] border border-[#1f2937] rounded-lg p-4">
          <h4 class="text-sm font-semibold text-[#e5e7eb] mb-2">Explanation:</h4>
          <div class="text-sm text-[#a9b1bb] leading-relaxed" [innerHTML]="formattedExplanation"></div>
        </div>
        
        <div *ngIf="nextSteps && nextSteps.length > 0" class="bg-[#151a20] border border-[#1f2937] rounded-lg p-4">
          <h4 class="text-sm font-semibold text-[#e5e7eb] mb-3">Next Steps:</h4>
          <ul class="space-y-2">
            <li *ngFor="let step of nextSteps" class="flex items-start gap-2 text-sm text-[#a9b1bb]">
              <span class="text-blue-400 mt-0.5">→</span>
              <span class="flex-1">{{ step }}</span>
            </li>
          </ul>
        </div>
      </div>
      
      <!-- Footer -->
      <div class="flex items-center justify-between p-6 border-t border-[#1f2937] bg-[#0b0f14]">
        <div class="text-xs text-[#6b7280]" *ngIf="showMeta">
          {{ timestamp | date:'short' }}
        </div>
        
        <div class="flex gap-2" *ngIf="showActions">
          <app-button 
            *ngIf="showRetryButton"
            variant="destructive"
            (click)="onRetry()"
          >
            Try Again
          </app-button>
          
          <app-button 
            *ngIf="showContinueButton"
            (click)="onContinue()"
          >
            Continue
          </app-button>
          
          <app-button 
            *ngIf="showAcknowledgeButton"
            variant="outline"
            (click)="onAcknowledge()"
          >
            Got it
          </app-button>
        </div>
      </div>
    </div>
  `
})
export class FeedbackBoxComponent extends WidgetBaseComponent implements AfterViewInit {
  @Input() type: FeedbackType = 'info';
  @Input() title!: string;
  @Input() message!: string;
  @ViewChild('feedbackAlert') feedbackAlert?: ElementRef;
  @Input() explanation?: string;
  @Input() nextSteps?: string[];
  @Input() showActions: boolean = true;
  @Input() showRetryButton: boolean = false;
  @Input() showContinueButton: boolean = true;
  @Input() showAcknowledgeButton: boolean = false;
  @Input() showMeta: boolean = true;
  @Input() autoComplete: boolean = false;
  @Output() continueClicked = new EventEmitter<void>();
  @Output() acknowledgeClicked = new EventEmitter<void>();
  @Output() retryClicked = new EventEmitter<void>();

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
    this.retryClicked.emit();
  }

  onContinue(): void {
    this.setDataValue('continue_clicked', true);
    this.setDataValue('continue_time', new Date());
    this.acknowledgeAndComplete();
    this.continueClicked.emit();
  }

  onAcknowledge(): void {
    this.acknowledgeAndComplete();
    this.acknowledgeClicked.emit();
  }

  getAlertVariant(): 'default' | 'destructive' | 'warning' | 'success' {
    const variants = {
      'success': 'success' as const,
      'error': 'destructive' as const,
      'warning': 'warning' as const,
      'info': 'default' as const
    };
    return variants[this.type];
  }

  getFeedbackIcon(): string {
    const icons = {
      'success': 'lucideCheck',
      'error': 'lucideX',
      'warning': 'lucideTriangle',
      'info': 'lucideInfo'
    };
    return icons[this.type];
  }

  override ngAfterViewInit(): void {
    if (this.feedbackAlert) {
      // Bounce animation on show
      gsap.from(this.feedbackAlert.nativeElement, {
        scale: 0.95,
        opacity: 0,
        duration: 0.3,
        ease: "back.out(1.7)"
      });
    }
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
      this.completeWidget();
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
