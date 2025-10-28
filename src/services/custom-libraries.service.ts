import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../environments/environment';

export interface CustomLibrary {
  id: string;
  filename: string;
  language: string;
  size: number;
  uploadedAt: string;
  enabled: boolean;
}

export interface LibraryUploadResponse {
  success: boolean;
  library?: CustomLibrary;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CustomLibrariesService {
  private apiUrl = `${environment.apiUrl}/api/libraries`;
  private librariesSubject = new BehaviorSubject<CustomLibrary[]>([]);
  public libraries$ = this.librariesSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadLibraries();
  }

  /**
   * Load all custom libraries from the backend
   */
  loadLibraries(): void {
    this.http.get<{ libraries: CustomLibrary[] }>(`${this.apiUrl}`)
      .subscribe({
        next: (response) => {
          this.librariesSubject.next(response.libraries);
        },
        error: (error) => {
          console.error('Failed to load custom libraries:', error);
          this.librariesSubject.next([]);
        }
      });
  }

  /**
   * Upload a custom library file
   */
  uploadLibrary(file: File, language: string): Observable<LibraryUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('language', language);

    return this.http.post<LibraryUploadResponse>(`${this.apiUrl}/upload`, formData)
      .pipe(
        tap(response => {
          if (response.success) {
            this.loadLibraries(); // Refresh the list
          }
        })
      );
  }

  /**
   * Delete a custom library
   */
  deleteLibrary(libraryId: string): Observable<{ success: boolean; error?: string }> {
    return this.http.delete<{ success: boolean; error?: string }>(`${this.apiUrl}/${libraryId}`)
      .pipe(
        tap(response => {
          if (response.success) {
            this.loadLibraries(); // Refresh the list
          }
        })
      );
  }

  /**
   * Toggle library enabled/disabled status
   */
  toggleLibrary(libraryId: string, enabled: boolean): Observable<{ success: boolean; error?: string }> {
    return this.http.patch<{ success: boolean; error?: string }>(`${this.apiUrl}/${libraryId}/toggle`, { enabled })
      .pipe(
        tap(response => {
          if (response.success) {
            this.loadLibraries(); // Refresh the list
          }
        })
      );
  }

  /**
   * Get libraries for a specific language
   */
  getLibrariesForLanguage(language: string): CustomLibrary[] {
    return this.librariesSubject.value.filter(lib => 
      lib.language.toLowerCase() === language.toLowerCase() && lib.enabled
    );
  }

  /**
   * Get all libraries
   */
  getLibraries(): CustomLibrary[] {
    return this.librariesSubject.value;
  }
}
