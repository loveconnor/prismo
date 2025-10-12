import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WidgetBaseComponent } from '../../base/widget-base';
import { ButtonComponent } from '../../../ui/button/button';

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
  imports: [CommonModule, FormsModule],
  template: `
    <div class="text-editor">
      <div class="editor-header">
        <div class="editor-title">
          <h3>{{ title }}</h3>
          <div class="editor-meta" *ngIf="showMeta">
            <span class="word-count">{{ wordCount }} words</span>
            <span class="character-count">{{ characterCount }} characters</span>
          </div>
        </div>
        
        <div class="editor-actions" *ngIf="showActions">
          <button 
            class="save-button"
            (click)="saveText()"
            [disabled]="!hasText"
          >
            💾 Save
          </button>
          
          <button 
            class="clear-button"
            (click)="clearText()"
            [disabled]="!hasText"
          >
            🗑️ Clear
          </button>
        </div>
      </div>
      
      <div class="editor-content">
        <div class="input-section">
          <label class="input-label" for="text-editor">
            {{ inputLabel }}
          </label>
          
          <div class="text-container">
            <textarea
              id="text-editor"
              class="text-textarea"
              [(ngModel)]="text"
              [ngModelOptions]="{standalone: true}"
              (input)="onTextChange()"
              [placeholder]="placeholder"
              [rows]="textareaRows"
              [maxlength]="maxLength"
            ></textarea>
            
            <div class="text-counter" *ngIf="showCounter">
              <span class="character-counter" [class.warning]="isNearLimit">
                {{ characterCount }}/{{ maxLength }}
              </span>
            </div>
          </div>
        </div>
        
        <div class="metrics-section" *ngIf="showMetrics && hasText">
          <div class="metrics-header">
            <h4>Writing Metrics</h4>
          </div>
          
          <div class="metrics-grid">
            <div class="metric-item">
              <span class="metric-label">Words:</span>
              <span class="metric-value">{{ wordCount }}</span>
            </div>
            
            <div class="metric-item">
              <span class="metric-label">Characters:</span>
              <span class="metric-value">{{ characterCount }}</span>
            </div>
            
            <div class="metric-item">
              <span class="metric-label">Sentences:</span>
              <span class="metric-value">{{ sentenceCount }}</span>
            </div>
            
            <div class="metric-item">
              <span class="metric-label">Paragraphs:</span>
              <span class="metric-value">{{ paragraphCount }}</span>
            </div>
            
            <div class="metric-item" *ngIf="averageWordsPerSentence > 0">
              <span class="metric-label">Avg words/sentence:</span>
              <span class="metric-value">{{ averageWordsPerSentence | number:'1.1-1' }}</span>
            </div>
          </div>
        </div>
        
        <div class="requirements-section" *ngIf="hasRequirements">
          <div class="requirements-header">
            <h4>Requirements</h4>
          </div>
          
          <div class="requirements-list">
            <div 
              *ngFor="let requirement of requirements; trackBy: trackByRequirement" 
              class="requirement-item"
              [class.fulfilled]="requirement.fulfilled"
            >
              <div class="requirement-icon">
                <span *ngIf="requirement.fulfilled">✅</span>
                <span *ngIf="!requirement.fulfilled">⏳</span>
              </div>
              <div class="requirement-content">
                <div class="requirement-text">{{ requirement.text }}</div>
                <div class="requirement-status" *ngIf="requirement.status">
                  {{ requirement.status }}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="preview-section" *ngIf="showPreview && hasText">
          <div class="preview-header">
            <h4>Preview</h4>
          </div>
          
          <div class="preview-content">
            <div class="preview-text" [innerHTML]="formattedPreview"></div>
          </div>
        </div>
      </div>
      
      <div class="editor-footer" *ngIf="showFooter">
        <div class="editor-stats">
          <span class="edit-time" *ngIf="editTime > 0">
            Edit time: {{ formatEditTime(editTime) }}
          </span>
          <span class="last-saved" *ngIf="lastSavedAt">
            Last saved: {{ lastSavedAt | date:'short' }}
          </span>
          <span class="auto-save" *ngIf="autoSaveEnabled">
            Auto-save: {{ autoSaveStatus }}
          </span>
        </div>
      </div>
    </div>
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
    setTimeout(() => {
      this.autoSaveStatus = 'Enabled';
    }, 2000);
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
