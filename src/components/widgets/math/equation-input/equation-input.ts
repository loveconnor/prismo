import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WidgetBaseComponent } from '../../base/widget-base';
import { ButtonComponent } from '../../../ui/button/button';
import { CardComponent } from '../../../ui/card/card';
import { CardContentComponent } from '../../../ui/card/card-content';
import { CardHeaderComponent } from '../../../ui/card/card-header';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucideCheck, lucideX, lucideTriangle, lucideCalculator } from '@ng-icons/lucide';

interface ValidationError {
  type: 'syntax' | 'format' | 'domain' | 'other';
  message: string;
  position?: number;
}

@Component({
  selector: 'app-equation-input',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule,
    CardComponent,
    CardContentComponent,
    CardHeaderComponent,
    ButtonComponent,
    NgIconComponent
  ],
  providers: [
    provideIcons({
      lucideCheck,
      lucideX,
      lucideTriangle,
      lucideCalculator
    })
  ],
  template: `
    <app-card>
      <app-card-header>
        <div class="flex items-center gap-3">
          <ng-icon name="lucideCalculator" class="w-5 h-5 text-blue-500"></ng-icon>
          <h3 class="text-lg font-semibold text-foreground">{{ title }}</h3>
        </div>
        <div class="text-sm text-muted-foreground" *ngIf="showMeta">
          {{ formatHint }}
        </div>
      </app-card-header>
      
      <app-card-content>
        <div class="space-y-4">
          <div class="space-y-2">
            <label class="text-sm font-medium text-foreground" for="equation-input">
              {{ inputLabel }}
            </label>
            
            <div class="flex gap-2">
              <input
                id="equation-input"
                type="text"
                class="flex-1 px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                [(ngModel)]="equation"
                [ngModelOptions]="{standalone: true}"
                (input)="onEquationChange()"
                [placeholder]="placeholder"
                [class.border-destructive]="hasValidationError"
                [disabled]="isValidating"
              />
              
              <app-button 
                variant="outline"
                size="sm"
                (click)="validateEquation()"
                [disabled]="!equation.trim() || isValidating"
              >
                <ng-icon name="lucideCheck" class="w-4 h-4 mr-2"></ng-icon>
                <span *ngIf="!isValidating">Validate</span>
                <span *ngIf="isValidating">Validating...</span>
              </app-button>
              
              <app-button 
                variant="outline"
                size="sm"
                (click)="clearEquation()"
                [disabled]="!equation.trim()"
              >
                <ng-icon name="lucideX" class="w-4 h-4 mr-2"></ng-icon>
                Clear
              </app-button>
            </div>
          </div>
          
          <div class="space-y-2" *ngIf="showPreview && equation">
            <div class="flex items-center justify-between">
              <span class="text-sm font-medium text-foreground">Preview:</span>
              <span class="text-xs px-2 py-1 rounded-full" 
                    [class]="previewStatus === 'valid' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                             previewStatus === 'invalid' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' :
                             'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'">
                {{ getPreviewStatusLabel() }}
              </span>
            </div>
            
            <div class="p-4 bg-muted rounded-lg">
              <div class="text-base text-foreground katex-preview" 
                   [innerHTML]="formattedPreview"
                   style="font-family: 'KaTeX_Main', 'Times New Roman', serif; font-size: 1.2em;">
              </div>
            </div>
          </div>
          
          <div class="space-y-2" *ngIf="validationErrors.length > 0">
            <span class="text-sm font-medium text-foreground">Validation Errors:</span>
            
            <div class="space-y-2">
              <div 
                *ngFor="let error of validationErrors; trackBy: trackByErrorType" 
                class="p-3 border rounded-lg"
                [class.border-yellow-200]="error.type === 'syntax'"
                [class.border-blue-200]="error.type === 'format'"
                [class.border-red-200]="error.type === 'domain'"
                [class.border-red-200]="error.type === 'other'"
              >
                <div class="flex items-start gap-2">
                  <ng-icon 
                    name="lucideTriangle" 
                    class="w-4 h-4 mt-0.5"
                    [class.text-yellow-600]="error.type === 'syntax'"
                    [class.text-blue-600]="error.type === 'format'"
                    [class.text-red-600]="error.type === 'domain'"
                    [class.text-red-600]="error.type === 'other'"
                  ></ng-icon>
                  <div class="flex-1">
                    <div class="text-sm text-foreground">{{ error.message }}</div>
                    <div class="text-xs text-muted-foreground" *ngIf="error.position !== undefined">
                      Position: {{ error.position }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div class="p-3 bg-green-50 border border-green-200 rounded-lg" *ngIf="isValid && !hasValidationError">
            <div class="flex items-center gap-2">
              <ng-icon name="lucideCheck" class="w-4 h-4 text-green-600"></ng-icon>
              <div>
                <div class="font-medium text-green-800">Valid Equation!</div>
                <div class="text-sm text-green-700" *ngIf="equationDetails">
                  {{ equationDetails }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </app-card-content>
      
      <div class="mt-4 pt-3 border-t" *ngIf="showFooter">
        <div class="flex items-center gap-4 text-xs text-muted-foreground">
          <span>{{ equation.length }} characters</span>
          <span *ngIf="validationCount > 0">
            Validations: {{ validationCount }}
          </span>
          <span *ngIf="lastValidatedAt">
            Last validated: {{ lastValidatedAt | date:'short' }}
          </span>
        </div>
      </div>
    </app-card>
  `,
})
export class EquationInputComponent extends WidgetBaseComponent {
  @Input() title: string = 'Mathematical Expression';
  @Input() inputLabel: string = 'Enter your equation:';
  @Input() placeholder: string = 'e.g., x^2 + 2x + 1 = 0';
  @Input() formatHint: string = 'Use LaTeX notation (e.g., x^2, \\frac{a}{b})';
  @Input() expectedFormat?: string;
  @Input() showPreview: boolean = true;
  @Input() showMeta: boolean = true;
  @Input() showFooter: boolean = true;
  @Input() autoValidate: boolean = false;
  
