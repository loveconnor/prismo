import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges,
  OnDestroy,
  AfterViewInit,
  ElementRef,
  ViewChild,
  Inject,
  PLATFORM_ID
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { WidgetBaseComponent } from '../../base/widget-base';
import { ThemeService } from '../../../../services/theme.service';
import { FontService } from '../../../../services/font.service';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  lucideTerminal,
  lucideCopy,
  lucideDownload,
  lucideRotateCcw
} from '@ng-icons/lucide';

// ==================== TYPES (unified) ====================

export type OutputType = 'stdout' | 'stderr' | 'info' | 'error' | 'success' | 'log' | 'warn';

export interface ConsoleLine {
  id: string;
  type: OutputType;
  content: string;
  timestamp: Date;
}

export interface LegacyConsoleMessage {
  id: string;
  type: 'log' | 'error' | 'warn' | 'info';
  message: string;
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
export class ConsoleOutputComponent
  extends WidgetBaseComponent
  implements OnChanges, OnDestroy, AfterViewInit
{
  // ==================== CORE/IDENTITY ====================
  @Input() id!: string;
  @Input() title: string = 'Console Output';

  // ==================== CONTENT (modern) ====================
  /** Preferred modern API */
  @Input() lines: ConsoleLine[] = [];
  /** Optional task/run indicator */
  @Input() isRunning: boolean = false;

  // ==================== LEGACY CONTENT (from HEAD) ====================
  /** Legacy API: will be merged into `lines` if provided */
  @Input() output: LegacyConsoleMessage[] = [];

  // ==================== DISPLAY/CONFIG ====================
  /** Preferred flag; if unset, `showTimestamp` is used for backward-compat */
  @Input() showTimestamps: boolean = false;
  /** Legacy single form supported for compat */
  @Input() showTimestamp: boolean = true;

  @Input() showLineNumbers: boolean = false;
  @Input() maxLines: number = 1000;
  @Input() autoScroll: boolean = true;
  @Input() wordWrap: boolean = true;

  /** UI config */
  @Input() ui?: ConsoleOutputUI;
  get variant(): 'default' | 'compact' | 'embedded' { return this.ui?.variant ?? 'default'; }
  get height(): 'sm' | 'md' | 'lg' | 'auto' { return this.ui?.height ?? 'md'; }
  get theme(): 'dark' | 'light' { return this.ui?.theme ?? 'dark'; }

  /** Features */
  @Input() allowCopy: boolean = true;
  @Input() allowDownload: boolean = true;
  @Input() allowClear: boolean = true;

  /** Filtering (legacy compat + modern) */
  @Input() filterByType: OutputType[] = ['log', 'error', 'warn', 'info', 'stdout', 'stderr', 'success'];

  /** Accessibility */
  @Input() a11yLabel?: string;

  // ==================== CALLBACK-STYLE OPTIONALS ====================
  @Input() onClear?: () => void;
  @Input() onCopy?: (content: string) => void;
  @Input() onDownload?: (content: string) => void;

  // ==================== OUTPUT EVENTS (modern) ====================
  @Output() clear = new EventEmitter<void>();
  @Output() copy = new EventEmitter<string>();
  @Output() download = new EventEmitter<string>();

  // ==================== OUTPUT EVENTS (legacy from HEAD) ====================
  @Output() outputCleared = new EventEmitter<void>();
  @Output() messageSelected = new EventEmitter<string>(); // emits selected line id
  @Output() filterChanged = new EventEmitter<OutputType[]>();
  @Output() maxLinesReached = new EventEmitter<void>();

  @ViewChild('endRef') endRef?: ElementRef<HTMLDivElement>;

  constructor(
    themeService: ThemeService,
    fontService: FontService,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    super(themeService, fontService, platformId);
  }

  // ==================== LIFECYCLE ====================
  ngAfterViewInit(): void {
    this.mergeLegacyOutput();
    this.maybeAutoScroll();
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Bring legacy `output` in whenever it changes
    if (changes['output']) {
      this.mergeLegacyOutput();
    }
    if (changes['lines'] || changes['maxLines']) {
      // Emit if exceeding max lines
      if (this.lines && this.lines.length > this.maxLines) {
        this.maxLinesReached.emit();
      }
      this.maybeAutoScroll();
    }
    if (changes['filterByType']) {
      this.filterChanged.emit(this.filterByType);
    }
  }

  ngOnDestroy(): void {
    // no-op for now
  }

  // ==================== WIDGET BASE HOOKS ====================
  protected initializeWidgetData(): void {
    // Nothing async/remote to initialize
  }

  protected validateInput(): boolean {
    // Console has no required input
    return true;
  }

  protected processCompletion(): void {
    // Completion semantics not applicable here
  }

  // ==================== HANDLERS ====================
  async handleCopy(): Promise<void> {
    if (!this.allowCopy) return;
    const content = this.displayLines.map(line => line.content).join('\n');
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(content);
      }
      this.onCopy?.(content);
      this.copy.emit(content);
    } catch {
      // swallow to avoid UI noise
    }
  }

  handleDownload(): void {
    if (!this.allowDownload) return;
    const content = this.displayLines
      .map(line => `[${new Date(line.timestamp).toISOString()}] ${line.content}`)
      .join('\n');

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
    this.onDownload?.(content);
    this.download.emit(content);
  }

  handleClear(): void {
    if (!this.allowClear) return;
    this.onClear?.();
    this.clear.emit();
    this.outputCleared.emit();
  }

  /** Call from template when a line is clicked/selected */
  selectLine(lineId: string): void {
    this.messageSelected.emit(lineId);
  }

  setFilter(types: OutputType[]): void {
    this.filterByType = types;
    this.filterChanged.emit(types);
  }

  // ==================== HELPERS ====================
  getLineColor(type: OutputType): string {
    switch (type) {
      case 'stderr':
      case 'error': return 'text-red-400';
      case 'success': return 'text-emerald-400';
      case 'info': return 'text-blue-400';
      case 'warn': return 'text-amber-400';
      case 'stdout':
      case 'log':
      default: return 'text-[#e5e7eb]';
    }
  }

  getLineIcon(type: OutputType): string {
    switch (type) {
      case 'error': return '❌';
      case 'success': return '✅';
      case 'info': return 'ℹ️';
      case 'stderr': return '⚠️';
      case 'warn': return '⚠️';
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

  /** Respect maxLines and filter; map legacy showTimestamp → showTimestamps */
  get displayLines(): ConsoleLine[] {
    const showTs = this.showTimestamps ?? this.showTimestamp;
    // (showTs is used in the template; kept here to highlight precedence)

    const filtered = (this.lines ?? []).filter(l =>
      this.filterByType.includes(l.type)
    );

    // Enforce max lines window
    const result = filtered.slice(-this.maxLines);
    if (filtered.length > this.maxLines) {
      // Fire once per overflow condition (already emitted in ngOnChanges for lines change)
      // This getter might be called often; avoid emitting here to prevent loops.
    }
    return result;
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

  /** Merge legacy `output` into `lines` for backward compatibility */
  private mergeLegacyOutput(): void {
    if (!this.output || this.output.length === 0) return;

    const converted: ConsoleLine[] = this.output.map(m => ({
      id: m.id,
      type: m.type as OutputType,
      content: m.message,
      timestamp: new Date(m.timestamp)
    }));

    // Append (don’t clobber) existing lines; dedupe by id
    const byId = new Map<string, ConsoleLine>();
    [...this.lines, ...converted].forEach(l => byId.set(l.id, l));
    this.lines = Array.from(byId.values());
  }
}
