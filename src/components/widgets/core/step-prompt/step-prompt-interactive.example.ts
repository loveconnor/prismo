/**
 * Example Usage: Step Prompt Interactive Widget
 * 
 * This file demonstrates how to use the StepPromptInteractiveComponent
 * in various scenarios within your Angular application.
 */

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StepPromptInteractiveComponent } from './step-prompt-interactive';
import { 
  STEP_PROMPT_INTERACTIVE_METADATA, 
  STEP_PROMPT_EXAMPLES 
} from './step-prompt-interactive.metadata';
import { StepPromptConfig } from './step-prompt-interactive';

/**
 * Example 1: Simple Reading Comprehension
 * A basic non-interactive prompt for displaying information
 */
@Component({
  selector: 'app-example-simple-reading',
  standalone: true,
  imports: [CommonModule, StepPromptInteractiveComponent],
  template: `
    <app-step-prompt-interactive
      [metadata]="metadata"
      [promptConfig]="promptConfig"
      (primaryAction)="handleNext($event)"
      (stepViewStart)="onViewStart($event)"
      (stepViewComplete)="onViewComplete($event)"
    />
  `
})
export class ExampleSimpleReadingComponent {
  metadata = STEP_PROMPT_EXAMPLES.simpleReading.metadata;
  promptConfig: StepPromptConfig = STEP_PROMPT_EXAMPLES.simpleReading.config;

  handleNext(event: any) {
    console.log('User clicked next:', event);
    // Navigate to next step
  }

  onViewStart(telemetry: any) {
    console.log('Step viewed:', telemetry);
    // Track analytics
  }

  onViewComplete(telemetry: any) {
    console.log('Step completed:', telemetry);
    // Track analytics
  }
}

/**
 * Example 2: Interactive Coding Challenge
 * A coding exercise with hints and validation
 */
@Component({
  selector: 'app-example-coding-challenge',
  standalone: true,
  imports: [CommonModule, StepPromptInteractiveComponent],
  template: `
    <div class="max-w-4xl mx-auto p-6">
      <app-step-prompt-interactive
        [metadata]="metadata"
        [promptConfig]="promptConfig"
        (submitResponse)="handleSubmit($event)"
        (hintRequested)="handleHintRequest($event)"
        (hintOpened)="handleHintOpened($event)"
      />
    </div>
  `
})
export class ExampleCodingChallengeComponent {
  metadata = STEP_PROMPT_EXAMPLES.codingChallenge.metadata;
  promptConfig: StepPromptConfig = STEP_PROMPT_EXAMPLES.codingChallenge.config;

  handleSubmit(event: { id: string; response: string; stepNumber?: number }) {
    console.log('Code submitted:', event.response);
    
    // Validate the code
    const isCorrect = this.validateCode(event.response);
    
    if (isCorrect) {
      console.log('Correct solution!');
      // Show success feedback
      // Navigate to next challenge
    } else {
      console.log('Incorrect solution');
      // Show error feedback
      // Allow retry
    }
  }

  handleHintRequest(event: { id: string; source: 'button' | 'hotkey' }) {
    console.log('Hint requested:', event);
    // Track hint usage for analytics
    // Could adjust difficulty based on hint usage
  }

  handleHintOpened(event: { id: string }) {
    console.log('Hint opened:', event);
    // Display hint panel with progressive hints
  }

  private validateCode(code: string): boolean {
    // Basic validation - in real app, would run code and check output
    return code.includes('for') && code.includes('range') && code.includes('print');
  }
}

/**
 * Example 3: Multi-Step Learning Sequence
 * A sequence of interactive prompts with state management
 */
