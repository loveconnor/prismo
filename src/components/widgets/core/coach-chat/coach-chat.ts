import { 
  Component, 
  Input, 
  Output, 
  EventEmitter, 
  ViewChild, 
  ElementRef, 
  OnInit,
  OnDestroy,
  signal,
  effect,
  Inject,
  PLATFORM_ID
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WidgetBaseComponent } from '../../base/widget-base';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { 
  lucideMessageSquare,
  lucideSend,
  lucideLightbulb,
  lucideTriangleAlert,
  lucideBookOpen,
  lucideChevronDown,
  lucideChevronUp,
  lucideX,
  lucideLoader,
  lucideShield,
  lucideZap,
  lucideClock
} from '@ng-icons/lucide';
import { SafeHtmlPipe } from '../../../../app/lib/safe-html.pipe';
import { cn } from '../../../../lib/utils';
import { ThemeService } from '../../../../services/theme.service';
import { FontService } from '../../../../services/font.service';

// ==================== TYPES ====================

export type CoachVariant = 'inline' | 'sidebar' | 'modal';
export type ChatState = 'collapsed' | 'idle' | 'composing' | 'thinking' | 'responded' | 'escalatedWorkedExample' | 'locked';
export type MessageRole = 'user' | 'coach' | 'system';
export type Domain = 'coding' | 'math' | 'writing' | 'general';

export interface ChatMessage {
  id: string;
  role: MessageRole;
  contentMD: string;
  createdAt: number;
  toolCalls?: ToolEvent[];
  attachments?: Attachment[];
}

export interface ToolEvent {
  name: 'errorExplain' | 'rubricLookup' | 'patternDetect' | 'unitCheck';
  status: 'queued' | 'running' | 'complete' | 'error';
  payload?: Record<string, any>;
}

export interface Attachment {
  kind: 'image' | 'code' | 'text' | 'csv';
  name: string;
  content: string;
  meta?: Record<string, any>;
}

export interface QuickAction {
  id: string;
  label: string;
  template: string;
}

export interface CoachPolicy {
  allowDirectAnswers?: boolean;
  allowCodeSnippets?: boolean;
  maxSnippetLines?: number;
  maskSolutionPatterns?: boolean;
  requireSocraticFirst?: boolean;
  disallowExternalLinks?: boolean;
}

export interface CoachContext {
  stepPromptMD: string;
  visibleHints: string[];
  recentAttempts: number;
  lastErrorSignature?: string;
  domain: Domain;
  skillTags: string[];
  userCodePreview?: string;
  userAnswerPreview?: string;
}

export interface CoachUI {
  defaultCollapsed?: boolean;
  showTokenMeter?: boolean;
  showContextChip?: boolean;
  maxHeightPx?: number;
  streaming?: boolean;
}

export interface CoachRateLimits {
  perMinute?: number;
  perSession?: number;
}

export interface CoachIntegrations {
  hintPanelId?: string;
  feedbackBoxId?: string;
  workedExampleAvailable?: boolean;
}

// Default quick actions
const DEFAULT_QUICK_ACTIONS: QuickAction[] = [
  { id: 'plan', label: 'Help me plan steps', template: "I'm stuck. Help me outline a 3–4 step plan without giving the answer." },
  { id: 'explain_error', label: 'Explain this error', template: 'Explain this error and how to fix it: {{error}}.' },
  { id: 'nudge', label: 'Give a small nudge', template: "Give a hint for the next step only; don't reveal the solution." },
  { id: 'check_work', label: 'Check my approach', template: 'Does my approach make sense? Point out one risk and one improvement.' },
];

// ==================== COMPONENT ====================

@Component({
  selector: 'app-coach-chat',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NgIconComponent,
    SafeHtmlPipe
  ],
  providers: [
    provideIcons({
      lucideMessageSquare,
      lucideSend,
      lucideLightbulb,
      lucideTriangleAlert,
      lucideBookOpen,
      lucideChevronDown,
      lucideChevronUp,
      lucideX,
      lucideLoader,
      lucideShield,
      lucideZap,
      lucideClock
    })
  ],
  templateUrl: './coach-chat.html',
  styleUrls: ['./coach-chat.css']
})
export class CoachChatComponent extends WidgetBaseComponent implements OnInit, OnDestroy {
  // ==================== INPUTS ====================
  @Input() coachId!: string;
  @Input() stepId!: string;
  @Input() variant: CoachVariant = 'inline';
  @Input() maxTurns: number = 12;
  @Input() policy: CoachPolicy = {};
  @Input() context!: CoachContext;
  @Input() ui: CoachUI = {};
  @Input() rateLimits: CoachRateLimits = {};
  @Input() integrations: CoachIntegrations = {};
  @Input() coachTelemetry?: { cohort?: string; abBucket?: string };
  @Input() a11yLabel?: string;
  @Input() coachReadOnly: boolean = false;