  @Output() latexChange = new EventEmitter<string>();

  public equation: string = '';
  public isValid: boolean = false;
  public isValidating: boolean = false;
  public hasValidationError: boolean = false;
  public validationErrors: ValidationError[] = [];
  public previewStatus: 'idle' | 'validating' | 'valid' | 'invalid' = 'idle';
  public equationDetails?: string;
  public lastValidatedAt?: Date;
  public validationCount = 0;

  get formattedPreview(): string {
    if (!this.equation) return '';
    
    try {
      // Enhanced LaTeX to HTML conversion for better math rendering
      let result = this.equation;
      
      // Handle simple fractions (a/b) - must be done before other replacements
      result = result.replace(/([a-zA-Z0-9\(\)]+)\/([a-zA-Z0-9\(\)]+)/g, 
        '<div class="math-fraction"><div class="math-numerator">$1</div><div class="math-denominator">$2</div></div>');
      
      // Handle LaTeX fractions
      result = result.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, 
        '<div class="math-fraction"><div class="math-numerator">$1</div><div class="math-denominator">$2</div></div>');
      
      // Handle multiplication symbols (* becomes ×)
      result = result.replace(/\*/g, '×');
      result = result.replace(/\\times/g, '×');
      
      // Handle division symbols
      result = result.replace(/\\div/g, '÷');
      
      // Handle superscripts
      result = result.replace(/\^(\d+)/g, '<sup>$1</sup>');
      result = result.replace(/\^(\w+)/g, '<sup>$1</sup>');
      result = result.replace(/\^\{([^}]+)\}/g, '<sup>$1</sup>');
      
      // Handle subscripts
      result = result.replace(/_(\d+)/g, '<sub>$1</sub>');
      result = result.replace(/_(\w+)/g, '<sub>$1</sub>');
      result = result.replace(/_\{(.+?)\}/g, '<sub>$1</sub>');
      
