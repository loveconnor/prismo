import { 
    Component, 
    Input, 
    Output, 
    EventEmitter,
    Inject,
    PLATFORM_ID
  } from '@angular/core';
  import { CommonModule } from '@angular/common';
  import { WidgetBaseComponent } from '../../base/widget-base';
  import { ThemeService } from '../../../../services/theme.service';
  import { FontService } from '../../../../services/font.service';
  import { NgIconComponent, provideIcons } from '@ng-icons/core';
  import { 
    lucideTriangleAlert,
    lucideLightbulb,
    lucideCircleCheck
  } from '@ng-icons/lucide';
  
  /** ==================== HEAD (legacy) TYPES ==================== */
  export interface DetectedError {
    id: string;
    type: string;
    line?: number;
    message: string;
    severity: 'error' | 'warning' | 'info';
  }
  
  /** ==================== WIDGET (modern) TYPES ==================== */
  export interface ErrorExplainUI {
    variant?: 'default' | 'compact' | 'inline';
    showCodeExample?: boolean;
    emphasizeFix?: boolean;
  }
  
  /**
   * Props used by newer widget API (for reference).
   * We expose them as @Input()s directly on the component.
   */
  export interface ErrorExplainProps {
    // Core
    id: string;
    errorSignature: string;
    errorDetails?: string;

    // Content
    explanation: string;
    fixSteps: string[];
    relatedConcepts?: string[];
    codeExample?: string;
  
    // UI
    ui?: ErrorExplainUI;
  
    // Configuration
    autoShow?: boolean;
    allowDismiss?: boolean;
  
    // Accessibility
    a11yLabel?: string;
  
    // Events
    onDismiss?: () => void;
    onFixApplied?: () => void;
  }
  
  @Component({
    selector: 'app-error-explain',
    standalone: true,
    imports: [CommonModule, NgIconComponent],
    providers: [
      provideIcons({
        lucideTriangleAlert,
        lucideLightbulb,
        lucideCircleCheck
      })
    ],
    templateUrl: './error-explain.html',
    styleUrls: ['./error-explain.css']
  })
  export class ErrorExplainComponent extends WidgetBaseComponent {
    /** ==================== MODERN WIDGET INPUTS ==================== */
    @Input() id!: string;
    @Input() errorSignature!: string;
    @Input() errorDetails?: string;
    @Input() explanation: string = '';
    @Input() fixSteps: string[] = [];
    @Input() relatedConcepts: string[] = [];
    @Input() codeExample?: string;
    @Input() ui?: ErrorExplainUI;
    @Input() autoShow: boolean = true;
    @Input() allowDismiss: boolean = true;
    @Input() a11yLabel?: string;
  
    /** Callback-style inputs (optional) */
    @Input() onDismiss?: () => void;
    @Input() onFixApplied?: () => void;
  
    /** ==================== MODERN WIDGET OUTPUTS ==================== */
    @Output() dismiss = new EventEmitter<void>();
    @Output() fixApplied = new EventEmitter<void>();
  
    /** ==================== LEGACY HEAD INPUTS (back-compat) ==================== */
    @Input() errorText: string = '';
    @Input() detectedErrors: DetectedError[] = [];
    @Input() explanations: { [errorId: string]: string } = {};
    @Input() showLineNumbers: boolean = true;
    @Input() allowUserExplanation: boolean = true;
    @Input() showHints: boolean = true;
  
    /** ==================== LEGACY HEAD OUTPUTS (back-compat) ==================== */
    @Output() errorSelected = new EventEmitter<string>();
    @Output() explanationSubmitted = new EventEmitter<{ errorId: string; explanation: string }>();
    @Output() hintRequested = new EventEmitter<string>();
    @Output() errorFixed = new EventEmitter<string>();
  
    /** ==================== LOCAL STATE (for legacy interop) ==================== */
    private selectedErrorId: string | null = null;
  
    /** ==================== CONSTRUCTOR ==================== */
    constructor(
      protected override fontService: FontService,
      themeService: ThemeService,
      @Inject(PLATFORM_ID) platformId: Object
    ) {
      super(themeService, fontService, platformId);
    }
  
    /** ==================== COMPUTED (modern) ==================== */
    get variant(): 'default' | 'compact' | 'inline' {
      return this.ui?.variant || 'default';
    }
  
    get showCodeExample(): boolean {
      return this.ui?.showCodeExample ?? true;
    }
  
    get emphasizeFix(): boolean {
      return this.ui?.emphasizeFix ?? true;
    }
  
    /** ==================== HANDLERS (modern) ==================== */
    handleDismiss(): void {
      try { this.onDismiss?.(); } finally { this.dismiss.emit(); }
    }
  
    handleFixApplied(): void {
      try { this.onFixApplied?.(); } finally {
        this.fixApplied.emit();
        // Legacy bridge: if a specific error is selected, also emit errorFixed
        if (this.selectedErrorId) {
          this.errorFixed.emit(this.selectedErrorId);
        }
      }
    }
  
    /** ==================== LEGACY BRIDGE HELPERS ==================== */
    /** Select an error (HEAD API) and emit event */
    selectError(errorId: string): void {
      this.selectedErrorId = errorId;
      this.errorSelected.emit(errorId);
    }
  
    /** Submit a free-form explanation for a specific error (HEAD API) */
    submitUserExplanation(errorId: string, explanationText: string): void {
      if (!this.allowUserExplanation) return;
      this.explanations = { ...this.explanations, [errorId]: explanationText };
      this.explanationSubmitted.emit({ errorId, explanation: explanationText });
    }
  
    /** Request a hint for a specific error (HEAD API) */
    requestHint(errorId: string): void {
      if (!this.showHints) return;
      this.hintRequested.emit(errorId);
    }
  
    /** UI helpers (used by template) */
    getContainerClasses(): string {
      const classes = ['rounded-lg border border-red-500/20 bg-red-500/10'];
      if (this.variant === 'compact') classes.push('p-3');
      else if (this.variant === 'inline') classes.push('border-l-4 p-3');
      else classes.push('p-4');
      return classes.join(' ');
    }
  
    getFixHeaderClasses(): string {
      const classes = ['text-sm font-medium mb-2'];
      if (this.emphasizeFix) classes.push('text-emerald-600 dark:text-emerald-400');
      return classes.join(' ');
    }
  
    /** ==================== WIDGET BASE IMPLEMENTATION ==================== */
    protected initializeWidgetData(): void {
      // Initialize widget-specific data if needed
    }
  
    protected validateInput(): boolean {
      // Always valid: either modern or legacy usage paths
      return true;
    }
  
    protected processCompletion(): void {
      // No-op for this widget
    }
  }
  