import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy,
  OnChanges,
  ViewChild,
  ElementRef,
  Inject,
  PLATFORM_ID,
  ChangeDetectorRef,
  NgZone
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  lucideX,
  lucideCheck,
  lucideTriangle,
  lucideCode,
  lucideLightbulb,
  lucideArrowRight,
  lucideMaximize2,
  lucideInfo
} from '@ng-icons/lucide';
import { ButtonComponent } from '../../../ui/button/button';
import { CardComponent } from '../../../ui/card/card';
import { CardContentComponent } from '../../../ui/card/card-content';
import { CardHeaderComponent } from '../../../ui/card/card-header';

declare const monaco: any;

interface GradingSuggestion {
  type: 'readability' | 'performance' | 'maintainability' | 'correctness' | 'simplicity';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
}

@Component({
  selector: 'app-code-refactor-modal',
  standalone: true,
  imports: [
    CommonModule,
    ButtonComponent,
    CardComponent,
    CardContentComponent,
    CardHeaderComponent,
    NgIconComponent
  ],
  providers: [
    provideIcons({
      lucideX,
      lucideCheck,
      lucideTriangle,
      lucideCode,
      lucideLightbulb,
      lucideArrowRight,
      lucideMaximize2,
      lucideInfo
    })
  ],
  template: `
    <!-- Modal Overlay (only show when not minimized) -->
    <div 
      *ngIf="isOpen && !isMinimized"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm overflow-y-auto p-4"
      (click)="onOverlayClick($event)"
    >
      <!-- Modal Container -->
      <div 
        class="relative w-full max-w-3xl my-8 bg-[#0e1318] rounded-2xl border border-[#1f2937] shadow-2xl flex flex-col"
        (click)="$event.stopPropagation()"
      >
        <!-- Header -->
        <div class="flex items-center justify-between px-6 py-4 border-b border-[#1f2937] flex-shrink-0">
          <div class="flex items-center gap-3">
            <div class="p-2 bg-amber-500/10 rounded-lg">
              <ng-icon name="lucideTriangle" class="w-6 h-6 text-amber-500"></ng-icon>
            </div>
            <div>
              <h2 class="text-xl font-bold text-foreground">Code Needs Improvement</h2>
              <p class="text-sm text-muted-foreground">Review the feedback and update your code</p>
            </div>
          </div>
          <app-button
            variant="ghost"
            size="icon"
            (click)="close()"
          >
            <ng-icon name="lucideX" class="w-5 h-5"></ng-icon>
          </app-button>
        </div>

        <!-- Scrollable Content Area -->
        <div class="flex-1 overflow-y-auto max-h-[70vh]">
          <!-- Feedback Section -->
          <div class="px-6 py-6 space-y-6">
            <!-- AI Feedback -->
            <div class="flex items-start gap-3 p-4 rounded-lg bg-[#0b0f14] border border-[#1f2937]">
              <ng-icon name="lucideLightbulb" class="w-5 h-5 text-[#bc78f9] mt-0.5 flex-shrink-0"></ng-icon>
              <div class="flex-1 min-w-0">
                <h3 class="text-sm font-semibold text-foreground mb-2">AI Feedback</h3>
                <div class="text-sm text-muted-foreground leading-relaxed">{{ feedback }}</div>
              </div>
            </div>

            <!-- Suggestions -->
            <div *ngIf="suggestions.length > 0" class="space-y-3">
              <h4 class="text-sm font-semibold text-foreground uppercase tracking-wide flex items-center gap-2">
                <ng-icon name="lucideCheck" class="w-4 h-4 text-emerald-500"></ng-icon>
                What You Need to Fix
              </h4>
              <div class="space-y-3">
                <div
                  *ngFor="let suggestion of suggestions; let i = index"
                  class="p-4 rounded-lg bg-[#0b0f14] border border-[#1f2937] hover:border-[#bc78f9]/30 transition-colors"
                >
                  <div class="flex items-start gap-3">
                    <div class="flex items-center gap-2 flex-shrink-0">
                      <span class="flex items-center justify-center w-6 h-6 rounded-full bg-[#bc78f9]/20 text-[#bc78f9] text-xs font-bold">
                        {{ i + 1 }}
                      </span>
                      <span 
                        [class]="getPriorityBadgeClass(suggestion.priority)"
                        class="px-2 py-0.5 rounded text-xs font-medium"
                      >
                        {{ suggestion.priority }}
                      </span>
                    </div>
                    <div class="flex-1 min-w-0 space-y-2">
                      <div class="flex items-center gap-2 flex-wrap">
                        <span [class]="getTypeBadgeClass(suggestion.type)" class="text-xs font-semibold uppercase tracking-wide">
                          {{ suggestion.type }}
                        </span>
                        <span class="text-muted-foreground">•</span>
                        <h5 class="text-sm font-bold text-foreground">{{ suggestion.title }}</h5>
                      </div>
                      <p class="text-sm text-muted-foreground leading-relaxed">{{ suggestion.description }}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Helpful Tip -->
            <div class="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
              <div class="flex items-start gap-3">
                <ng-icon name="lucideInfo" class="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0"></ng-icon>
                <div class="flex-1">
                  <h4 class="text-sm font-semibold text-blue-400 mb-1">Tip</h4>
                  <p class="text-sm text-blue-300/80 leading-relaxed">
                    Use the feedback above to update your code. Click "Modify Code" to minimize this panel and work on your code while keeping the feedback visible.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer Actions -->
        <div class="flex items-center justify-between px-6 py-4 border-t border-[#1f2937] bg-[#0b0f14] flex-shrink-0">
          <div class="flex items-center gap-2 text-sm text-muted-foreground">
            <ng-icon name="lucideArrowRight" class="w-4 h-4"></ng-icon>
            <span>Review the feedback and update your code</span>
          </div>
          <div class="flex gap-3">
            <app-button
              variant="outline"
              (click)="keepOriginal()"
            >
              Dismiss
            </app-button>
            <app-button
              variant="default"
              (click)="minimize()"
            >
              <ng-icon name="lucideCode" class="w-4 h-4 mr-2"></ng-icon>
              Modify Code
            </app-button>
          </div>
        </div>
      </div>
    </div>

    <!-- Minimized Sidebar -->
    <div 
      #sidebarRef
      *ngIf="isOpen && isMinimized"
      id="feedback-sidebar"
      class="fixed z-40 w-96 max-h-[500px] bg-[#0e1318] border border-[#1f2937] shadow-2xl flex flex-col overflow-hidden rounded-lg draggable-sidebar"
      [class.dragging]="isDragging"
      [class.cursor-move]="isDragging"
      [style.top.px]="sidebarPosition.top"
      [style.right.px]="sidebarPosition.right"
    >
      <!-- Minimized Header (Draggable) -->
      <div 
        class="flex items-center justify-between px-4 py-3 border-b border-[#1f2937] bg-[#0b0f14] flex-shrink-0 cursor-move select-none"
        (mousedown)="onDragStart($event)"
      >
        <div class="flex items-center gap-2">
          <div class="p-1.5 bg-amber-500/10 rounded">
            <ng-icon name="lucideTriangle" class="w-4 h-4 text-amber-500"></ng-icon>
          </div>
          <h3 class="text-sm font-semibold text-foreground">AI Feedback</h3>
          <span class="text-xs text-muted-foreground">(Drag to move)</span>
        </div>
        <div class="flex gap-1">
          <app-button
            variant="ghost"
            size="icon"
            (click)="maximize()"
            class="h-8 w-8"
          >
            <ng-icon name="lucideMaximize2" class="w-4 h-4"></ng-icon>
          </app-button>
          <app-button
            variant="ghost"
            size="icon"
            (click)="close()"
            class="h-8 w-8"
          >
            <ng-icon name="lucideX" class="w-4 h-4"></ng-icon>
          </app-button>
        </div>
      </div>

      <!-- Minimized Content -->
      <div class="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        <!-- Compact Feedback -->
        <div class="p-3 rounded-lg bg-[#0b0f14] border border-[#1f2937]">
          <div class="text-xs text-muted-foreground leading-relaxed">{{ feedback }}</div>
        </div>

        <!-- Compact Suggestions -->
        <div *ngIf="suggestions.length > 0" class="space-y-2">
          <h4 class="text-xs font-semibold text-foreground uppercase tracking-wide">Tasks</h4>
          <div class="space-y-2">
            <div
              *ngFor="let suggestion of suggestions; let i = index"
              class="p-3 rounded-lg bg-[#0b0f14] border border-[#1f2937]"
            >
              <div class="flex items-start gap-2">
                <span class="flex items-center justify-center w-5 h-5 rounded-full bg-[#bc78f9]/20 text-[#bc78f9] text-xs font-bold flex-shrink-0">
                  {{ i + 1 }}
                </span>
                <div class="flex-1 min-w-0 space-y-1">
                  <div class="flex items-center gap-2">
                    <span 
                      [class]="getPriorityBadgeClass(suggestion.priority)"
                      class="px-1.5 py-0.5 rounded text-xs font-medium"
                    >
                      {{ suggestion.priority }}
                    </span>
                  </div>
                  <h5 class="text-xs font-semibold text-foreground">{{ suggestion.title }}</h5>
                  <p class="text-xs text-muted-foreground leading-relaxed">{{ suggestion.description }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: contents;
    }
    
    .cursor-move {
      cursor: move !important;
      user-select: none;
    }
    
    .cursor-move * {
      cursor: move !important;
      pointer-events: none;
    }
    
    /* Optimized dragging - no transitions during drag */
    .draggable-sidebar {
      transition: box-shadow 0.2s ease;
    }
    
    .draggable-sidebar.dragging {
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
      transition: none;
    }
  `]
})
export class CodeRefactorModalComponent implements OnInit, OnDestroy, OnChanges {
  @Input() isOpen = false;
  @Input() language = 'javascript';
  @Input() originalCode = '';
  @Input() refactoredCode = '';
  @Input() feedback = '';
  @Input() suggestions: GradingSuggestion[] = [];

