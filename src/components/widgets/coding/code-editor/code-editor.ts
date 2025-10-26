import { Component, Input, ViewChild, ElementRef, AfterViewInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { WidgetBaseComponent } from '../../base/widget-base';
import { FontService } from '../../../../services/font.service';
import { ThemeService } from '../../../../services/theme.service';
import { ButtonComponent } from '../../../ui/button/button';
import { CardComponent } from '../../../ui/card/card';
import { CardContentComponent } from '../../../ui/card/card-content';
import { CardHeaderComponent } from '../../../ui/card/card-header';
import { SwitchComponent } from '../../../ui/switch/switch';
import { CodeReviewCommentComponent } from '../code-review-comment/code-review-comment';
import { CodeRefactorModalComponent } from '../code-refactor-modal/code-refactor-modal';
import { PanelComponent } from '../../../ui/panel/panel';
import { PanelHeaderComponent } from '../../../ui/panel/panel-header';
import { PanelGroupComponent, ResizablePanelComponent, PanelResizeHandleComponent } from '../../../ui/resizable-panels';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { 
  lucidePlay, 
  lucideRotateCcw, 
  lucideCheck, 
  lucideX, 
  lucideClock,
  lucideSettings,
  lucideSparkles,
  lucideInfo
} from '@ng-icons/lucide';
import { environment } from '../../../../environments/environment';
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
import { indentWithTab } from '@codemirror/commands';

interface TestCase {
  id: string;
  input: string;
  expectedOutput: string;
  description?: string;
  passed?: boolean;
  actualOutput?: string;
}

interface CodeReviewComment {
  lineNumber?: number;
  type: 'info' | 'warning' | 'error' | 'success' | 'suggestion';
  title?: string;
  message: string;
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
    CodeReviewCommentComponent,
    CodeRefactorModalComponent,
    PanelComponent,
    PanelHeaderComponent,
    PanelGroupComponent,
    ResizablePanelComponent,
    PanelResizeHandleComponent,
    NgIconComponent
  ],
  providers: [
    provideIcons({
      lucidePlay,
      lucideRotateCcw,
      lucideCheck,
      lucideX,
      lucideClock,
      lucideSettings,
      lucideSparkles,
      lucideInfo
    })
  ],
  template: `
    <app-card>
      <app-card-header>
        <div class="space-y-3">
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
                (click)="getAIReview()"
                [disabled]="isGettingReview || !hasCode"
              >
                <ng-icon name="lucideSparkles" class="w-4 h-4 mr-2"></ng-icon>
                <span *ngIf="!isGettingReview">AI Review</span>
                <span *ngIf="isGettingReview">Reviewing...</span>
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
          
          <!-- Settings Panel (inside header) -->
          <div *ngIf="isSettingsOpen && allowUserSettings" class="pt-3 border-t">
            <div class="space-y-3">
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
        </div>
      </app-card-header>
      
      <app-card-content>
        <!-- Resizable Layout: Horizontal split (Editor | Feedback) -->
        <div class="code-editor-layout" [style.height]="totalLayoutHeight">
          <app-panel-group 
            direction="horizontal" 
            [storageKey]="'codeEditorMainLayout'"
            [onLayout]="handleMainLayoutChange.bind(this)"
          >
            <!-- Left Panel: Code Editor -->
            <app-resizable-panel [defaultSize]="50" [minSize]="20" [maxSize]="80" className="min-w-0">
              <app-panel class="h-full flex flex-col">
                <app-panel-header>
                  <span>Code Editor</span>
                  <span class="text-xs text-muted-foreground normal-case font-normal">{{ lineCount }} lines</span>
                </app-panel-header>
                
                <div class="flex-1 overflow-hidden p-3">
                  <div 
                    #editorContainer
                    class="w-full h-full overflow-hidden rounded border border-border/50"
                    (click)="focusEditor()"
                    tabindex="-1"
                    data-code-editor="true"
                  ></div>
                </div>
              </app-panel>
            </app-resizable-panel>
            
            <!-- Resize Handle (Vertical bar between Editor and Feedback) -->
            <app-panel-resize-handle></app-panel-resize-handle>
            
            <!-- Right Panel: Feedback & Results with nested vertical split -->
            <app-resizable-panel [defaultSize]="50" [minSize]="20" [maxSize]="80" className="min-w-0">
              <!-- Nested Vertical Panel Group for Step/Output (top) and Tests (bottom) -->
              <app-panel-group 
                direction="vertical"
                [storageKey]="'codeEditorFeedbackLayout'"
                [onLayout]="handleFeedbackLayoutChange.bind(this)"
              >
                <!-- Top: Step Panel / Output & AI Review -->
                <app-resizable-panel [defaultSize]="50" [minSize]="20" [maxSize]="80" className="min-h-0">
                  <app-panel class="h-full flex flex-col">
                    <app-panel-header>
                      <span>Output & AI Review</span>
                    </app-panel-header>
                    
                    <div class="flex-1 overflow-y-auto p-3 space-y-4 bg-background/50">
                        <!-- AI Review Comments -->
                        <div *ngIf="reviewComments.length > 0" class="space-y-3">
                          <div class="flex items-center gap-2 text-sm font-medium text-foreground">
                            <ng-icon name="lucideSparkles" class="w-4 h-4 text-sky-500"></ng-icon>
                            <span>AI Code Review</span>
                          </div>
                          <div *ngFor="let comment of reviewComments" class="animate-in fade-in slide-in-from-top-2 duration-300">
                            <app-code-review-comment
                              [lineNumber]="comment.lineNumber"
                              [commentType]="comment.type"
                              [title]="comment.title"
                              [message]="comment.message"
                              [author]="'AI Assistant'"
                              [showLineHighlight]="false"
                            ></app-code-review-comment>
                          </div>
                          <div *ngIf="overallReviewFeedback" class="p-4 rounded-lg border border-border/60 bg-muted/50">
                            <div class="flex items-start gap-3">
                              <ng-icon name="lucideInfo" class="w-5 h-5 text-sky-500 flex-shrink-0 mt-0.5"></ng-icon>
                              <div>
                                <div class="text-sm font-medium text-foreground mb-1">Overall Assessment</div>
                                <div class="text-sm text-muted-foreground">{{ overallReviewFeedback }}</div>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <!-- Output Section -->
                        <div class="space-y-2" *ngIf="showOutput">
                          <div class="flex items-center justify-between">
                            <span class="text-sm font-medium text-foreground">Console Output:</span>
                            <span class="text-xs px-2 py-1 rounded-full" 
                                  [class]="outputStatus === 'success' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                                           outputStatus === 'error' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' :
                                           'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'">
                              {{ getStatusLabel() }}
                            </span>
                          </div>
                          
                          <div class="p-3 bg-muted rounded-lg min-h-[60px] font-mono text-xs">
                            <pre class="text-foreground whitespace-pre-wrap" *ngIf="output">{{ output }}</pre>
                            <div class="text-sm text-muted-foreground" *ngIf="!output">
                              Click "Run" to see output
                            </div>
                          </div>
                        </div>
                        
                        <!-- Empty state if no output or reviews -->
                        <div *ngIf="!showOutput && reviewComments.length === 0" class="flex items-center justify-center h-full text-muted-foreground text-sm">
                          <div class="text-center space-y-2">
                            <ng-icon name="lucideInfo" class="w-8 h-8 mx-auto opacity-50"></ng-icon>
                            <p>Run your code or request an AI review to see feedback here</p>
                          </div>
                        </div>
                      </div>
                    </app-panel>
                  </app-resizable-panel>
                    
                    <!-- Resize Handle (Horizontal bar between Output and Tests) -->
                    <app-panel-resize-handle></app-panel-resize-handle>
                    
                    <!-- Bottom: Test Results Panel -->
                    <app-resizable-panel [defaultSize]="50" [minSize]="20" [maxSize]="80" className="min-h-0">
                      <app-panel class="h-full flex flex-col">
                        <app-panel-header>
                          <span>Test Results</span>
                          <span class="text-xs text-muted-foreground normal-case font-normal" *ngIf="testCases.length > 0 && hasRunCode">
                            {{ passedTests }}/{{ testCases.length }} passed
                          </span>
                        </app-panel-header>
                        
                        <div class="flex-1 overflow-y-auto p-3 bg-background/30">
                          <div *ngIf="testCases.length > 0 && hasRunCode" class="space-y-2">
                            <div 
                              *ngFor="let test of testCases; trackBy: trackByTestId" 
                              class="p-3 border rounded-lg transition-colors"
                              [class.bg-green-50]="test.passed === true"
                              [class.border-green-200]="test.passed === true"
                              [class.dark:bg-green-900/10]="test.passed === true"
                              [class.dark:border-green-800/50]="test.passed === true"
                              [class.bg-red-50]="test.passed === false"
                              [class.border-red-200]="test.passed === false"
                              [class.dark:bg-red-900/10]="test.passed === false"
                              [class.dark:border-red-800/50]="test.passed === false"
                              [class.bg-muted]="test.passed === undefined"
                            >
                              <div class="flex items-center gap-2">
                                <ng-icon 
                                  *ngIf="test.passed === true" 
                                  name="lucideCheck" 
                                  class="w-4 h-4 text-green-600 dark:text-green-400"
                                ></ng-icon>
                                <ng-icon 
                                  *ngIf="test.passed === false" 
                                  name="lucideX" 
                                  class="w-4 h-4 text-red-600 dark:text-red-400"
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
                          
                          <!-- Empty state for tests -->
                          <div *ngIf="testCases.length === 0 || !hasRunCode" class="flex items-center justify-center h-full text-muted-foreground text-sm">
                            <div class="text-center space-y-2">
                              <ng-icon name="lucideClock" class="w-8 h-8 mx-auto opacity-50"></ng-icon>
                              <p *ngIf="testCases.length === 0">No test cases available</p>
                              <p *ngIf="testCases.length > 0 && !hasRunCode">Run your code to see test results</p>
                            </div>
                          </div>
                        </div>
                      </app-panel>
                    </app-resizable-panel>
                  </app-panel-group>
                </app-resizable-panel>
          </app-panel-group>
        </div>
       </app-card-content>
      
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

    <!-- Code Refactor Modal -->
    <app-code-refactor-modal
      [isOpen]="showRefactorModal"
      [language]="language"
      [originalCode]="code"
      [refactoredCode]="refactoredCode"
      [feedback]="gradingFeedback"
      [suggestions]="gradingSuggestions"
      (closeModal)="closeRefactorModal()"
      (acceptRefactor)="acceptRefactoredCode($event)"
      (keepOriginalCode)="keepOriginalCode()"
      (modifyOriginalCode)="modifyOriginalCode()"
    ></app-code-refactor-modal>
  `,
  styles: [`
    .code-editor-layout {
      width: 100%;
      min-height: 600px;
      height: 800px;
      max-height: 90vh;
    }
  `]
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
  
  // Grading Configuration
  @Input() enableGrading: boolean = false;
  @Input() gradingRequirements: string = '';
  @Input() expectedOutput: string = '';
  @Input() gradingContext: string = '';
  
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
  // legacy simple output only for showcase; no structured console here
  public outputStatus: 'idle' | 'running' | 'success' | 'error' = 'idle';
  public isRunning = false;
  public runsCount = 0;
  public lastExecutionTime?: number;
  public hasRunCode = false;
  
  // AI Review state
  public isGettingReview = false;
  public reviewComments: CodeReviewComment[] = [];
  public overallReviewFeedback: string = '';
  
  // Grading state
  public showRefactorModal = false;
  public refactoredCode = '';
  public gradingFeedback = '';
  public gradingSuggestions: any[] = [];
  public isGrading = false;
  
  // User Settings State
  public userSettings = {
    syntaxHighlighting: true,
    autoCompletion: true,
    lineNumbers: true,
    wordWrap: false,
    minimap: false
  };
  
  public isSettingsOpen = false;
  
  // Resizable panel state
  public editorPanelHeight: number = 400;
  public feedbackPanelHeight: number = 400;
  public outputPanelHeight: number = 200;
  public testResultsPanelHeight: number = 200;
  public totalLayoutHeight: string = '800px';
  
  private editorView?: EditorView;
  private eventListenerCleanup: (() => void)[] = [];

  constructor(
    protected override fontService: FontService,
    themeService: ThemeService,
    private http: HttpClient,
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
      
      // Add direct event listeners to prevent event bubbling
      if (this.editorContainer && typeof document !== 'undefined') {
        const container = this.editorContainer.nativeElement;
        
        const keydownHandler = (e: KeyboardEvent) => {
          // For Tab key, we need special handling
          if (e.key === 'Tab') {
            // Prevent default browser tab navigation
            e.preventDefault();
            // Stop propagation to parent handlers
            e.stopPropagation();
            e.stopImmediatePropagation();
            
            // Manually insert tab or trigger indent if CodeMirror didn't handle it
            if (this.editorView) {
              const state = this.editorView.state;
              const from = state.selection.main.from;
              const to = state.selection.main.to;
              const indentText = '    '; // 4 spaces for indentation
              
              const transaction = state.update({
                changes: { from, to, insert: indentText },
                selection: { anchor: from + indentText.length }
              });
              this.editorView.dispatch(transaction);
            }
            return;
          }
          
          // For all other keys, stop propagation
          e.stopPropagation();
          e.stopImmediatePropagation();
        };
        
        const keypressHandler = (e: KeyboardEvent) => {
          e.stopPropagation();
          e.stopImmediatePropagation();
        };
        
        const keyupHandler = (e: KeyboardEvent) => {
          e.stopPropagation();
          e.stopImmediatePropagation();
        };
        
        // Add listeners in capture phase (before bubble phase)
        container.addEventListener('keydown', keydownHandler, { capture: true });
        container.addEventListener('keypress', keypressHandler, { capture: true });
        container.addEventListener('keyup', keyupHandler, { capture: true });
        
        // Store cleanup functions
        this.eventListenerCleanup.push(
          () => container.removeEventListener('keydown', keydownHandler, { capture: true }),
          () => container.removeEventListener('keypress', keypressHandler, { capture: true }),
          () => container.removeEventListener('keyup', keyupHandler, { capture: true })
        );
      }
    }, 100);
  }

  override ngOnDestroy(): void {
    this.editorView?.destroy();
    
    // Clean up event listeners
    this.eventListenerCleanup.forEach(cleanup => cleanup());
    this.eventListenerCleanup = [];
  }

  private initializeEditor(): void {
    if (!this.editorContainer) {
      console.error('Editor container not found');
      return;
    }
    
    // Only initialize in the browser
    if (typeof document === 'undefined' || typeof window === 'undefined') {
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
      
      // Enable Tab key for indentation
      keymap.of([indentWithTab]),
      
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
      
      // Search functionality (conditional - only if enabled)
      ...(this.enableSearch ? [search()] : []),
      
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
      extensions: [
        ...extensions,
        // Ensure editor is editable
        EditorView.editable.of(true)
      ],
      parent: this.editorContainer.nativeElement
    });

    this.code = this.starterCode || this.code;
    
    // Focus the editor to ensure it can receive input
    setTimeout(() => {
      if (this.editorView) {
        this.editorView.focus();
      }
    }, 200);
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
      case 'cpp':
      case 'c++':
        // C++ uses JavaScript syntax highlighting for now (similar C-style syntax)
        // TODO: Install @codemirror/lang-cpp package for proper C++ support
        return useFullSupport ? javascript() : javascriptLanguage;
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
    console.log('▶️ RUN CODE BUTTON PRESSED');
    console.log('📊 enableGrading:', this.enableGrading);
    console.log('📝 gradingRequirements:', this.gradingRequirements);
    
    // TEMPORARY: Alert to verify this method is called
    if (this.enableGrading) {
      alert('🎯 GRADING IS ENABLED! enableGrading=' + this.enableGrading + ', requirements=' + this.gradingRequirements);
    } else {
      alert('❌ GRADING IS DISABLED! enableGrading=' + this.enableGrading);
    }
    
    if (!this.hasCode || this.isRunning) {
      console.log('⚠️ Cannot run: hasCode =', this.hasCode, ', isRunning =', this.isRunning);
      return;
    }

    this.isRunning = true;
    this.outputStatus = 'running';
    this.runsCount++;
    this.hasRunCode = true;
    this.output = '';  // Clear previous output

    this.setDataValue('runs_count', this.runsCount);
    this.setDataValue('last_run_at', new Date());

    console.log('🔍 Language:', this.language);
    
    // Emit state change for interaction tracking
    this.emitStateChange('code_executed', {
      runsCount: this.runsCount,
      language: this.language,
      codeLength: this.code.length,
      hasTests: this.testCases.length > 0
    });

    // For JavaScript, Python, and C++, execute on backend
    const lang = this.language.toLowerCase();
    if (lang === 'javascript' || lang === 'js' || 
        lang === 'python' || lang === 'py' ||
        lang === 'cpp' || lang === 'c++') {
      console.log('🌐 Executing on backend for language:', lang);
      this.executeCodeOnBackend();
    } else {
      // For other languages, fall back to simulation
      const startTime = Date.now();
      try {
        this.executeCode();
        this.outputStatus = 'success';
        this.lastExecutionTime = Date.now() - startTime;
        this.setDataValue('last_execution_time', this.lastExecutionTime);
        this.setDataValue('execution_success', true);
        
        // Emit success state change
        this.emitStateChange('code_execution_success', {
          executionTime: this.lastExecutionTime,
          outputLength: this.output.length,
          testsPassed: this.testCases.filter(t => t.passed).length,
          totalTests: this.testCases.length
        });
      } catch (error) {
        this.output = `Error: ${error}`;
        this.outputStatus = 'error';
        this.setDataValue('execution_error', error);
        
        // Emit error state change
        this.emitStateChange('code_execution_error', {
          error: String(error),
          executionTime: Date.now() - startTime
        });
      }
      
      this.isRunning = false;
      
      // Check if all tests pass
      if (this.testCases.length > 0 && this.allTestsPass) {
        this.completeWidget();
      }
    }
  }

  private executeCodeOnBackend(): void {
    console.log('🔧 executeCodeOnBackend() called');
    console.log('🎯 Current enableGrading value:', this.enableGrading);
    
    const apiUrl = `${environment.apiUrl}/api/claude/execute-code`;
    
    console.log('📡 Sending request to:', apiUrl);
    
    this.http.post<any>(apiUrl, {
      code: this.code,
      language: this.language,
      testCases: this.testCases
    }).subscribe({
      next: (response) => {
        console.log('📥 Received response from execute-code:', response);
        this.isRunning = false;
        
        if (response.success) {
          this.output = response.output || 'No output';
          this.outputStatus = 'success';
          this.lastExecutionTime = response.executionTime;
          
          // Update test results
          if (response.testResults && response.testResults.length > 0) {
            response.testResults.forEach((result: any) => {
              const test = this.testCases.find(t => t.id === result.id);
              if (test) {
                test.passed = result.passed;
                test.actualOutput = result.actualOutput;
              }
            });
          }
          
          this.setDataValue('last_execution_time', this.lastExecutionTime);
          this.setDataValue('execution_success', true);
          
          console.log('🚀 Code executed successfully. Checking if grading is enabled:', this.enableGrading);
          
          // Call grading if enabled
          if (this.enableGrading) {
            console.log('✨ Grading is enabled - calling gradeCode()');
            this.gradeCode();
          } else {
            console.log('⏭️ Grading is disabled - checking test results');
            // Check if all tests pass (original behavior)
            if (this.testCases.length > 0 && this.allTestsPass) {
              this.completeWidget();
            }
          }
        } else {
          this.output = response.error || 'Execution failed';
          this.outputStatus = 'error';
          this.setDataValue('execution_error', response.error);
        }
      },
      error: (error) => {
        this.isRunning = false;
        this.outputStatus = 'error';
        this.output = `Error: ${error.message || 'Failed to execute code'}`;
        this.setDataValue('execution_error', error);
        console.error('Code execution failed:', error);
      }
    });
  }

  private gradeCode(): void {
    if (this.isGrading) return;

    console.log('🎯 GRADING CODE - enableGrading:', this.enableGrading);
    console.log('📝 Requirements:', this.gradingRequirements);
    console.log('💻 Code:', this.code);

    this.isGrading = true;
    const apiUrl = `${environment.apiUrl}/api/claude/grade-code`;

    this.http.post<any>(apiUrl, {
      code: this.code,
      language: this.language,
      requirements: this.gradingRequirements,
      expectedOutput: this.expectedOutput,
      context: this.gradingContext || this.title
    }).subscribe({
      next: (response) => {
        this.isGrading = false;
        
        console.log('✅ Grading response:', response);

        if (response.success) {
          if (response.passed) {
            // Code passed grading - complete the widget
            console.log('🎉 Code passed grading!');
            this.completeWidget();
            this.setDataValue('grading_passed', true);
            this.setDataValue('grading_feedback', response.feedback);
          } else {
            // Code failed grading - show refactor modal
            console.log('⚠️ Code failed grading - showing refactor modal');
            this.refactoredCode = response.refactoredCode || '';
            this.gradingFeedback = response.feedback || 'Your code needs improvement.';
            this.gradingSuggestions = response.suggestions || [];
            this.showRefactorModal = true;
            
            this.setDataValue('grading_passed', false);
            this.setDataValue('grading_feedback', response.feedback);
            this.setDataValue('grading_suggestions', response.suggestions);
          }
        } else {
          console.error('❌ Grading failed:', response.feedback);
          // Don't block the user - just log the error
          this.completeWidget();
        }
      },
      error: (error) => {
        this.isGrading = false;
        console.error('❌ Grading request failed:', error);
        // Don't block the user - just log the error
        this.completeWidget();
      }
    });
  }

  closeRefactorModal(): void {
    this.showRefactorModal = false;
  }

  acceptRefactoredCode(refactoredCode: string): void {
    this.code = refactoredCode;
    this.onCodeChange();
    this.showRefactorModal = false;
    
    // Re-run the code with the refactored version
    this.runCode();
  }

  keepOriginalCode(): void {
    this.showRefactorModal = false;
    // User chose to keep their original code - don't complete widget
  }

  modifyOriginalCode(): void {
    this.showRefactorModal = false;
    // User wants to modify their code - focus on the editor
    this.focusEditor();
  }

  resetCode(): void {
    this.code = this.starterCode;
    this.output = '';
    this.outputStatus = 'idle';
    this.isRunning = false;
    this.hasRunCode = false;
    this.runsCount = 0;
    this.lastExecutionTime = undefined;
    this.reviewComments = [];
    this.overallReviewFeedback = '';
    
    // Reset test results
    this.testCases.forEach(test => {
      test.passed = undefined;
      test.actualOutput = undefined;
    });
    
    this.setDataValue('code', this.code);
    this.setDataValue('runs_count', 0);
    this.setDataValue('last_modified', new Date());
  }

  getAIReview(): void {
    if (!this.hasCode || this.isGettingReview) return;

    this.isGettingReview = true;
    this.reviewComments = [];
    this.overallReviewFeedback = '';

    // Call the AI review API using the backend URL from environment
    const apiUrl = `${environment.apiUrl}/api/claude/review-code`;
    
    this.http.post<any>(apiUrl, {
      code: this.code,
      language: this.language,
      context: this.title
    }).subscribe({
      next: (response) => {
        if (response.success) {
          this.reviewComments = response.comments || [];
          this.overallReviewFeedback = response.overallFeedback || '';
          
          // Track that review was requested
          this.setDataValue('ai_review_requested', true);
          this.setDataValue('ai_review_timestamp', new Date());
        }
        this.isGettingReview = false;
      },
      error: (error) => {
        console.error('AI review failed:', error);
        this.reviewComments = [{
          type: 'error',
          title: 'Review Failed',
          message: 'Unable to get AI code review. Please try again later.'
        }];
        this.isGettingReview = false;
      }
    });
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
      
      // Append to simple output string only
      this.output = this.output ? this.output + '\n' + message : message;
      
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

  clearConsole(): void { this.output = ''; }

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
    console.log('🔧 CODE EDITOR - initializeWidgetData() called');
    console.log('📦 Config object:', this.config);
    
    // Load ALL config values from the config object
    this.title = this.getConfigValue('title', this.title);
    this.language = this.getConfigValue('language', this.language);
    this.placeholder = this.getConfigValue('placeholder', this.placeholder);
    this.starterCode = this.getConfigValue('starterCode', this.starterCode);
    this.testCases = this.getConfigValue('testCases', this.testCases);
    this.showOutput = this.getConfigValue('showOutput', this.showOutput);
    this.showFooter = this.getConfigValue('showFooter', this.showFooter);
    this.autoRun = this.getConfigValue('autoRun', this.autoRun);
    
    this.code = this.starterCode;
    
    // Allow height configuration through metadata
    const metadataHeight = this.getConfigValue('editorHeight', '');
    if (metadataHeight) {
      this.height = metadataHeight;
    }
    
    const metadataMinHeight = this.getConfigValue('editorMinHeight', '');
    if (metadataMinHeight) {
      this.minHeight = metadataMinHeight;
    }
    
    // Load grading configuration from config
    this.enableGrading = this.getConfigValue('enableGrading', this.enableGrading);
    this.gradingRequirements = this.getConfigValue('gradingRequirements', this.gradingRequirements);
    this.expectedOutput = this.getConfigValue('expectedOutput', this.expectedOutput);
    this.gradingContext = this.getConfigValue('gradingContext', this.gradingContext);
    
    console.log('✅ Grading config loaded:');
    console.log('   - enableGrading:', this.enableGrading);
    console.log('   - gradingRequirements:', this.gradingRequirements);
    console.log('   - expectedOutput:', this.expectedOutput);
    console.log('   - gradingContext:', this.gradingContext);
    
    this.setDataValue('language', this.language);
    this.setDataValue('code', this.code);
    this.setDataValue('runs_count', 0);
    this.setDataValue('grading_enabled', this.enableGrading);
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

  focusEditor(): void {
    if (this.editorView) {
      this.editorView.focus();
    }
  }

  updateUserSetting(setting: keyof typeof this.userSettings, value: boolean): void {
    this.userSettings[setting] = value;
    this.saveUserSettings();
    this.reinitializeEditor();
  }

  private saveUserSettings(): void {
    // Save to localStorage or user preferences
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('codeEditorSettings', JSON.stringify(this.userSettings));
    }
    this.setDataValue('user_settings', this.userSettings);
  }

  private loadUserSettings(): void {
    // Load from localStorage or user preferences
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('codeEditorSettings');
      if (saved) {
        this.userSettings = { ...this.userSettings, ...JSON.parse(saved) };
      }
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

  // Layout change handlers for resizable panels
  handleMainLayoutChange(sizes: number[]): void {
    console.log('Main layout changed:', sizes);
  }

  handleFeedbackLayoutChange(sizes: number[]): void {
    console.log('Feedback layout changed:', sizes);
  }
}