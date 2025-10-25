import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';
import { AuthResponse, User } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // Generic HTTP methods
  get<T>(endpoint: string): Observable<T> {
    return this.http.get<T>(`${this.apiUrl}${endpoint}`);
  }

  post<T>(endpoint: string, data: any): Observable<T> {
    return this.http.post<T>(`${this.apiUrl}${endpoint}`, data);
  }

  put<T>(endpoint: string, data: any): Observable<T> {
    return this.http.put<T>(`${this.apiUrl}${endpoint}`, data);
  }

  delete<T>(endpoint: string): Observable<T> {
    return this.http.delete<T>(`${this.apiUrl}${endpoint}`);
  }

  // Auth endpoints
  register(userData: any): Observable<any> {
    return this.post('/auth/register', userData);
  }

  login(credentials: any): Observable<AuthResponse> {
    return this.post<AuthResponse>('/auth/login', credentials);
  }

  logout(): Observable<any> {
    return this.post('/auth/logout', {});
  }

  verifyToken(token: string): Observable<any> {
    return this.post('/auth/verify', { token });
  }

  refreshToken(refreshToken: string): Observable<AuthResponse> {
    return this.post<AuthResponse>('/auth/refresh', { refresh_token: refreshToken });
  }

  forgotPassword(email: string): Observable<any> {
    return this.post('/auth/forgot-password', { email });
  }

  confirmForgotPassword(email: string, code: string, newPassword: string): Observable<any> {
    return this.post('/auth/confirm-forgot-password', {
      email,
      code,
      new_password: newPassword
    });
  }

  // Labs endpoints
  getLabs() {
    return this.get('/api/labs');
  }

  getLab(id: string) {
    return this.get(`/api/labs/${id}`);
  }

  createLab(labData: any) {
    return this.post('/api/labs', labData);
  }

  updateLab(id: string, labData: any) {
    return this.put(`/api/labs/${id}`, labData);
  }

  deleteLab(id: string) {
    return this.delete(`/api/labs/${id}`);
  }

  // Widgets endpoints
  getWidgets() {
    return this.get('/api/widgets');
  }

  getWidget(id: string) {
    return this.get(`/api/widgets/${id}`);
  }

  createWidget(widgetData: any) {
    return this.post('/api/widgets', widgetData);
  }

  // Collections endpoints
  getCollections() {
    return this.get('/api/collections');
  }

  getCollection(id: string) {
    return this.get(`/api/collections/${id}`);
  }

  createCollection(collectionData: any) {
    return this.post('/api/collections', collectionData);
  }

  updateCollection(id: string, collectionData: any) {
    return this.put(`/api/collections/${id}`, collectionData);
  }

  deleteCollection(id: string) {
    return this.delete(`/api/collections/${id}`);
  }

  // Health check
  healthCheck() {
    return this.get('/health');
  }

  // OAuth endpoints
  getGoogleAuthUrl() {
    return this.get('/oauth/google/login');
  }

  // Admin endpoints
  getUsers() {
    return this.get('/admin/users');
  }

  getUser(id: string) {
    return this.get(`/admin/users/${id}`);
  }

  updateUser(id: string, userData: any) {
    return this.put(`/admin/users/${id}`, userData);
  }

  deleteUser(id: string) {
    return this.delete(`/admin/users/${id}`);
  }
}
