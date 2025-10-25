import { 
  Component, 
  Input, 
  Output, 
  EventEmitter, 
  OnInit,
  OnDestroy,
  signal,
  computed
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { WidgetBaseComponent } from '../../base/widget-base';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { 
  lucidePlay,
  lucideEye,
  lucideFileText,
  lucideShare2,
  lucideBookmark,
  lucideX,
  lucideChevronDown,
  lucideChevronUp,
  lucideCircleCheck,
  lucideClock,
  lucideTarget,
  lucideZap
} from '@ng-icons/lucide';
import { DialogComponent } from '../../../ui/dialog/dialog';
import { cn } from '../../../../lib/utils';

// ==================== TYPES ====================

export type LabDifficulty = 'easy' | 'medium' | 'hard' | 'challenge';
export type LabIntroVariant = 'hero' | 'card' | 'modal';
export type LabIntroState = 'idle' | 'detailsCollapsed' | 'detailsExpanded' | 'prereqAwaitingAck' | 'readyToStart' | 'readOnly';
export type SecondaryAction = 'preview' | 'rubric' | 'sample' | 'share' | 'save' | 'cancel';
export type RequirementType = 'software' | 'dataset' | 'account' | 'hardware' | 'browser';

export interface Requirement {
  type: RequirementType;
  label: string;
  url?: string;
}

export interface SyllabusStep {
  step: string;
  estMin?: number;
}

export interface Progress {
  percent: number;
  lastStepTitle?: string;
}

export interface SecondaryCTA {
  label: string;
  action: SecondaryAction;
  href?: string;
}

export interface LabIntroPolicy {
  noAnswerRevealInPreview?: boolean;
  requirePrereqAck?: boolean;
  showRubricLink?: boolean;
}

export interface LabIntroUI {
  variant?: LabIntroVariant;
  defaultExpanded?: boolean;
  showSkillChips?: boolean;
  showMiniSyllabus?: boolean;
  compact?: boolean;
}

export interface LabIntroCTA {
  primaryLabel?: string;
  secondary?: SecondaryCTA[];
}

export interface LabIntroIntegrations {
  resumeAvailable?: boolean;
  onStartEvent?: string;
  onPreviewEvent?: string;
  timerSuggestionMinutes?: number;
  estimationModelOrigin?: 'author' | 'ai' | 'historical';
}

export interface LabIntroTelemetry {
  cohort?: string;
  abBucket?: string;
}

export interface LabIntroViewedPayload {
  id: string;
  labId: string;
  difficulty: LabDifficulty;
  estimatedMinutes: number;
  resume: boolean;
}

export interface LabIntroExpandCollapsePayload {
  id: string;
  labId: string;
}

export interface LabIntroPrereqAckPayload {
  id: string;
  labId: string;
  acknowledged: boolean;
}

export interface LabIntroStartPayload {
  id: string;
  labId: string;
  resume: boolean;
}

export interface LabIntroSecondaryPayload {
  id: string;
  labId: string;
  action: SecondaryAction;
}

// ==================== COMPONENT ====================

@Component({
  selector: 'app-lab-intro',
  standalone: true,
  imports: [
    CommonModule,
    NgIconComponent,
    DialogComponent
  ],
  providers: [
    provideIcons({
      lucidePlay,
      lucideEye,
      lucideFileText,
      lucideShare2,
      lucideBookmark,
      lucideX,
      lucideChevronDown,
      lucideChevronUp,
      lucideCircleCheck,
      lucideClock,
      lucideTarget,
      lucideZap
    })
  ],
  templateUrl: './lab-intro.html',
  styleUrls: ['./lab-intro.css']
})
export class LabIntroComponent extends WidgetBaseComponent implements OnInit, OnDestroy {
  // ==================== ABSTRACT METHOD IMPLEMENTATIONS ====================
  
  protected initializeWidgetData(): void {
    // Lab intro doesn't require specific initialization
  }

  protected validateInput(): boolean {
    // Lab intro doesn't have input validation
    return true;
  }

  protected processCompletion(): void {
    // Mark as completed when lab is started
    this.updateState({ is_completed: true });
    this.completion.emit({
      widget_id: this._state.id,
      event_type: 'completion',
      data: { labId: this.labId },
      timestamp: new Date()
    });
  }
  // ==================== INPUTS ====================

  @Input() id!: string;
  @Input() labId!: string;
  @Input() title!: string;
  @Input() subtitle?: string;
  @Input() objective!: string | string[];
  @Input() difficulty!: LabDifficulty;
  @Input() estimatedMinutes!: number;
  @Input() skills: string[] = [];
  @Input() prerequisites: string[] = [];
  @Input() requirements: Requirement[] = [];
  @Input() miniSyllabus: SyllabusStep[] = [];
  @Input() progress?: Progress;
  @Input() policy: LabIntroPolicy = {};
  @Input() ui: LabIntroUI = {};
  @Input() cta: LabIntroCTA = {};
  @Input() integrations: LabIntroIntegrations = {};
  @Input() telemetry?: LabIntroTelemetry;
  @Input() a11yLabel?: string;
  @Input() labReadOnly: boolean = false;

  // ==================== OUTPUTS ====================

  @Output() labViewed = new EventEmitter<LabIntroViewedPayload>();
  @Output() labExpand = new EventEmitter<LabIntroExpandCollapsePayload>();
  @Output() labCollapse = new EventEmitter<LabIntroExpandCollapsePayload>();
  @Output() prereqAck = new EventEmitter<LabIntroPrereqAckPayload>();
  @Output() startClicked = new EventEmitter<LabIntroStartPayload>();
  @Output() secondaryClicked = new EventEmitter<LabIntroSecondaryPayload>();

  // ==================== STATE ====================

  labIntroState = signal<LabIntroState>('idle');
  detailsExpanded = signal<boolean>(true);
  showPrereqModal = signal<boolean>(false);
  prereqsAcknowledged = signal<boolean>(false);

  // ==================== COMPUTED ====================

  get variant() { return this.ui.variant ?? 'hero'; }
  get defaultExpanded() { return this.ui.defaultExpanded ?? true; }
  get showSkillChips() { return this.ui.showSkillChips ?? true; }
  get showMiniSyllabus() { return this.ui.showMiniSyllabus ?? false; }
  get compact() { return this.ui.compact ?? false; }

  get noAnswerRevealInPreview() { return this.policy.noAnswerRevealInPreview ?? true; }
  get requirePrereqAck() { return this.policy.requirePrereqAck ?? false; }
  get showRubricLink() { return this.policy.showRubricLink ?? false; }

  get resumeAvailable() { return this.integrations.resumeAvailable ?? false; }
  get onStartEvent() { return this.integrations.onStartEvent; }
  get onPreviewEvent() { return this.integrations.onPreviewEvent; }
  get timerSuggestionMinutes() { return this.integrations.timerSuggestionMinutes; }
  get estimationModelOrigin() { return this.integrations.estimationModelOrigin; }

  isResuming = computed(() => 
    Boolean(this.progress && this.progress.percent > 0 && this.resumeAvailable)
  );

  primaryLabel = computed(() => 
    this.cta.primaryLabel || (this.isResuming() ? 'Resume lab' : 'Start lab')
  );

  objectiveArray = computed(() => 
    Array.isArray(this.objective) ? this.objective : [this.objective]
  );

  hasOverflow = computed(() => this.objectiveArray().length > 3);

  displayedObjectives = computed(() => 
    this.detailsExpanded() ? this.objectiveArray() : this.objectiveArray().slice(0, 3)
  );

  totalSyllabusMinutes = computed(() => 
    this.miniSyllabus.reduce((sum, s) => sum + (s.estMin || 0), 0)
  );

  syllabusString = computed(() => {
    const total = this.totalSyllabusMinutes();
    const length = this.miniSyllabus.length;
    
    if (length > 0 && total > 0) {
      return `${length} steps · ${total} min`;
    } else if (length > 0) {
      return `${length} steps`;
    }
    return null;
  });

  // ==================== LIFECYCLE ====================

  override ngOnInit() {
    super.ngOnInit();
    this.detailsExpanded.set(this.defaultExpanded);

    // Emit viewed event
    this.labViewed.emit({
      id: this.id,
      labId: this.labId,
      difficulty: this.difficulty,
      estimatedMinutes: this.estimatedMinutes,
      resume: this.isResuming(),
    });
  }

  override ngOnDestroy() {
    super.ngOnDestroy();
  }

  // ==================== HANDLERS ====================

  handleExpandCollapse() {
    const newExpanded = !this.detailsExpanded();
    this.detailsExpanded.set(newExpanded);
    
    if (newExpanded) {
      this.labExpand.emit({ id: this.id, labId: this.labId });
    } else {
      this.labCollapse.emit({ id: this.id, labId: this.labId });
    }
  }

  handleStartClick() {
    if (this.labReadOnly || this.labIntroState() === 'readOnly') return;

    // Check prereq gating
    if (this.requirePrereqAck && !this.prereqsAcknowledged() && this.prerequisites.length > 0) {
      this.showPrereqModal.set(true);
      return;
    }

    this.startClicked.emit({
      id: this.id,
      labId: this.labId,
      resume: this.isResuming(),
    });
  }

  handlePrereqAck() {
    this.prereqsAcknowledged.set(true);
    this.showPrereqModal.set(false);
    
    this.prereqAck.emit({
      id: this.id,
      labId: this.labId,
      acknowledged: true,
    });

    // Auto-start after ack
    this.startClicked.emit({
      id: this.id,
      labId: this.labId,
      resume: this.isResuming(),
    });
  }

  handleSecondaryClick(action: SecondaryAction, href?: string) {
    this.secondaryClicked.emit({
      id: this.id,
      labId: this.labId,
      action,
    });

    if (href) {
      window.open(href, '_blank', 'noopener,noreferrer');
    }
  }

  handleClosePrereqModal() {
    this.showPrereqModal.set(false);
  }

  // ==================== HELPERS ====================

  getDifficultyColor(diff: LabDifficulty): string {
    switch (diff) {
      case 'easy':
        return 'border-emerald-500 text-emerald-500 bg-emerald-500/10';
      case 'medium':
        return 'border-amber-500 text-amber-500 bg-amber-500/10';
      case 'hard':
        return 'border-red-500 text-red-500 bg-red-500/10';
      case 'challenge':
        return 'border-purple-500 text-purple-500 bg-purple-500/10';
      default:
        return 'border-gray-500 text-gray-500 bg-gray-500/10';
    }
  }

  getDifficultyIcon(diff: LabDifficulty): string {
    switch (diff) {
      case 'challenge':
        return 'lucideZap';
      default:
        return 'lucideTarget';
    }
  }

  getSecondaryIcon(action: SecondaryAction): string {
    switch (action) {
      case 'preview':
        return 'lucideEye';
      case 'rubric':
        return 'lucideFileText';
      case 'share':
        return 'lucideShare2';
      case 'save':
        return 'lucideBookmark';
      default:
        return 'lucideFileText';
    }
  }

  // Expose cn utility for template
  cn = cn;
  
  // Helper for template
  isArray(value: any): boolean {
    return Array.isArray(value);
  }
}

