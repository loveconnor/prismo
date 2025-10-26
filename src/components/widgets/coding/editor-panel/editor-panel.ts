import { Component, ElementRef, EventEmitter, Inject, Input, OnDestroy, OnInit, AfterViewInit, Output, PLATFORM_ID, ViewChild, SimpleChanges, OnChanges } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ButtonComponent } from '../../../ui/button/button';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucidePlay, lucideTrash2, lucideChevronUp, lucideChevronDown } from '@ng-icons/lucide';

type ConsoleLine = { type: 'info' | 'success' | 'error'; message: string };

@Component({
  selector: 'app-editor-panel',
  standalone: true,
  imports: [CommonModule, ButtonComponent, NgIconComponent],
  providers: [
    provideIcons({
      lucidePlay,
      lucideTrash2,
      lucideChevronUp,
      lucideChevronDown
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

  @ViewChild('editorHost', { static: false }) editorHost?: ElementRef<HTMLDivElement>;

  consoleOutput: ConsoleLine[] = [
    { type: 'info', message: 'Ready to run your code...' }
  ];
  consoleHidden = false;
  passed = false;

  private monacoEditor: any = null;
  private monacoScript?: HTMLScriptElement;
  private themeObserver?: MutationObserver;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

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
    // Here we simulate success output same as Next.js example
    this.consoleOutput = [
      { type: 'info', message: '> Running code...' },
      { type: 'success', message: 'The sum of numbers from 1 to 10 is: 55' },
      { type: 'info', message: '\nExecution completed successfully!' }
    ];
    this.passed = true;
    
    // Emit the codePassed event to parent component
    this.codePassed.emit();
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
}


