import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
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
}

export interface LabsResponse {
  labs: Lab[];
  count: number;
  status: string;
}

@Injectable({
  providedIn: 'root'
})
export class LabsService {
  private apiUrl = environment.apiUrl || 'http://localhost:5000/api';
  private labsSubject = new BehaviorSubject<Lab[]>([]);
  public labs$ = this.labsSubject.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * Fetch all labs from the backend API
   */
  getAllLabs(): Observable<Lab[]> {
    return this.http.get<LabsResponse>(`${this.apiUrl}/api/labs`).pipe(
      map(response => {
        if (response.status === 'success') {
          this.labsSubject.next(response.labs);
          return response.labs;
        }
        throw new Error('Failed to fetch labs');
      }),
      catchError(error => {
        console.error('Error fetching labs:', error);
        throw error;
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
}