  // ==================== OUTPUTS ====================
  @Output() coachOpened = new EventEmitter<any>();
  @Output() messageSent = new EventEmitter<any>();
  @Output() replyStarted = new EventEmitter<any>();
  @Output() replyCompleted = new EventEmitter<any>();
  @Output() policyBlock = new EventEmitter<any>();
  @Output() hintSuggested = new EventEmitter<any>();
  @Output() workedExampleRedirect = new EventEmitter<any>();

  // ==================== VIEW CHILDREN ====================
  @ViewChild('messagesEnd') messagesEndRef?: ElementRef;
  @ViewChild('textarea') textareaRef?: ElementRef;
  @ViewChild('container') containerRef?: ElementRef;

  // ==================== STATE ====================
  chatState = signal<ChatState>('idle');
  messages = signal<ChatMessage[]>([]);
  inputValue = signal<string>('');
  isStreaming = signal<boolean>(false);
  messagesSentThisMinute = signal<number>(0);
  messagesSentThisSession = signal<number>(0);
  tokensUsed = signal<number>(0);
  socraticTurnsRemaining = signal<number>(0);

  // Quick actions
  quickActions = DEFAULT_QUICK_ACTIONS;

  // Rate limit timer
  private rateLimitResetTimer?: any;

  // ==================== CONSTRUCTOR ====================
  
  constructor(
    themeService: ThemeService,
    fontService: FontService,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    super(themeService, fontService, platformId);

    // Auto-scroll effect
    effect(() => {
      // React to messages changes
      this.messages();
      setTimeout(() => this.scrollToBottom(), 100);
    });
  }

  // ==================== COMPUTED ====================
  get allowDirectAnswers() { return this.policy.allowDirectAnswers ?? false; }
  get allowCodeSnippets() { return this.policy.allowCodeSnippets ?? true; }
  get maxSnippetLines() { return this.policy.maxSnippetLines ?? 12; }
  get maskSolutionPatterns() { return this.policy.maskSolutionPatterns ?? true; }
  get requireSocraticFirst() { return this.policy.requireSocraticFirst ?? true; }
  get disallowExternalLinks() { return this.policy.disallowExternalLinks ?? false; }

  get defaultCollapsed() { return this.ui.defaultCollapsed ?? false; }
  get showTokenMeter() { return this.ui.showTokenMeter ?? true; }
  get showContextChip() { return this.ui.showContextChip ?? true; }
  get maxHeightPx() { return this.ui.maxHeightPx ?? 420; }
  get streaming() { return this.ui.streaming ?? true; }

  get perMinute() { return this.rateLimits.perMinute ?? 6; }
  get perSession() { return this.rateLimits.perSession ?? 40; }

  // ==================== LIFECYCLE ====================

  override ngOnInit(): void {
    super.ngOnInit();

    // Set initial state
    if (this.defaultCollapsed) {
      this.chatState.set('collapsed');
    }

    // Set socratic turns
    if (this.requireSocraticFirst) {
      this.socraticTurnsRemaining.set(2);
    }

    // Add system message
    const systemMsg: ChatMessage = {
      id: `sys-${Date.now()}`,
      role: 'system',
      contentMD: `**Coaching Mode Active** • ${!this.allowDirectAnswers ? 'No full solutions' : 'Guided help'} • Ask questions to understand the concepts.`,
      createdAt: Date.now(),
    };
    this.messages.set([systemMsg]);

    // Emit opened event
    if (!this.defaultCollapsed) {
      this.coachOpened.emit({
        id: this.coachId,
        stepId: this.stepId,
        variant: this.variant,
      });
    }

    // Setup rate limit reset
    this.rateLimitResetTimer = setInterval(() => {
      this.messagesSentThisMinute.set(0);
    }, 60000);
  }

  override ngOnDestroy(): void {
    if (this.rateLimitResetTimer) {
      clearInterval(this.rateLimitResetTimer);
    }
    super.ngOnDestroy();
  }

  // ==================== METHODS ====================

  private scrollToBottom(): void {
    // Only scroll in browser environment
    if (!isPlatformBrowser(this.platformId)) return;
    
    if (this.messagesEndRef?.nativeElement?.scrollIntoView) {
      this.messagesEndRef.nativeElement.scrollIntoView({ behavior: 'smooth' });
    }
  }