  @Output() closeModal = new EventEmitter<void>();
  @Output() acceptRefactor = new EventEmitter<string>();
  @Output() keepOriginalCode = new EventEmitter<void>();
  @Output() modifyOriginalCode = new EventEmitter<void>();

  @ViewChild('originalEditor', { read: ElementRef }) originalEditorElement?: ElementRef;
  @ViewChild('refactoredEditor', { read: ElementRef }) refactoredEditorElement?: ElementRef;

  private originalMonacoEditor: any;
  private refactoredMonacoEditor: any;
  private isBrowser: boolean;
  
  // Minimized state - start minimized by default
  public isMinimized = true;
  
  // Drag state for minimized sidebar
  public isDragging = false;
  private dragStartX = 0;
  private dragStartY = 0;
  private initialMouseX = 0;
  private initialMouseY = 0;
  public sidebarPosition = { top: 0, right: 0 };
  
  // Bound event handlers for proper cleanup
  private boundDragMove: (e: MouseEvent) => void;
  private boundDragEnd: () => void;
  
  // Reference to sidebar element for direct DOM manipulation
  private sidebarElement: HTMLElement | null = null;

  constructor(
    @Inject(PLATFORM_ID) platformId: Object,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
    
    // Bind methods once for better performance
    this.boundDragMove = (e: MouseEvent) => this.onDragMove(e);
    this.boundDragEnd = () => this.onDragEnd();
  }