      // Handle square roots
      result = result.replace(/\\sqrt\{([^}]+)\}/g, '<span class="math-sqrt">√<span class="math-radicand">$1</span></span>');
      
      // Handle Greek letters
      result = result.replace(/\\alpha/g, 'α');
      result = result.replace(/\\beta/g, 'β');
      result = result.replace(/\\gamma/g, 'γ');
      result = result.replace(/\\delta/g, 'δ');
      result = result.replace(/\\epsilon/g, 'ε');
      result = result.replace(/\\theta/g, 'θ');
      result = result.replace(/\\lambda/g, 'λ');
      result = result.replace(/\\mu/g, 'μ');
      result = result.replace(/\\pi/g, 'π');
      result = result.replace(/\\sigma/g, 'σ');
      result = result.replace(/\\tau/g, 'τ');
      result = result.replace(/\\phi/g, 'φ');
      result = result.replace(/\\omega/g, 'ω');
      
      // Handle other mathematical symbols
      result = result.replace(/\\pm/g, '±');
      result = result.replace(/\\mp/g, '∓');
      result = result.replace(/\\leq/g, '≤');
      result = result.replace(/\\geq/g, '≥');
      result = result.replace(/\\neq/g, '≠');
      result = result.replace(/\\approx/g, '≈');
      result = result.replace(/\\infty/g, '∞');
      result = result.replace(/\\sum/g, '∑');
      result = result.replace(/\\int/g, '∫');
      result = result.replace(/\\partial/g, '∂');
      
      // Handle parentheses and brackets
      result = result.replace(/\\left\(/g, '(');
      result = result.replace(/\\right\)/g, ')');
      result = result.replace(/\\left\[/g, '[');
      result = result.replace(/\\right\]/g, ']');
      result = result.replace(/\\left\{/g, '{');
      result = result.replace(/\\right\}/g, '}');
      
      return result;
    } catch (error) {
      console.error('Math rendering error:', error);
      return this.equation;
    }
  }

  onEquationChange(): void {
    // Convert simple syntax to proper LaTeX for symbolic parsing
    const latexValue = this.convertToLaTeX(this.equation);
    
    this.setDataValue('equation', latexValue);
    this.setDataValue('equation_length', this.equation.length);
    this.setDataValue('last_modified', new Date());
    
    // Emit the LaTeX value for external symbolic parsing
    this.latexChange.emit(latexValue);
    
    if (this.autoValidate && this.equation.trim()) {
      this.validateEquation();
    }
  }

  /**
   * Get the current equation as proper LaTeX for symbolic parsing
   */
  get latexValue(): string {
    return this.convertToLaTeX(this.equation);
  }

  /**
   * Convert simple math syntax to proper LaTeX for symbolic parsing
   */
  private convertToLaTeX(input: string): string {
    if (!input) return '';
    
    let result = input;
    
    // Convert simple fractions (a/b) to LaTeX fractions
    result = result.replace(/([a-zA-Z0-9\(\)]+)\/([a-zA-Z0-9\(\)]+)/g, '\\frac{$1}{$2}');
    
    // Convert * to \times for multiplication
    result = result.replace(/\*/g, '\\times');
    
    // Keep other LaTeX syntax as-is (^, _, \alpha, etc.)
    
    return result;
  }

  validateEquation(): void {
    if (!this.equation.trim()) return;

    this.isValidating = true;
    this.previewStatus = 'validating';
    this.validationErrors = [];
    this.hasValidationError = false;
    this.validationCount++;

    this.setDataValue('validation_count', this.validationCount);
    this.setDataValue('last_validated', new Date());

    // Perform validation immediately
    try {
      this.performValidation();
      this.isValid = this.validationErrors.length === 0;
      this.hasValidationError = !this.isValid;
      this.previewStatus = this.isValid ? 'valid' : 'invalid';
      this.lastValidatedAt = new Date();
      
      if (this.isValid) {
        this.setDataValue('validated_at', this.lastValidatedAt);
        this.setDataValue('is_valid', true);
        
        // Auto-complete if valid
        if (this.autoValidate) {
          this.completeWidget();
        }
      }
    } catch (error) {
      this.validationErrors.push({
        type: 'other',
        message: `Validation error: ${error}`
      });
      this.isValid = false;
      this.hasValidationError = true;
      this.previewStatus = 'invalid';
    }
    
    this.isValidating = false;
  }

  clearEquation(): void {
    this.equation = '';
    this.isValid = false;
    this.hasValidationError = false;
    this.validationErrors = [];
    this.previewStatus = 'idle';
    this.equationDetails = undefined;
    
    this.setDataValue('equation', '');
    this.setDataValue('is_valid', false);
    this.setDataValue('cleared_at', new Date());
  }

  private performValidation(): void {
    const equation = this.equation.trim();
    
    // Basic syntax validation
    if (!this.validateBasicSyntax(equation)) {
      return;
    }
    
    // Format validation
    if (this.expectedFormat && !this.validateFormat(equation)) {
      return;
    }
    
    // Domain validation
    if (!this.validateDomain(equation)) {
      return;
    }
    
    // If all validations pass, set success details
    this.equationDetails = this.generateEquationDetails(equation);
  }

  private validateBasicSyntax(equation: string): boolean {
    // Check for balanced parentheses
    let parenCount = 0;
    for (let i = 0; i < equation.length; i++) {
      if (equation[i] === '(') parenCount++;
      if (equation[i] === ')') parenCount--;
      if (parenCount < 0) {
        this.validationErrors.push({
          type: 'syntax',
          message: 'Unbalanced parentheses',
          position: i
        });
        return false;
      }
    }
    
    if (parenCount !== 0) {
      this.validationErrors.push({
        type: 'syntax',
        message: 'Unbalanced parentheses'
      });
      return false;
    }
    
    // Check for valid characters
    const validChars = /^[a-zA-Z0-9+\-*/^_()\\\s=<>.,]+$/;
    if (!validChars.test(equation)) {
      this.validationErrors.push({
        type: 'syntax',
        message: 'Contains invalid characters'
      });
      return false;
    }
    
    return true;
  }

  private validateFormat(equation: string): boolean {
    // Check if equation matches expected format
    if (this.expectedFormat && !equation.includes(this.expectedFormat)) {
      this.validationErrors.push({
        type: 'format',
        message: `Expected format: ${this.expectedFormat}`
      });
      return false;
    }
    return true;
  }

  private validateDomain(equation: string): boolean {
    // Check for division by zero patterns
    if (equation.includes('/0') || equation.includes('/ 0')) {
      this.validationErrors.push({
        type: 'domain',
        message: 'Potential division by zero'
      });
      return false;
    }
    
    return true;
  }

  private generateEquationDetails(equation: string): string {
    const variables = this.extractVariables(equation);
    const operators = this.extractOperators(equation);
    
    let details = `Equation contains ${variables.length} variable(s): ${variables.join(', ')}`;
    if (operators.length > 0) {
      details += ` and ${operators.length} operator(s): ${operators.join(', ')}`;
    }
    
    return details;
  }

  private extractVariables(equation: string): string[] {
    const matches = equation.match(/[a-zA-Z]/g);
    return matches ? [...new Set(matches)] : [];
  }

  private extractOperators(equation: string): string[] {
    const matches = equation.match(/[+\-*/^]/g);
    return matches ? [...new Set(matches)] : [];
  }

  getPreviewStatusLabel(): string {
    switch (this.previewStatus) {
      case 'idle': return 'Ready';
      case 'validating': return 'Validating...';
      case 'valid': return 'Valid';
      case 'invalid': return 'Invalid';
      default: return 'Unknown';
    }
  }

  trackByErrorType(index: number, error: ValidationError): string {
    return error.type;
  }

  protected initializeWidgetData(): void {
    this.setDataValue('validation_count', 0);
    this.setDataValue('is_valid', false);
  }

  protected validateInput(): boolean {
    return !!(this.title && this.inputLabel);
  }

  protected processCompletion(): void {
    this.setDataValue('completion_time', new Date());
    this.setDataValue('final_equation', this.equation);
    this.setDataValue('final_validation_count', this.validationCount);
    this.setDataValue('was_validated', this.isValid);
  }
}