  handleToggleCollapse(): void {
    const current = this.chatState();
    this.chatState.set(current === 'collapsed' ? 'idle' : 'collapsed');
  }

  handleQuickAction(action: QuickAction): void {
    let filledTemplate = action.template;
    
    // Replace placeholders
    if (this.context.lastErrorSignature) {
      filledTemplate = filledTemplate.replace('{{error}}', this.context.lastErrorSignature);
    } else {
      filledTemplate = filledTemplate.replace('{{error}}', 'No recent error');
    }
    
    this.inputValue.set(filledTemplate);
    this.textareaRef?.nativeElement.focus();
  }

  handleSuggestHints(): void {
    this.hintSuggested.emit({ id: this.coachId, stepId: this.stepId });
    
    const systemMsg: ChatMessage = {
      id: `sys-hint-${Date.now()}`,
      role: 'system',
      contentMD: '💡 **Hint available** — You might find the hint panel helpful. Would you like me to explain the hint, or shall we work through this together?',
      createdAt: Date.now(),
    };
    this.messages.update(msgs => [...msgs, systemMsg]);
  }

  async handleSendMessage(): Promise<void> {
    const input = this.inputValue();
    if (!input.trim() || this.isStreaming() || this.chatState() === 'locked') return;

    // Check rate limits
    if (this.messagesSentThisMinute() >= this.perMinute) {
      const systemMsg: ChatMessage = {
        id: `sys-rate-${Date.now()}`,
        role: 'system',
        contentMD: `⏱️ **Rate limit reached** — Please wait before sending more messages (${this.perMinute}/min).`,
        createdAt: Date.now(),
      };
      this.messages.update(msgs => [...msgs, systemMsg]);
      return;
    }

    if (this.messagesSentThisSession() >= this.perSession) {
      const systemMsg: ChatMessage = {
        id: `sys-session-${Date.now()}`,
        role: 'system',
        contentMD: `⏱️ **Session limit reached** — You've used ${this.perSession} messages this session. Consider using the hint panel or worked example.`,
        createdAt: Date.now(),
      };
      this.messages.update(msgs => [...msgs, systemMsg]);
      return;
    }

    // Check turn limit
    const userMessages = this.messages().filter(m => m.role === 'user');
    if (userMessages.length >= this.maxTurns) {
      const systemMsg: ChatMessage = {
        id: `sys-turns-${Date.now()}`,
        role: 'system',
        contentMD: `📚 **Max turns reached** — Consider reviewing the worked example for a complete walkthrough.`,
        createdAt: Date.now(),
      };
      this.messages.update(msgs => [...msgs, systemMsg]);
      this.workedExampleRedirect.emit({ id: this.coachId, stepId: this.stepId });
      return;
    }

    // Create user message
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      contentMD: input.trim(),
      createdAt: Date.now(),
    };

    this.messages.update(msgs => [...msgs, userMsg]);
    this.inputValue.set('');
    this.chatState.set('thinking');
    this.isStreaming.set(true);
    this.messagesSentThisMinute.update(count => count + 1);
    this.messagesSentThisSession.update(count => count + 1);

    this.messageSent.emit({
      id: this.coachId,
      stepId: this.stepId,
      length: userMsg.contentMD.length,
      from: 'user',
    });

    this.replyStarted.emit({ id: this.coachId, stepId: this.stepId });

