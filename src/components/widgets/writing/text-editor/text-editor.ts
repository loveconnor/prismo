import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WidgetBaseComponent } from '../../base/widget-base';
import { ButtonComponent } from '../../../ui/button/button';
import { CardComponent } from '../../../ui/card/card';
import { CardContentComponent } from '../../../ui/card/card-content';
import { CardHeaderComponent } from '../../../ui/card/card-header';
import { TextareaComponent } from '../../../ui/textarea/textarea';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucideSave, lucideTrash2, lucideFileText, lucideClock, lucidePenTool } from '@ng-icons/lucide';

interface WritingMetrics {
  wordCount: number;
  characterCount: number;
  sentenceCount: number;
  paragraphCount: number;
  averageWordsPerSentence: number;
  readabilityScore?: number;
}

@Component({
  selector: 'app-text-editor',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule,
    CardComponent,
    CardContentComponent,
    CardHeaderComponent,
    TextareaComponent,
    ButtonComponent,
    NgIconComponent
  ],
  providers: [
    provideIcons({
      lucideSave,
      lucideTrash2,
      lucideFileText,
      lucideClock,
      lucidePenTool
    })
  ],
  template: `
    <app-card>
      <app-card-header>
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <ng-icon name="lucideFileText" class="w-5 h-5 text-blue-500"></ng-icon>
            <h3 class="text-lg font-semibold text-foreground">{{ title }}</h3>
          </div>
          <div class="flex gap-2" *ngIf="showActions">
            <app-button 
              variant="default"
              size="sm"
              (click)="saveText()"
              [disabled]="!hasText"
            >
              <ng-icon name="lucideSave" class="w-4 h-4 mr-2"></ng-icon>
              Save
            </app-button>
            
            <app-button 
              variant="outline"
              size="sm"
              (click)="clearText()"
              [disabled]="!hasText"
            >
              <ng-icon name="lucideTrash2" class="w-4 h-4 mr-2"></ng-icon>
              Clear
            </app-button>
          </div>
        </div>
        <div class="flex items-center gap-4 text-sm text-muted-foreground" *ngIf="showMeta">
          <span class="flex items-center gap-1">
            <ng-icon name="lucidePenTool" class="w-4 h-4"></ng-icon>
            {{ wordCount }} words
          </span>
          <span>{{ characterCount }} characters</span>
        </div>
      </app-card-header>
      
      <app-card-content>
        <div class="space-y-4">
          <div class="space-y-2">
            <label class="text-sm font-medium text-foreground" for="text-editor">
              {{ inputLabel }}
            </label>
            
            <div class="space-y-2">
              <app-textarea
                id="text-editor"
                className="min-h-[200px]"
                [(ngModel)]="text"
                [ngModelOptions]="{standalone: true}"
                (input)="onTextChange()"
                [placeholder]="placeholder"
                [rows]="textareaRows"
                [maxlength]="maxLength"
              ></app-textarea>
              
              <div class="flex items-center justify-between text-xs text-muted-foreground" *ngIf="showCounter">
                <span class="flex items-center gap-1">
                  <ng-icon name="lucidePenTool" class="w-3 h-3"></ng-icon>
                  {{ wordCount }} words
                </span>
                <span [class.text-orange-500]="isNearLimit" [class.text-red-500]="isAtLimit">
                  {{ characterCount }}/{{ maxLength }}
                </span>
              </div>
            </div>
          </div>
          
          <div class="space-y-3" *ngIf="showMetrics && hasText">
            <h4 class="text-sm font-semibold text-foreground">Writing Metrics</h4>
            
            <div class="grid grid-cols-2 gap-3">
              <div class="p-3 bg-muted rounded-lg">
                <div class="text-xs text-muted-foreground">Words</div>
                <div class="text-lg font-semibold text-foreground">{{ wordCount }}</div>
              </div>
              
              <div class="p-3 bg-muted rounded-lg">
                <div class="text-xs text-muted-foreground">Characters</div>
                <div class="text-lg font-semibold text-foreground">{{ characterCount }}</div>
              </div>
              
              <div class="p-3 bg-muted rounded-lg">
                <div class="text-xs text-muted-foreground">Sentences</div>
                <div class="text-lg font-semibold text-foreground">{{ sentenceCount }}</div>
              </div>
              
              <div class="p-3 bg-muted rounded-lg">
                <div class="text-xs text-muted-foreground">Paragraphs</div>
                <div class="text-lg font-semibold text-foreground">{{ paragraphCount }}</div>
              </div>
              
              <div class="p-3 bg-muted rounded-lg" *ngIf="averageWordsPerSentence > 0">
                <div class="text-xs text-muted-foreground">Avg words/sentence</div>
                <div class="text-lg font-semibold text-foreground">{{ averageWordsPerSentence | number:'1.1-1' }}</div>
              </div>
            </div>
          </div>
          
          <div class="space-y-3" *ngIf="hasRequirements">
            <h4 class="text-sm font-semibold text-foreground">Requirements</h4>
            
            <div class="space-y-2">
              <div 
                *ngFor="let requirement of requirements; trackBy: trackByRequirement" 
                class="flex items-start gap-3 p-3 border rounded-lg"
                [class.bg-green-50]="requirement.fulfilled"
                [class.border-green-200]="requirement.fulfilled"
                [class.bg-muted]="!requirement.fulfilled"
              >
                <ng-icon 
                  *ngIf="requirement.fulfilled" 
                  name="lucideCheck" 
                  class="w-4 h-4 text-green-600 mt-0.5"
                ></ng-icon>
                <ng-icon 
                  *ngIf="!requirement.fulfilled" 
                  name="lucideClock" 
                  class="w-4 h-4 text-muted-foreground mt-0.5"
                ></ng-icon>
                <div class="flex-1">
                  <div class="text-sm text-foreground">{{ requirement.text }}</div>
                  <div class="text-xs text-muted-foreground" *ngIf="requirement.status">
                    {{ requirement.status }}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div class="space-y-2" *ngIf="showPreview && hasText">
            <h4 class="text-sm font-semibold text-foreground">Preview</h4>
            
            <div class="p-3 bg-muted rounded-lg">
              <div class="text-sm text-foreground prose max-w-none" [innerHTML]="formattedPreview"></div>
            </div>
          </div>
        </div>
      </app-card-content>
      
      <div class="mt-4 pt-3 border-t" *ngIf="showFooter">
        <div class="flex items-center gap-4 text-xs text-muted-foreground">
          <span *ngIf="editTime > 0" class="flex items-center gap-1">
            <ng-icon name="lucideClock" class="w-3 h-3"></ng-icon>
            Edit time: {{ formatEditTime(editTime) }}
          </span>
          <span *ngIf="lastSavedAt">
            Last saved: {{ lastSavedAt | date:'short' }}
          </span>
          <span *ngIf="autoSaveEnabled">
            Auto-save: {{ autoSaveStatus }}
          </span>
        </div>
      </div>
    </app-card>
  `,
})
export class TextEditorComponent extends WidgetBaseComponent {
  @Input() title: string = 'Text Editor';
  @Input() inputLabel: string = 'Write your text:';
  @Input() placeholder: string = 'Start writing...';
  @Input() textareaRows: number = 8;
  @Input() maxLength: number = 5000;
  @Input() minWords?: number;
  @Input() maxWords?: number;
  @Input() showMetrics: boolean = true;
  @Input() showPreview: boolean = true;
  @Input() showCounter: boolean = true;
  @Input() showMeta: boolean = true;
  @Input() showActions: boolean = true;
  @Input() showFooter: boolean = true;
  @Input() autoSaveEnabled: boolean = true;
  @Input() autoSaveInterval: number = 30000; // 30 seconds

