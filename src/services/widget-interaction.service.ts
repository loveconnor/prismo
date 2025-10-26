import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, timer, from } from 'rxjs';
import { debounceTime, switchMap, tap, catchError, retry } from 'rxjs/operators';
import { AuthService } from './auth.service';

export interface WidgetInteraction {
  widget_id: string;
  widget_type: string;
  action: string;
  timestamp: string;
  data: Record<string, any>;
}

export interface InteractionBatch {
  sessionId: string;
  interactions: WidgetInteraction[];
}

@Injectable({
  providedIn: 'root'
})
export class WidgetInteractionService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private baseUrl = 'http://localhost:5000/api/module-sessions';
  
  /**
   * Get authentication headers for API requests
   */
  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getAccessToken();
    if (!token) {
      console.warn('[WidgetInteractionService] No access token available');
      return new HttpHeaders();
    }
    
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }
  
  // Batching configuration
  private readonly BATCH_SIZE = 5;
  private readonly BATCH_TIMEOUT_MS = 10000; // 10 seconds
  
  // Pending interactions queue
  private pendingInteractions = new Map<string, WidgetInteraction[]>();
  private batchTimers = new Map<string, any>();
  
  // Track current session
  private currentSessionId: string | null = null;
  
  /**
   * Set the current session ID for tracking
   */
  setCurrentSession(sessionId: string | null): void {
    console.log('[WidgetInteractionService] Setting current session:', sessionId);
    this.currentSessionId = sessionId;
    
    // Clear any pending interactions for old session
    if (sessionId) {
      this.clearPendingInteractions();
    }
  }
  
  /**
   * Track a widget interaction
   */
  trackInteraction(
    widgetId: string, 
    widgetType: string, 
    action: string, 
    data: Record<string, any> = {}
  ): void {
    if (!this.currentSessionId) {
      console.warn('[WidgetInteractionService] No active session - interaction not tracked');
      return;
    }
    
    const interaction: WidgetInteraction = {
      widget_id: widgetId,
      widget_type: widgetType,
      action: action,
      timestamp: new Date().toISOString(),
      data: data
    };
    
    console.log('[WidgetInteractionService] Tracking interaction:', interaction);
    
    // Add to pending queue
    this.addToPendingQueue(interaction);
  }
  
  /**
   * Add interaction to pending queue and trigger batching logic
   */
  private addToPendingQueue(interaction: WidgetInteraction): void {
    if (!this.currentSessionId) return;
    
    const sessionId = this.currentSessionId;
    
    // Initialize queue for session if needed
    if (!this.pendingInteractions.has(sessionId)) {
      this.pendingInteractions.set(sessionId, []);
    }
    
    // Add interaction to queue
    const queue = this.pendingInteractions.get(sessionId)!;
    queue.push(interaction);
    
    console.log(`[WidgetInteractionService] Queue size for session ${sessionId}:`, queue.length);
    
    // Check if we should send batch immediately
    if (queue.length >= this.BATCH_SIZE) {
      this.sendBatch(sessionId);
    } else {
      // Set/reset timer for batch timeout
      this.setBatchTimer(sessionId);
    }
  }
  
  /**
   * Set timer for batch timeout
   */
  private setBatchTimer(sessionId: string): void {
    // Clear existing timer
    if (this.batchTimers.has(sessionId)) {
      clearTimeout(this.batchTimers.get(sessionId));
    }
    
    // Set new timer
    const timer = setTimeout(() => {
      this.sendBatch(sessionId);
    }, this.BATCH_TIMEOUT_MS);
    
    this.batchTimers.set(sessionId, timer);
  }
  
  /**
   * Send batch of interactions to backend
   */
  private sendBatch(sessionId: string): void {
    const queue = this.pendingInteractions.get(sessionId);
    if (!queue || queue.length === 0) return;
    
    console.log(`[WidgetInteractionService] Sending batch of ${queue.length} interactions for session ${sessionId}`);
    
    // Clear timer
    if (this.batchTimers.has(sessionId)) {
      clearTimeout(this.batchTimers.get(sessionId));
      this.batchTimers.delete(sessionId);
    }
    
    // Send each interaction individually (backend expects one at a time)
    const sendPromises = queue.map(interaction => 
      this.sendSingleInteraction(sessionId, interaction).toPromise()
    );
    
    // Clear the queue
    this.pendingInteractions.set(sessionId, []);
    
    // Execute all sends in parallel
    Promise.all(sendPromises)
      .then(() => {
        console.log(`[WidgetInteractionService] Successfully sent batch for session ${sessionId}`);
      })
      .catch(error => {
        console.error(`[WidgetInteractionService] Error sending batch for session ${sessionId}:`, error);
        // Could implement retry logic here
      });
  }
  
  /**
   * Send a single interaction to the backend
   */
  private sendSingleInteraction(sessionId: string, interaction: WidgetInteraction): Observable<any> {
    const url = `${this.baseUrl}/${sessionId}/interaction`;
    
    return this.http.post(url, {
      widget_id: interaction.widget_id,
      widget_type: interaction.widget_type,
      action: interaction.action,
      data: interaction.data
    }, {
      headers: this.getAuthHeaders()
    }).pipe(
      tap(response => {
        console.log('[WidgetInteractionService] Interaction sent successfully:', response);
      }),
      catchError(error => {
        console.error('[WidgetInteractionService] Error sending interaction:', error);
        throw error;
      })
    );
  }
  
  /**
   * Clear pending interactions for a session
   */
  private clearPendingInteractions(): void {
    // Clear all timers
    this.batchTimers.forEach(timer => clearTimeout(timer));
    this.batchTimers.clear();
    
    // Clear all queues
    this.pendingInteractions.clear();
    
    console.log('[WidgetInteractionService] Cleared all pending interactions');
  }
  
  /**
   * Force send all pending interactions (useful on page unload)
   */
  flushPendingInteractions(): void {
    if (!this.currentSessionId) return;
    
    console.log('[WidgetInteractionService] Flushing pending interactions');
    this.sendBatch(this.currentSessionId);
  }
  
  /**
   * Get pending interaction count for current session
   */
  getPendingCount(): number {
    if (!this.currentSessionId) return 0;
    return this.pendingInteractions.get(this.currentSessionId)?.length || 0;
  }
  
  /**
   * Check if there are pending interactions
   */
  hasPendingInteractions(): boolean {
    return this.getPendingCount() > 0;
  }
}