  ngOnInit(): void {
    if (this.isBrowser && this.isOpen) {
      // Small delay to ensure DOM is ready
      setTimeout(() => this.initializeEditors(), 100);
    }
    
    // Add global listeners for dragging outside Angular zone for performance
    if (this.isBrowser) {
      this.ngZone.runOutsideAngular(() => {
        document.addEventListener('mousemove', this.boundDragMove, { passive: true });
        document.addEventListener('mouseup', this.boundDragEnd);
      });
    }
  }

  ngOnDestroy(): void {
    this.disposeEditors();
    
    // Remove global drag listeners
    if (this.isBrowser) {
      document.removeEventListener('mousemove', this.boundDragMove);
      document.removeEventListener('mouseup', this.boundDragEnd);
    }
  }

  ngOnChanges(changes: any): void {
    if (changes.isOpen && this.isOpen && this.isBrowser) {
      // Reset to minimized state and position when opening
      this.isMinimized = true;
      this.sidebarPosition = { top: 0, right: 0 };
      setTimeout(() => {
        this.initializeEditors();
        // Get reference to sidebar element for direct DOM manipulation
        this.sidebarElement = document.getElementById('feedback-sidebar');
      }, 100);
    } else if (changes.isOpen && !this.isOpen) {
      this.disposeEditors();
      this.sidebarElement = null;
    }

    // Update editor content if code changes while modal is open
    if (this.isOpen && this.isBrowser) {
      if (changes.originalCode && this.originalMonacoEditor) {
        this.originalMonacoEditor.setValue(this.originalCode);
      }
      if (changes.refactoredCode && this.refactoredMonacoEditor) {
        this.refactoredMonacoEditor.setValue(this.refactoredCode);
      }
    }
  }