  public text: string = '';
  public editTime: number = 0;
  public lastSavedAt?: Date;
  public autoSaveStatus: string = 'Enabled';
  private editStartTime?: number;
  private autoSaveTimer?: any;

  get hasText(): boolean {
    return this.text.trim().length > 0;
  }

  get characterCount(): number {
    return this.text.length;
  }

  get wordCount(): number {
    return this.text.trim() ? this.text.trim().split(/\s+/).length : 0;
  }

  get sentenceCount(): number {
    return this.text.trim() ? this.text.trim().split(/[.!?]+/).filter(s => s.trim().length > 0).length : 0;
  }

  get paragraphCount(): number {
    return this.text.trim() ? this.text.trim().split(/\n\s*\n/).filter(p => p.trim().length > 0).length : 0;
  }

  get averageWordsPerSentence(): number {
    return this.sentenceCount > 0 ? this.wordCount / this.sentenceCount : 0;
  }

  get isNearLimit(): boolean {
    return this.characterCount > this.maxLength * 0.9;
  }

  get isAtLimit(): boolean {
    return this.characterCount >= this.maxLength;
  }

  get hasRequirements(): boolean {
    return this.requirements.length > 0;
  }

  get requirements(): Array<{text: string, fulfilled: boolean, status?: string}> {
    const reqs = [];
    
    if (this.minWords) {
      reqs.push({
        text: `Minimum ${this.minWords} words`,
        fulfilled: this.wordCount >= this.minWords,
        status: `${this.wordCount}/${this.minWords} words`
      });
    }
    
    if (this.maxWords) {
      reqs.push({
        text: `Maximum ${this.maxWords} words`,
        fulfilled: this.wordCount <= this.maxWords,
        status: `${this.wordCount}/${this.maxWords} words`
      });
    }
    
    return reqs;
  }

