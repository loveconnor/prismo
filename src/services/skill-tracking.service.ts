import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../environments/environment';

export interface SkillUpdate {
  skill_tag: string;
  correct: boolean;
  widget_id?: string;
  module_id?: string;
  session_id?: string;
}

export interface MasteryRecord {
  id: string;
  user_id: string;
  skill_tag: string;
  level: string;
  progress: number;
  last_practiced: string;
  created_at: string;
  updated_at: string;
}

@Injectable({
  providedIn: 'root'
})
export class SkillTrackingService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/api/learning`;

  /**
   * Update skill mastery based on correct/incorrect answer
   */
  updateSkillFromAnswer(update: SkillUpdate): Observable<MasteryRecord | null> {
    const { skill_tag, correct } = update;
    
    console.log(`[SkillTracking] Updating skill "${skill_tag}" - ${correct ? 'CORRECT' : 'INCORRECT'}`);

    // First, get the current mastery record for this skill
    return this.getMasteryForSkill(skill_tag).pipe(
      map(mastery => {
        if (mastery) {
          // Update existing mastery
          const progressDelta = correct ? 0.1 : -0.05; // +10% for correct, -5% for incorrect
          const newProgress = Math.max(0, Math.min(1, mastery.progress + progressDelta));
          
          this.updateMastery(mastery.id, {
            progress: newProgress,
            last_practiced: new Date().toISOString()
          }).subscribe();
          
          return { ...mastery, progress: newProgress };
        } else {
          // Create new mastery record
          const initialProgress = correct ? 0.1 : 0.0;
          
          this.createMastery({
            skill_tag: skill_tag,
            level: 'learning',
            progress: initialProgress,
            last_practiced: new Date().toISOString()
          }).subscribe();
          
          return null;
        }
      }),
      catchError(error => {
        console.error('[SkillTracking] Error updating skill:', error);
        return of(null);
      })
    );
  }

  /**
   * Update skills from multiple-choice answer
   */
  updateSkillsFromMultipleChoice(
    skills: string[],
    correct: boolean,
    widgetId: string,
    moduleId: string,
    sessionId: string
  ): void {
    skills.forEach(skill => {
      this.updateSkillFromAnswer({
        skill_tag: skill,
        correct: correct,
        widget_id: widgetId,
        module_id: moduleId,
        session_id: sessionId
      }).subscribe({
        next: (mastery) => {
          if (mastery) {
            console.log(`[SkillTracking] Updated mastery for "${skill}":`, mastery);
          }
        },
        error: (error) => {
          console.error(`[SkillTracking] Failed to update skill "${skill}":`, error);
        }
      });
    });
  }

  /**
   * Get mastery record for a specific skill
   */
  private getMasteryForSkill(skillTag: string): Observable<MasteryRecord | null> {
    return this.http.get<{ mastery: MasteryRecord[] }>(`${this.apiUrl}/mastery?skill_tag=${skillTag}`)
      .pipe(
        map(response => {
          if (response.mastery && response.mastery.length > 0) {
            return response.mastery[0];
          }
          return null;
        }),
        catchError(error => {
          console.error('[SkillTracking] Error fetching mastery:', error);
          return of(null);
        })
      );
  }

  /**
   * Create new mastery record
   */
  private createMastery(data: Partial<MasteryRecord>): Observable<MasteryRecord | null> {
    return this.http.post<{ mastery: MasteryRecord }>(`${this.apiUrl}/mastery`, data)
      .pipe(
        map(response => response.mastery),
        catchError(error => {
          console.error('[SkillTracking] Error creating mastery:', error);
          return of(null);
        })
      );
  }

  /**
   * Update existing mastery record
   */
  private updateMastery(masteryId: string, data: Partial<MasteryRecord>): Observable<MasteryRecord | null> {
    return this.http.put<{ mastery: MasteryRecord }>(`${this.apiUrl}/mastery/${masteryId}`, data)
      .pipe(
        map(response => response.mastery),
        catchError(error => {
          console.error('[SkillTracking] Error updating mastery:', error);
          return of(null);
        })
      );
  }

  /**
   * Get all mastery records for the current user
   */
  getAllMastery(): Observable<MasteryRecord[]> {
    return this.http.get<{ mastery: MasteryRecord[] }>(`${this.apiUrl}/mastery`)
      .pipe(
        map(response => response.mastery || []),
        catchError(error => {
          console.error('[SkillTracking] Error fetching all mastery:', error);
          return of([]);
        })
      );
  }
}
