// Widget System Barrel Exports

// Base Widget
export * from './base/widget-base';

// Core Widgets
export * from './core/step-prompt/step-prompt';
export * from './core/step-prompt/step-prompt-interactive';
export * from './core/step-prompt/step-prompt-interactive.metadata';
export * from './core/coach-chat/coach-chat';
export * from './core/coach-chat/coach-chat.metadata';
export * from './core/reflection-prompt/reflection-prompt';
export * from './core/reflection-prompt/reflection-prompt.metadata';
export * from './core/timer/timer';
export * from './core/timer/timer.metadata';
export { LabIntroComponent } from './core/lab-intro/lab-intro';
export type { LabDifficulty } from './core/lab-intro/lab-intro';
export type { LabIntroVariant } from './core/lab-intro/lab-intro';
export type { LabIntroState } from './core/lab-intro/lab-intro';
export type { SecondaryAction } from './core/lab-intro/lab-intro';
export type { RequirementType } from './core/lab-intro/lab-intro';
export type { Requirement } from './core/lab-intro/lab-intro';
export type { SyllabusStep } from './core/lab-intro/lab-intro';
export type { Progress } from './core/lab-intro/lab-intro';
export type { SecondaryCTA } from './core/lab-intro/lab-intro';
export type { LabIntroPolicy } from './core/lab-intro/lab-intro';
export type { LabIntroUI } from './core/lab-intro/lab-intro';
export type { LabIntroCTA } from './core/lab-intro/lab-intro';
export type { LabIntroIntegrations } from './core/lab-intro/lab-intro';
export type { LabIntroTelemetry } from './core/lab-intro/lab-intro';
export type { LabIntroViewedPayload } from './core/lab-intro/lab-intro';
export type { LabIntroExpandCollapsePayload } from './core/lab-intro/lab-intro';
export type { LabIntroPrereqAckPayload } from './core/lab-intro/lab-intro';
export type { LabIntroStartPayload } from './core/lab-intro/lab-intro';
export type { LabIntroSecondaryPayload } from './core/lab-intro/lab-intro';
export * from './core/lab-intro/lab-intro.metadata';
export { MultipleChoiceComponent } from './core/multiple-choice/multiple-choice';
export type { SelectionMode } from './core/multiple-choice/multiple-choice';
export type { ChoiceStatus } from './core/multiple-choice/multiple-choice';
export type { ChoiceOption } from './core/multiple-choice/multiple-choice';
export type { MultipleChoiceUI } from './core/multiple-choice/multiple-choice';
export type { MultipleChoiceChangePayload } from './core/multiple-choice/multiple-choice';
export type { MultipleChoiceSubmitPayload } from './core/multiple-choice/multiple-choice';
export * from './core/multiple-choice/multiple-choice.metadata';
export { ShortAnswerComponent } from './core/short-answer/short-answer';
export type { ValidationMode } from './core/short-answer/short-answer';
export type { ShortAnswerState } from './core/short-answer/short-answer';
export type { ValidationRule } from './core/short-answer/short-answer';
export type { ShortAnswerUI } from './core/short-answer/short-answer';
export type { ShortAnswerProps } from './core/short-answer/short-answer';
export type { ShortAnswerFeedback } from './core/short-answer/short-answer';
export * from './core/short-answer/short-answer.metadata';
export { FillInBlanksComponent } from './core/fill-in-blanks/fill-in-blanks';
export type { BlankType } from './core/fill-in-blanks/fill-in-blanks';
export type { FillInBlanksState } from './core/fill-in-blanks/fill-in-blanks';
export type { Blank } from './core/fill-in-blanks/fill-in-blanks';
export type { FillInBlanksUI } from './core/fill-in-blanks/fill-in-blanks';
export type { FillInBlanksProps } from './core/fill-in-blanks/fill-in-blanks';
export type { TemplateSegment } from './core/fill-in-blanks/fill-in-blanks';
export * from './core/fill-in-blanks/fill-in-blanks.metadata';
export { MatchingPairsComponent } from './core/matching-pairs/matching-pairs';
export type { MatchMode } from './core/matching-pairs/matching-pairs';
export type { MatchingPairsState } from './core/matching-pairs/matching-pairs';
export type { MatchItem } from './core/matching-pairs/matching-pairs';
export type { CorrectMatch } from './core/matching-pairs/matching-pairs';
export type { MatchingPairsUI } from './core/matching-pairs/matching-pairs';
export type { MatchingPairsProps } from './core/matching-pairs/matching-pairs';
export * from './core/matching-pairs/matching-pairs.metadata';
export { OrderingComponent } from './core/ordering/ordering';
export type { OrderingMode } from './core/ordering/ordering';
export type { OrderingState } from './core/ordering/ordering';
export type { OrderItem } from './core/ordering/ordering';
export type { OrderingUI } from './core/ordering/ordering';
export type { OrderingProps } from './core/ordering/ordering';
export * from './core/ordering/ordering.metadata';
export { NumericInputComponent } from './core/numeric-input/numeric-input';
export type { NumericValidation } from './core/numeric-input/numeric-input';
export type { NumericInputState } from './core/numeric-input/numeric-input';
export type { NumericConstraint } from './core/numeric-input/numeric-input';
export type { NumericInputUI } from './core/numeric-input/numeric-input';
export type { NumericInputProps } from './core/numeric-input/numeric-input';
export * from './core/numeric-input/numeric-input.metadata';
export { ErrorExplainComponent } from './core/error-explain/error-explain';
export type { ErrorExplainUI } from './core/error-explain/error-explain';
export type { ErrorExplainProps } from './core/error-explain/error-explain';
export * from './core/error-explain/error-explain.metadata';
export { OutcomeSummaryComponent } from './core/outcome-summary/outcome-summary';
export type { OutcomeType } from './core/outcome-summary/outcome-summary';
export type { LabOutcome } from './core/outcome-summary/outcome-summary';
export type { NextLabSuggestion } from './core/outcome-summary/outcome-summary';
export type { OutcomeSummaryUI } from './core/outcome-summary/outcome-summary';
export * from './core/outcome-summary/outcome-summary.metadata';
export { AdaptiveSummaryComponent } from './core/adaptive-summary/adaptive-summary';
export type { AdaptationReason } from './core/adaptive-summary/adaptive-summary';
export type { SkillAssessment } from './core/adaptive-summary/adaptive-summary';
export type { Adaptation } from './core/adaptive-summary/adaptive-summary';
export type { AdaptiveSummaryUI } from './core/adaptive-summary/adaptive-summary';
export * from './core/adaptive-summary/adaptive-summary.metadata';
export { GoalSetterComponent } from './core/goal-setter/goal-setter';
export type { GoalType } from './core/goal-setter/goal-setter';
export type { GoalStatus } from './core/goal-setter/goal-setter';
export type { LearningGoal } from './core/goal-setter/goal-setter';
export type { GoalSetterUI } from './core/goal-setter/goal-setter';
export * from './core/goal-setter/goal-setter.metadata';
export { CheckpointComponent } from './core/checkpoint/checkpoint';
export type { CheckpointState } from './core/checkpoint/checkpoint';
export type { CheckpointUI } from './core/checkpoint/checkpoint';
export type { CheckpointSaveData } from './core/checkpoint/checkpoint';
export * from './core/checkpoint/checkpoint.metadata';
export * from './core/hint-panel/hint-panel';
export * from './core/feedback-box/feedback-box';
export * from './core/confidence-meter/confidence-meter';

// Review Loop
export { ReviewLoopComponent } from './core/review-loop/review-loop';
export * from './core/review-loop/review-loop.metadata';

// Console Output
export { ConsoleOutputComponent } from './coding/console-output/console-output';
export * from './coding/console-output/console-output.metadata';

// Category-Specific Widgets
export * from './coding/code-editor/code-editor';
export * from './math/equation-input/equation-input';
export * from './writing/text-editor/text-editor';

// Module Components
export * from '../modules/module-container/module-container';
