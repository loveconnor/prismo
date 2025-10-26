import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { LabsService } from './labs.service';

export interface GenerateModuleRequest {
  topic: string;
  subject: string;
  difficulty: string;
  skills?: string[];
  goal?: string;
}

export interface GeneratePersonalizedModuleRequest {
  learning_goal?: string;
}

export interface ModuleGenerationResponse {
  success: boolean;
  module?: any;
  module_id?: string;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ModuleGeneratorService {
  private http = inject(HttpClient);
  private labsService = inject(LabsService);
  private baseUrl = 'http://localhost:5000/api/modules';

  /**
   * Generate a new learning module using AI
   */
  generateModule(request: GenerateModuleRequest): Observable<ModuleGenerationResponse> {
    console.log('[ModuleGeneratorService] Generating module:', request);
    
    return this.http.post<ModuleGenerationResponse>(`${this.baseUrl}/generate`, request)
      .pipe(
        tap(response => {
          // Notify that a lab was created to invalidate recommendations cache
          if (response.success && response.module_id) {
            this.labsService.notifyLabCreated(response.module_id);
          }
        }),
        map(response => {
          if (response.success && response.module) {
            console.log('[ModuleGeneratorService] Module generated successfully:', {
              moduleId: response.module_id,
              moduleName: response.module.name,
              widgetCount: response.module.widgets?.length
            });
            return response;
          }
          console.error('[ModuleGeneratorService] Failed to generate module:', response.error);
          throw new Error(response.error || 'Failed to generate module');
        }),
        catchError(error => {
          console.error('[ModuleGeneratorService] Error generating module:', {
            error: error.message || error,
            request: request,
            timestamp: new Date().toISOString()
          });
          return throwError(() => error);
        })
      );
  }

  /**
   * Generate a personalized module based on user's learning profile
   */
  generatePersonalizedModule(request: GeneratePersonalizedModuleRequest = {}): Observable<ModuleGenerationResponse> {
    console.log('[ModuleGeneratorService] Generating personalized module:', request);
    
    return this.http.post<ModuleGenerationResponse>(`${this.baseUrl}/generate/personalized`, request)
      .pipe(
        tap(response => {
          // Notify that a lab was created to invalidate recommendations cache
          if (response.success && response.module_id) {
            this.labsService.notifyLabCreated(response.module_id);
          }
        }),
        map(response => {
          if (response.success && response.module) {
            console.log('[ModuleGeneratorService] Personalized module generated successfully:', {
              moduleId: response.module_id,
              moduleName: response.module.name,
              widgetCount: response.module.widgets?.length
            });
            return response;
          }
          console.error('[ModuleGeneratorService] Failed to generate personalized module:', response.error);
          throw new Error(response.error || 'Failed to generate personalized module');
        }),
        catchError(error => {
          console.error('[ModuleGeneratorService] Error generating personalized module:', {
            error: error.message || error,
            request: request,
            timestamp: new Date().toISOString()
          });
          return throwError(() => error);
        })
      );
  }
}
