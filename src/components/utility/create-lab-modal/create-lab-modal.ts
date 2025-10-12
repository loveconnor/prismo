import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
    LabelComponent
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

  constructor(private themeService: ThemeService) {}

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

    const value = this.skillInput.trim();
    if (!value) {
      return;
    }

    event.preventDefault();
    this.skills = [...this.skills, value];
    this.skillInput = '';
  }

  removeSkill(index: number) {
    this.skills = this.skills.filter((_, i) => i !== index);
  }

  submit(event: Event) {
    event.preventDefault();
    if (!this.canSubmit) {
      return;
    }

    // Placeholder for submission logic
    console.log({
      subject: this.subject,
      difficulty: this.difficulty,
      skills: this.skills,
      goal: this.goal
    });

    this.close();
  }
}
