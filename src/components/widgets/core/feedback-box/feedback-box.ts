import { Component, Input, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
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
    <app-alert 
      [variant]="getAlertVariant()" 
      [className]="'w-full'"
      #feedbackAlert
    >
      <ng-icon [name]="getFeedbackIcon()" class="w-5 h-5"></ng-icon>
      <div class="space-y-3">
        <h3 class="text-lg font-semibold">{{ title }}</h3>
        
        <div class="text-base leading-relaxed" [innerHTML]="formattedMessage"></div>
        
        <div *ngIf="explanation" class="bg-background/50 rounded-lg p-3">
          <h4 class="text-sm font-semibold mb-2">Explanation:</h4>
          <div class="text-sm leading-relaxed" [innerHTML]="formattedExplanation"></div>
        </div>
        
        <div *ngIf="nextSteps && nextSteps.length > 0" class="bg-background/50 rounded-lg p-3">
          <h4 class="text-sm font-semibold mb-2">Next Steps:</h4>
          <ul class="space-y-1">
            <li *ngFor="let step of nextSteps" class="text-sm leading-relaxed">
              {{ step }}
            </li>
          </ul>
        </div>
        
        <div class="flex gap-2 pt-2" *ngIf="showActions">
          <app-button 
            *ngIf="showRetryButton"
            variant="destructive"
            size="sm"
            (click)="onRetry()"
          >
            Try Again
          </app-button>
          
          <app-button 
            *ngIf="showContinueButton"
            variant="default"
            size="sm"
            (click)="onContinue()"
          >
            Continue
          </app-button>
          
          <app-button 
            *ngIf="showAcknowledgeButton"
            variant="outline"
            size="sm"
            (click)="onAcknowledge()"
          >
            Got it
          </app-button>
        </div>
        
        <div class="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t" *ngIf="showMeta">
          <span class="font-mono">
            {{ timestamp | date:'short' }}
          </span>
          <span class="font-medium" *ngIf="attemptNumber > 0">
            Attempt {{ attemptNumber }}
          </span>
        </div>
      </div>
    </app-alert>
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
