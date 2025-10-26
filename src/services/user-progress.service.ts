import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map, catchError, of } from 'rxjs';
import { environment } from '../environments/environment';
import { AuthService } from './auth.service';
import { LabsService } from './labs.service';

export interface UserLabProgress {
  lab_id: string;
  status: 'not_started' | 'started' | 'in_progress' | 'completed' | 'abandoned';
  progress: number; // 0-100 percentage
  current_step?: number;
  total_steps?: number;
  time_spent?: number; // in seconds
  last_activity_at?: string;
  completed_at?: string;
  attempts_count?: number;
  best_score?: number;
}

export interface ModuleSession {
  id: string;
  user_id: string;
  module_id: string;
  status: string; // 'started', 'in_progress', 'completed', 'abandoned'
  started_at: string;
  last_activity_at: string;
  completed_at?: string;
  time_spent: number;
  progress: number; // 0.0 to 1.0
  current_step: number;
  total_steps: number;
}

export interface UserProgressResponse {
  success: boolean;
  sessions: ModuleSession[];
  total: number;
}

@Injectable({
  providedIn: 'root'
})
export class UserProgressService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private labsService = inject(LabsService);
  private apiUrl = environment.apiUrl;

  /**
   * Get authentication headers for API requests
   */
  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getAccessToken();
    if (!token) {
      console.warn('[UserProgressService] No access token available');
      return new HttpHeaders();
    }
    
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  /**
   * Get user progress for all labs
   * Merges backend session data with localStorage progress
   */
  getUserLabProgress(userId?: string): Observable<UserLabProgress[]> {
    // Get the current authenticated user ID
    const currentUser = this.authService.getCurrentUser();
    // Use cognito_user_id for backend queries, fallback to id if not available
    const targetUserId = userId || currentUser?.cognito_user_id || currentUser?.id;
    
    if (!targetUserId) {
      console.warn('No user ID available for progress fetch');
      return of([]);
    }
    
    return this.http.get<UserProgressResponse>(`${this.apiUrl}/api/module-sessions/user/${targetUserId}`, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(response => {
        if (response.success) {
          // Convert module sessions to lab progress format
          const backendProgress = this.convertModuleSessionsToLabProgress(response.sessions || []);
          
          // Get localStorage progress data
          const localStorageProgress = this.labsService.getAllLocalStorageProgress();
          
          // Merge localStorage data with backend data
          return this.mergeProgressData(backendProgress, localStorageProgress);
        }
        return [];
      }),
      catchError(error => {
        console.error('Error fetching user progress:', error);
        // Even on backend error, return localStorage data
        const localStorageProgress = this.labsService.getAllLocalStorageProgress();
        return of(this.convertLocalStorageToLabProgress(localStorageProgress));
      })
    );
  }

  /**
   * Merge backend progress with localStorage progress
   * localStorage takes priority for more recent data
   */
  private mergeProgressData(
    backendProgress: UserLabProgress[], 
    localStorageProgress: Map<string, any>
  ): UserLabProgress[] {
    const progressMap = new Map<string, UserLabProgress>();
    
    // First, add all backend progress
    backendProgress.forEach(progress => {
      progressMap.set(progress.lab_id, progress);
    });
    
    // Then, merge/override with localStorage data (which is more up-to-date for client-side changes)
    localStorageProgress.forEach((localData, labId) => {
      const existing = progressMap.get(labId);
      
      if (existing) {
        // Merge: use localStorage for step/completion data, keep backend for time/dates
        progressMap.set(labId, {
          ...existing,
          current_step: localData.currentStep || existing.current_step,
          total_steps: localData.totalSteps || existing.total_steps,
          progress: Math.round((localData.progress || 0) * 100),
          // Determine status based on progress
          status: localData.progress >= 1 ? 'completed' : 'in_progress'
        });
      } else {
        // No backend data, create from localStorage
        progressMap.set(labId, {
          lab_id: labId,
          status: localData.progress >= 1 ? 'completed' : 'in_progress',
          progress: Math.round((localData.progress || 0) * 100),
          current_step: localData.currentStep,
          total_steps: localData.totalSteps,
          time_spent: 0,
          last_activity_at: new Date(localData.lastUpdated).toISOString()
        });
      }
    });
    
    return Array.from(progressMap.values());
  }

  /**
   * Convert localStorage progress to lab progress format
   */
  private convertLocalStorageToLabProgress(localStorageProgress: Map<string, any>): UserLabProgress[] {
    const progressList: UserLabProgress[] = [];
    
    localStorageProgress.forEach((localData, labId) => {
      progressList.push({
        lab_id: labId,
        status: localData.progress >= 1 ? 'completed' : 'in_progress',
        progress: Math.round((localData.progress || 0) * 100),
        current_step: localData.currentStep,
        total_steps: localData.totalSteps,
        time_spent: 0,
        last_activity_at: new Date(localData.lastUpdated).toISOString()
      });
    });
    
    return progressList;
  }

  /**
   * Get user progress for a specific lab
   */
  getUserLabProgressForLab(labId: string, userId?: string): Observable<UserLabProgress | null> {
    return this.getUserLabProgress(userId).pipe(
      map(progressList => {
        return progressList.find(p => p.lab_id === labId) || null;
      })
    );
  }

  /**
   * Convert module sessions to lab progress format
   */
  private convertModuleSessionsToLabProgress(sessions: any[]): UserLabProgress[] {
    return sessions.map(session => {
      // Convert progress from 0.0-1.0 to 0-100 percentage
      const progressPercentage = Math.round((session.progress || 0) * 100);
      
      // Map session status to lab status
      let status: UserLabProgress['status'] = 'not_started';
      switch (session.status) {
        case 'started':
          status = 'started';
          break;
        case 'in_progress':
          status = 'in_progress';
          break;
        case 'completed':
          status = 'completed';
          break;
        case 'abandoned':
          status = 'abandoned';
          break;
        default:
          status = 'not_started';
      }

      return {
        lab_id: session.module_id, // Note: using module_id as lab_id
        status,
        progress: progressPercentage,
        current_step: session.current_step,
        total_steps: session.total_steps,
        time_spent: session.time_spent,
        last_activity_at: session.last_activity_at,
        completed_at: session.completed_at,
        attempts_count: 1, // Could be calculated from attempts table
        best_score: undefined // Could be fetched from attempts table
      };
    });
  }

  /**
   * Get lab status for display purposes
   */
  getLabStatusForDisplay(progress: UserLabProgress | null): 'in-progress' | 'completed' {
    if (!progress) {
      return 'in-progress'; // Default to in-progress for labs not started
    }

    switch (progress.status) {
      case 'completed':
        return 'completed';
      case 'started':
      case 'in_progress':
      case 'abandoned':
      default:
        return 'in-progress';
    }
  }

  /**
   * Get progress percentage for display
   */
  getProgressPercentage(progress: UserLabProgress | null): number {
    if (!progress) {
      return 0;
    }
    return progress.progress;
  }

  /**
   * Get completion date for display
   */
  getCompletionDate(progress: UserLabProgress | null): string | undefined {
    if (!progress || progress.status !== 'completed') {
      return undefined;
    }
    return progress.completed_at;
  }
}
