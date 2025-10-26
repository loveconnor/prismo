import { Component, ElementRef, EventEmitter, Inject, Input, OnDestroy, OnInit, AfterViewInit, Output, PLATFORM_ID, ViewChild, SimpleChanges, OnChanges, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ButtonComponent } from '../../../ui/button/button';
import { CodeReviewCommentComponent } from '../code-review-comment/code-review-comment';
import { CodeRefactorModalComponent } from '../code-refactor-modal/code-refactor-modal';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucidePlay, lucideTrash2, lucideChevronUp, lucideChevronDown, lucideSparkles, lucideInfo } from '@ng-icons/lucide';
import { environment } from '../../../../environments/environment';

type ConsoleLine = { type: 'info' | 'success' | 'error'; message: string };

interface CodeReviewComment {
  lineNumber?: number;
  type: 'info' | 'warning' | 'error' | 'success' | 'suggestion';
  title?: string;
  message: string;
}

@Component({
  selector: 'app-editor-panel',
  standalone: true,
  imports: [CommonModule, ButtonComponent, CodeReviewCommentComponent, CodeRefactorModalComponent, NgIconComponent],
  providers: [
    provideIcons({
      lucidePlay,
      lucideTrash2,
      lucideChevronUp,
      lucideChevronDown,
      lucideSparkles,
      lucideInfo
    })
  ],
  templateUrl: './editor-panel.html',
  styleUrls: ['./editor-panel.css']
})
export class EditorPanelComponent implements OnInit, AfterViewInit, OnDestroy, OnChanges {
  @Input() currentStep = 1;
  @Input() totalSteps = 1;
  @Input() shiftHeader = false;
  @Input() editorConfig: any = null;
  @Output() completeStep = new EventEmitter<void>();
  @Output() codePassed = new EventEmitter<void>();
  @Output() aiReviewComplete = new EventEmitter<string>(); // Emit summary to parent

  @ViewChild('editorHost', { static: false }) editorHost?: ElementRef<HTMLDivElement>;

  consoleOutput: ConsoleLine[] = [
    { type: 'info', message: 'Ready to run your code...' }
  ];
  consoleHidden = false;
  passed = false;
  
  // AI Review state
  isGettingReview = false;
  reviewComments: CodeReviewComment[] = [];
  overallReviewFeedback: string = '';
  showReviewComments = false;
  
  // Grading state
  showRefactorModal = false;
  refactoredCode = '';
  gradingFeedback = '';
  gradingSuggestions: any[] = [];
  isGrading = false;
  
  private decorationIds: string[] = [];
  private widgetIds: string[] = [];
  private activeWidgetIndex: number = -1; // Track which widget is currently visible

  private monacoEditor: any = null;
  private monacoScript?: HTMLScriptElement;
  private themeObserver?: MutationObserver;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  get isStepPrompt(): boolean {
    // A step-prompt is a non-coding step (no language configured)
    return !this.editorConfig || !this.editorConfig.language;
  }

  get languageDisplay(): string {
    const lang = this.editorConfig?.language || 'python';
    const displayNames: Record<string, string> = {
      'python': 'Python',
      'javascript': 'JavaScript',
      'typescript': 'TypeScript',
      'cpp': 'C++',
      'c': 'C',
      'java': 'Java',
      'csharp': 'C#',
      'go': 'Go',
      'rust': 'Rust',
      'ruby': 'Ruby',
      'php': 'PHP',
      'swift': 'Swift',
      'kotlin': 'Kotlin'
    };
    return displayNames[lang] || lang.toUpperCase();
  }

  ngOnInit(): void {
    // Component initialization
    console.log('EditorPanel ngOnInit - editorConfig:', this.editorConfig);
    console.log('EditorPanel ngOnInit - editorConfig.language:', this.editorConfig?.language);
    console.log('EditorPanel ngOnInit - passed:', this.passed);
  }

