import { Component, Input, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { cn } from '../../../../lib/utils';
import { gsap } from 'gsap';

@Component({
  selector: 'app-navbar-section',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './navbar-section.html',
  styleUrl: './navbar-section.css'
})
export class NavbarSectionComponent implements AfterViewInit {
  @Input() className = '';

  @ViewChild('sectionElement', { static: false }) sectionElement!: ElementRef;

  get sectionClasses(): string {
    return cn(
      'flex items-center gap-3',
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
