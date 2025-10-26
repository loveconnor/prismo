import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TabsNewComponent } from '../../../ui/tabs/tabs-new';
import { TabsListComponent } from '../../../ui/tabs/tabs-list';
import { TabsTriggerComponent } from '../../../ui/tabs/tabs-trigger';
import { TabsContentComponent } from '../../../ui/tabs/tabs-content';
import { HintPanelComponent } from '../hint-panel/hint-panel';
import { FeedbackBoxComponent } from '../feedback-box/feedback-box';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucideChevronDown, lucideChevronRight } from '@ng-icons/lucide';

interface HintItem {
  level: number;
  title: string;
  content: string;
}

@Component({
  selector: 'app-support-panel',
  standalone: true,
  imports: [
    CommonModule,
    TabsNewComponent,
    TabsListComponent,
    TabsTriggerComponent,
    TabsContentComponent,
    HintPanelComponent,
    FeedbackBoxComponent,
    NgIconComponent
  ],
  providers: [
    provideIcons({
      lucideChevronDown,
      lucideChevronRight
    })
  ],
  templateUrl: './support-panel.html',
  styleUrls: ['./support-panel.css']
})
export class SupportPanelComponent implements OnChanges {
  @Input() collapsed = false;
  @Input() onToggleCollapse?: () => void;
  @Input() hints: any[] = [];
  @Input() feedback: any[] = [];
  @Input() sessionId: string = '';
  @Input() aiReview: string = '';

  openHints: number[] = [];

  // Get the default tab value based on what content is available
  get defaultTabValue(): string {
    if (this.aiReview) return 'feedback'; // Auto-switch to feedback if AI review exists
    if (this.hasHints) return 'hints';
    if (this.hasFeedback) return 'feedback';
    return 'hints';
  }

  value = this.defaultTabValue;

  ngOnChanges(changes: SimpleChanges): void {
    // Auto-switch to feedback tab when AI review comes in
    if (changes['aiReview'] && changes['aiReview'].currentValue && !changes['aiReview'].previousValue) {
      this.value = 'feedback';
    }
  }

  // Check if hints exist
  get hasHints(): boolean {
    if (!this.hints || this.hints.length === 0) return false;
    if (this.hints[0]?.config?.hints && this.hints[0].config.hints.length > 0) return true;
    return false;
  }

  // Check if feedback exists
  get hasFeedback(): boolean {
    return this.feedback && this.feedback.length > 0;
  }

  // Check if the panel should be visible at all
  get shouldShowPanel(): boolean {
    return this.hasHints || this.hasFeedback;
  }

  // Get formatted hints from input
  get formattedHints(): HintItem[] {
    if (this.hints && this.hints.length > 0 && this.hints[0]?.config?.hints) {
      // Convert from widget hints format
      return this.hints[0].config.hints.map((h: any, index: number) => ({
        level: h.tier || index + 1,
        title: `Hint ${h.tier || index + 1}`,
        content: h.text || h.content || ''
      }));
    }
    
    // Return empty array if no hints
    return [];
  }

  onValueChange(v: string) {
    this.value = v;
  }

  toggleHint(level: number) {
    if (this.openHints.includes(level)) {
      this.openHints = this.openHints.filter(l => l !== level);
    } else {
      this.openHints = [...this.openHints, level];
    }
  }

  trackByHintLevel = (_: number, item: HintItem) => item.level;

  trackByHintWidget = (_: number, item: any) => item.id;

  trackByFeedback = (_: number, item: any) => item.id;

  getFeedbackProps(feedbackWidget: any) {
    return {
      type: feedbackWidget.config?.type || feedbackWidget.type || 'info',
      title: feedbackWidget.config?.title || feedbackWidget.title || 'Feedback',
      message: feedbackWidget.config?.message || feedbackWidget.message || '',
      explanation: feedbackWidget.config?.explanation || feedbackWidget.explanation,
      nextSteps: feedbackWidget.config?.nextSteps || feedbackWidget.nextSteps
    };
  }
}


