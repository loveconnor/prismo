import { Component, Input, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WidgetBaseComponent } from '../../base/widget-base';
import { ButtonComponent } from '../../../ui/button/button';
import { CardComponent } from '../../../ui/card/card';
import { CardContentComponent } from '../../../ui/card/card-content';
import { CardHeaderComponent } from '../../../ui/card/card-header';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucidePlay, lucideRotateCcw, lucideCheck, lucideX, lucideClock } from '@ng-icons/lucide';

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
      lucidePlay,
      lucideRotateCcw,
      lucideCheck,
      lucideX,
      lucideClock
    })
  ],
  template: `
    <app-card>
      <app-card-header>
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <h3 class="text-lg font-semibold text-foreground">{{ title }}</h3>
            <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
              {{ language }}
            </span>
          </div>
          <div class="flex gap-2">
            <app-button 
              variant="default"
              size="sm"
              (click)="runCode()"
              [disabled]="isRunning || !hasCode"
            >
              <ng-icon name="lucidePlay" class="w-4 h-4 mr-2"></ng-icon>
              <span *ngIf="!isRunning">Run</span>
              <span *ngIf="isRunning">Running...</span>
            </app-button>
            
            <app-button 
              variant="outline"
              size="sm"
              (click)="resetCode()"
              [disabled]="isRunning"
            >
              <ng-icon name="lucideRotateCcw" class="w-4 h-4 mr-2"></ng-icon>
              Reset
            </app-button>
          </div>
        </div>
      </app-card-header>
      
      <app-card-content>
        <div class="space-y-4">
          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-sm font-medium text-foreground">Your Code:</span>
              <span class="text-xs text-muted-foreground">{{ lineCount }} lines</span>
            </div>
            
            <textarea
              #codeTextarea
              class="w-full min-h-[200px] p-3 border border-border rounded-lg bg-background text-foreground font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
              [(ngModel)]="code"
              [ngModelOptions]="{standalone: true}"
              (input)="onCodeChange()"
              [placeholder]="placeholder"
              [disabled]="isRunning"
              spellcheck="false"
            ></textarea>
          </div>
          
          <div class="space-y-2" *ngIf="showOutput">
            <div class="flex items-center justify-between">
              <span class="text-sm font-medium text-foreground">Output:</span>
              <span class="text-xs px-2 py-1 rounded-full" 
                    [class]="outputStatus === 'success' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                             outputStatus === 'error' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' :
                             'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'">
                {{ getStatusLabel() }}
              </span>
            </div>
            
            <div class="p-3 bg-muted rounded-lg min-h-[60px]">
              <pre class="text-sm text-foreground whitespace-pre-wrap" *ngIf="output">{{ output }}</pre>
              <div class="text-sm text-muted-foreground" *ngIf="!output">
                Click "Run" to see output
              </div>
            </div>
          </div>
        </div>
      </app-card-content>
      
      <div class="mt-4" *ngIf="testCases.length > 0 && hasRunCode">
        <div class="flex items-center justify-between mb-3">
          <h4 class="text-sm font-semibold text-foreground">Test Results</h4>
          <span class="text-xs text-muted-foreground">
            {{ passedTests }}/{{ testCases.length }} tests passed
          </span>
        </div>
        
        <div class="space-y-2">
          <div 
            *ngFor="let test of testCases; trackBy: trackByTestId" 
            class="p-3 border rounded-lg transition-colors"
            [class.bg-green-50]="test.passed === true"
            [class.border-green-200]="test.passed === true"
            [class.bg-red-50]="test.passed === false"
            [class.border-red-200]="test.passed === false"
            [class.bg-muted]="test.passed === undefined"
          >
            <div class="flex items-center gap-2">
              <ng-icon 
                *ngIf="test.passed === true" 
                name="lucideCheck" 
                class="w-4 h-4 text-green-600"
              ></ng-icon>
              <ng-icon 
                *ngIf="test.passed === false" 
                name="lucideX" 
                class="w-4 h-4 text-red-600"
              ></ng-icon>
              <ng-icon 
                *ngIf="test.passed === undefined" 
                name="lucideClock" 
                class="w-4 h-4 text-muted-foreground"
              ></ng-icon>
              <span class="text-sm font-medium text-foreground">{{ test.description || 'Test Case' }}</span>
            </div>
            
            <div class="mt-2 space-y-1" *ngIf="test.passed === false">
              <div class="text-xs text-muted-foreground">
                <strong>Expected:</strong> {{ test.expectedOutput }}
              </div>
              <div class="text-xs text-muted-foreground">
                <strong>Got:</strong> {{ test.actualOutput || 'No output' }}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="mt-4 pt-3 border-t" *ngIf="showFooter">
        <div class="flex items-center gap-4 text-xs text-muted-foreground">
          <span>Runs: {{ runsCount }}</span>
          <span>{{ code.length }} characters</span>
          <span *ngIf="lastExecutionTime">
            Last run: {{ lastExecutionTime }}ms
          </span>
        </div>
      </div>
    </app-card>
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
