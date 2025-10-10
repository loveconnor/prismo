import { Component, Input, Output, EventEmitter, ViewChild, ElementRef, AfterViewInit, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { gsap } from 'gsap';
import { cn } from '../../../lib/utils';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pagination.html',
  styleUrl: './pagination.css'
})
export class PaginationComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() currentPage = 1;
  @Input() totalPages = 1;
  @Input() showPrevNext = true;
  @Input() className = '';

  @Output() pageChange = new EventEmitter<number>();

  @ViewChild('paginationContainer', { static: false }) paginationContainer!: ElementRef;
  @ViewChild('pageButtons', { static: false }) pageButtons!: ElementRef;

  private timeline?: gsap.core.Timeline;

  get paginationClasses(): string {
    return cn(
      'flex items-center justify-center space-x-1',
      this.className
    );
  }

  get pageNumbers(): number[] {
    const pages: number[] = [];
    const start = Math.max(1, this.currentPage - 2);
    const end = Math.min(this.totalPages, this.currentPage + 2);
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }

  get buttonClasses(): string {
    return cn(
      'inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 w-9'
    );
  }

  get activeButtonClasses(): string {
    return cn(
      'bg-primary text-primary-foreground hover:bg-primary/90'
    );
  }

  getPageButtonClasses(page: number): string {
    const baseClasses = 'inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 w-9';
    const activeClasses = this.currentPage === page ? 'bg-primary text-primary-foreground hover:bg-primary/90' : '';
    return cn(baseClasses, activeClasses);
  }

  ngOnInit(): void {
    // Component initialization
  }

  ngAfterViewInit(): void {
    // Use setTimeout to ensure we're in browser context after SSR
    setTimeout(() => {
      if (typeof window !== 'undefined' && this.paginationContainer) {
        gsap.from(this.paginationContainer.nativeElement, {
          opacity: 0,
          y: 20,
          duration: 0.4,
          ease: "power2.out"
        });
      }
    }, 0);
  }

  ngOnDestroy(): void {
    if (this.timeline) {
      this.timeline.kill();
    }
  }

  onPageClick(page: number): void {
    if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      this.animatePageChange();
      this.pageChange.emit(page);
    }
  }

  onPrevious(): void {
    if (this.currentPage > 1) {
      this.animatePageChange();
      this.pageChange.emit(this.currentPage - 1);
    }
  }

  onNext(): void {
    if (this.currentPage < this.totalPages) {
      this.animatePageChange();
      this.pageChange.emit(this.currentPage + 1);
    }
  }

  private animatePageChange(): void {
    if (!this.pageButtons || typeof window === 'undefined') {
      return;
    }

    // Kill any existing timeline
    if (this.timeline) {
      this.timeline.kill();
    }

    // Create page change animation
    this.timeline = gsap.timeline();

    this.timeline
      .to(this.pageButtons.nativeElement, {
        scale: 0.95,
        duration: 0.1,
        ease: "power2.in"
      })
      .to(this.pageButtons.nativeElement, {
        scale: 1,
        duration: 0.2,
        ease: "power2.out"
      });
  }
}
