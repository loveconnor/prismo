import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';
import { userInfo } from 'os';

@Injectable({
  providedIn: 'root'
})
export class Analytics {

  constructor(private http: HttpClient) { }


  // THis generates feedback from when a widget option is selected
  // To be stored in a users account for utilizing with an adaptive learning algorithm
  onWidgetSelection(data: { moduleId: string; widgetId: string; selectedOption: string; userId: string}): Observable<any> {
    const payload = {
      userId: data.userId,
      moduleId: data.moduleId,
      widgetId: data.widgetId,
      selectedOption: data.selectedOption
    };
    return this.http.post('/api/analytics/widget-selection', payload);
  }


  //This generates feedback from when a module is completed
  // To be stored in a users account for utilizing with an adaptive learning algorithm
  onFeedbackGenerated(data: { 
    userId: string;
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
      userId: data.userId,
      moduleId: data.moduleId,
      widgetId: data.widgetId,
      feedbackText: data.feedbackText,
      rating: data.rating,
      time_spent: data.time_spent,
      attempts_taken: data.attempts_taken,
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
}