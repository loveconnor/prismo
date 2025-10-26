import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, Subject, forkJoin, of } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { environment } from '../environments/environment';

export interface Lab {
  id: string;
  title: string;
  description: string;
  skills: string[];
  steps: any[];
  widgets: any[];
  completion_criteria: any;
  estimated_duration: number;
  version: string;
  lab_type: string;
  difficulty: number;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  user_id?: string;
  source?: 'lab' | 'module'; // Track if it's from labs or modules table
}

export interface Module {
  id: string;
  user_id: string;
  name: string;
  module_type: string;
  content: any; // Contains the full module structure (widgets, etc.)
  is_public: boolean;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface LabsResponse {
  labs: Lab[];
  count: number;
  status: string;
}

export interface ModulesResponse {
  modules: Module[];
  count: number;
}

@Injectable({
  providedIn: 'root'
})
export class LabsService {
  private apiUrl = environment.apiUrl || 'http://localhost:5000';
  private labsSubject = new BehaviorSubject<Lab[]>([]);
  public labs$ = this.labsSubject.asObservable();
  
  // Event emitter for when a new lab is created
  private labCreatedSubject = new Subject<string>();
  public labCreated$ = this.labCreatedSubject.asObservable();
  
  private readonly RECOMMENDATIONS_CACHE_KEY = 'ai_recommendations_cache';
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

  constructor(private http: HttpClient) {}