@Component({
  selector: 'app-example-multi-step',
  standalone: true,
  imports: [CommonModule, StepPromptInteractiveComponent],
  template: `
    <div class="max-w-4xl mx-auto p-6">
      <app-step-prompt-interactive
        [metadata]="currentMetadata"
        [promptConfig]="currentPromptConfig"
        (primaryAction)="handlePrimaryAction($event)"
        (submitResponse)="handleSubmit($event)"
        (stepViewComplete)="onStepComplete($event)"
      />
    </div>
  `
})
export class ExampleMultiStepComponent {
  currentStep = 0;
  totalSteps = 5;
  userResponses: string[] = [];

  steps: StepPromptConfig[] = [
    {
      title: 'Introduction to Variables',
      stepNumber: 1,
      totalSteps: 5,
      promptType: 'instruction',
      bodyMD: '# Variables\n\nVariables are containers for storing data values.',
      difficulty: 'easy',
      estimatedMinutes: 1,
      skillTags: ['variables', 'basics'],
      ctaPrimary: {
        label: 'Start Learning',
        action: 'start'
      },
      variant: 'emphatic'
    },
    {
      title: 'Creating Variables',
      stepNumber: 2,
      totalSteps: 5,
      promptType: 'task',
      bodyMD: 'Create a variable named `age` and assign it the value `25`.',
      example: 'age = 25',
      requiresSubmission: true,
      inputType: 'code',
      inputPlaceholder: '# Write your code here...',
      inputLabel: 'Your Code',
      difficulty: 'easy',
      estimatedMinutes: 2,
      skillTags: ['variables', 'assignment'],
      ctaPrimary: {
        label: 'Submit',
        action: 'submit'
      },
      ctaSecondary: {
        showHint: true
      },
      integrations: {
        showHintPanel: true
      }
    },
    {
      title: 'Variable Types',
      stepNumber: 3,
      totalSteps: 5,
      promptType: 'question',
      bodyMD: 'What type of data is stored in the variable `name = "Alice"`?',
      requiresSubmission: true,
      inputType: 'text',
      inputPlaceholder: 'Enter the data type...',
      inputLabel: 'Your Answer',
      validateInput: (value: string) => {
        if (!value.trim()) return 'Please enter an answer';
        const normalized = value.trim().toLowerCase();
        if (normalized !== 'string' && normalized !== 'str') {
          return 'Not quite. Think about text data types.';
        }
        return null;
      },
      difficulty: 'easy',
      estimatedMinutes: 1,
      skillTags: ['variables', 'data-types', 'strings'],
      ctaPrimary: {
        label: 'Submit Answer',
        action: 'submit'
      },
      ctaSecondary: {
        showHint: true,
        openCoach: true
      },
      integrations: {
        showHintPanel: true,
        showCoach: true
      }
    },
    {
      title: 'Modifying Variables',
      stepNumber: 4,
      totalSteps: 5,
      promptType: 'task',
      bodyMD: 'Given `x = 10`, write code to increase `x` by 5.',
      example: 'x = x + 5\n# or\nx += 5',
      tip: 'You can use the += operator as a shorthand.',
      requiresSubmission: true,
      inputType: 'code',
      inputPlaceholder: '# Write your code here...',
      inputLabel: 'Your Code',
      difficulty: 'medium',
      estimatedMinutes: 2,
      skillTags: ['variables', 'operators', 'arithmetic'],
      ctaPrimary: {
        label: 'Submit',
        action: 'submit'
      },
      ctaSecondary: {
        showHint: true,
        openCoach: true
      },
      integrations: {
        showHintPanel: true,
        showFeedbackBox: true,
        showCoach: true
      }
    },
    {
      title: 'Congratulations!',
      stepNumber: 5,
      totalSteps: 5,
      promptType: 'instruction',
      bodyMD: '# Well Done! 🎉\n\nYou have completed the Variables module.',
      difficulty: 'easy',
      estimatedMinutes: 1,
      skillTags: ['variables'],
      ctaPrimary: {
        label: 'Continue to Next Module',
        action: 'next'
      },
      variant: 'emphatic'
    }
  ];

