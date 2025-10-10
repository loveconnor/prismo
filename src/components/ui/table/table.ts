import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { cn } from '../../../lib/utils';

@Component({
  selector: 'app-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './table.html',
  styleUrl: './table.css'
})
export class TableComponent {
  @Input() striped = false;
  @Input() hover = false;
  @Input() className = '';

  get tableClasses(): string {
    return cn(
      'w-full caption-bottom text-sm',
      this.className
    );
  }

  get theadClasses(): string {
    return cn(
      '[&_tr]:border-b'
    );
  }

  get tbodyClasses(): string {
    return cn(
      '[&_tr:last-child]:border-0',
      this.striped ? '[&_tr:nth-child(odd)]:bg-muted/50' : '',
      this.hover ? '[&_tr:hover]:bg-muted/50' : ''
    );
  }

  get trClasses(): string {
    return cn(
      'border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted'
    );
  }

  get thClasses(): string {
    return cn(
      'h-10 px-2 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]'
    );
  }

  get tdClasses(): string {
    return cn(
      'p-2 align-middle [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]'
    );
  }
}