  private initializeEditors(): void {
    // No editors needed anymore - just showing feedback
  }

  private disposeEditors(): void {
    // No editors to dispose
  }

  private getMonacoLanguage(): string {
    const lang = this.language.toLowerCase();
    if (lang === 'js') return 'javascript';
    if (lang === 'py') return 'python';
    if (lang === 'cpp' || lang === 'c++') return 'cpp';
    return lang;
  }

  getPriorityBadgeClass(priority: string): string {
    switch (priority) {
      case 'high':
        return 'bg-red-500/10 text-red-500';
      case 'medium':
        return 'bg-amber-500/10 text-amber-500';
      case 'low':
        return 'bg-blue-500/10 text-blue-500';
      default:
        return 'bg-gray-500/10 text-gray-500';
    }
  }

  getTypeBadgeClass(type: string): string {
    switch (type) {
      case 'readability':
        return 'text-blue-500';
      case 'performance':
        return 'text-purple-500';
      case 'maintainability':
        return 'text-emerald-500';
      case 'correctness':
        return 'text-red-500';
      case 'simplicity':
        return 'text-amber-500';
      default:
        return 'text-gray-500';
    }
  }

  onOverlayClick(event: MouseEvent): void {
    this.close();
  }

  close(): void {
    this.isMinimized = true; // Reset to minimized for next time
    this.sidebarPosition = { top: 0, right: 0 }; // Reset position
    this.closeModal.emit();
  }

  minimize(): void {
    this.isMinimized = true;
    this.modifyOriginalCode.emit();
  }

  maximize(): void {
    this.isMinimized = false;
  }

  onDragStart(event: MouseEvent): void {
    if (!this.sidebarElement) {
      this.sidebarElement = document.getElementById('feedback-sidebar');
    }
    
    this.ngZone.runOutsideAngular(() => {
      this.isDragging = true;
      this.initialMouseX = event.clientX;
      this.initialMouseY = event.clientY;
      this.dragStartX = this.sidebarPosition.right;
      this.dragStartY = this.sidebarPosition.top;
    });
    
    event.preventDefault();
    event.stopPropagation();
  }

  onDragMove(event: MouseEvent): void {
    if (!this.isDragging || !this.sidebarElement) return;
    
    // Calculate deltas from initial mouse position
    const deltaX = this.initialMouseX - event.clientX;
    const deltaY = event.clientY - this.initialMouseY;
    
    const newTop = Math.max(0, this.dragStartY + deltaY);
    const newRight = Math.max(0, this.dragStartX + deltaX);
    
    // Direct DOM manipulation - bypasses Angular change detection
    this.sidebarElement.style.top = newTop + 'px';
    this.sidebarElement.style.right = newRight + 'px';
    
    // Update the position silently for when we need it later
    this.sidebarPosition.top = newTop;
    this.sidebarPosition.right = newRight;
  }

  onDragEnd(): void {
    this.ngZone.run(() => {
      this.isDragging = false;
      this.cdr.detectChanges();
    });
  }

  acceptSuggestion(): void {
    this.acceptRefactor.emit(this.refactoredCode);
    this.close();
  }

  keepOriginal(): void {
    this.keepOriginalCode.emit();
    this.close();
  }

  modifyCode(): void {
    this.modifyOriginalCode.emit();
    this.close();
  }
}