    // Simulate streaming response
    await this.simulateCoachReply(userMsg.contentMD);
  }

  private async simulateCoachReply(userQuery: string): Promise<void> {
    // Simulate coach thinking
    await new Promise(resolve => setTimeout(resolve, 800));

    let replyContent = '';
    const isSocraticMode = this.socraticTurnsRemaining() > 0;

    // Generate contextual reply based on policy and context
    if (userQuery.toLowerCase().includes('error')) {
      if (this.context.lastErrorSignature) {
        replyContent = `I see you're encountering a **${this.context.lastErrorSignature}**. Let's break this down:\n\n1. What do you think causes this type of error?\n2. Can you identify where in your code this might occur?\n\nThink about the base case and how your recursion progresses.`;
      } else {
        replyContent = `I don't see a recent error. Can you share what's happening when you run your code?`;
      }
    } else if (userQuery.toLowerCase().includes('plan') || userQuery.toLowerCase().includes('steps')) {
      if (isSocraticMode) {
        replyContent = `Good question! Before I suggest steps, let me ask:\n\n1. What's the **simplest case** you need to handle?\n2. How would you break down the problem into smaller parts?\n\nThese questions will help you build your plan.`;
        this.socraticTurnsRemaining.update(count => Math.max(0, count - 1));
      } else {
        replyContent = `Here's a general approach:\n\n1. **Identify the base case** — What's the simplest input?\n2. **Define the recursive step** — How does f(n) relate to f(n-1)?\n3. **Test with small values** — Try n=0, n=1, n=2\n4. **Handle edge cases** — Negative numbers, large values\n\nTry implementing step 1 first!`;
      }
    } else if (userQuery.toLowerCase().includes('approach') || userQuery.toLowerCase().includes('check')) {
      replyContent = `Let me review your approach:\n\n**What's working:**\n- You're thinking about the problem structure\n\n**One risk:**\n- ${this.context.domain === 'coding' ? 'Make sure your base case prevents infinite recursion' : 'Verify your initial assumptions'}\n\n**One improvement:**\n- ${this.context.domain === 'coding' ? 'Add validation for invalid inputs (e.g., negative numbers)' : 'Consider breaking the problem into clearer steps'}\n\nDoes this help?`;
    } else if (userQuery.toLowerCase().includes('hint') || userQuery.toLowerCase().includes('nudge')) {
      if (isSocraticMode) {
        replyContent = `Instead of giving you the answer, let me guide you:\n\nWhat happens when you call your function with the **smallest possible input**? Write that down first.`;
        this.socraticTurnsRemaining.update(count => Math.max(0, count - 1));
      } else {
        replyContent = `Think about what **factorial(0)** should return. That's your base case!\n\nOnce you have that, the recursive step follows a pattern: \`n × factorial(n-1)\``;
      }
    } else {
      // Default contextual response
      if (isSocraticMode) {
        replyContent = `Great question! Let me help you think through this:\n\nWhat have you tried so far? What specific part is confusing?`;
        this.socraticTurnsRemaining.update(count => Math.max(0, count - 1));
      } else {
        replyContent = `Based on your question and the step context:\n\n**Key concept:** ${this.context.skillTags[0] || 'the core pattern'}\n\nHere's a targeted hint: Focus on the relationship between the current state and the previous one. ${this.allowCodeSnippets ? '\n\nFor example:\n```\n// Base case\nif (condition) return simple_value;\n// Recursive step\nreturn current * recurse(smaller);\n```' : ''}\n\nTry applying this pattern!`;
      }
    }

    // Stream the response
    const coachMsg: ChatMessage = {
      id: `coach-${Date.now()}`,
      role: 'coach',
      contentMD: '',
      createdAt: Date.now(),
    };

    this.messages.update(msgs => [...msgs, coachMsg]);

    // Simulate streaming
    const words = replyContent.split(' ');
    for (let i = 0; i < words.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 30));
      this.messages.update(msgs => {
        const updated = [...msgs];
        const lastMsg = updated[updated.length - 1];
        if (lastMsg.role === 'coach') {
          lastMsg.contentMD += (i > 0 ? ' ' : '') + words[i];
        }
        return updated;
      });
    }

    this.isStreaming.set(false);
    this.chatState.set('responded');
    const tokensOut = Math.floor(replyContent.length / 4);
    this.tokensUsed.update(count => count + tokensOut);

    this.replyCompleted.emit({
      id: this.coachId,
      stepId: this.stepId,
      tokensOut,
    });
  }

  handleKeyDown(event: KeyboardEvent): void {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault();
      this.handleSendMessage();
    }

    if (event.key === 'Escape' && this.variant === 'modal') {
      this.handleToggleCollapse();
    }
  }

  handleWorkedExample(): void {
    this.workedExampleRedirect.emit({ id: this.coachId, stepId: this.stepId });
  }

  getMessageClasses(role: MessageRole): string {
    if (role === 'user') {
      return 'justify-end';
    } else if (role === 'coach') {
      return 'justify-start';
    } else {
      return 'justify-center';
    }
  }

  getMessageBubbleClasses(role: MessageRole): string {
    const base = 'max-w-[85%] rounded-xl px-3 py-2 text-sm';
    if (role === 'user') {
      return cn(base, 'bg-[#0B2A55] text-[#e5e7eb]');
    } else if (role === 'coach') {
      return cn(base, 'bg-[#1f2937] text-[#e5e7eb]');
    }
    return '';
  }

  // ==================== WIDGET BASE IMPLEMENTATION ====================

  protected override initializeWidgetData(): void {
    this.setDataValue('opened', true);
    this.setDataValue('opened_at', new Date());
  }

  protected override validateInput(): boolean {
    return true;
  }

  protected override processCompletion(): void {
    this.setDataValue('completed_at', new Date());
    this.setDataValue('total_messages', this.messages().length);
    this.setDataValue('tokens_used', this.tokensUsed());
  }
}

