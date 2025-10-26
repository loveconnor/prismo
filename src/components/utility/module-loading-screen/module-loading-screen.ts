import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { provideIcons, NgIconComponent } from '@ng-icons/core';
import { lucideSparkles, lucideLoader } from '@ng-icons/lucide';

@Component({
  selector: 'app-module-loading-screen',
  standalone: true,
  providers: [provideIcons({ lucideSparkles, lucideLoader })],
  imports: [CommonModule, NgIconComponent],
  template: `
    <div class="loading-screen-overlay" [class.visible]="isLoading">
      <div class="loading-content">
        <div class="loading-icon">
          <ng-icon name="lucide-sparkles" class="sparkles"></ng-icon>
          <ng-icon name="lucide-loader" class="spinner"></ng-icon>
        </div>
        
        <h2 class="loading-title">{{ title }}</h2>
        <p class="loading-message">{{ message }}</p>
        
        <div class="loading-progress">
          <div class="progress-bar">
            <div class="progress-fill" [style.width.%]="progress"></div>
          </div>
          <p class="progress-text">{{ progressText }}</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .loading-screen-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.85);
      backdrop-filter: blur(8px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      opacity: 0;
      visibility: hidden;
      transition: opacity 0.3s ease, visibility 0.3s ease;
    }

    .loading-screen-overlay.visible {
      opacity: 1;
      visibility: visible;
    }

    .loading-content {
      text-align: center;
      max-width: 500px;
      padding: 2rem;
    }

    .loading-icon {
      position: relative;
      width: 120px;
      height: 120px;
      margin: 0 auto 2rem;
    }

    .sparkles {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-size: 4rem;
      color: #3b82f6;
      animation: pulse 2s ease-in-out infinite;
    }

    .spinner {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-size: 6rem;
      color: rgba(59, 130, 246, 0.3);
      animation: spin 2s linear infinite;
    }

    @keyframes pulse {
      0%, 100% {
        opacity: 1;
        transform: translate(-50%, -50%) scale(1);
      }
      50% {
        opacity: 0.8;
        transform: translate(-50%, -50%) scale(1.1);
      }
    }

    @keyframes spin {
      from {
        transform: translate(-50%, -50%) rotate(0deg);
      }
      to {
        transform: translate(-50%, -50%) rotate(360deg);
      }
    }

    .loading-title {
      font-size: 1.75rem;
      font-weight: 700;
      color: #fff;
      margin: 0 0 0.75rem;
      letter-spacing: -0.025em;
    }

    .loading-message {
      font-size: 1rem;
      color: rgba(255, 255, 255, 0.7);
      margin: 0 0 2rem;
      line-height: 1.6;
    }

    .loading-progress {
      margin-top: 2rem;
    }

    .progress-bar {
      width: 100%;
      height: 6px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 3px;
      overflow: hidden;
      margin-bottom: 0.75rem;
    }

    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #3b82f6, #8b5cf6);
      border-radius: 3px;
      transition: width 0.5s ease;
    }

    .progress-text {
      font-size: 0.875rem;
      color: rgba(255, 255, 255, 0.6);
      margin: 0;
      font-weight: 500;
    }
  `]
})
export class ModuleLoadingScreenComponent {
  @Input() isLoading = false;
  @Input() title = 'Generating Your Lab';
  @Input() message = 'Our AI is crafting a personalized learning experience just for you...';
  @Input() progress = 0;
  @Input() progressText = 'Initializing...';
}
