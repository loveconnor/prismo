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
export * from './core/hint-panel/hint-panel';
export * from './core/feedback-box/feedback-box';
export * from './core/confidence-meter/confidence-meter';

// Category-Specific Widgets
export * from './coding/code-editor/code-editor';
export * from './math/equation-input/equation-input';
export * from './writing/text-editor/text-editor';

// Module Components
export * from '../modules/module-container/module-container';
