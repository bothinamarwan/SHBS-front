import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, of, delay } from 'rxjs';
import { User, AuthResponse } from '../models/user.model';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  
  // Use signals for easy template binding
  public isAuthenticated = signal<boolean>(false);
  private baseUrl = '/api/v1';

  constructor(private router: Router, private http: HttpClient) {
    this.loadToken();
  }

  get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  private loadToken() {
    const token = localStorage.getItem('auth_token');
    const user = localStorage.getItem('user');
    if (token && user) {
      this.currentUserSubject.next(JSON.parse(user));
      this.isAuthenticated.set(true);
    }
  }

  login(credentials: any): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/Auth/login`, credentials).pipe(
      tap((res: AuthResponse) => this.handleAuthentication(res))
    );
  }

  register(userData: any): Observable<AuthResponse> {
    const endpoint = userData.role === 'landlord' ? 'register-landlord' : 'register-student';
    return this.http.post<AuthResponse>(`${this.baseUrl}/Auth/${endpoint}`, userData).pipe(
      tap((res: AuthResponse) => this.handleAuthentication(res))
    );
  }

  refreshToken(token: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/Auth/refresh-token`, { token });
  }

  logout() {
    this.http.post(`${this.baseUrl}/Auth/logout`, {}).subscribe({
      next: () => this.clearLocalSession(),
      error: () => this.clearLocalSession() // Clear session even if API fails
    });
  }

  private clearLocalSession() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    this.currentUserSubject.next(null);
    this.isAuthenticated.set(false);
    this.router.navigate(['/auth/login']);
  }

  private handleAuthentication(res: AuthResponse) {
    if (res && res.success && res.token && res.token.accessToken) {
      localStorage.setItem('auth_token', res.token.accessToken);
      
      // Map backend user model to frontend User model
      const mappedUser: User = {
        id: res.user.id,
        name: res.user.fullName,
        email: res.user.email,
        phone: res.user.phoneNumber,
        role: (res.user.roles && res.user.roles.length > 0) ? res.user.roles[0].toLowerCase() as any : 'student',
        studentId: res.user.studentId,
        landlordId: res.user.landLordId
      };

      localStorage.setItem('user', JSON.stringify(mappedUser));
      this.currentUserSubject.next(mappedUser);
      this.isAuthenticated.set(true);
    }
  }
}
