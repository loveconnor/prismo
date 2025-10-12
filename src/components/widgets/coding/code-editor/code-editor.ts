import { Component, Input, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WidgetBaseComponent } from '../../base/widget-base';
import { ButtonComponent } from '../../../ui/button/button';

interface TestCase {
  id: string;
  input: string;
  expectedOutput: string;
  description?: string;
  passed?: boolean;
  actualOutput?: string;
}

@Component({
  selector: 'app-code-editor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="code-editor">
      <div class="editor-header">
        <div class="editor-title">
          <h3>{{ title }}</h3>
          <span class="language-badge">{{ language }}</span>
        </div>
        <div class="editor-actions">
          <button 
            class="run-button"
            (click)="runCode()"
            [disabled]="isRunning || !hasCode"
          >
            <span *ngIf="!isRunning">▶️ Run</span>
            <span *ngIf="isRunning">⏳ Running...</span>
          </button>
          
          <button 
            class="reset-button"
            (click)="resetCode()"
            [disabled]="isRunning"
          >
            🔄 Reset
          </button>
        </div>
      </div>
      
      <div class="editor-content">
        <div class="code-section">
          <div class="code-header">
            <span class="code-label">Your Code:</span>
            <span class="line-count">{{ lineCount }} lines</span>
          </div>
          
            <textarea
              #codeTextarea
              class="code-textarea"
              [(ngModel)]="code"
              [ngModelOptions]="{standalone: true}"
              (input)="onCodeChange()"
              [placeholder]="placeholder"
              [disabled]="isRunning"
              spellcheck="false"
            ></textarea>
        </div>
        
        <div class="output-section" *ngIf="showOutput">
          <div class="output-header">
            <span class="output-label">Output:</span>
            <span class="output-status" [class]="'status-' + outputStatus">
              {{ getStatusLabel() }}
            </span>
          </div>
          
          <div class="output-content">
            <pre class="output-text" *ngIf="output">{{ output }}</pre>
            <div class="output-empty" *ngIf="!output">
              Click "Run" to see output
            </div>
          </div>
        </div>
      </div>
      
      <div class="test-results" *ngIf="testCases.length > 0 && hasRunCode">
        <div class="test-header">
          <h4>Test Results</h4>
          <span class="test-summary">
            {{ passedTests }}/{{ testCases.length }} tests passed
          </span>
        </div>
        
        <div class="test-list">
          <div 
            *ngFor="let test of testCases; trackBy: trackByTestId" 
            class="test-item"
            [class.passed]="test.passed"
            [class.failed]="test.passed === false"
          >
            <div class="test-info">
              <span class="test-icon">
                <span *ngIf="test.passed === true">✅</span>
                <span *ngIf="test.passed === false">❌</span>
                <span *ngIf="test.passed === undefined">⏳</span>
              </span>
              <span class="test-description">{{ test.description || 'Test Case' }}</span>
            </div>
            
            <div class="test-details" *ngIf="test.passed === false">
              <div class="test-expected">
                <strong>Expected:</strong> {{ test.expectedOutput }}
              </div>
              <div class="test-actual">
                <strong>Got:</strong> {{ test.actualOutput || 'No output' }}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="editor-footer" *ngIf="showFooter">
        <div class="editor-stats">
          <span class="runs-count">Runs: {{ runsCount }}</span>
          <span class="code-length">{{ code.length }} characters</span>
          <span class="execution-time" *ngIf="lastExecutionTime">
            Last run: {{ lastExecutionTime }}ms
          </span>
        </div>
      </div>
    </div>
  `,
})
export class CodeEditorComponent extends WidgetBaseComponent {
  @Input() title: string = 'Code Editor';
  @Input() language: string = 'javascript';
  @Input() placeholder: string = 'Enter your code here...';
  @Input() starterCode: string = '';
  @Input() testCases: TestCase[] = [];
  @Input() showOutput: boolean = true;
  @Input() showFooter: boolean = true;
  @Input() autoRun: boolean = false;

  @ViewChild('codeTextarea') codeTextarea!: ElementRef<HTMLTextAreaElement>;

  public code: string = '';
  public output: string = '';
  public outputStatus: 'idle' | 'running' | 'success' | 'error' = 'idle';
  public isRunning = false;
  public runsCount = 0;
  public lastExecutionTime?: number;
  public hasRunCode = false;

  get hasCode(): boolean {
    return this.code.trim().length > 0;
  }

  get lineCount(): number {
    return this.code.split('\n').length;
  }

  get passedTests(): number {
    return this.testCases.filter(t => t.passed === true).length;
  }

  trackByTestId(index: number, test: TestCase): string {
    return test.id;
  }

  onCodeChange(): void {
    this.setDataValue('code', this.code);
    this.setDataValue('code_length', this.code.length);
    this.setDataValue('line_count', this.lineCount);
    this.setDataValue('last_modified', new Date());
  }

  runCode(): void {
    if (!this.hasCode || this.isRunning) return;

    this.isRunning = true;
    this.outputStatus = 'running';
    this.runsCount++;
    this.hasRunCode = true;

    const startTime = Date.now();
    this.setDataValue('runs_count', this.runsCount);
    this.setDataValue('last_run_at', new Date());

    // Simulate code execution
    setTimeout(() => {
      try {
        // Simple code execution simulation
        this.executeCode();
        this.outputStatus = 'success';
        this.lastExecutionTime = Date.now() - startTime;
        this.setDataValue('last_execution_time', this.lastExecutionTime);
        this.setDataValue('execution_success', true);
      } catch (error) {
        this.output = `Error: ${error}`;
        this.outputStatus = 'error';
        this.setDataValue('execution_error', error);
      }
      
      this.isRunning = false;
      
      // Check if all tests pass
      if (this.testCases.length > 0 && this.allTestsPass()) {
        this.completeWidget();
      }
    }, 1000);
  }

  resetCode(): void {
    this.code = this.starterCode;
    this.output = '';
    this.outputStatus = 'idle';
    this.isRunning = false;
    this.hasRunCode = false;
    this.runsCount = 0;
    this.lastExecutionTime = undefined;
    
    // Reset test results
    this.testCases.forEach(test => {
      test.passed = undefined;
      test.actualOutput = undefined;
    });
    
    this.setDataValue('code', this.code);
    this.setDataValue('runs_count', 0);
    this.setDataValue('last_modified', new Date());
  }

  private executeCode(): void {
    // Simple code execution simulation
    if (this.language === 'javascript') {
      try {
        // Basic JavaScript execution simulation
        const result = eval(this.code);
        this.output = result !== undefined ? String(result) : 'No output';
      } catch (error) {
        throw new Error(`JavaScript Error: ${error}`);
      }
    } else {
      // Generic execution
      this.output = `Code executed successfully!\nOutput: ${this.code}`;
    }

    // Run test cases
    this.runTestCases();
  }

  private runTestCases(): void {
    this.testCases.forEach(test => {
      try {
        // Simple test execution simulation
        const result = this.simulateTestExecution(test);
        test.actualOutput = result;
        test.passed = result === test.expectedOutput;
      } catch (error) {
        test.actualOutput = `Error: ${error}`;
        test.passed = false;
      }
    });
  }

  private simulateTestExecution(test: TestCase): string {
    // Simple test simulation - in real implementation, this would execute the code
    return `Test output for input: ${test.input}`;
  }

  private allTestsPass(): boolean {
    return this.testCases.length > 0 && this.testCases.every(test => test.passed === true);
  }

  getStatusLabel(): string {
    switch (this.outputStatus) {
      case 'idle': return 'Ready';
      case 'running': return 'Running...';
      case 'success': return 'Success';
      case 'error': return 'Error';
      default: return 'Unknown';
    }
  }

  protected initializeWidgetData(): void {
    this.code = this.starterCode || this.getConfigValue('starterCode', '');
    this.setDataValue('language', this.language);
    this.setDataValue('code', this.code);
    this.setDataValue('runs_count', 0);
  }

  protected validateInput(): boolean {
    return !!(this.language && this.language.trim().length > 0);
  }

  protected processCompletion(): void {
    this.setDataValue('completion_time', new Date());
    this.setDataValue('final_code', this.code);
    this.setDataValue('total_runs', this.runsCount);
    this.setDataValue('tests_passed', this.passedTests);
    this.setDataValue('all_tests_passed', this.allTestsPass());
  }
}
