import { Component, Input, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { cn } from '../../../../lib/utils';
import { gsap } from 'gsap';

@Component({
  selector: 'app-sidebar-section',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sidebar-section.html',
  styleUrl: './sidebar-section.css'
})
export class SidebarSectionComponent implements AfterViewInit {
  @Input() className = '';

  @ViewChild('sectionElement', { static: false }) sectionElement!: ElementRef;

  get sectionClasses(): string {
    return cn(
      'flex flex-col gap-0.5',
      this.className
    );
  }

  ngAfterViewInit(): void {
    if (typeof window !== 'undefined') {
      setTimeout(() => {
        this.animateSection();
      }, 100);
    }
  }

  private animateSection(): void {
    if (!this.sectionElement || typeof window === 'undefined') return;

    gsap.from(this.sectionElement.nativeElement.children, {
      opacity: 0,
      y: -10,
      duration: 0.3,
      stagger: 0.1,
      ease: "power2.out"
    });
  }
}
