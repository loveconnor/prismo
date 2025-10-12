import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WidgetBaseComponent } from '../../base/widget-base';
import { ButtonComponent } from '../../../ui/button/button';

interface ValidationError {
  type: 'syntax' | 'format' | 'domain' | 'other';
  message: string;
  position?: number;
}

@Component({
  selector: 'app-equation-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="equation-input">
      <div class="equation-header">
        <h3 class="equation-title">{{ title }}</h3>
        <div class="equation-meta" *ngIf="showMeta">
          <span class="format-hint">{{ formatHint }}</span>
        </div>
      </div>
      
      <div class="equation-content">
        <div class="input-section">
          <label class="input-label" for="equation-input">
            {{ inputLabel }}
          </label>
          
          <div class="input-container">
            <input
              id="equation-input"
              type="text"
              class="equation-input-field"
              [(ngModel)]="equation"
              [ngModelOptions]="{standalone: true}"
              (input)="onEquationChange()"
              [placeholder]="placeholder"
              [class.error]="hasValidationError"
              [disabled]="isValidating"
            />
            
            <div class="input-actions">
              <button 
                class="validate-button"
                (click)="validateEquation()"
                [disabled]="!equation.trim() || isValidating"
              >
                <span *ngIf="!isValidating">✓ Validate</span>
                <span *ngIf="isValidating">⏳ Validating...</span>
              </button>
              
              <button 
                class="clear-button"
                (click)="clearEquation()"
                [disabled]="!equation.trim()"
              >
                🗑️ Clear
              </button>
            </div>
          </div>
        </div>
        
        <div class="preview-section" *ngIf="showPreview && equation">
          <div class="preview-header">
            <span class="preview-label">Preview:</span>
            <span class="preview-status" [class]="'status-' + previewStatus">
              {{ getPreviewStatusLabel() }}
            </span>
          </div>
          
          <div class="preview-content">
            <div class="equation-preview" [innerHTML]="formattedPreview"></div>
          </div>
        </div>
        
        <div class="validation-section" *ngIf="validationErrors.length > 0">
          <div class="validation-header">
            <span class="validation-label">Validation Errors:</span>
          </div>
          
          <div class="validation-errors">
            <div 
              *ngFor="let error of validationErrors; trackBy: trackByErrorType" 
              class="validation-error"
              [class]="'error-' + error.type"
            >
              <div class="error-icon">
                <span *ngIf="error.type === 'syntax'">⚠️</span>
                <span *ngIf="error.type === 'format'">📝</span>
                <span *ngIf="error.type === 'domain'">🔢</span>
                <span *ngIf="error.type === 'other'">❌</span>
              </div>
              <div class="error-content">
                <div class="error-message">{{ error.message }}</div>
                <div class="error-position" *ngIf="error.position !== undefined">
                  Position: {{ error.position }}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="success-section" *ngIf="isValid && !hasValidationError">
          <div class="success-content">
            <div class="success-icon">✅</div>
            <div class="success-message">
              <div class="success-title">Valid Equation!</div>
              <div class="success-details" *ngIf="equationDetails">
                {{ equationDetails }}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="equation-footer" *ngIf="showFooter">
        <div class="equation-stats">
          <span class="equation-length">{{ equation.length }} characters</span>
          <span class="validation-count" *ngIf="validationCount > 0">
            Validations: {{ validationCount }}
          </span>
          <span class="last-validated" *ngIf="lastValidatedAt">
            Last validated: {{ lastValidatedAt | date:'short' }}
          </span>
        </div>
      </div>
    </div>
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
    
    // Simple LaTeX to HTML conversion for preview
    return this.equation
      .replace(/\^(\d+)/g, '<sup>$1</sup>')
      .replace(/\^(\w+)/g, '<sup>$1</sup>')
      .replace(/_(\d+)/g, '<sub>$1</sub>')
      .replace(/_(\w+)/g, '<sub>$1</sub>')
      .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '<span class="fraction"><span class="numerator">$1</span><span class="denominator">$2</span></span>')
      .replace(/\*/g, '×')
      .replace(/\//g, '÷');
  }

  onEquationChange(): void {
    this.setDataValue('equation', this.equation);
    this.setDataValue('equation_length', this.equation.length);
    this.setDataValue('last_modified', new Date());
    
    if (this.autoValidate && this.equation.trim()) {
      this.validateEquation();
    }
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

    // Simulate validation delay
    setTimeout(() => {
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
    }, 1000);
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
