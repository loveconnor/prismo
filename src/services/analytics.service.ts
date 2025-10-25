import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class Analytics {

  constructor(private http: HttpClient) { }

  onWidgetCompletion(data: { moduleId: string; widgetId: string; timeSpent: number; attempts: number; }): Observable<any> {
    const payload = {
      moduleId: data.moduleId,
      widgetId: data.widgetId,
      timeSpent: data.timeSpent,
      attempts: data.attempts
    };
    return this.http.post('/api/analytics/widget-completion', payload);
  }

  onWidgetSelection(data: { moduleId: string; widgetId: string; selectedOption: string; }): Observable<any> {
    const payload = {
      moduleId: data.moduleId,
      widgetId: data.widgetId,
      selectedOption: data.selectedOption
    };
    return this.http.post('/api/analytics/widget-selection', payload);
  }

  onFeedbackGenerated(data: { 
    moduleId: string; 
    widgetId: string; 
    feedbackText: string; 
    rating: number; 
    time_spent: number; 
    attempts_taken: number;
    moduleTitle?: string;
    moduleDescription?: string;
    moduleDifficulty?: number;
    moduleSkills?: string[];
    estimatedDuration?: number;
    totalWidgets?: number;
    completionPercentage?: number;
  }): Observable<any> {
    const payload = {
      moduleId: data.moduleId,
      widgetId: data.widgetId,
      feedbackText: data.feedbackText,
      rating: data.rating,
      time_spent: data.time_spent,
      attempts_taken: data.attempts_taken,
      // 🎯 INCLUDE MODULE METADATA IN PAYLOAD
      module_metadata: {
        title: data.moduleTitle,
        description: data.moduleDescription,
        difficulty: data.moduleDifficulty,
        skills: data.moduleSkills,
        estimated_duration: data.estimatedDuration,
        total_widgets: data.totalWidgets,
        completion_percentage: data.completionPercentage
      }
    };
    return this.http.post('/api/analytics/feedback-generated', payload);
  }

  updateMasteryScore(data: { moduleId: string; widgetId: string; masteryScore: number; }): Observable<any> {
    const payload = {
      moduleId: data.moduleId,
      widgetId: data.widgetId,
      masteryScore: data.masteryScore
    };
    return this.http.post('/api/analytics/update-mastery-score', payload);
  }
}