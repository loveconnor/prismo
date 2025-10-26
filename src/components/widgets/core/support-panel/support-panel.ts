import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TabsNewComponent } from '../../../ui/tabs/tabs-new';
import { TabsListComponent } from '../../../ui/tabs/tabs-list';
import { TabsTriggerComponent } from '../../../ui/tabs/tabs-trigger';
import { TabsContentComponent } from '../../../ui/tabs/tabs-content';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucideChevronDown, lucideChevronRight } from '@ng-icons/lucide';
// Coach tab removed

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
export class SupportPanelComponent {
  @Input() collapsed = false;
  @Input() onToggleCollapse?: () => void;
  @Input() hints: any[] = [];

  value = 'hints';
  openHints: number[] = [];

  // Get formatted hints from input or use defaults
  get formattedHints(): HintItem[] {
    if (this.hints && this.hints.length > 0 && this.hints[0]?.config?.hints) {
      // Convert from widget hints format
      return this.hints[0].config.hints.map((h: any, index: number) => ({
        level: h.tier || index + 1,
        title: `Hint ${h.tier || index + 1}`,
        content: h.text || h.content || ''
      }));
    }
    
    // Default hints
    return [
      {
        level: 1,
        title: 'Basic Hint',
        content: 'Start by initializing a variable before the loop. Think about what value you want to start with.'
      },
      {
        level: 2,
        title: 'Intermediate Hint',
        content: "Use 'for num in nums:' to iterate over the list. This gives you each element one at a time."
      },
      {
        level: 3,
        title: 'Detailed Hint',
        content: 'Inside the loop, add each number to your total variable. Remember to update the accumulator with each iteration.'
      }
    ];
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
}


