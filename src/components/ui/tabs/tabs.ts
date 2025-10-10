import { Component, Input, Output, EventEmitter, ViewChild, ElementRef, AfterViewInit, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { gsap } from 'gsap';
import { cn } from '../../../lib/utils';

export interface TabItem {
  id: string;
  label: string;
  disabled?: boolean;
}

@Component({
  selector: 'app-tabs',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tabs.html',
  styleUrl: './tabs.css'
})
export class TabsComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() tabs: TabItem[] = [];
  @Input() activeTab: string = '';
  @Input() className = '';

  @Output() tabChange = new EventEmitter<string>();

  @ViewChild('tabList', { static: false }) tabList!: ElementRef;
  @ViewChild('contentContainer', { static: false }) contentContainer!: ElementRef;

  private timeline?: gsap.core.Timeline;

  get tabsClasses(): string {
    return cn(
      'inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground',
      this.className
    );
  }

  getTabClasses(tabId: string): string {
    const baseClasses = 'inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer';
    const activeClasses = this.activeTab === tabId ? 'bg-background text-foreground shadow-sm' : '';
    return cn(baseClasses, activeClasses);
  }

  ngOnInit(): void {
    // Component initialization
  }

  ngAfterViewInit(): void {
    // Use setTimeout to ensure we're in browser context after SSR
    setTimeout(() => {
      if (typeof window !== 'undefined' && this.contentContainer) {
        gsap.set(this.contentContainer.nativeElement, { opacity: 0, y: 10 });
        gsap.to(this.contentContainer.nativeElement, {
          opacity: 1,
          y: 0,
          duration: 0.3,
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

  onTabClick(tabId: string): void {
    if (tabId === this.activeTab) {
      return;
    }

    this.activeTab = tabId;
    this.tabChange.emit(tabId);

    // Animate content change
    this.animateContentChange();
  }

  private animateContentChange(): void {
    if (!this.contentContainer || typeof window === 'undefined') {
      return;
    }

    // Kill any existing timeline
    if (this.timeline) {
      this.timeline.kill();
    }

    // Create content transition animation
    this.timeline = gsap.timeline();

    this.timeline
      .to(this.contentContainer.nativeElement, {
        opacity: 0,
        y: -10,
        duration: 0.15,
        ease: "power2.in"
      })
      .set(this.contentContainer.nativeElement, { y: 10 })
      .to(this.contentContainer.nativeElement, {
        opacity: 1,
        y: 0,
        duration: 0.2,
        ease: "power2.out"
      });
  }
}