  get currentMetadata() {
    // In a real app, each step might have its own metadata
    // For simplicity, we're reusing the base metadata
    return {
      ...STEP_PROMPT_INTERACTIVE_METADATA,
      id: `step-prompt-${this.currentStep}`,
      skills: this.steps[this.currentStep].skillTags || []
    };
  }

  get currentPromptConfig() {
    return this.steps[this.currentStep];
  }

  handlePrimaryAction(event: { id: string; action: string }) {
    console.log('Primary action:', event);
    
    if (event.action === 'next' || event.action === 'start') {
      this.nextStep();
    }
  }

  handleSubmit(event: { id: string; response: string; stepNumber?: number }) {
    console.log('Response submitted:', event);
    
    // Store the response
    this.userResponses[this.currentStep] = event.response;
    
    // Validate response (simplified)
    const isCorrect = this.validateResponse(this.currentStep, event.response);
    
    if (isCorrect) {
      console.log('Correct!');
      // Show success feedback, then move to next step
      setTimeout(() => this.nextStep(), 1000);
    } else {
      console.log('Incorrect - allow retry');
      // Show feedback but stay on current step
    }
  }

  onStepComplete(telemetry: any) {
    console.log('Step complete telemetry:', telemetry);
    // Save progress, track analytics
  }

  private nextStep() {
    if (this.currentStep < this.totalSteps - 1) {
      this.currentStep++;
    } else {
      console.log('Module complete!');
      // Navigate to next module or completion screen
    }
  }

  private validateResponse(step: number, response: string): boolean {
    // Simplified validation logic
    switch (step) {
      case 1: // Creating variables
        return response.includes('age') && response.includes('25');
      case 2: // Variable types
        return response.toLowerCase().includes('string') || response.toLowerCase().includes('str');
      case 3: // Modifying variables
        return response.includes('+=') || response.includes('+ 5');
      default:
        return true;
    }
  }
}

/**
 * Example 4: Timed Assessment
 * An assessment with a countdown timer
 */
@Component({
  selector: 'app-example-timed-assessment',
  standalone: true,
  imports: [CommonModule, StepPromptInteractiveComponent],
  template: `
    <div class="max-w-4xl mx-auto p-6">
      <app-step-prompt-interactive
        [metadata]="metadata"
        [promptConfig]="promptConfig"
        (submitResponse)="handleSubmit($event)"
        (timeUp)="handleTimeUp()"
      />
    </div>
  `
})
export class ExampleTimedAssessmentComponent {
  metadata = STEP_PROMPT_EXAMPLES.timedAssessment.metadata;
  promptConfig: StepPromptConfig = {
    ...STEP_PROMPT_EXAMPLES.timedAssessment.config,
    timeRemainingMs: 180000 // 3 minutes
  };

  handleSubmit(event: { id: string; response: string }) {
    console.log('Assessment submitted:', event);
    
    // Validate answer
    const isCorrect = this.checkAnswer(event.response);
    
    // Record result
    this.recordAssessmentResult(event.response, isCorrect);
    
    // Show feedback
    this.showFeedback(isCorrect);
  }

  handleTimeUp() {
    console.log('Time is up!');
    
    // Auto-submit with current response
    // or show "time's up" message
    alert('Time is up! Your current response will be submitted.');
  }

  private checkAnswer(answer: string): boolean {
    // For equation 3x + 7 = 22, answer is x = 5
    const normalized = answer.trim().toLowerCase();
    return normalized === '5' || normalized === 'x=5' || normalized === 'x = 5';
  }

  private recordAssessmentResult(response: string, correct: boolean) {
    // Save to backend or state management
    console.log('Recording result:', { response, correct });
  }

  private showFeedback(correct: boolean) {
    // Show feedback modal or inline message
    if (correct) {
      console.log('Correct! Moving to next question...');
    } else {
      console.log('Incorrect. The correct answer is x = 5');
    }
  }
}

