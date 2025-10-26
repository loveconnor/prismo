import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { provideIcons, NgIconComponent } from '@ng-icons/core';
import { lucideSparkles, lucideX } from '@ng-icons/lucide';
import { DialogComponent } from '../../ui/dialog/dialog';
import { DialogHeaderComponent } from '../../ui/dialog/dialog-header';
import { DialogTitleComponent } from '../../ui/dialog/dialog-title';
import { DialogDescriptionComponent } from '../../ui/dialog/dialog-description';
import { DialogFooterComponent } from '../../ui/dialog/dialog-footer';
import { ButtonComponent } from '../../ui/button/button';
import { SelectComponent } from '../../ui/select/select';
import { InputComponent } from '../../ui/input/input';
import { TextareaComponent } from '../../ui/textarea/textarea';
import { LabelComponent } from '../../ui/label/label';
import { ThemeService } from '../../../services/theme.service';
import { ModuleGeneratorService } from '../../../services/module-generator.service';
import { ModuleLoadingScreenComponent } from '../module-loading-screen/module-loading-screen';
import { cn } from '../../../lib/utils';

@Component({
  selector: 'app-create-lab-modal',
  standalone: true,
  providers: [provideIcons({ lucideSparkles, lucideX })],
  imports: [
    CommonModule,
    FormsModule,
    NgIconComponent,
    DialogComponent,
    DialogHeaderComponent,
    DialogTitleComponent,
    DialogDescriptionComponent,
    DialogFooterComponent,
    ButtonComponent,
    SelectComponent,
    InputComponent,
    TextareaComponent,
    LabelComponent,
    ModuleLoadingScreenComponent
  ],
  templateUrl: './create-lab-modal.html',
  styleUrls: ['./create-lab-modal.css']
})
export class CreateLabModalComponent {
  @Input() open = false;
  @Output() openChange = new EventEmitter<boolean>();

  subject = '';
  difficulty = '';
  skillInput = '';
  skills: string[] = [];
  goal = '';

  // Loading state
  isGenerating = false;
  loadingProgress = 0;
  loadingProgressText = 'Initializing...';

  readonly subjects = [
    { value: 'coding', label: 'Coding' },
    { value: 'math', label: 'Math' },
    { value: 'writing', label: 'Writing' }
  ];

  readonly difficulties = [
    { value: 'beginner', label: 'Beginner' },
    { value: 'practice', label: 'Practice' },
    { value: 'challenge', label: 'Challenge' }
  ];

  constructor(
    private themeService: ThemeService,
    private moduleGenerator: ModuleGeneratorService,
    private router: Router
  ) {}

  private checkAuth(): boolean {
    const hasToken = !!localStorage.getItem('access_token');
    console.log('[CreateLabModal] Auth check:', { hasToken });
    return hasToken;
  }

  get canSubmit(): boolean {
    return this.subject.trim().length > 0 && this.difficulty.trim().length > 0;
  }

  get isDark(): boolean {
    return this.themeService.isDarkMode();
  }

  get dialogClasses(): string {
    return cn(
      'max-w-[620px]',
      this.isDark
        ? 'bg-card text-foreground'
        : 'bg-white text-zinc-900'
    );
  }

  get titleClasses(): string {
    return cn(
      'text-xl font-semibold',
      this.isDark ? 'text-zinc-100' : 'text-zinc-900'
    );
  }

  get descriptionClasses(): string {
    return cn(
      'text-sm mt-1',
      this.isDark ? 'text-zinc-400' : 'text-zinc-600'
    );
  }

  get labelClasses(): string {
    return cn(
      'text-sm font-medium',
      this.isDark ? 'text-zinc-100' : 'text-zinc-900'
    );
  }

  get selectTriggerClasses(): string {
    return cn(
      'w-full border text-sm',
      this.isDark
        ? 'bg-[#0d1117] border-[#30363d] text-zinc-100 focus:border-blue-500 focus:ring-blue-500/35'
        : 'bg-white border-zinc-300 text-zinc-900 focus:border-blue-500 focus:ring-blue-500/35'
    );
  }

  get selectContentClasses(): string {
    return cn(
      'border',
      this.isDark
        ? 'bg-[#161b22] border-[#30363d]'
        : 'bg-white border-zinc-200'
    );
  }

  get selectOptionClasses(): string {
    return cn(
      this.isDark
        ? 'text-zinc-100 hover:bg-white/10 focus:bg-white/10 focus:text-zinc-100'
        : 'text-zinc-900 hover:bg-zinc-100 focus:bg-zinc-100 focus:text-zinc-900'
    );
  }

  get inputClasses(): string {
    return cn(
      'w-full border text-sm placeholder:text-zinc-500',
      this.isDark
        ? 'bg-[#0d1117] border-[#30363d] text-zinc-100 focus:border-blue-500 focus:ring-blue-500/35'
        : 'bg-white border-zinc-300 text-zinc-900 focus:border-blue-500 focus:ring-blue-500/35'
    );
  }

  get textareaClasses(): string {
    return cn(
      'w-full border text-sm placeholder:text-zinc-500 resize-none',
      this.isDark
        ? 'bg-[#0d1117] border-[#30363d] text-zinc-100 focus:border-blue-500 focus:ring-blue-500/35'
        : 'bg-white border-zinc-300 text-zinc-900 focus:border-blue-500 focus:ring-blue-500/35'
    );
  }

  get buttonClasses(): string {
    return 'w-full h-10 bg-[#3b82f6] hover:bg-[#2563eb] text-white disabled:opacity-50 flex items-center justify-center gap-2 sm:max-w-none';
  }

  close() {
    this.openChange.emit(false);
  }