  /**
   * Get auth headers from localStorage
   */
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('auth_token');
    if (token) {
      return new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      });
    }
    return new HttpHeaders({
      'Content-Type': 'application/json'
    });
  }

  /**
   * Convert a Module to Lab format for display
   */
  private convertModuleToLab(module: Module): Lab {
    const content = module.content || {};
    return {
      id: module.id,
      title: content.title || module.name || 'Untitled Module',
      description: content.description || 'No description available',
      skills: content.skills || module.tags || [],
      steps: content.steps || [],
      widgets: content.widgets || [],
      completion_criteria: content.completion_criteria || {},
      estimated_duration: content.estimated_duration || 1800,
      version: content.version || '1.0.0',
      lab_type: module.module_type || 'generated',
      difficulty: content.difficulty || 2,
      is_public: module.is_public,
      created_at: module.created_at,
      updated_at: module.updated_at,
      user_id: module.user_id,
      source: 'module'
    };
  }

  /**
   * Fetch all labs AND modules from the backend API (combined view)
   */
  getAllLabs(): Observable<Lab[]> {
    const headers = this.getAuthHeaders();
    
    // Fetch both labs and modules in parallel
    return forkJoin({
      labs: this.http.get<any>(`${this.apiUrl}/api/labs`, { headers }).pipe(
        map(response => {
          console.log('Labs response:', response);
          return response.labs || [];
        }),
        map(labs => labs.map((lab: any) => ({ ...lab, source: 'lab' as const }))),
        catchError(error => {
          console.error('Error fetching labs:', error);
          return of([]); // Return empty array on error
        })
      ),
      modules: this.http.get<ModulesResponse>(`${this.apiUrl}/learning/modules`, { headers }).pipe(
        map(response => {
          console.log('Modules response:', response);
          return response.modules || [];
        }),
        map(modules => modules.map(m => this.convertModuleToLab(m))),
        catchError(error => {
          console.error('Error fetching modules:', error);
          // Log more details about the error
          if (error.error) {
            console.error('Error details:', error.error);
          }
          return of([]); // Return empty array on error
        })
      )
    }).pipe(
      map(({ labs, modules }) => {
        // Combine both arrays
        const combined = [...labs, ...modules];
        this.labsSubject.next(combined);
        return combined;
      }),
      tap(combined => console.log(`Loaded ${combined.length} total labs/modules`)),
      catchError(error => {
        console.error('Error combining labs and modules:', error);
        // Return empty array instead of throwing
        this.labsSubject.next([]);
        return of([]);
      })
    );
  }

  /**
   * Get public labs only
   */
  getPublicLabs(): Observable<Lab[]> {
    return this.getAllLabs().pipe(
      map(labs => labs.filter(lab => lab.is_public))
    );
  }

  /**
   * Get labs by type (coding, math, writing, etc.)
   */
  getLabsByType(type: string): Observable<Lab[]> {
    return this.getAllLabs().pipe(
      map(labs => labs.filter(lab => lab.lab_type === type))
    );
  }

  /**
   * Get labs by difficulty level
   */
  getLabsByDifficulty(difficulty: number): Observable<Lab[]> {
    return this.getAllLabs().pipe(
      map(labs => labs.filter(lab => lab.difficulty === difficulty))
    );
  }

  /**
   * Get recommended labs (public labs with medium difficulty)
   */
  getRecommendedLabs(): Observable<Lab[]> {
    return this.getPublicLabs().pipe(
      map(labs => labs.filter(lab => lab.difficulty >= 2 && lab.difficulty <= 3))
    );
  }

  /**
   * Get cached labs from BehaviorSubject
   */
  getCachedLabs(): Lab[] {
    return this.labsSubject.value;
  }

  /**
   * Format estimated duration from seconds to minutes
   */
  formatDuration(seconds: number): string {
    const minutes = Math.round(seconds / 60);
    return `${minutes} min`;
  }

  /**
   * Delete a lab or module
   */
  deleteLab(labId: string, source: 'lab' | 'module' = 'lab'): Observable<any> {
    const headers = this.getAuthHeaders();
    const endpoint = source === 'module' 
      ? `${this.apiUrl}/learning/modules/${labId}`
      : `${this.apiUrl}/api/labs/${labId}`;
    
    return this.http.delete(endpoint, { headers }).pipe(
      tap(() => {
        // Remove the deleted lab from the local cache
        const currentLabs = this.labsSubject.value;
        const updatedLabs = currentLabs.filter(lab => lab.id !== labId);
        this.labsSubject.next(updatedLabs);
        console.log(`Deleted lab ${labId} from ${source}`);
      }),
      catchError(error => {
        console.error('Error deleting lab:', error);
        throw error;
      })
    );
  }

  /**
   * Get difficulty label
   */
  getDifficultyLabel(difficulty: number): string {
    switch (difficulty) {
      case 1: return 'Easy';
      case 2: return 'Medium';
      case 3: return 'Hard';
      default: return 'Unknown';
    }
  }

  /**
   * Get difficulty color class
   */
  getDifficultyColor(difficulty: number): string {
    switch (difficulty) {
      case 1: return 'bg-[rgba(34,197,94,0.15)] text-[#86efac]';
      case 2: return 'bg-[rgba(245,158,11,0.15)] text-[#fcd34d]';
      case 3: return 'bg-[rgba(239,68,68,0.15)] text-[#fca5a5]';
      default: return 'bg-[rgba(107,114,128,0.15)] text-[#9ca3af]';
    }
  }

  /**
   * Get lab icon based on lab type and title
   */
  getLabIcon(lab: Lab): string {
    const title = lab.title.toLowerCase();
    const type = lab.lab_type.toLowerCase();
    
    if (type === 'coding' || title.includes('javascript') || title.includes('react') || title.includes('node')) {
      return 'lucideCode';
    }
    if (title.includes('math') || title.includes('equation') || title.includes('calculation')) {
      return 'lucideCalculator';
    }
    if (title.includes('writing') || title.includes('essay') || title.includes('text')) {
      return 'lucideFileText';
    }
    if (title.includes('database') || title.includes('sql') || title.includes('query')) {
      return 'lucideDatabase';
    }
    if (title.includes('security') || title.includes('auth') || title.includes('authentication')) {
      return 'lucideShield';
    }
    if (title.includes('tree') || title.includes('binary') || title.includes('algorithm')) {
      return 'lucideTreePine';
    }
    if (title.includes('network') || title.includes('graph') || title.includes('api')) {
      return 'lucideNetwork';
    }
    
    return 'lucideBookOpen';
  }

  /**
   * Get AI-generated lab recommendations based on user's learning history
   * Uses caching to avoid unnecessary API calls
   */
  getAIRecommendations(count: number = 3, forceRefresh: boolean = false): Observable<any> {
    // Check cache first unless force refresh
    if (!forceRefresh) {
      const cached = this.getCachedRecommendations();
      if (cached) {
        console.log('[LabsService] Using cached AI recommendations');
        return of({ success: true, recommendations: cached, source: 'cache' });
      }
    }
    
    console.log('[LabsService] Fetching fresh AI recommendations');
    return this.http.post<any>(`${this.apiUrl}/learning/recommendations`, 
      { count },
      { headers: this.getAuthHeaders() }
    ).pipe(
      tap((response: any) => {
        if (response && response.success && response.recommendations) {
          this.cacheRecommendations(response.recommendations);
        }
      }),
      catchError(error => {
        console.error('Error fetching AI recommendations:', error);
        return of({ success: false, recommendations: [], source: 'error' });
      })
    );
  }
  
  /**
   * Get cached recommendations if they exist and are not expired
   */
  private getCachedRecommendations(): any[] | null {
    try {
      const cached = localStorage.getItem(this.RECOMMENDATIONS_CACHE_KEY);
      if (!cached) return null;
      
      const { recommendations, timestamp } = JSON.parse(cached);
      const now = Date.now();
      
      // Check if cache is expired
      if (now - timestamp > this.CACHE_DURATION) {
        localStorage.removeItem(this.RECOMMENDATIONS_CACHE_KEY);
        return null;
      }
      
      return recommendations;
    } catch (error) {
      console.error('Error reading recommendations cache:', error);
      return null;
    }
  }
  
  /**
   * Cache recommendations in localStorage
   */
  private cacheRecommendations(recommendations: any[]): void {
    try {
      const cacheData = {
        recommendations,
        timestamp: Date.now()
      };
      localStorage.setItem(this.RECOMMENDATIONS_CACHE_KEY, JSON.stringify(cacheData));
    } catch (error) {
      console.error('Error caching recommendations:', error);
    }
  }
  
  /**
   * Clear the recommendations cache (e.g., when a new lab is created)
   */
  clearRecommendationsCache(): void {
    localStorage.removeItem(this.RECOMMENDATIONS_CACHE_KEY);
  }
  
  /**
   * Notify subscribers that a lab was created
   */
  notifyLabCreated(labId: string): void {
    this.clearRecommendationsCache();
    this.labCreatedSubject.next(labId);
  }

  /**
   * Get a specific module by ID
   */
  getModuleById(moduleId: string): Observable<Lab | null> {
    const headers = this.getAuthHeaders();
    return this.http.get<any>(`${this.apiUrl}/learning/modules/${moduleId}`, { headers }).pipe(
      map(response => {
        if (response.success && response.module) {
          return this.convertModuleToLab(response.module);
        }
        return null;
      }),
      catchError(error => {
        console.error('Error fetching module:', error);
        return of(null);
      })
    );
  }
}

