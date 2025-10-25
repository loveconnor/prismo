/**
 * Widget Showcase Component
 * 
 * This component demonstrates all the widgets available in the app,
 * including the new StepPromptInteractiveComponent.
 */

import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StepPromptInteractiveComponent } from '../../components/widgets/core/step-prompt/step-prompt-interactive';
import { 
  STEP_PROMPT_INTERACTIVE_METADATA,
  STEP_PROMPT_EXAMPLES 
} from '../../components/widgets/core/step-prompt/step-prompt-interactive.metadata';
import { StepPromptConfig } from '../../components/widgets/core/step-prompt/step-prompt-interactive';
import { CoachChatComponent } from '../../components/widgets/core/coach-chat/coach-chat';
import { COACH_CHAT_METADATA } from '../../components/widgets/core/coach-chat/coach-chat.metadata';
import { CoachContext } from '../../components/widgets/core/coach-chat/coach-chat';
import { ReflectionPromptComponent } from '../../components/widgets/core/reflection-prompt/reflection-prompt';
import { REFLECTION_PROMPT_METADATA } from '../../components/widgets/core/reflection-prompt/reflection-prompt.metadata';
import { TimerComponent } from '../../components/widgets/core/timer/timer';
import { TIMER_METADATA } from '../../components/widgets/core/timer/timer.metadata';
import { LabIntroComponent } from '../../components/widgets/core/lab-intro/lab-intro';
import { LAB_INTRO_METADATA } from '../../components/widgets/core/lab-intro/lab-intro.metadata';
import { MultipleChoiceComponent } from '../../components/widgets/core/multiple-choice/multiple-choice';
import { MULTIPLE_CHOICE_METADATA } from '../../components/widgets/core/multiple-choice/multiple-choice.metadata';
import { ShortAnswerComponent } from '../../components/widgets/core/short-answer/short-answer';
import { SHORT_ANSWER_METADATA } from '../../components/widgets/core/short-answer/short-answer.metadata';
import { FillInBlanksComponent } from '../../components/widgets/core/fill-in-blanks/fill-in-blanks';
import { FILL_IN_BLANKS_METADATA } from '../../components/widgets/core/fill-in-blanks/fill-in-blanks.metadata';
import { WidgetInputType, WidgetOutputType } from '../../types/widget.types';
import { ButtonComponent } from '../../components/ui/button/button';
import { CardComponent } from '../../components/ui/card/card';
import { CardHeaderComponent } from '../../components/ui/card/card-header';
import { CardContentComponent } from '../../components/ui/card/card-content';
import { TabsComponent } from '../../components/ui/tabs/tabs';
import { TabsListComponent } from '../../components/ui/tabs/tabs-list';
import { TabsTriggerComponent } from '../../components/ui/tabs/tabs-trigger';
import { TabsContentComponent } from '../../components/ui/tabs/tabs-content';

@Component({
  selector: 'app-widget-showcase',
  standalone: true,
  imports: [
    CommonModule,
    StepPromptInteractiveComponent,
    CoachChatComponent,
    ReflectionPromptComponent,
    TimerComponent,
    LabIntroComponent,
    MultipleChoiceComponent,
    ShortAnswerComponent,
    FillInBlanksComponent,
    ButtonComponent,
    CardComponent,
    CardHeaderComponent,
    CardContentComponent,
    TabsComponent,
    TabsListComponent,
    TabsTriggerComponent,
    TabsContentComponent
  ],
  templateUrl: './widget-showcase.component.html',
  styleUrls: ['./widget-showcase.component.css']
})
export class WidgetShowcaseComponent {
  // Expose enums for template use
  WidgetInputType = WidgetInputType;
  WidgetOutputType = WidgetOutputType;
  
  // Current active example
  activeExample = signal<string>('simple');

  // Widget examples
  examples = {
    simple: {
      name: 'Simple Reading',
      description: 'A basic instructional prompt',
      metadata: STEP_PROMPT_EXAMPLES.simpleReading.metadata,
      config: STEP_PROMPT_EXAMPLES.simpleReading.config
    },
    coding: {
      name: 'Coding Challenge',
      description: 'Interactive coding exercise with hints',
      metadata: STEP_PROMPT_EXAMPLES.codingChallenge.metadata,
      config: STEP_PROMPT_EXAMPLES.codingChallenge.config
    },
    assessment: {
      name: 'Timed Assessment',
      description: 'Assessment with countdown timer',
      metadata: STEP_PROMPT_EXAMPLES.timedAssessment.metadata,
      config: {
        ...STEP_PROMPT_EXAMPLES.timedAssessment.config,
        timeRemainingMs: 180000 // Reset timer
      }
    },
    media: {
      name: 'With Media',
      description: 'Emphatic prompt with images',
      metadata: STEP_PROMPT_EXAMPLES.emphaticWithMedia.metadata,
      config: STEP_PROMPT_EXAMPLES.emphaticWithMedia.config
    }
  };

