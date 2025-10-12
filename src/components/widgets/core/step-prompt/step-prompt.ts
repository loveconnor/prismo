import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WidgetBaseComponent } from '../../base/widget-base';
import { WidgetMetadata } from '../../../../types/widget.types';

@Component({
  selector: 'app-step-prompt',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="w-full space-y-4">
      <div class="border-b border-gray-200 pb-2" *ngIf="title">
        <h3 class="text-lg font-semibold text-gray-900">{{ title }}</h3>
      </div>
      
      <div class="space-y-4">
        <div class="text-base text-gray-900 leading-relaxed" [innerHTML]="formattedPrompt"></div>
        
        <div class="flex justify-center" *ngIf="mediaUrl">
          <img 
            *ngIf="mediaType === 'image'" 
            [src]="mediaUrl" 
            [alt]="mediaAlt || 'Prompt image'"
            class="max-w-full h-auto rounded-lg border border-gray-200"
          />
          <video 
            *ngIf="mediaType === 'video'" 
            [src]="mediaUrl" 
            controls
            class="max-w-full h-auto rounded-lg border border-gray-200"
          ></video>
        </div>
      </div>
      
      <div class="border-t border-gray-200 pt-3" *ngIf="showFooter">
        <div class="flex items-center justify-between text-sm text-gray-500">
          <span class="flex items-center gap-1" *ngIf="estimatedTime">
            <span class="text-xs">⏱️</span>
            {{ estimatedTime }}s
          </span>
          <span class="px-2 py-1 rounded-full text-xs font-medium" 
                [class]="difficulty === 1 ? 'bg-green-100 text-green-800' : 
                         difficulty === 2 ? 'bg-blue-100 text-blue-800' : 
                         difficulty === 3 ? 'bg-yellow-100 text-yellow-800' : 
                         difficulty === 4 ? 'bg-orange-100 text-orange-800' : 
                         'bg-red-100 text-red-800'">
            {{ difficultyLabel }}
          </span>
        </div>
      </div>
    </div>
  `
})
export class StepPromptComponent extends WidgetBaseComponent {
  @Input() title?: string;
  @Input() prompt!: string;
  @Input() mediaUrl?: string;
  @Input() mediaType?: 'image' | 'video';
  @Input() mediaAlt?: string;
  @Input() estimatedTime?: number;
  @Input() showFooter: boolean = true;

  get formattedPrompt(): string {
    return this.prompt?.replace(/\n/g, '<br>') || '';
  }

  get difficulty(): number {
    return this.metadata?.difficulty || 2;
  }

  get difficultyLabel(): string {
    const labels = ['', 'Very Easy', 'Easy', 'Medium', 'Hard', 'Very Hard'];
    return labels[this.difficulty] || 'Unknown';
  }

  protected initializeWidgetData(): void {
    // Mark as viewed when initialized
    this.setDataValue('viewed', true);
    this.setDataValue('viewed_at', new Date());
    
    // Complete the widget since it's just a display
    setTimeout(() => {
      this.completeWidget();
    }, 100);
  }

  protected validateInput(): boolean {
    return !!(this.prompt && this.prompt.trim().length > 0);
  }

  protected processCompletion(): void {
    this.setDataValue('completed_at', new Date());
    this.setDataValue('time_to_view', this.timeSpent);
  }
}
