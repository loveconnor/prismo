import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, OnDestroy, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { 
  lucideTerminal,
  lucideCopy,
  lucideDownload,
  lucideRotateCcw
} from '@ng-icons/lucide';

// ==================== TYPES ====================

export type OutputType = 'stdout' | 'stderr' | 'info' | 'error' | 'success';

export interface ConsoleLine {
  id: string;
  type: OutputType;
  content: string;
  timestamp: Date;
}

export interface ConsoleOutputUI {
  variant?: 'default' | 'compact' | 'embedded';
  height?: 'sm' | 'md' | 'lg' | 'auto';
  theme?: 'dark' | 'light';
}

@Component({
  selector: 'app-console-output',
  standalone: true,
  imports: [CommonModule, NgIconComponent],
  providers: [
    provideIcons({
      lucideTerminal,
      lucideCopy,
      lucideDownload,
      lucideRotateCcw
    })
  ],
  templateUrl: './console-output.html',
  styleUrls: ['./console-output.css']
})
export class ConsoleOutputComponent implements OnChanges, OnDestroy, AfterViewInit {
  // Core
  @Input() id!: string;
  @Input() title: string = 'Console Output';

  // Content
  @Input() lines: ConsoleLine[] = [];
  @Input() isRunning: boolean = false;
  @Input() showTimestamps: boolean = false;

  // Configuration
  @Input() maxLines: number = 1000;
  @Input() autoScroll: boolean = true;
  @Input() wordWrap: boolean = true;

  // UI
  @Input() ui?: ConsoleOutputUI;

  // Features
  @Input() allowCopy: boolean = true;
  @Input() allowDownload: boolean = true;
  @Input() allowClear: boolean = true;

  // Events
  @Input() onClear?: () => void;
  @Input() onCopy?: (content: string) => void;
  @Input() onDownload?: (content: string) => void;

  // Accessibility
  @Input() a11yLabel?: string;

  // Outputs
  @Output() clear = new EventEmitter<void>();
  @Output() copy = new EventEmitter<string>();
  @Output() download = new EventEmitter<string>();

  @ViewChild('endRef') endRef?: ElementRef<HTMLDivElement>;

  get variant(): 'default' | 'compact' | 'embedded' { return this.ui?.variant || 'default'; }
  get height(): 'sm' | 'md' | 'lg' | 'auto' { return this.ui?.height || 'md'; }
  get theme(): 'dark' | 'light' { return this.ui?.theme || 'dark'; }

  ngAfterViewInit(): void {
    this.maybeAutoScroll();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['lines']) {
      this.maybeAutoScroll();
    }
  }

  ngOnDestroy(): void {}

  // ==================== HANDLERS ====================

  async handleCopy(): Promise<void> {
    const content = this.lines.map(line => line.content).join('\n');
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(content);
      }
      if (this.onCopy) this.onCopy(content);
      this.copy.emit(content);
    } catch (error) {
      console.warn('Failed to copy console output');
    }
  }

  handleDownload(): void {
    const content = this.lines.map(line => `[${line.timestamp.toISOString()}] ${line.content}`).join('\n');
    if (typeof window !== 'undefined') {
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `console-output-${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
    if (this.onDownload) this.onDownload(content);
    this.download.emit(content);
  }

  handleClear(): void {
    if (this.onClear) this.onClear();
    this.clear.emit();
  }

  // ==================== HELPERS ====================

  getLineColor(type: OutputType): string {
    switch (type) {
      case 'stdout': return 'text-[#e5e7eb]';
      case 'stderr': return 'text-red-400';
      case 'error': return 'text-red-400 font-medium';
      case 'success': return 'text-emerald-400';
      case 'info': return 'text-blue-400';
      default: return 'text-[#e5e7eb]';
    }
  }

  getLineIcon(type: OutputType): string {
    switch (type) {
      case 'error': return '❌';
      case 'success': return '✅';
      case 'info': return 'ℹ️';
      case 'stderr': return '⚠️';
      default: return '';
    }
  }

  formatTimestamp(timestamp: Date): string {
    const d = new Date(timestamp);
    return d.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  get displayLines(): ConsoleLine[] {
    if (!this.lines) return [];
    return this.lines.slice(-this.maxLines);
  }

  get consoleContainerStyles(): { [key: string]: string } {
    return {
      'font-family': '"Fira Code", "Monaco", "Consolas", monospace',
      'scrollbar-width': 'thin',
      'scrollbar-color': '#374151 #111827'
    };
  }

  private maybeAutoScroll(): void {
    if (!this.autoScroll) return;
    if (typeof window === 'undefined') return;
    queueMicrotask(() => {
      if (this.endRef?.nativeElement) {
        this.endRef.nativeElement.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }
}


