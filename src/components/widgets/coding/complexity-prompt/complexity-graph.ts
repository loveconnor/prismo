import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

export type ComplexityType = 'O(1)' | 'O(log n)' | 'O(n)' | 'O(n²)' | 'O(n³)' | 'O(2^n)' | 'O(n!)';

@Component({
  selector: 'app-complexity-graph',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="w-full">
      <div class="flex flex-wrap gap-2 mb-3">
        <button
          type="button"
          *ngFor="let c of complexities"
          (click)="interactive && select.emit(c)"
          [class]="getButtonClasses(c)"
        >
          {{ c }}
        </button>
      </div>
      <div class="h-64 w-full rounded-md bg-[#0b0f14] border border-[#1f2937] flex items-center justify-center text-[#6b7280]">
        <span class="text-sm">Graph placeholder (lines per complexity)</span>
      </div>
    </div>
  `
})
export class ComplexityGraphComponent {
  @Input() selectedComplexity: ComplexityType | null = null;
  @Input() showLegend: boolean = true;
  @Input() interactive: boolean = true;
  @Output() selectComplexity = new EventEmitter<ComplexityType>();

  complexities: ComplexityType[] = ['O(1)', 'O(log n)', 'O(n)', 'O(n²)', 'O(n³)', 'O(2^n)', 'O(n!)'];

  getButtonClasses(c: ComplexityType): string {
    const base = 'px-2 py-1 rounded text-xs border transition-colors';
    const selected = this.selectedComplexity === c;
    return [
      base,
      selected ? 'border-[#bc78f9] bg-[#bc78f9]/10 text-[#e5e7eb]' : 'border-[#1f2937] bg-[#0a0e12] text-[#a9b1bb] hover:bg-[#0e1318]'
    ].join(' ');
  }

  // Alias for template friendliness
  get select() { return this.selectComplexity; }
}