  // Custom interactive example
  customExample = {
    metadata: {
      ...STEP_PROMPT_INTERACTIVE_METADATA,
      id: 'custom-showcase-example',
      skills: ['demonstration', 'example']
    },
    config: {
      title: 'Try It Yourself!',
      stepNumber: 1,
      totalSteps: 1,
      promptType: 'question' as const,
      bodyMD: `
# Interactive Widget Demo

This is the **StepPromptInteractiveComponent** in action!

Try entering your answer below and click submit. You can also:
- Press **H** to show hints
- Press **Enter** to submit
- Press **Escape** to close hints

**Question:** What is the capital of the United States?
      `,
      tip: 'The capital is named after the first U.S. President.',
      requiresSubmission: true,
      inputType: 'text' as const,
      inputPlaceholder: 'Enter city name...',
      inputLabel: 'Your Answer',
      validateInput: (value: string) => {
        if (!value.trim()) return 'Please enter an answer';
        return null;
      },
      difficulty: 'easy' as const,
      estimatedMinutes: 1,
      skillTags: ['geography', 'capitals', 'usa'],
      ctaPrimary: {
        label: 'Submit Answer',
        action: 'submit' as const
      },
      ctaSecondary: {
        showHint: true,
        openCoach: true
      },
      integrations: {
        showHintPanel: true,
        showFeedbackBox: true,
        showCoach: true
      },
      variant: 'default' as const
    }
  };

  // Event tracking
  events = signal<any[]>([]);

  // Coach chat context
  coachContext: CoachContext = {
    stepPromptMD: 'Write a function that calculates factorial recursively.',
    visibleHints: [],
    recentAttempts: 0,
    lastErrorSignature: 'RecursionError: maximum recursion depth exceeded',
    domain: 'coding',
    skillTags: ['recursion', 'functions', 'base-case'],
    userCodePreview: 'def factorial(n):\n    return n * factorial(n-1)',
  };

  get currentExample() {
    const exampleKey = this.activeExample() as keyof typeof this.examples;
    return this.examples[exampleKey];
  }

  selectExample(key: string) {
    this.activeExample.set(key);
    this.clearEvents();
  }

  // Event handlers with logging
  handlePrimaryAction(event: any) {
    this.logEvent('Primary Action', event);
    console.log('Primary action triggered:', event);
  }

  handleSubmit(event: any) {
    this.logEvent('Submit Response', event);
    console.log('Response submitted:', event);
    
    // Check if answer is correct
    const answer = event.response.trim().toLowerCase();
    if (answer === 'washington' || answer === 'washington d.c.' || answer === 'washington dc') {
      alert('✅ Correct! Washington, D.C. is the capital of the United States.');
    } else {
      alert('❌ Not quite. Try again!');
    }
  }

  handleHintRequest(event: any) {
    this.logEvent('Hint Requested', event);
    console.log('Hint requested:', event);
    alert('💡 Hint: The city shares its name with the first U.S. President.');
  }

  handleHintOpen(event: any) {
    this.logEvent('Hint Opened', event);
    console.log('Hint opened:', event);
  }

  handleViewStart(event: any) {
    this.logEvent('View Start', event);
    console.log('Step view started:', event);
  }

  handleViewComplete(event: any) {
    this.logEvent('View Complete', event);
    console.log('Step view completed:', event);
  }

  handleTimeUp() {
    this.logEvent('Time Up', {});
    console.log('Timer expired');
    alert('⏰ Time is up!');
  }

  logEvent(type: string, data: any) {
    const event = {
      type,
      data,
      timestamp: new Date().toISOString()
    };
    this.events.update(events => [event, ...events].slice(0, 10)); // Keep last 10 events
  }

  private clearEvents() {
    this.events.set([]);
  }

  // Short Answer event handlers
  handleShortAnswerSubmit(event: any) {
    this.logEvent('Short Answer Submitted', event);
    console.log('Short answer submitted:', event);
  }

  handleShortAnswerChange(event: any) {
    this.logEvent('Short Answer Changed', event);
    console.log('Short answer changed:', event);
  }

  // Fill-in-the-Blanks event handlers
  handleFillInBlanksSubmit(event: any) {
    this.logEvent('Fill-in-Blanks Submitted', event);
    console.log('Fill-in-blanks submitted:', event);
  }

  handleFillInBlanksChange(event: any) {
    this.logEvent('Fill-in-Blanks Changed', event);
    console.log('Fill-in-blanks changed:', event);
  }
}

