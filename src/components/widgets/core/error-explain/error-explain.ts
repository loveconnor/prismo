import { 
  Component, 
  Input, 
  Output, 
  EventEmitter
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { 
  lucideTriangleAlert,
  lucideLightbulb,
  lucideCircleCheck
} from '@ng-icons/lucide';

// ==================== TYPES ====================

export interface ErrorExplainUI {
  variant?: 'default' | 'compact' | 'inline';
  showCodeExample?: boolean;
  emphasizeFix?: boolean;
}

export interface ErrorExplainProps {
  // Core
  id: string;
  errorSignature: string;
  errorMessage?: string;

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

// ==================== COMPONENT ====================

@Component({
  selector: 'app-error-explain',
  standalone: true,
  imports: [
    CommonModule,
    NgIconComponent
  ],
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
export class ErrorExplainComponent {
  // ==================== INPUTS ====================
  @Input() id!: string;
  @Input() errorSignature!: string;
  @Input() errorMessage?: string;
  @Input() explanation!: string;
  @Input() fixSteps: string[] = [];
  @Input() relatedConcepts: string[] = [];
  @Input() codeExample?: string;
  @Input() ui?: ErrorExplainUI;
  @Input() autoShow: boolean = true;
  @Input() allowDismiss: boolean = true;
  @Input() a11yLabel?: string;
  
  // Event callbacks
  @Input() onDismiss?: () => void;
  @Input() onFixApplied?: () => void;
  
  // ==================== OUTPUTS ====================
  @Output() dismiss = new EventEmitter<void>();
  @Output() fixApplied = new EventEmitter<void>();
  
  // ==================== COMPUTED ====================
  get variant(): 'default' | 'compact' | 'inline' {
    return this.ui?.variant || 'default';
  }
  
  get showCodeExample(): boolean {
    return this.ui?.showCodeExample ?? true;
  }
  
  get emphasizeFix(): boolean {
    return this.ui?.emphasizeFix ?? true;
  }
  
  // ==================== HANDLERS ====================
  
  handleDismiss(): void {
    if (this.onDismiss) {
      this.onDismiss();
    }
    this.dismiss.emit();
  }
  
  handleFixApplied(): void {
    if (this.onFixApplied) {
      this.onFixApplied();
    }
    this.fixApplied.emit();
  }
  
  // ==================== HELPERS ====================
  
  getContainerClasses(): string {
    const classes = ['rounded-lg border border-red-500/20 bg-red-500/10'];
    
    if (this.variant === 'compact') {
      classes.push('p-3');
    } else if (this.variant === 'inline') {
      classes.push('border-l-4 p-3');
    } else {
      classes.push('p-4');
    }
    
    return classes.join(' ');
  }
  
  getFixHeaderClasses(): string {
    const classes = ['text-sm font-medium mb-2'];
    
    if (this.emphasizeFix) {
      classes.push('text-emerald-600 dark:text-emerald-400');
    }
    
    return classes.join(' ');
  }
}

