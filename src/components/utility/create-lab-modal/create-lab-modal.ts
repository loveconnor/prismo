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

  get canSubmit(): boolean {
    return this.subject.trim().length > 0 && this.difficulty.trim().length > 0;
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