  ngOnChanges(changes: SimpleChanges): void {
    console.log('EditorPanel ngOnChanges - changes:', changes);
    console.log('EditorPanel ngOnChanges - editorConfig:', this.editorConfig);
    console.log('EditorPanel ngOnChanges - editorConfig.language:', this.editorConfig?.language);
    console.log('EditorPanel ngOnChanges - passed:', this.passed);
    
    // Reset passed state when currentStep or editorConfig changes (new step)
    if (changes['currentStep'] && !changes['currentStep'].firstChange) {
      this.passed = false;
      this.showRefactorModal = false; // Hide feedback modal when changing steps
      this.gradingFeedback = ''; // Clear previous feedback
      this.gradingSuggestions = []; // Clear previous suggestions
      this.clearConsole();
      this.consoleOutput.push({ type: 'info', message: 'Ready to run your code...' });
    }
    
    // Update editor content when editorConfig changes
    if (changes['editorConfig']) {
      if (!changes['editorConfig'].firstChange && this.monacoEditor) {
        const newCode = this.editorConfig?.initialCode || '';
        if (newCode && this.monacoEditor.getValue() !== newCode) {
          this.monacoEditor.setValue(newCode);
        }
      }
      
      // For non-coding steps (steps without editor config), show informational message
      // but DON'T auto-pass - require user to click Continue button
      if (!this.editorConfig || !this.editorConfig.language) {
        this.consoleOutput = [
          { type: 'info', message: 'Review the content above and click Continue when ready.' }
        ];
      }
    }
  }

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    console.log('EditorPanel AfterViewInit - editorHost:', this.editorHost);
    // Load Monaco after view is initialized
    setTimeout(() => {
      this.loadMonaco();
    }, 100);
  }

  ngOnDestroy(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.clearInlineComments();
    try { this.monacoEditor?.dispose?.(); } catch {}
    this.monacoEditor = null;
    if (this.monacoScript && document.body.contains(this.monacoScript)) {
      document.body.removeChild(this.monacoScript);
    }
    try { this.themeObserver?.disconnect(); } catch {}
  }

  private loadMonaco() {
    if (typeof window === 'undefined') return;
    if (this.monacoEditor) return;
    
    // Ensure editor host is available
    if (!this.editorHost?.nativeElement) {
      console.log('Editor host not available, retrying...');
      setTimeout(() => this.loadMonaco(), 100);
      return;
    }

    console.log('Loading Monaco editor script...');
    console.log('Editor host dimensions:', {
      width: this.editorHost.nativeElement.offsetWidth,
      height: this.editorHost.nativeElement.offsetHeight,
      clientWidth: this.editorHost.nativeElement.clientWidth,
      clientHeight: this.editorHost.nativeElement.clientHeight
    });

    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/monaco-editor@0.44.0/min/vs/loader.js';
    script.async = true;
    script.onload = () => this.initMonaco();
    script.onerror = (error) => console.error('Failed to load Monaco script:', error);
    this.monacoScript = script;
    document.body.appendChild(script);
  }

  private initMonaco() {
    console.log('Initializing Monaco...');
    // @ts-ignore
    const win: any = window as any;
    if (!win.require) {
      console.error('Monaco require not available');
      return;
    }
    win.require.config({ paths: { vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.44.0/min/vs' } });
    win.require(['vs/editor/editor.main'], () => {
      console.log('Monaco editor.main loaded');
      if (!this.editorHost?.nativeElement || this.monacoEditor) {
        console.log('Editor host not available or editor already exists');
        return;
      }

      // Get initial code and language from editorConfig, or use defaults
      const starterCode = this.editorConfig?.initialCode || '';
      const language = this.editorConfig?.language || 'python';
      
      console.log('EditorConfig:', this.editorConfig);
      console.log('Using starter code:', starterCode);
      console.log('Using language:', language);

      try {
        const isLight = document.documentElement.classList.contains('theme-light');
        const monaco = win.monaco;
        monaco?.editor?.defineTheme?.('edusyn-light', {
          base: 'vs',
          inherit: true,
          rules: [],
          colors: {
            'editor.lineHighlightBorder': '#00000000',
            'editor.lineHighlightBackground': '#00000014'
          }
        });
        monaco?.editor?.defineTheme?.('edusyn-dark', {
          base: 'vs-dark',
          inherit: true,
          rules: [],
          colors: {
            'editor.lineHighlightBorder': '#00000000',
            'editor.lineHighlightBackground': '#FFFFFF10'
          }
        });

        console.log('Creating Monaco editor instance...');
        this.monacoEditor = monaco.editor.create(this.editorHost.nativeElement, {
          value: starterCode,
          language: language,
          theme: isLight ? 'edusyn-light' : 'edusyn-dark',
          fontSize: 14,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          automaticLayout: true,
          lineNumbers: 'on',
          roundedSelection: false,
          renderLineHighlight: 'line',
          glyphMargin: true, // Enable glyph margin for review icons
          scrollbar: {
            vertical: 'visible',
            horizontal: 'visible',
            verticalScrollbarSize: 10,
            horizontalScrollbarSize: 10
          },
          overviewRulerLanes: 0
        });
        
        console.log('Monaco editor created:', this.monacoEditor);
        
        // Force layout multiple times to ensure proper rendering
        setTimeout(() => {
          console.log('Forcing Monaco layout (100ms)...');
          const container = this.editorHost.nativeElement;
          console.log('Container dimensions at layout:', {
            offsetWidth: container.offsetWidth,
            offsetHeight: container.offsetHeight,
            clientWidth: container.clientWidth,
            clientHeight: container.clientHeight
          });
          this.monacoEditor?.layout();
        }, 100);
        
        setTimeout(() => {
          console.log('Forcing Monaco layout (500ms)...');
          this.monacoEditor?.layout();
        }, 500);

        // React to theme changes on the document
        try {
          this.themeObserver = new MutationObserver(() => {
            const light = document.documentElement.classList.contains('theme-light');
            win.monaco.editor.setTheme(light ? 'edusyn-light' : 'edusyn-dark');
          });
          this.themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
        } catch {}
      } catch {}

      // Safety: ensure theme is corrected after load timing
      let tries = 0;
      const t = window.setInterval(() => {
        const monaco = (window as any).monaco;
        if (monaco && monaco.editor && this.monacoEditor) {
          const light = document.documentElement.classList.contains('theme-light');
          try { monaco.editor.setTheme(light ? 'edusyn-light' : 'edusyn-dark'); } catch {}
          window.clearInterval(t);
        }
        if (++tries > 40) window.clearInterval(t);
      }, 100);
    });
  }

  runCode() {
    const code = this.monacoEditor?.getValue?.() || '';
    
    if (!code.trim()) {
      this.consoleOutput = [
        { type: 'error', message: 'Error: No code to execute' }
      ];
      return;
    }
    
    const language = this.editorConfig?.language || 'javascript';
    
    // Add initial running message
    this.consoleOutput = [
      { type: 'info', message: '> Running code...' }
    ];
    
    // Execute code on backend for supported languages
    const supportedLanguages = ['javascript', 'js', 'python', 'py', 'cpp', 'c++'];
    if (supportedLanguages.includes(language.toLowerCase())) {
      this.executeCodeOnBackend(code, language);
    } else {
      // Fallback for unsupported languages
      this.consoleOutput = [
        { type: 'info', message: '> Running code...' },
        { type: 'error', message: `Language "${language}" is not yet supported for execution` }
      ];
    }
  }

  private executeCodeOnBackend(code: string, language: string) {
    console.log('🔧 executeCodeOnBackend() called in editor-panel');
    console.log('🎯 editorConfig:', this.editorConfig);
    console.log('🎯 enableGrading:', this.editorConfig?.enableGrading);
    
    const apiUrl = `${environment.apiUrl}/api/claude/execute-code`;
    
    this.http.post<any>(apiUrl, {
      code: code,
      language: language,
      testCases: []
    }).subscribe({
      next: (response) => {
        if (response.success) {
          const output = response.output || 'No output';
          const lines = output.split('\n');
          
          this.consoleOutput = [
            { type: 'info', message: '> Running code...' },
            ...lines.map((line: string) => ({ 
              type: 'success' as const, 
              message: line 
            })),
            { type: 'info', message: `\nExecution completed in ${response.executionTime}ms` }
          ];
          
          // Check if grading is enabled (default to true if not specified)
          const enableGrading = this.editorConfig?.enableGrading !== false;
          
          console.log('✨ Checking grading status:');
          console.log('   - editorConfig.enableGrading:', this.editorConfig?.enableGrading);
          console.log('   - enableGrading (resolved):', enableGrading);
          console.log('   - gradingRequirements:', this.editorConfig?.gradingRequirements);
          
          if (enableGrading && this.editorConfig?.gradingRequirements) {
            console.log('✨ Grading is enabled - calling gradeCode()');
            this.passed = false; // Don't set to true until grading passes
            this.gradeCode(code, language);
          } else {
            if (!enableGrading) {
              console.log('⏭️ Grading is explicitly disabled - emitting codePassed');
            } else {
              console.log('⏭️ No grading requirements specified - emitting codePassed');
            }
            this.passed = true; // Only set to true if grading is disabled
            this.codePassed.emit();
          }
        } else {
          this.consoleOutput = [
            { type: 'info', message: '> Running code...' },
            { type: 'error', message: response.error || 'Execution failed' }
          ];
          this.passed = false;
        }
      },
      error: (error) => {
        this.consoleOutput = [
          { type: 'info', message: '> Running code...' },
          { type: 'error', message: `Error: ${error.message || 'Failed to execute code'}` }
        ];
        this.passed = false;
        console.error('Code execution failed:', error);
      }
    });
  }

  getAIReview() {
    console.log('=== AI Review Started ===');
    console.log('monacoEditor exists:', !!this.monacoEditor);
    console.log('isGettingReview:', this.isGettingReview);
    
    if (!this.monacoEditor || this.isGettingReview) {
      console.log('Early return - no editor or already reviewing');
      return;
    }

    const code = this.monacoEditor.getValue();
    console.log('Code length:', code?.length);
    console.log('Code preview:', code?.substring(0, 100));
    
    if (!code || code.trim().length === 0) {
      console.log('Early return - no code');
      return;
    }

    this.isGettingReview = true;
    this.reviewComments = [];
    this.overallReviewFeedback = '';
    this.showReviewComments = true;
    
    // Clear any existing inline comments
    this.clearInlineComments();

    // Call the AI review API using the backend URL from environment
    const apiUrl = `${environment.apiUrl}/api/claude/review-code`;
    console.log('API URL:', apiUrl);
    console.log('Language:', this.editorConfig?.language || 'javascript');
    console.log('Context:', this.editorConfig?.title || '');
    
    const requestBody = {
      code: code,
      language: this.editorConfig?.language || 'javascript',
      context: this.editorConfig?.title || ''
    };
    console.log('Request body:', requestBody);
    
    this.http.post<any>(apiUrl, requestBody).subscribe({
      next: (response) => {
        console.log('API Response received:', response);
        if (response.success) {
          this.reviewComments = response.comments || [];
          this.overallReviewFeedback = response.overallFeedback || '';
          console.log('Review comments:', this.reviewComments);
          console.log('Overall feedback:', this.overallReviewFeedback);
          
          // Render inline comments in Monaco
          this.renderInlineComments();
          
          // Emit summary to parent component to show in feedback panel
          if (this.overallReviewFeedback) {
            this.aiReviewComplete.emit(this.overallReviewFeedback);
          }
        } else {
          console.warn('API returned success=false:', response);
        }
        this.isGettingReview = false;
        console.log('=== AI Review Completed ===');
        console.log('showReviewComments:', this.showReviewComments);
        console.log('reviewComments.length:', this.reviewComments.length);
        console.log('Should render?', this.showReviewComments && this.reviewComments.length > 0);
        
        // Manually trigger change detection for zoneless Angular
        this.cdr.markForCheck();
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('=== AI Review Error ===');
        console.error('Error details:', error);
        console.error('Error status:', error.status);
        console.error('Error message:', error.message);
        console.error('Error body:', error.error);
        this.reviewComments = [{
          type: 'error',
          title: 'Review Failed',
          message: 'Unable to get AI code review. Please try again later.'
        }];
        this.isGettingReview = false;
        
        // Manually trigger change detection for zoneless Angular
        this.cdr.markForCheck();
        this.cdr.detectChanges();
      }
    });
  }

  private renderInlineComments() {
    if (!this.monacoEditor) return;

    // Clear previous decorations and widgets
    this.clearInlineComments();

    const monaco = (window as any).monaco;
    if (!monaco) return;

    console.log('Rendering inline comments for', this.reviewComments.length, 'comments');

    const decorations: any[] = [];
    
    // Add decorations for each comment
    this.reviewComments.forEach((comment, index) => {
      const lineNumber = comment.lineNumber || 1;
      const model = this.monacoEditor.getModel();
      if (!model) return;
      
      const lineContent = model.getLineContent(lineNumber);
      const lineLength = lineContent.length;
      
      console.log(`Comment ${index}: line ${lineNumber}, length ${lineLength}, type ${comment.type}`);
      
      // Get color based on comment type
      let glyphColor = '#60a5fa'; // info - blue
      let underlineColor = 'rgba(96, 165, 250, 0.6)';
      let glyphIcon = 'ℹ️';
      
      if (comment.type === 'error') {
        glyphColor = '#ef4444';
        underlineColor = 'rgba(239, 68, 68, 0.6)';
        glyphIcon = '⚠️';
      } else if (comment.type === 'warning') {
        glyphColor = '#f59e0b';
        underlineColor = 'rgba(245, 158, 11, 0.6)';
        glyphIcon = '⚡';
      } else if (comment.type === 'success') {
        glyphColor = '#10b981';
        underlineColor = 'rgba(16, 185, 129, 0.6)';
        glyphIcon = '✓';
      } else if (comment.type === 'suggestion') {
        glyphColor = '#8b5cf6';
        underlineColor = 'rgba(139, 92, 246, 0.6)';
        glyphIcon = '💡';
      }

      // Add inline decoration with underline (only on the code, not whole line)
      decorations.push({
        range: new monaco.Range(lineNumber, 1, lineNumber, lineLength + 1),
        options: {
          className: `ai-review-line-${comment.type}`, // For whole line subtle bg
          inlineClassName: `ai-review-inline-${comment.type}`, // For the underline
          glyphMarginClassName: `ai-review-glyph-${comment.type}`, // For the icon in margin
          stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
          hoverMessage: { value: `Click to see AI review` }
        }
      });
    });

    // Apply all decorations at once
    this.decorationIds = this.monacoEditor.deltaDecorations([], decorations);
    console.log('Applied decorations:', this.decorationIds);
    
    // Add click handler to show/hide comments
    const clickDisposable = this.monacoEditor.onMouseDown((e: any) => {
      console.log('Editor clicked', e.target.position);
      if (e.target.position) {
        const lineNumber = e.target.position.lineNumber;
        const commentIndex = this.reviewComments.findIndex(c => (c.lineNumber || 1) === lineNumber);
        
        console.log('Line clicked:', lineNumber, 'Comment index:', commentIndex);
        
        if (commentIndex !== -1) {
          // Toggle the widget for this line
          if (this.activeWidgetIndex === commentIndex) {
            console.log('Hiding active widget');
            this.hideActiveWidget();
          } else {
            console.log('Showing widget for comment', commentIndex);
            this.showWidgetForComment(commentIndex);
          }
        } else if (this.activeWidgetIndex !== -1) {
          // Clicked elsewhere, hide active widget
          console.log('Clicked elsewhere, hiding widget');
          this.hideActiveWidget();
        }
      }
    });
    
    // Add CSS for inline decorations if not already added
    if (!document.getElementById('ai-review-styles')) {
      const style = document.createElement('style');
      style.id = 'ai-review-styles';
      style.textContent = `
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        /* Line background (more noticeable) */
        .ai-review-line-error {
          background: rgba(239, 68, 68, 0.12) !important;
        }
        .ai-review-line-warning {
          background: rgba(245, 158, 11, 0.12) !important;
        }
        .ai-review-line-success {
          background: rgba(16, 185, 129, 0.12) !important;
        }
        .ai-review-line-info {
          background: rgba(96, 165, 250, 0.12) !important;
        }
        .ai-review-line-suggestion {
          background: rgba(139, 92, 246, 0.12) !important;
        }
        
        /* Inline highlighting (no underline) */
        .ai-review-inline-error {
          background: rgba(239, 68, 68, 0.15) !important;
          cursor: pointer !important;
          border-radius: 2px !important;
        }
        .ai-review-inline-error:hover {
          background: rgba(239, 68, 68, 0.25) !important;
        }
        .ai-review-inline-warning {
          background: rgba(245, 158, 11, 0.15) !important;
          cursor: pointer !important;
          border-radius: 2px !important;
        }
        .ai-review-inline-warning:hover {
          background: rgba(245, 158, 11, 0.25) !important;
        }
        .ai-review-inline-success {
          background: rgba(16, 185, 129, 0.15) !important;
          cursor: pointer !important;
          border-radius: 2px !important;
        }
        .ai-review-inline-success:hover {
          background: rgba(16, 185, 129, 0.25) !important;
        }
        .ai-review-inline-info {
          background: rgba(96, 165, 250, 0.15) !important;
          cursor: pointer !important;
          border-radius: 2px !important;
        }
        .ai-review-inline-info:hover {
          background: rgba(96, 165, 250, 0.25) !important;
        }
        .ai-review-inline-suggestion {
          background: rgba(139, 92, 246, 0.15) !important;
          cursor: pointer !important;
          border-radius: 2px !important;
        }
        .ai-review-inline-suggestion:hover {
          background: rgba(139, 92, 246, 0.25) !important;
        }
        
        /* Glyph margin icons */
        .ai-review-glyph-error {
          cursor: pointer !important;
        }
        .ai-review-glyph-error::before { 
          content: '⚠️';
          font-size: 14px;
        }
        .ai-review-glyph-warning {
          cursor: pointer !important;
        }
        .ai-review-glyph-warning::before { 
          content: '⚡';
          font-size: 14px;
        }
        .ai-review-glyph-success {
          cursor: pointer !important;
        }
        .ai-review-glyph-success::before { 
          content: '✓';
          font-size: 14px;
          color: #10b981;
          font-weight: bold;
        }
        .ai-review-glyph-info {
          cursor: pointer !important;
        }
        .ai-review-glyph-info::before { 
          content: 'ℹ️';
          font-size: 14px;
        }
        .ai-review-glyph-suggestion {
          cursor: pointer !important;
        }
        .ai-review-glyph-suggestion::before { 
          content: '💡';
          font-size: 14px;
        }
      `;
      document.head.appendChild(style);
    }
  }

  private showWidgetForComment(index: number) {
    // Hide current widget if any
    this.hideActiveWidget();
    
    const comment = this.reviewComments[index];
    const lineNumber = comment.lineNumber || 1;
    const monaco = (window as any).monaco;
    
    let glyphColor = '#60a5fa';
    let bgColor = 'rgba(96, 165, 250, 0.08)';
    let borderColor = 'rgba(96, 165, 250, 0.4)';
    let iconSymbol = '●';
    let typeLabel = 'Info';
    
    if (comment.type === 'error') {
      glyphColor = '#ef4444';
      bgColor = 'rgba(239, 68, 68, 0.08)';
      borderColor = 'rgba(239, 68, 68, 0.4)';
      iconSymbol = '✕';
      typeLabel = 'Error';
    } else if (comment.type === 'warning') {
      glyphColor = '#f59e0b';
      bgColor = 'rgba(245, 158, 11, 0.08)';
      borderColor = 'rgba(245, 158, 11, 0.4)';
      iconSymbol = '⚠';
      typeLabel = 'Warning';
    } else if (comment.type === 'success') {
      glyphColor = '#10b981';
      bgColor = 'rgba(16, 185, 129, 0.08)';
      borderColor = 'rgba(16, 185, 129, 0.4)';
      iconSymbol = '✓';
      typeLabel = 'Success';
    } else if (comment.type === 'suggestion') {
      glyphColor = '#8b5cf6';
      bgColor = 'rgba(139, 92, 246, 0.08)';
      borderColor = 'rgba(139, 92, 246, 0.4)';
      iconSymbol = '→';
      typeLabel = 'Suggestion';
    }
    
    const contentWidget = {
      domNode: null as any,
      getId: () => `ai-review-widget-active`,
      getDomNode: function() {
        if (!this.domNode) {
          const node = document.createElement('div');
          node.className = 'ai-review-content-widget';
          node.style.cssText = `
            background: #1e2433;
            border: 1px solid rgba(75, 85, 99, 0.5);
            padding: 6px 10px;
            margin: 2px 0 2px 50px;
            border-radius: 4px;
            min-width: 450px;
            max-width: 650px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
            animation: slideIn 0.15s ease-out;
            position: relative;
            z-index: 100;
          `;
          
          node.innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="color: ${glyphColor}; font-weight: 600; font-size: 11px; flex-shrink: 0;">${iconSymbol}</span>
              <div style="flex: 1; min-width: 0;">
                <div style="font-weight: 600; font-size: 10px; color: ${glyphColor}; margin-bottom: 2px;">${comment.title || typeLabel}</div>
                <div style="font-size: 11px; color: #d1d5db; line-height: 1.3;">${comment.message}</div>
              </div>
              <button onclick="this.closest('.ai-review-content-widget').remove()" 
                style="background: transparent; border: none; color: #6b7280; cursor: pointer; padding: 0; font-size: 16px; line-height: 1; flex-shrink: 0; width: 16px; height: 16px; display: flex; align-items: center; justify-content: center; border-radius: 2px; transition: all 0.1s;" 
                onmouseover="this.style.background='rgba(255,255,255,0.1)'; this.style.color='#9ca3af';" 
                onmouseout="this.style.background='transparent'; this.style.color='#6b7280';">×</button>
            </div>
          `;
          this.domNode = node;
        }
        return this.domNode;
      },
      getPosition: () => ({
        position: { lineNumber, column: 1 },
        preference: [monaco.editor.ContentWidgetPositionPreference.BELOW]
      })
    };
    
    this.monacoEditor.addContentWidget(contentWidget);
    this.activeWidgetIndex = index;
  }

  private hideActiveWidget() {
    if (this.activeWidgetIndex === -1) return;
    
    const widget = { 
      getId: () => 'ai-review-widget-active', 
      getDomNode: () => null, 
      getPosition: () => null 
    };
    
    try {
      this.monacoEditor.removeContentWidget(widget);
    } catch (e) {}
    
    this.activeWidgetIndex = -1;
  }

  clearInlineComments() {
    if (!this.monacoEditor) return;

    // Hide active widget
    this.hideActiveWidget();

    // Remove decorations
    if (this.decorationIds.length > 0) {
      this.monacoEditor.deltaDecorations(this.decorationIds, []);
      this.decorationIds = [];
    }

    // Clear widget IDs array (no longer needed since we only have one active widget)
    this.widgetIds = [];
  }

  clearConsole() {
    this.consoleOutput = [];
  }

  continueStep() {
    // For non-coding steps, trigger feedback/confidence before moving to next step
    if (!this.editorConfig || !this.editorConfig.language) {
      this.codePassed.emit();
    }
    this.passed = false;
    this.completeStep.emit();
  }

  private gradeCode(code: string, language: string): void {
    if (this.isGrading) return;

    console.log('🎯 GRADING CODE');
    console.log('📝 Requirements:', this.editorConfig?.gradingRequirements);
    console.log('💻 Code:', code);

    this.isGrading = true;
    const apiUrl = `${environment.apiUrl}/api/claude/grade-code`;

    this.http.post<any>(apiUrl, {
      code: code,
      language: language,
      requirements: this.editorConfig?.gradingRequirements || '',
      expectedOutput: this.editorConfig?.expectedOutput || '',
      context: this.editorConfig?.gradingContext || this.editorConfig?.title || ''
    }).subscribe({
      next: (response) => {
        this.isGrading = false;
        
        console.log('✅ Grading response:', response);

        if (response.success) {
          if (response.passed) {
            // Code passed grading
            console.log('🎉 Code passed grading!');
            this.passed = true; // Set passed flag to show Continue button
            this.showRefactorModal = false; // Hide feedback modal on success
            this.consoleOutput.push({ 
              type: 'success', 
              message: '\n✓ Code passed all requirements!' 
            });
            this.codePassed.emit();
            this.cdr.detectChanges(); // Update UI to show Continue button
          } else {
            // Code failed grading - show refactor modal
            console.log('⚠️ Code failed grading - showing refactor modal');
            console.log('📝 Refactored code:', response.refactoredCode);
            console.log('💬 Feedback:', response.feedback);
            console.log('📋 Suggestions:', response.suggestions);
            
            this.refactoredCode = response.refactoredCode || '';
            this.gradingFeedback = response.feedback || 'Your code needs improvement.';
            this.gradingSuggestions = response.suggestions || [];
            this.showRefactorModal = true;
            
            console.log('🎨 showRefactorModal is now:', this.showRefactorModal);
            
            // Force change detection
            this.cdr.detectChanges();
            
            console.log('✅ Change detection triggered');
            
            this.consoleOutput.push({ 
              type: 'error', 
              message: '\n✗ Code needs improvement. Check the feedback panel for details.' 
            });
          }
        } else {
          console.error('❌ Grading failed:', response.feedback);
          this.consoleOutput.push({ 
            type: 'error', 
            message: '\nGrading error - please try again.' 
          });
          this.codePassed.emit();
        }
      },
      error: (error) => {
        this.isGrading = false;
        console.error('❌ Grading request failed:', error);
        this.consoleOutput.push({ 
          type: 'error', 
          message: '\nGrading request failed: ' + error.message 
        });
        this.codePassed.emit();
      }
    });
  }

  closeRefactorModal(): void {
    this.showRefactorModal = false;
  }

  acceptRefactoredCode(refactoredCode: string): void {
    if (this.monacoEditor) {
      this.monacoEditor.setValue(refactoredCode);
    }
    this.showRefactorModal = false;
    
    // Re-run the code with the refactored version
    this.runCode();
  }

  keepOriginalCode(): void {
    this.showRefactorModal = false;
  }

  modifyOriginalCode(): void {
    // Don't close the modal - let it minimize instead
    // this.showRefactorModal = false;
    // Modal will handle its own minimize state
    console.log('📝 Modify code clicked - modal will minimize');
    // Focus stays on editor
  }
}