  get formattedPreview(): string {
    return this.text
      .replace(/\n/g, '<br>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>');
  }

  onTextChange(): void {
    if (!this.editStartTime) {
      this.editStartTime = Date.now();
    }
    
    this.setDataValue('text', this.text);
    this.setDataValue('word_count', this.wordCount);
    this.setDataValue('character_count', this.characterCount);
    this.setDataValue('last_modified', new Date());
    
    // Check if all requirements are met
    if (this.hasRequirements && this.requirements.every(r => r.fulfilled)) {
      this.completeWidget();
    }
  }

  saveText(): void {
    this.lastSavedAt = new Date();
    this.setDataValue('saved_at', this.lastSavedAt);
    this.setDataValue('saved_text', this.text);
    this.setDataValue('saved_word_count', this.wordCount);
    
    this.autoSaveStatus = 'Saved';
    // Reset status immediately
    this.autoSaveStatus = 'Enabled';
  }

  clearText(): void {
    this.text = '';
    this.editTime = 0;
    this.editStartTime = undefined;
    this.lastSavedAt = undefined;
    
    this.setDataValue('text', '');
    this.setDataValue('word_count', 0);
    this.setDataValue('character_count', 0);
    this.setDataValue('cleared_at', new Date());
  }

  formatEditTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  }

  trackByRequirement(index: number, requirement: any): string {
    return requirement.text;
  }

  protected initializeWidgetData(): void {
    this.setDataValue('edit_time', 0);
    this.setDataValue('word_count', 0);
    this.setDataValue('character_count', 0);
    
    if (this.autoSaveEnabled) {
      this.startAutoSave();
    }
  }

  protected validateInput(): boolean {
    return !!(this.title && this.inputLabel);
  }

  protected processCompletion(): void {
    this.setDataValue('completion_time', new Date());
    this.setDataValue('final_text', this.text);
    this.setDataValue('final_word_count', this.wordCount);
    this.setDataValue('final_character_count', this.characterCount);
    this.setDataValue('total_edit_time', this.editTime);
    this.setDataValue('requirements_met', this.hasRequirements ? this.requirements.every(r => r.fulfilled) : true);
  }

  private startAutoSave(): void {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
    }
    
    this.autoSaveTimer = setInterval(() => {
      if (this.hasText) {
        this.saveText();
      }
    }, this.autoSaveInterval);
  }

  private stopAutoSave(): void {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = undefined;
    }
  }

  override ngOnDestroy(): void {
    super.ngOnDestroy();
    this.stopAutoSave();
    
    // Update edit time before destroying
    if (this.editStartTime) {
      this.editTime += Math.floor((Date.now() - this.editStartTime) / 1000);
    }
  }
}
