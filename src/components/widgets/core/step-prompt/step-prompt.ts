import { Component, Input, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WidgetBaseComponent } from '../../base/widget-base';
import { CardComponent } from '../../../ui/card/card';
import { CardHeaderComponent } from '../../../ui/card/card-header';
import { CardContentComponent } from '../../../ui/card/card-content';
import { CardFooterComponent } from '../../../ui/card/card-footer';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucideClock, lucideZap, lucideFlame, lucideTriangle, lucideStar } from '@ng-icons/lucide';
import { gsap } from 'gsap';
import { WidgetMetadata } from '../../../../types/widget.types';

@Component({
  selector: 'app-step-prompt',
  standalone: true,
  imports: [
    CommonModule,
    CardComponent,
    CardHeaderComponent,
    CardContentComponent,
    CardFooterComponent,
    NgIconComponent
  ],
  providers: [
    provideIcons({
      lucideClock,
      lucideZap,
      lucideFlame,
      lucideTriangle,
      lucideStar
    })
  ],
  template: `
    <app-card>
      <app-card-header *ngIf="title" #cardHeader>
        <h3 class="text-lg font-semibold text-foreground">{{ title }}</h3>
      </app-card-header>
      
      <app-card-content #cardContent>
        <div class="text-base text-foreground leading-relaxed" [innerHTML]="formattedPrompt"></div>
        
        <div class="flex justify-center mt-4" *ngIf="mediaUrl">
          <img 
            *ngIf="mediaType === 'image'" 
            [src]="mediaUrl" 
            [alt]="mediaAlt || 'Prompt image'"
            class="max-w-full h-auto rounded-lg "
          />
          <video 
            *ngIf="mediaType === 'video'" 
            [src]="mediaUrl" 
            controls
            class="max-w-full h-auto rounded-lg "
          ></video>
        </div>
      </app-card-content>
      
      <app-card-footer *ngIf="showFooter" #cardFooter>
        <div class="flex items-center justify-between text-sm text-muted-foreground">
          <span class="flex items-center gap-2" *ngIf="estimatedTime">
            <ng-icon name="lucideClock" class="w-4 h-4"></ng-icon>
            {{ estimatedTime }}s
          </span>
          <span class="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium" 
                [class]="getDifficultyClasses()">
            <ng-icon [name]="getDifficultyIcon()" class="w-3 h-3"></ng-icon>
            {{ difficultyLabel }}
          </span>
        </div>
      </app-card-footer>
    </app-card>
  `
})
export class StepPromptComponent extends WidgetBaseComponent implements AfterViewInit {
  @Input() title?: string;
  @Input() prompt!: string;
  @Input() mediaUrl?: string;
  @ViewChild('cardHeader') cardHeader?: ElementRef;
  @ViewChild('cardContent') cardContent?: ElementRef;
  @ViewChild('cardFooter') cardFooter?: ElementRef;
  @Input() mediaType?: 'image' | 'video';
  @Input() mediaAlt?: string;
  @Input() estimatedTime?: number;
  @Input() showFooter: boolean = true;

  get formattedPrompt(): string {
    return this.prompt?.replace(/\n/g, '<br>') || '';
  }

  getDifficultyClasses(): string {
    const classes = {
      1: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      2: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
      3: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
      4: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400',
      5: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
    };
    return classes[this.difficulty as keyof typeof classes] || classes[1];
  }

  getDifficultyIcon(): string {
    const icons = {
      1: 'lucideZap',
      2: 'lucideZap',
      3: 'lucideFlame',
      4: 'lucideTriangle',
      5: 'lucideStar'
    };
    return icons[this.difficulty as keyof typeof icons] || 'lucideZap';
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
