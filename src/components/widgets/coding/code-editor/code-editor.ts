import { Component, Input, ViewChild, ElementRef, AfterViewInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WidgetBaseComponent } from '../../base/widget-base';
import { FontService } from '../../../../services/font.service';
import { ThemeService } from '../../../../services/theme.service';
import { ButtonComponent } from '../../../ui/button/button';
import { CardComponent } from '../../../ui/card/card';
import { CardContentComponent } from '../../../ui/card/card-content';
import { CardHeaderComponent } from '../../../ui/card/card-header';
import { SwitchComponent } from '../../../ui/switch/switch';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { 
  lucidePlay, 
  lucideRotateCcw, 
  lucideCheck, 
  lucideX, 
  lucideClock,
  lucideSettings
} from '@ng-icons/lucide';
import { EditorView, basicSetup } from 'codemirror';
import { javascript, javascriptLanguage } from '@codemirror/lang-javascript';
import { python, pythonLanguage } from '@codemirror/lang-python';
import { html, htmlLanguage } from '@codemirror/lang-html';
import { css, cssLanguage } from '@codemirror/lang-css';
import { oneDark } from '@codemirror/theme-one-dark';
import { autocompletion } from '@codemirror/autocomplete';
import { keymap } from '@codemirror/view';
import { searchKeymap } from '@codemirror/search';
import { lineNumbers } from '@codemirror/view';
import { bracketMatching } from '@codemirror/language';
import { foldGutter } from '@codemirror/language';
import { search } from '@codemirror/search';
import { history } from '@codemirror/commands';
import { highlightSelectionMatches } from '@codemirror/search';

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
    SwitchComponent,
    NgIconComponent
  ],
  providers: [
    provideIcons({
      lucidePlay,
      lucideRotateCcw,
      lucideCheck,
      lucideX,
      lucideClock,
      lucideSettings
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
             
             <app-button 
               variant="outline"
               size="sm"
               (click)="toggleSettings()"
             >
               <ng-icon name="lucideSettings" class="w-4 h-4 mr-2"></ng-icon>
               Settings
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
            
             <div 
               #editorContainer
               class="w-full h-[180px] overflow-hidden"
             ></div>
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
       
       <!-- Settings Panel -->
       <div *ngIf="isSettingsOpen && allowUserSettings" class="border-t bg-muted/50 p-4">
         <div class="space-y-4">
           <div class="flex items-center justify-between">
             <h4 class="text-sm font-semibold text-foreground">Editor Settings</h4>
             <app-button 
               variant="outline" 
               size="sm" 
               (click)="resetUserSettings()"
             >
               Reset to Defaults
             </app-button>
           </div>
           
           <div class="grid grid-cols-2 gap-4">
             <div class="flex items-center justify-between">
               <label class="text-sm text-foreground">Syntax Highlighting</label>
               <app-switch 
                 [(ngModel)]="userSettings.syntaxHighlighting"
                 (ngModelChange)="updateUserSetting('syntaxHighlighting', $event)"
                 [disabled]="!enableSyntaxHighlighting"
               ></app-switch>
             </div>
             
             <div class="flex items-center justify-between">
               <label class="text-sm text-foreground">Auto Completion</label>
               <app-switch 
                 [(ngModel)]="userSettings.autoCompletion"
                 (ngModelChange)="updateUserSetting('autoCompletion', $event)"
                 [disabled]="!enableAutoCompletion"
               ></app-switch>
             </div>
             
             <div class="flex items-center justify-between">
               <label class="text-sm text-foreground">Line Numbers</label>
               <app-switch 
                 [(ngModel)]="userSettings.lineNumbers"
                 (ngModelChange)="updateUserSetting('lineNumbers', $event)"
                 [disabled]="!enableLineNumbers"
               ></app-switch>
             </div>
             
             <div class="flex items-center justify-between">
               <label class="text-sm text-foreground">Word Wrap</label>
               <app-switch 
                 [(ngModel)]="userSettings.wordWrap"
                 (ngModelChange)="updateUserSetting('wordWrap', $event)"
               ></app-switch>
             </div>
           </div>
         </div>
       </div>
       
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
          <span *ngIf="showRunsCount">Runs: {{ runsCount }}</span>
          <span *ngIf="showCharacterCount">{{ code.length }} characters</span>
          <span *ngIf="lastExecutionTime">
            Last run: {{ lastExecutionTime }}ms
          </span>
        </div>
      </div>
    </app-card>
  `,
})
export class CodeEditorComponent extends WidgetBaseComponent implements AfterViewInit, OnDestroy {
  @Input() title: string = 'Code Editor';
  @Input() language: string = 'javascript';
  @Input() placeholder: string = 'Enter your code here...';
  @Input() starterCode: string = '';
  @Input() testCases: TestCase[] = [];
  @Input() showOutput: boolean = true;
  @Input() showFooter: boolean = true;
  @Input() autoRun: boolean = false;
  @Input() override width: string = '100%';
  @Input() override height: string = '400px';
  @Input() override minHeight: string = '300px';
  
  // Editor Settings
  @Input() enableSyntaxHighlighting: boolean = true;
  @Input() enableAutoCompletion: boolean = true;
  @Input() enableLineNumbers: boolean = true;
  @Input() enableBracketMatching: boolean = true;
  @Input() enableCodeFolding: boolean = true;
  @Input() enableSearch: boolean = true;
  @Input() enableIndentation: boolean = true;
  @Input() enableWordWrap: boolean = false;
  @Input() enableMinimap: boolean = false;
  @Input() allowUserSettings: boolean = false;
  @Input() showSettingsPanel: boolean = false;
  @Input() showCharacterCount: boolean = false;
  @Input() showRunsCount: boolean = false;
  
  @ViewChild('editorContainer') editorContainer!: ElementRef<HTMLDivElement>;

  public code: string = '';
  public output: string = '';
  public outputStatus: 'idle' | 'running' | 'success' | 'error' = 'idle';
  public isRunning = false;
  public runsCount = 0;
  public lastExecutionTime?: number;
  public hasRunCode = false;
  
  // User Settings State
  public userSettings = {
    syntaxHighlighting: true,
    autoCompletion: true,
    lineNumbers: true,
    wordWrap: false,
    minimap: false
  };
  
  public isSettingsOpen = false;
  
  private editorView?: EditorView;

  constructor(
    protected override fontService: FontService,
    themeService: ThemeService,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    super(themeService, fontService, platformId);
  }

  get hasCode(): boolean {
    return this.code.trim().length > 0;
  }

  get lineCount(): number {
    return this.code.split('\n').length;
  }

  get passedTests(): number {
    return this.testCases.filter(t => t.passed === true).length;
  }

  get totalTests(): number {
    return this.testCases.length;
  }

  get allTestsPass(): boolean {
    return this.totalTests > 0 && this.passedTests === this.totalTests;
  }

  override ngAfterViewInit(): void {
    this.loadUserSettings();
    // Add a small delay to ensure the container is ready
    setTimeout(() => {
      this.initializeEditor();
    }, 100);
  }

  override ngOnDestroy(): void {
    this.editorView?.destroy();
  }

  private initializeEditor(): void {
    if (!this.editorContainer) {
      console.error('Editor container not found');
      return;
    }
    

    // Get language support (only if syntax highlighting is enabled)
    const languageSupport = this.enableSyntaxHighlighting && this.userSettings.syntaxHighlighting 
      ? [this.getLanguageSupport()] 
      : [];

    // Check if dark mode is enabled
    const isDarkMode = document.documentElement.classList.contains('dark') || 
                      window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    // Build extensions array based on settings
    const extensions = [
      // Core functionality (always enabled)
      history(),
      highlightSelectionMatches(),
      
      // Language support (conditional)
      ...languageSupport,
      
      // Line numbers (conditional)
      ...(this.enableLineNumbers && this.userSettings.lineNumbers ? [lineNumbers()] : []),
      
      // Bracket matching (always enabled)
      bracketMatching(),
      
      // Code folding (always enabled)
      foldGutter(),
      
      // Auto-completion (conditional)
      ...(this.enableAutoCompletion && this.userSettings.autoCompletion ? [autocompletion()] : []),
      
      // Search functionality (always enabled)
      search(),
      keymap.of(searchKeymap),
      
      // Word wrap (conditional)
      ...(this.userSettings.wordWrap ? [EditorView.lineWrapping] : []),
      
      // Update listener (always needed)
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          this.code = update.state.doc.toString();
          this.onCodeChange();
        }
      }),
      
      // Theme (conditional)
      ...(isDarkMode ? [oneDark] : []),
      
      // Custom theme with settings
      EditorView.theme({
        "&": {
          fontSize: this.fontService.getFontSizeCSS(),
          height: "100%"
        },
        ".cm-content": {
          padding: "8px",
          minHeight: "100px"
        },
        ".cm-editor": {
          height: "100%"
        },
        ".cm-scroller": {
          fontFamily: this.fontService.getFontFamilyCSS()
        },
        // Hide line numbers if disabled
        ...(this.enableLineNumbers && this.userSettings.lineNumbers ? {} : {
          ".cm-lineNumbers": { display: "none !important" }
        })
      })
    ];
    
    
    // Create editor with conditional extensions
    this.editorView = new EditorView({
      doc: this.starterCode || this.code,
      extensions,
      parent: this.editorContainer.nativeElement
    });

    this.code = this.starterCode || this.code;
  }

  private getLanguageSupport() {
    // Use full language support if autocomplete is enabled, otherwise use parsers only
    const useFullSupport = this.enableAutoCompletion && this.userSettings.autoCompletion;
    
    switch (this.language.toLowerCase()) {
      case 'javascript':
      case 'js':
        return useFullSupport ? javascript() : javascriptLanguage;
      case 'python':
      case 'py':
        return useFullSupport ? python() : pythonLanguage;
      case 'html':
        return useFullSupport ? html() : htmlLanguage;
      case 'css':
        return useFullSupport ? css() : cssLanguage;
      default:
        return useFullSupport ? javascript() : javascriptLanguage;
    }
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

    // Execute code immediately
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
    if (this.testCases.length > 0 && this.allTestsPass) {
      this.completeWidget();
    }
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
        // Capture console.log for JavaScript
        this.captureConsoleLog();
        
        // Basic JavaScript execution simulation
        const result = eval(this.code);
        
        // If there's no console output but there's a result, show it
        if (!this.output && result !== undefined) {
          this.output = String(result);
        } else if (!this.output) {
          this.output = 'No output';
        }
      } catch (error) {
        throw new Error(`JavaScript Error: ${error}`);
      } finally {
        // Restore original console.log
        this.restoreConsoleLog();
      }
    } else {
      // Generic execution
      this.output = `Code executed successfully!\nOutput: ${this.code}`;
    }

    // Run test cases
    this.runTestCases();
  }

  private captureConsoleLog(): void {
    // Store original console.log
    (window as any).__originalConsoleLog = console.log;
    
    // Override console.log to capture output
    console.log = (...args: any[]) => {
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ');
      
      if (this.output) {
        this.output += '\n' + message;
      } else {
        this.output = message;
      }
      
      // Also call original console.log to maintain normal behavior
      (window as any).__originalConsoleLog.apply(console, args);
    };
  }

  private restoreConsoleLog(): void {
    // Restore original console.log
    if ((window as any).__originalConsoleLog) {
      console.log = (window as any).__originalConsoleLog;
      delete (window as any).__originalConsoleLog;
    }
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
    this.setDataValue('all_tests_passed', this.allTestsPass);
  }

  toggleSettings(): void {
    this.isSettingsOpen = !this.isSettingsOpen;
  }

  updateUserSetting(setting: keyof typeof this.userSettings, value: boolean): void {
    this.userSettings[setting] = value;
    this.saveUserSettings();
    this.reinitializeEditor();
  }

  private saveUserSettings(): void {
    // Save to localStorage or user preferences
    localStorage.setItem('codeEditorSettings', JSON.stringify(this.userSettings));
    this.setDataValue('user_settings', this.userSettings);
  }

  private loadUserSettings(): void {
    // Load from localStorage or user preferences
    const saved = localStorage.getItem('codeEditorSettings');
    if (saved) {
      this.userSettings = { ...this.userSettings, ...JSON.parse(saved) };
    }
  }

  resetUserSettings(): void {
    this.userSettings = {
      syntaxHighlighting: true,
      autoCompletion: true,
      lineNumbers: true,
      wordWrap: false,
      minimap: false
    };
    this.saveUserSettings();
    this.reinitializeEditor();
  }

  private reinitializeEditor(): void {
    if (this.editorView) {
      this.editorView.destroy();
    }
    this.initializeEditor();
  }
}
