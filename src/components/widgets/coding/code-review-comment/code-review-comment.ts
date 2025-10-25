import {
  Component,
  Input,
  Output,
  EventEmitter,
  Inject,
  PLATFORM_ID,
  OnInit,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { WidgetBaseComponent } from '../../base/widget-base';
import { ThemeService } from '../../../../services/theme.service';
import { FontService } from '../../../../services/font.service';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  lucideInfo,
  lucideTriangle,
  lucideCircleX,
  lucideCircleCheck,
  lucideLightbulb,
  lucideChevronDown,
  lucideThumbsUp,
  lucideReply
} from '@ng-icons/lucide';

export type CommentType = 'info' | 'warning' | 'error' | 'success' | 'suggestion';
export type CommentPosition = 'left' | 'right' | 'top' | 'bottom';

@Component({
  selector: 'app-code-review-comment',
  standalone: true,
  imports: [CommonModule, NgIconComponent],
  providers: [
    provideIcons({
      lucideInfo,
      lucideTriangle,
      lucideCircleX,
      lucideCircleCheck,
      lucideLightbulb,
      lucideChevronDown,
      lucideThumbsUp,
      lucideReply
    })
  ],
  templateUrl: './code-review-comment.html',
  styleUrls: ['./code-review-comment.css']
})
export class CodeReviewCommentComponent extends WidgetBaseComponent implements OnInit {
  // Inputs
  @Input() lineNumber?: number;
  @Input() code?: string;
  @Input() language: string = 'typescript';
  @Input() commentType: CommentType = 'info';
  @Input() title?: string;
  @Input() message!: string;
  @Input() author: string = 'Instructor';
  @Input() timestamp?: string;
  @Input() position: CommentPosition = 'right';
  @Input() showLineHighlight: boolean = true;
  @Input() isResolved: boolean = false;
  // Callback-style
  @Input() onResolve?: () => void;

  // Outputs
  @Output() resolved = new EventEmitter<void>();

  // State
  isExpanded = signal<boolean>(true);
  showReply = signal<boolean>(false);
  replyText = signal<string>('');
  likes = signal<number>(0);
  hasLiked = signal<boolean>(false);

  constructor(
    themeService: ThemeService,
    fontService: FontService,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    super(themeService, fontService, platformId);
  }

  override ngOnInit(): void {
    super.ngOnInit();
  }

  protected initializeWidgetData(): void {}
  protected validateInput(): boolean { return true; }
  protected processCompletion(): void {}

  // UI helpers
  getPositionClass(): string {
    switch (this.position) {
      case 'left': return 'flex-row-reverse';
      case 'right': return 'flex-row';
      case 'top': return 'flex-col-reverse';
      case 'bottom':
      default: return 'flex-col';
    }
  }

  getTypeClasses(): { border: string; bg: string; header: string; icon: string } {
    switch (this.commentType) {
      case 'warning':
        return { border: 'border-amber-500/30', bg: 'bg-amber-500/10', header: 'bg-amber-500/15', icon: 'text-amber-400' };
      case 'error':
        return { border: 'border-red-500/30', bg: 'bg-red-500/10', header: 'bg-red-500/15', icon: 'text-red-400' };
      case 'success':
        return { border: 'border-emerald-500/30', bg: 'bg-emerald-500/10', header: 'bg-emerald-500/15', icon: 'text-emerald-400' };
      case 'suggestion':
        // Use sky/blue theme instead of purple for AI suggestions
        return { border: 'border-sky-500/30', bg: 'bg-sky-500/10', header: 'bg-sky-500/15', icon: 'text-sky-400' };
      case 'info':
      default:
        return { border: 'border-sky-500/30', bg: 'bg-sky-500/10', header: 'bg-sky-500/15', icon: 'text-sky-400' };
    }
  }

  getIconName(): string {
    switch (this.commentType) {
      case 'warning': return 'lucideTriangle';
      case 'error': return 'lucideCircleX';
      case 'success': return 'lucideCircleCheck';
      case 'suggestion': return 'lucideLightbulb';
      case 'info':
      default: return 'lucideInfo';
    }
  }

  // Actions
  toggleExpanded() { this.isExpanded.set(!this.isExpanded()); }
  toggleReply() { this.showReply.set(!this.showReply()); }
  handleLike() {
    if (this.hasLiked()) {
      this.likes.set(this.likes() - 1);
      this.hasLiked.set(false);
    } else {
      this.likes.set(this.likes() + 1);
      this.hasLiked.set(true);
    }
  }
  handleResolve() {
    this.onResolve?.();
    this.resolved.emit();
  }
  handleReplySubmit() {
    if (this.replyText().trim().length === 0) return;
    // Placeholder: could emit event later
    this.replyText.set('');
    this.showReply.set(false);
  }
}


