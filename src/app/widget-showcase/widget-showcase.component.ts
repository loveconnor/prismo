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
import { MatchingPairsComponent } from '../../components/widgets/core/matching-pairs/matching-pairs';
import { MATCHING_PAIRS_METADATA } from '../../components/widgets/core/matching-pairs/matching-pairs.metadata';
import { MatchItem, CorrectMatch } from '../../components/widgets/core/matching-pairs/matching-pairs';
import { OrderingComponent } from '../../components/widgets/core/ordering/ordering';
import { ORDERING_METADATA } from '../../components/widgets/core/ordering/ordering.metadata';
import { OrderItem } from '../../components/widgets/core/ordering/ordering';
import { NumericInputComponent } from '../../components/widgets/core/numeric-input/numeric-input';
import { NUMERIC_INPUT_METADATA } from '../../components/widgets/core/numeric-input/numeric-input.metadata';
import { NumericConstraint } from '../../components/widgets/core/numeric-input/numeric-input';
import { ErrorExplainComponent } from '../../components/widgets/core/error-explain/error-explain';
import { ERROR_EXPLAIN_METADATA } from '../../components/widgets/core/error-explain/error-explain.metadata';
import { CheckpointComponent } from '../../components/widgets/core/checkpoint/checkpoint';
import { CHECKPOINT_METADATA } from '../../components/widgets/core/checkpoint/checkpoint.metadata';
import { OutcomeSummaryComponent } from '../../components/widgets/core/outcome-summary/outcome-summary';
import { OUTCOME_SUMMARY_METADATA } from '../../components/widgets/core/outcome-summary/outcome-summary.metadata';
import { AdaptiveSummaryComponent } from '../../components/widgets/core/adaptive-summary/adaptive-summary';
import { ADAPTIVE_SUMMARY_METADATA } from '../../components/widgets/core/adaptive-summary/adaptive-summary.metadata';
import { GoalSetterComponent } from '../../components/widgets/core/goal-setter/goal-setter';
import { GoalType, LearningGoal } from '../../components/widgets/core/goal-setter/goal-setter';
import { GOAL_SETTER_METADATA } from '../../components/widgets/core/goal-setter/goal-setter.metadata';
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
    MatchingPairsComponent,
    OrderingComponent,
    NumericInputComponent,
    ErrorExplainComponent,
    CheckpointComponent,
    OutcomeSummaryComponent,
    AdaptiveSummaryComponent,
    GoalSetterComponent,
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
  }

  handleSubmit(event: any) {
    this.logEvent('Submit Response', event);
    
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
    alert('💡 Hint: The city shares its name with the first U.S. President.');
  }

  handleHintOpen(event: any) {
    this.logEvent('Hint Opened', event);
  }

  handleViewStart(event: any) {
    this.logEvent('View Start', event);
  }

  handleViewComplete(event: any) {
    this.logEvent('View Complete', event);
  }

  handleTimeUp() {
    this.logEvent('Time Up', {});
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
  }

  handleShortAnswerChange(event: any) {
    this.logEvent('Short Answer Changed', event);
  }

  // Fill-in-blanks event handlers
  handleFillInBlanksSubmit(event: any) {
    this.logEvent('Fill-in-Blanks Submitted', event);
    console.log('Fill-in-blanks submitted:', event);
  }

  handleFillInBlanksChange(event: any) {
    this.logEvent('Fill-in-Blanks Answers Changed', event);
    console.log('Fill-in-blanks changed:', event);
  }

  // Template strings for fill-in-blanks examples
  fibTemplate1 = 'The quick brown {{animal}} jumps over the lazy {{animal2}}.';
  fibTemplate2 = 'If x + {{num1}} = {{num2}}, and we subtract {{num3}} from both sides, then x = {{answer}}.';
  fibTemplate3 = 'JavaScript is an {{type}} programming language that runs in the {{environment}}.';
  fibTemplate4 = 'Photosynthesis occurs in {{organelle}} which contain the green pigment {{pigment}}. Plants use {{gas}} from the air and produce {{sugar}}.';
  fibTemplate5 = 'The capital of {{country}} is {{city}}.';

  // Matching Pairs event handlers
  handleMatchingPairsMatch(event: any) {
    this.logEvent('Match Created', event);
    console.log('Match created:', event);
  }

  handleMatchingPairsUnmatch(event: any) {
    this.logEvent('Match Removed', event);
    console.log('Match removed:', event);
  }

  handleMatchingPairsComplete(event: any) {
    this.logEvent('Matching Pairs Complete', event);
    console.log('Matching pairs completed:', event);
  }

  // Matching Pairs example data
  vocabularyLeft: MatchItem[] = [
    { id: 'def1', label: 'Ephemeral', type: 'left' },
    { id: 'def2', label: 'Ubiquitous', type: 'left' },
    { id: 'def3', label: 'Serendipity', type: 'left' },
    { id: 'def4', label: 'Ambiguous', type: 'left' }
  ];

  vocabularyRight: MatchItem[] = [
    { id: 'word1', label: 'Lasting for a very short time', type: 'right' },
    { id: 'word2', label: 'Present everywhere', type: 'right' },
    { id: 'word3', label: 'Happy accident or fortunate discovery', type: 'right' },
    { id: 'word4', label: 'Open to multiple interpretations', type: 'right' }
  ];

  vocabularyMatches: CorrectMatch[] = [
    { leftId: 'def1', rightId: 'word1', explanation: 'Ephemeral means lasting for a very short time, like a brief moment.' },
    { leftId: 'def2', rightId: 'word2', explanation: 'Ubiquitous means present everywhere or found everywhere.' },
    { leftId: 'def3', rightId: 'word3', explanation: 'Serendipity is the occurrence of a happy accident or fortunate discovery.' },
    { leftId: 'def4', rightId: 'word4', explanation: 'Ambiguous means open to multiple interpretations or unclear.' }
  ];

  // Programming concepts
  programmingLeft: MatchItem[] = [
    { id: 'concept1', label: 'Variable', type: 'left', category: 'Fundamentals' },
    { id: 'concept2', label: 'Loop', type: 'left', category: 'Control Flow' },
    { id: 'concept3', label: 'Function', type: 'left', category: 'Fundamentals' },
    { id: 'concept4', label: 'Array', type: 'left', category: 'Data Structures' },
    { id: 'concept5', label: 'Object', type: 'left', category: 'Data Structures' }
  ];

  programmingRight: MatchItem[] = [
    { id: 'desc1', label: 'Stores a single value', type: 'right', category: 'Fundamentals' },
    { id: 'desc2', label: 'Repeats code multiple times', type: 'right', category: 'Control Flow' },
    { id: 'desc3', label: 'Reusable block of code', type: 'right', category: 'Fundamentals' },
    { id: 'desc4', label: 'Ordered collection of items', type: 'right', category: 'Data Structures' },
    { id: 'desc5', label: 'Collection of key-value pairs', type: 'right', category: 'Data Structures' }
  ];

  programmingMatches: CorrectMatch[] = [
    { leftId: 'concept1', rightId: 'desc1', explanation: 'A variable stores a single value that can be changed.' },
    { leftId: 'concept2', rightId: 'desc2', explanation: 'A loop repeats code multiple times until a condition is met.' },
    { leftId: 'concept3', rightId: 'desc3', explanation: 'A function is a reusable block of code that performs a specific task.' },
    { leftId: 'concept4', rightId: 'desc4', explanation: 'An array is an ordered collection of items accessed by index.' },
    { leftId: 'concept5', rightId: 'desc5', explanation: 'An object is a collection of key-value pairs representing properties.' }
  ];

  // Historical events
  historyLeft: MatchItem[] = [
    { id: 'event1', label: '1776', type: 'left' },
    { id: 'event2', label: '1969', type: 'left' },
    { id: 'event3', label: '1945', type: 'left' }
  ];

  historyRight: MatchItem[] = [
    { id: 'desc1h', label: 'Moon landing', type: 'right' },
    { id: 'desc2h', label: 'US Declaration of Independence', type: 'right' },
    { id: 'desc3h', label: 'End of World War II', type: 'right' }
  ];

  historyMatches: CorrectMatch[] = [
    { leftId: 'event1', rightId: 'desc2h' },
    { leftId: 'event2', rightId: 'desc1h' },
    { leftId: 'event3', rightId: 'desc3h' }
  ];

  // Science - Chemical symbols
  scienceLeft: MatchItem[] = [
    { id: 'symbol1', label: 'H₂O', type: 'left' },
    { id: 'symbol2', label: 'CO₂', type: 'left' },
    { id: 'symbol3', label: 'NaCl', type: 'left' },
    { id: 'symbol4', label: 'O₂', type: 'left' }
  ];

  scienceRight: MatchItem[] = [
    { id: 'name1', label: 'Water', type: 'right' },
    { id: 'name2', label: 'Carbon Dioxide', type: 'right' },
    { id: 'name3', label: 'Salt', type: 'right' },
    { id: 'name4', label: 'Oxygen', type: 'right' }
  ];

  scienceMatches: CorrectMatch[] = [
    { leftId: 'symbol1', rightId: 'name1', explanation: 'H₂O is the chemical formula for water (2 hydrogen, 1 oxygen).' },
    { leftId: 'symbol2', rightId: 'name2', explanation: 'CO₂ is carbon dioxide (1 carbon, 2 oxygen).' },
    { leftId: 'symbol3', rightId: 'name3', explanation: 'NaCl is sodium chloride, commonly known as table salt.' },
    { leftId: 'symbol4', rightId: 'name4', explanation: 'O₂ is molecular oxygen, the form we breathe.' }
  ];

  // Goals demo data
  goalsDemo: LearningGoal[] = [
    { id: 'g1', type: 'learning' as GoalType, title: 'Master recursion', description: 'Practice recursive thinking daily', targetValue: 10, currentValue: 4, priority: 'high', status: 'active', createdAt: new Date(), tags: ['algorithms'] },
    { id: 'g2', type: 'time' as GoalType, title: 'Study 5 hours', targetValue: 300, currentValue: 120, priority: 'medium', status: 'active', createdAt: new Date(), deadline: new Date(Date.now() + 86400000) },
    { id: 'g3', type: 'completion' as GoalType, title: 'Finish two labs', description: 'Complete Labs 3 and 4', priority: 'low', status: 'completed', createdAt: new Date() }
  ];

  // Ordering event handlers
  handleOrderingReorder(event: any) {
    this.logEvent('Items Reordered', event);
    console.log('Items reordered:', event);
  }

  handleOrderingCheck(event: any) {
    this.logEvent('Order Checked', event);
    console.log('Order checked:', event);
  }

  handleOrderingComplete(event: any) {
    this.logEvent('Ordering Complete', event);
    console.log('Ordering completed:', event);
  }

  // Ordering example data - Steps in making a sandwich
  sandwichSteps: OrderItem[] = [
    { id: '1', content: 'Get two slices of bread', correctPosition: 1, explanation: 'Start with the foundation - the bread.' },
    { id: '2', content: 'Spread mayonnaise on one slice', correctPosition: 2, explanation: 'Add condiments before the fillings.' },
    { id: '3', content: 'Add lettuce and tomato', correctPosition: 3, explanation: 'Layer the vegetables first.' },
    { id: '4', content: 'Place cheese and meat', correctPosition: 4, explanation: 'Add the protein and dairy.' },
    { id: '5', content: 'Top with the second slice of bread', correctPosition: 5, explanation: 'Complete the sandwich with the top slice.' }
  ];

  // Ordering - Software development lifecycle
  sdlcSteps: OrderItem[] = [
    { id: '1', content: 'Requirements Gathering', correctPosition: 1, explanation: 'Understand what needs to be built.', category: 'Planning' },
    { id: '2', content: 'Design', correctPosition: 2, explanation: 'Plan the architecture and UI/UX.', category: 'Planning' },
    { id: '3', content: 'Implementation', correctPosition: 3, explanation: 'Write the actual code.', category: 'Development' },
    { id: '4', content: 'Testing', correctPosition: 4, explanation: 'Verify the software works correctly.', category: 'Quality Assurance' },
    { id: '5', content: 'Deployment', correctPosition: 5, explanation: 'Release the software to users.', category: 'Operations' },
    { id: '6', content: 'Maintenance', correctPosition: 6, explanation: 'Fix bugs and add features.', category: 'Operations' }
  ];

  // Ordering - Historical events
  historicalEvents: OrderItem[] = [
    { id: '1', content: 'Declaration of Independence (1776)', correctPosition: 1, explanation: 'The United States declared independence from Britain.' },
    { id: '2', content: 'Constitution Ratified (1788)', correctPosition: 2, explanation: 'The U.S. Constitution was ratified.' },
    { id: '3', content: 'Civil War (1861-1865)', correctPosition: 3, explanation: 'A war between the Union and Confederacy.' },
    { id: '4', content: 'World War I (1914-1918)', correctPosition: 4, explanation: 'The first global war.' },
    { id: '5', content: 'World War II (1939-1945)', correctPosition: 5, explanation: 'The second global war.' }
  ];

  // Ordering - Steps in a loop
  loopSteps: OrderItem[] = [
    { id: '1', content: 'Initialize counter variable', correctPosition: 1, explanation: 'Set up the loop control variable.' },
    { id: '2', content: 'Check condition', correctPosition: 2, explanation: 'Determine if loop should continue.' },
    { id: '3', content: 'Execute loop body', correctPosition: 3, explanation: 'Run the code inside the loop.' },
    { id: '4', content: 'Update counter', correctPosition: 4, explanation: 'Modify the loop control variable.' },
    { id: '5', content: 'Repeat from step 2', correctPosition: 5, explanation: 'Go back and check the condition again.' }
  ];

  // Numeric Input event handlers
  handleNumericInputChange(event: any) {
    this.logEvent('Numeric Input Changed', event);
  }

  handleNumericInputSubmit(event: any) {
    this.logEvent('Numeric Input Submitted', event);
  }

  // Error Explain event handlers
  handleErrorDismiss() {
    this.logEvent('Error Dismissed', {});
  }

  handleErrorFixApplied() {
    this.logEvent('Error Fix Applied', {});
  }
}

