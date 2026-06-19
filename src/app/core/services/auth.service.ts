import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, of, delay } from 'rxjs';
import { User, AuthResponse } from '../models/user.model';
import { Router } from '@angular/router';

// ─────────────────────────────────────────────────────────────
//  MOCK FLAG — set to true to bypass backend entirely
// ─────────────────────────────────────────────────────────────
const MOCK_MODE = true;

/** Determine role from email keyword for easy frontend-only testing:
 *  - email contains "landlord" → landlord
 *  - email contains "admin"    → admin
 *  - anything else             → student
 */
function roleFromEmail(email: string): 'student' | 'landlord' | 'admin' {
  const e = email.toLowerCase();
  if (e.includes('landlord')) return 'landlord';
  if (e.includes('admin')) return 'admin';
  return 'student';
}

function buildMockResponse(email: string, fullName: string, role?: string): AuthResponse {
  const resolvedRole = (role as any) || roleFromEmail(email);
  return {
    success: true,
    message: 'Mock login successful',
    token: {
      accessToken: 'mock-access-token-' + Date.now(),
      refreshToken: 'mock-refresh-token',
      tokenType: 'Bearer',
      expiresIn: 3600
    },
    user: {
      id: 'mock-user-' + Date.now(),
      email,
      phoneNumber: '01012345678',
      fullName,
      roles: [resolvedRole],
      studentId: resolvedRole === 'student' ? 'S-MOCK-001' : undefined,
      landLordId: resolvedRole === 'landlord' ? 'L-MOCK-001' : undefined
    }
  };
}

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
    if (MOCK_MODE) {
      const mockRes = buildMockResponse(
        credentials.email,
        credentials.email.split('@')[0].replace(/[._]/g, ' ')
      );
      return of(mockRes).pipe(
        delay(600),
        tap(res => this.handleAuthentication(res))
      );
    }
    return this.http.post<AuthResponse>(`${this.baseUrl}/Auth/login`, credentials).pipe(
      tap((res: AuthResponse) => this.handleAuthentication(res))
    );
  }

  register(userData: any): Observable<AuthResponse> {
    if (MOCK_MODE) {
      const mockRes = buildMockResponse(
        userData.email,
        userData.fullName || userData.email.split('@')[0],
        userData.role
      );
      return of(mockRes).pipe(
        delay(800),
        tap(res => this.handleAuthentication(res))
      );
    }
    const endpoint = userData.role === 'landlord' ? 'register-landlord' : 'register-student';
    return this.http.post<AuthResponse>(`${this.baseUrl}/Auth/${endpoint}`, userData).pipe(
      tap((res: AuthResponse) => this.handleAuthentication(res))
    );
  }

  refreshToken(token: string): Observable<any> {
    if (MOCK_MODE) return of({ success: true }).pipe(delay(300));
    return this.http.post(`${this.baseUrl}/Auth/refresh-token`, { token });
  }

  logout() {
    // In mock mode skip the API call entirely
    if (MOCK_MODE) {
      this.clearLocalSession();
      return;
    }
    this.http.post(`${this.baseUrl}/Auth/logout`, {}).subscribe({
      next: () => this.clearLocalSession(),
      error: () => this.clearLocalSession()
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

      const mappedUser: User = {
        id: res.user.id,
        name: res.user.fullName,
        email: res.user.email,
        phone: res.user.phoneNumber,
        role: (res.user.roles && res.user.roles.length > 0)
          ? res.user.roles[0].toLowerCase() as any
          : 'student',
        studentId: res.user.studentId,
        landlordId: res.user.landLordId
      };

      localStorage.setItem('user', JSON.stringify(mappedUser));
      this.currentUserSubject.next(mappedUser);
      this.isAuthenticated.set(true);
    }
  }
}
