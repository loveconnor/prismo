import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export interface ModuleSession {
  id: string;
  user_id: string;
  module_id: string;
  status: 'started' | 'in_progress' | 'completed' | 'abandoned';
  started_at: string;
  last_activity_at: string;
  completed_at?: string;
  time_spent: number; // in seconds
  progress: number; // 0.0 to 1.0
  current_step: number;
  total_steps: number;
  created_at: string;
  updated_at: string;
}

export interface StartSessionRequest {
  module_id: string;
  total_steps?: number;
}

export interface UpdateSessionRequest {
  status?: 'started' | 'in_progress' | 'completed' | 'abandoned';
  current_step?: number;
  progress?: number; // 0.0 to 1.0
  time_spent?: number; // in seconds
  completed?: boolean;
}

export interface CompleteSessionRequest {
  final_time_spent?: number;
  final_score?: number;
}

export interface SessionResponse {
  success: boolean;
  session?: ModuleSession;
  error?: string;
}

export interface SessionsResponse {
  success: boolean;
  sessions?: ModuleSession[];
  total?: number;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ModuleSessionService {
  private http = inject(HttpClient);
  private baseUrl = '/api/module-sessions';

  /**
   * Start a new module session
   */
  startSession(request: StartSessionRequest): Observable<ModuleSession> {
    return this.http.post<SessionResponse>(`${this.baseUrl}/start`, request)
      .pipe(
        map(response => {
          if (response.success && response.session) {
            return response.session;
          }
          throw new Error(response.error || 'Failed to start session');
        }),
        catchError(error => {
          console.error('Error starting module session:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Update an existing module session
   */
  updateSession(sessionId: string, request: UpdateSessionRequest): Observable<ModuleSession> {
    return this.http.put<SessionResponse>(`${this.baseUrl}/${sessionId}/update`, request)
      .pipe(
        map(response => {
          if (response.success && response.session) {
            return response.session;
          }
          throw new Error(response.error || 'Failed to update session');
        }),
        catchError(error => {
          console.error('Error updating module session:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Get a specific module session
   */
  getSession(sessionId: string): Observable<ModuleSession> {
    return this.http.get<SessionResponse>(`${this.baseUrl}/${sessionId}`)
      .pipe(
        map(response => {
          if (response.success && response.session) {
            return response.session;
          }
          throw new Error(response.error || 'Session not found');
        }),
        catchError(error => {
          console.error('Error getting module session:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Get all module sessions for a user
   */
  getUserSessions(
    userId: string, 
    options: {
      status?: string;
      module_id?: string;
      limit?: number;
      offset?: number;
    } = {}
  ): Observable<{ sessions: ModuleSession[]; total: number }> {
    const params = new URLSearchParams();
    if (options.status) params.set('status', options.status);
    if (options.module_id) params.set('module_id', options.module_id);
    if (options.limit) params.set('limit', options.limit.toString());
    if (options.offset) params.set('offset', options.offset.toString());

    const queryString = params.toString();
    const url = `${this.baseUrl}/user/${userId}${queryString ? `?${queryString}` : ''}`;

    return this.http.get<SessionsResponse>(url)
      .pipe(
        map(response => {
          if (response.success && response.sessions && response.total !== undefined) {
            return {
              sessions: response.sessions,
              total: response.total
            };
          }
          throw new Error(response.error || 'Failed to get user sessions');
        }),
        catchError(error => {
          console.error('Error getting user sessions:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Complete a module session
   */
  completeSession(sessionId: string, request: CompleteSessionRequest = {}): Observable<ModuleSession> {
    return this.http.post<SessionResponse>(`${this.baseUrl}/${sessionId}/complete`, request)
      .pipe(
        map(response => {
          if (response.success && response.session) {
            return response.session;
          }
          throw new Error(response.error || 'Failed to complete session');
        }),
        catchError(error => {
          console.error('Error completing module session:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Abandon a module session
   */
  abandonSession(sessionId: string): Observable<ModuleSession> {
    return this.http.post<SessionResponse>(`${this.baseUrl}/${sessionId}/abandon`, {})
      .pipe(
        map(response => {
          if (response.success && response.session) {
            return response.session;
          }
          throw new Error(response.error || 'Failed to abandon session');
        }),
        catchError(error => {
          console.error('Error abandoning module session:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Get active sessions for a user (started or in_progress)
   */
  getActiveSessions(userId: string): Observable<ModuleSession[]> {
    return this.getUserSessions(userId, { status: 'started' })
      .pipe(
        map(result => result.sessions)
      );
  }

  /**
   * Get completed sessions for a user
   */
  getCompletedSessions(userId: string): Observable<ModuleSession[]> {
    return this.getUserSessions(userId, { status: 'completed' })
      .pipe(
        map(result => result.sessions)
      );
  }

  /**
   * Check if user has an active session for a specific module
   */
  getActiveSessionForModule(userId: string, moduleId: string): Observable<ModuleSession | null> {
    return this.getUserSessions(userId, { module_id: moduleId, status: 'started' })
      .pipe(
        map(result => {
          const activeSessions = result.sessions.filter(s => 
            s.status === 'started' || s.status === 'in_progress'
          );
          return activeSessions.length > 0 ? activeSessions[0] : null;
        })
      );
  }
}