  onSkillInputChange(value: string) {
    this.skillInput = value;
  }

  onGoalChange(value: string) {
    this.goal = value;
  }

  handleSkillKeydown(event: KeyboardEvent) {
    if (event.key !== 'Enter') {
      return;
    }

    this.addSkill();
  }

  addSkill() {
    const value = this.skillInput.trim();
    if (!value) {
      return;
    }

    // Avoid adding duplicate skills
    if (!this.skills.includes(value)) {
      this.skills = [...this.skills, value];
    }
    this.skillInput = '';
  }

  handleSkillInputBlur() {
    // Auto-add skill when user leaves the input field
    this.addSkill();
  }

  onGoalBlur() {
    // This is just to ensure goal is properly set
  }

  removeSkill(index: number) {
    this.skills = this.skills.filter((_, i) => i !== index);
  }

  async submit() {
    console.log('[CreateLabModal] Submit clicked');
    console.log('[CreateLabModal] LocalStorage before submit:', {
      accessToken: localStorage.getItem('access_token')?.substring(0, 20) + '...',
      hasToken: !!localStorage.getItem('access_token')
    });
    
    if (!this.canSubmit || this.isGenerating) {
      console.log('[CreateLabModal] Submit blocked:', { canSubmit: this.canSubmit, isGenerating: this.isGenerating });
      return;
    }

    // Check authentication before proceeding
    if (!this.checkAuth()) {
      alert('You must be logged in to generate a lab. Please log in and try again.');
      return;
    }

    // Create a topic from subject and goal
    const topicParts = [this.subject];
    if (this.goal) {
      topicParts.push(this.goal);
    }
    const topic = topicParts.join(' - ');

    console.log('[CreateLabModal] Starting module generation:', {
      topic,
      subject: this.subject,
      difficulty: this.difficulty,
      skills: this.skills
    });

    // Set loading state immediately (not in setTimeout) to show loading screen right away
    this.isGenerating = true;
    this.loadingProgress = 0;
    this.loadingProgressText = 'Initializing...';

    try {
      // Start smooth progress animation
      const startTime = Date.now();
      const progressInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        
        // Smooth progress over 10 seconds (typical generation time)
        // Progress slows down as it gets closer to 90% to avoid reaching 100% before completion
        if (elapsed < 20) {
          this.loadingProgress = Math.min(20, (elapsed / 20) * 20);
          this.loadingProgressText = 'Analyzing your requirements...';
        } else if (elapsed < 50) {
          this.loadingProgress = Math.min(50, 20 + ((elapsed - 20) / 30) * 30);
          this.loadingProgressText = 'Generating learning content...';
        } else if (elapsed < 80) {
          this.loadingProgress = Math.min(75, 50 + ((elapsed - 50) / 30) * 25);
          this.loadingProgressText = 'Creating interactive widgets...';
        } else {
          this.loadingProgress = Math.min(90, 75 + ((elapsed - 80) / 20) * 15);
          this.loadingProgressText = 'Finalizing your lab...';
        }
      }, 100);
      
      // Store interval ID so we can clear it when done
      (this as any).progressInterval = progressInterval;

      // Generate the module
      console.log('[CreateLabModal] Sending to API:', {
        topic: topic,
        subject: this.subject,
        difficulty: this.difficulty,
        skills: this.skills,
        goal: this.goal
      });

      // Verify skills are actually present
      if (this.skills.length === 0) {
        console.warn('[CreateLabModal] WARNING: No skills added. Only using subject as skill.');
      }
      
      const response = await this.moduleGenerator.generateModule({
        topic: topic,
        subject: this.subject,
        difficulty: this.difficulty,
        skills: this.skills,
        goal: this.goal
      }).toPromise();

      // Clear the progress interval
      if ((this as any).progressInterval) {
        clearInterval((this as any).progressInterval);
      }

      this.loadingProgress = 100;
      this.loadingProgressText = 'Complete!';

      // Wait a moment to show completion
      await new Promise(resolve => setTimeout(resolve, 500));

      // Navigate to the widget lab with the generated module
      if (response?.module_id) {
        console.log('Navigating to widget lab with module:', response.module_id);
        console.log('Module name:', response.module?.name);
        
        // Close the modal
        this.close();
        
        // Use the clean filename (same as backend save_module_to_filesystem)
        const moduleName = response.module?.name || response.module_id;
        const safeFilename = moduleName.replace(/[^a-zA-Z0-9\-_]/g, '-');
        
        // Navigate to /labs/{safe-filename} route
        // Use the safe filename that matches what the backend saves
        this.router.navigate(['/labs', safeFilename], {
          state: {
            module: response.module,
            moduleId: response.module_id
          }
        });
      }

    } catch (error: any) {
      console.error('Failed to generate module:', error);
      
      // Clear the progress interval on error
      if ((this as any).progressInterval) {
        clearInterval((this as any).progressInterval);
      }
      
      // Check if it's an auth error - handle different error structures
      const errorMessage = error?.error?.error || error?.error || error?.message || 'Unknown error';
      const isAuthError = error?.status === 401 || 
                          (typeof errorMessage === 'string' && errorMessage.includes('401')) ||
                          (typeof errorMessage === 'string' && errorMessage.toLowerCase().includes('unauthorized'));
      
      if (isAuthError) {
        alert('Authentication failed. Please log out and log back in, then try again.');
      } else {
        const displayMessage = typeof errorMessage === 'string' ? errorMessage : 'Unknown error';
        alert(`Failed to generate lab: ${displayMessage}. Please try again.`);
      }
    } finally {
      this.isGenerating = false;
      this.loadingProgress = 0;
      this.loadingProgressText = 'Initializing...';
    }
  }
}
