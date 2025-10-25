/**
 * Short Answer Widget - Usage Examples
 * 
 * This file demonstrates various configurations and use cases
 * for the Short Answer widget.
 */

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ShortAnswerComponent, ShortAnswerProps } from './short-answer';
import { SHORT_ANSWER_METADATA } from './short-answer.metadata';

@Component({
  selector: 'app-short-answer-examples',
  standalone: true,
  imports: [CommonModule, ShortAnswerComponent],
  template: `
    <div class="space-y-8 p-6">
      <h1 class="text-3xl font-bold text-[#e5e7eb] mb-8">Short Answer Widget Examples</h1>
      
      <!-- Example 1: Exact Match -->
      <section>
        <h2 class="text-2xl font-semibold text-[#e5e7eb] mb-4">1. Exact Match Validation</h2>
        <app-short-answer
          id="example-exact"
          question="What is the capital of France?"
          placeholder="Enter your answer..."
          [validation]="{
            mode: 'exact',
            expected: ['Paris'],
            caseSensitive: false
          }"
          (submit)="handleSubmit($event)"
        />
      </section>
      
      <!-- Example 2: Contains Validation -->
      <section>
        <h2 class="text-2xl font-semibold text-[#e5e7eb] mb-4">2. Contains Keywords Validation</h2>
        <app-short-answer
          id="example-contains"
          question="Name any organ in the human respiratory system."
          [validation]="{
            mode: 'contains',
            expected: ['lung', 'trachea', 'bronchi', 'diaphragm', 'alveoli'],
            caseSensitive: false
          }"
          correctFeedback="Correct! That is part of the respiratory system."
          incorrectFeedback="Think about the organs involved in breathing."
          (submit)="handleSubmit($event)"
        />
      </section>
      
      <!-- Example 3: Similarity Validation -->
      <section>
        <h2 class="text-2xl font-semibold text-[#e5e7eb] mb-4">3. Fuzzy/Similarity Validation</h2>
        <app-short-answer
          id="example-similarity"
          question="H₂O is the chemical formula for?"
          [validation]="{
            mode: 'similarity',
            expected: ['water'],
            similarityThreshold: 0.8
          }"
          (submit)="handleSubmit($event)"
        />
      </section>
      
      <!-- Example 4: Open-Ended -->
      <section>
        <h2 class="text-2xl font-semibold text-[#e5e7eb] mb-4">4. Open-Ended (No Validation)</h2>
        <app-short-answer
          id="example-open"
          question="Reflect on what you learned today. What was the most interesting concept?"
          [validation]="{
            mode: 'none',
            expected: []
          }"
          [maxLength]="500"
          [minLength]="50"
          correctFeedback="Thank you for your reflection!"
          (submit)="handleSubmit($event)"
        />
      </section>
      
      <!-- Example 5: Compact Variant -->
      <section>
        <h2 class="text-2xl font-semibold text-[#e5e7eb] mb-4">5. Compact Variant</h2>
        <app-short-answer
          id="example-compact"
          question="What is 5 × 7?"
          [validation]="{
            mode: 'exact',
            expected: ['35']
          }"
          [ui]="{
            variant: 'compact',
            showCharCount: false
          }"
          (submit)="handleSubmit($event)"
        />
      </section>
    </div>
  `
})
export class ShortAnswerExamplesComponent {
  handleSubmit(event: any): void {
    console.log('Answer submitted:', event);
  }
}

/**
 * Usage in a Module or Lab Context
 */
export const SHORT_ANSWER_WIDGET_USAGE_EXAMPLES = {
  /**
   * Basic usage in a component
   */
  basic: `
    <!-- In your component template -->
    <app-short-answer
      [metadata]="shortAnswerMetadata"
      [answerConfig]="shortAnswerConfig"
      (answerSubmit)="onAnswerSubmit($event)"
      (answerChange)="onAnswerChange($event)"
    />
    
    // In your component TypeScript
    import { Component } from '@angular/core';
    import { ShortAnswerComponent, ShortAnswerConfig } from '@/components/widgets/core/short-answer/short-answer';
    import { SHORT_ANSWER_METADATA } from '@/components/widgets/core/short-answer/short-answer.metadata';
    
    @Component({
      selector: 'app-my-component',
      standalone: true,
      imports: [ShortAnswerComponent],
      // ...
    })
    export class MyComponent {
      shortAnswerMetadata = SHORT_ANSWER_METADATA;
      shortAnswerConfig: ShortAnswerConfig = {
        id: 'my-short-answer-1',
        question: 'What is the capital of France?',
        validation: {
          mode: 'exact',
          expected: ['Paris'],
          caseSensitive: false
        }
      };
      
      onAnswerSubmit(event: any) {
        console.log('Submitted:', event);
      }
      
      onAnswerChange(value: string) {
        console.log('Answer changed:', value);
      }
    }
  `,
  
  /**
   * With custom validation function
   */
  customValidation: `
    // Create a config with custom validation
    shortAnswerConfig: ShortAnswerConfig = {
      id: 'math-answer-1',
      question: 'What is 5 × 7?',
      validation: {
        mode: 'exact',
        expected: ['35'],
        caseSensitive: false,
        ignoreWhitespace: true
      },
      maxLength: 10,
      minLength: 1
    };
    
    // Handle validation in your component
    onAnswerSubmit(event: { value: string; isCorrect: boolean; feedback?: string }) {
      if (event.isCorrect) {
        // Proceed to next question or show success message
        this.nextQuestion();
      } else {
        // Provide additional help or retry
        this.showHint();
      }
    }
  `,
  
  /**
   * Multiple answers accepted (contains mode)
   */
  multipleAnswers: `
    shortAnswerConfig: ShortAnswerConfig = {
      id: 'biology-answer-1',
      question: 'Name any organ in the human respiratory system.',
      validation: {
        mode: 'contains',
        expected: ['lung', 'trachea', 'bronchi', 'diaphragm', 'alveoli'],
        caseSensitive: false,
        ignoreWhitespace: true
      },
      correctFeedback: 'Correct! That is part of the respiratory system.',
      incorrectFeedback: 'Think about the organs involved in breathing.'
    };
  `,
  
  /**
   * Open-ended reflection
   */
  openEnded: `
    reflectionConfig: ShortAnswerConfig = {
      id: 'reflection-1',
      question: 'Reflect on what you learned today. What was the most interesting concept?',
      validation: {
        mode: 'none',
        expected: []
      },
      maxLength: 500,
      minLength: 50,
      ui: {
        variant: 'default',
        showCharCount: true,
        autoResize: true
      },
      showFeedback: true,
      correctFeedback: 'Thank you for your reflection!'
    };
  `,
  
  /**
   * Inline compact usage
   */
  compact: `
    quickQuizConfig: ShortAnswerConfig = {
      id: 'quick-quiz-1',
      question: 'H₂O is the chemical formula for?',
      placeholder: 'Answer',
      validation: {
        mode: 'exact',
        expected: ['water', 'Water'],
        caseSensitive: false
      },
      maxLength: 20,
      minLength: 1,
      ui: {
        variant: 'compact',
        showCharCount: false,
        autoResize: false
      }
    };
  `
};