/**
 * Example 5: Widget with Custom Validation
 * Demonstrates advanced validation logic
 */
@Component({
  selector: 'app-example-custom-validation',
  standalone: true,
  imports: [CommonModule, StepPromptInteractiveComponent],
  template: `
    <div class="max-w-4xl mx-auto p-6">
      <app-step-prompt-interactive
        [metadata]="metadata"
        [promptConfig]="promptConfig"
        (submitResponse)="handleSubmit($event)"
      />
    </div>
  `
})
export class ExampleCustomValidationComponent {
  metadata = {
    ...STEP_PROMPT_INTERACTIVE_METADATA,
    id: 'custom-validation-example',
    skills: ['email', 'validation']
  };

  promptConfig: StepPromptConfig = {
    title: 'Enter Your Email',
    promptType: 'question',
    bodyMD: 'Please enter a valid email address to continue.',
    requiresSubmission: true,
    inputType: 'text',
    inputPlaceholder: 'name@example.com',
    inputLabel: 'Email Address',
    validateInput: (value: string) => {
      // Real-time validation
      if (!value.trim()) {
        return 'Email is required';
      }
      
      // Basic email regex
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        return 'Please enter a valid email address';
      }
      
      // Custom business logic
      if (value.endsWith('.test')) {
        return 'Test email addresses are not allowed';
      }
      
      return null; // Valid
    },
    difficulty: 'easy',
    estimatedMinutes: 1,
    ctaPrimary: {
      label: 'Continue',
      action: 'submit'
    }
  };

  handleSubmit(event: { id: string; response: string }) {
    console.log('Email submitted:', event.response);
    
    // Additional server-side validation could go here
    // Save email and continue
  }
}

/**
 * Example 6: Integration with State Management
 * Shows how to integrate with NgRx or other state management
 */
@Component({
  selector: 'app-example-state-integration',
  standalone: true,
  imports: [CommonModule, StepPromptInteractiveComponent],
  template: `
    <div class="max-w-4xl mx-auto p-6">
      <app-step-prompt-interactive
        [metadata]="metadata"
        [promptConfig]="promptConfig"
        (submitResponse)="onSubmit($event)"
        (stepViewStart)="onViewStart($event)"
        (stepViewComplete)="onViewComplete($event)"
        (hintRequested)="onHintRequested($event)"
      />
    </div>
  `
})
export class ExampleStateIntegrationComponent {
  metadata = STEP_PROMPT_INTERACTIVE_METADATA;
  promptConfig: StepPromptConfig = {
    title: 'State Management Example',
    promptType: 'task',
    bodyMD: 'This example shows integration with state management.',
    requiresSubmission: true,
    inputType: 'textarea',
    inputPlaceholder: 'Enter your response...',
    inputLabel: 'Your Answer',
    difficulty: 'medium',
    estimatedMinutes: 3,
    ctaPrimary: {
      label: 'Submit',
      action: 'submit'
    },
    ctaSecondary: {
      showHint: true
    },
    integrations: {
      showHintPanel: true
    }
  };

  onSubmit(event: { id: string; response: string; stepNumber?: number }) {
    // Dispatch action to state store
    // this.store.dispatch(submitStepResponse({ widgetId: event.id, response: event.response }));
    console.log('Dispatching submit action:', event);
  }

  onViewStart(telemetry: any) {
    // Track in analytics store
    // this.store.dispatch(trackStepView({ ...telemetry }));
    console.log('Dispatching view start:', telemetry);
  }

  onViewComplete(telemetry: any) {
    // Track in analytics store
    // this.store.dispatch(trackStepComplete({ ...telemetry }));
    console.log('Dispatching view complete:', telemetry);
  }

  onHintRequested(event: { id: string; source: 'button' | 'hotkey' }) {
    // Update hint usage in store, possibly adjust difficulty
    // this.store.dispatch(requestHint({ ...event }));
    console.log('Dispatching hint request:', event);
  }
}

