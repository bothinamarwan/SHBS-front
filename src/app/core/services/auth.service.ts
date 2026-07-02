import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { User, AuthResponse, TwoFactorSetupResponse, ForgotPasswordRequest, ResetPasswordRequest, TwoFactorRequest } from '../models/user.model';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  // Use signals for easy template binding
  public isAuthenticated = signal<boolean>(false);
  private baseUrl = '/api/v1/Account';

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

  /**
   * POST /api/v1/Account/login
   * Body: { email, password }
   * Response: AuthResponse (may include requiresTwoFactor: true)
   */
  login(credentials: { email: string; password: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/login`, credentials).pipe(
      tap((res: AuthResponse) => {
        // Only persist session if 2FA is NOT required
        if (!res.requiresTwoFactor) {
          this.handleAuthentication(res);
        }
      })
    );
  }

  /**
   * POST /api/v1/Account/register/student
   */
  registerStudent(userData: any): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/register/student`, userData).pipe(
      tap((res: AuthResponse) => this.handleAuthentication(res))
    );
  }

  /**
   * POST /api/v1/Account/register/landlord
   */
  registerLandlord(userData: any): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/register/landlord`, userData).pipe(
      tap((res: AuthResponse) => this.handleAuthentication(res))
    );
  }

  /** Convenience wrapper used by existing register calls */
  register(userData: any): Observable<AuthResponse> {
    return userData.role === 'landlord'
      ? this.registerLandlord(userData)
      : this.registerStudent(userData);
  }

  /**
   * POST /api/v1/Account/refresh-token
   * Body: { token, refreshToken }
   */
  refreshToken(token: string): Observable<AuthResponse> {
    const refreshToken = localStorage.getItem('refresh_token') ?? '';
    return this.http.post<AuthResponse>(`${this.baseUrl}/refresh-token`, { token, refreshToken });
  }

  // ─────────────────────────────────────────────────────────────
  //  Google OAuth helpers
  // ─────────────────────────────────────────────────────────────

  /**
   * Redirect the browser to the backend's Google OAuth challenge.
   * Flow: browser → GET /api/v1/Account/google-challenge
   *       → Google consent → GET /api/v1/Account/google-callback
   *       → backend redirects to /auth/google-callback?token=...&refreshToken=...
   */
  initiateGoogleLogin(): void {
    // Use the real backend URL directly (bypasses Angular proxy — needed for the
    // OAuth redirect chain to stay on the same origin as the backend).
    window.location.href = 'https://unistay.tryasp.net/api/v1/Account/google-challenge';
  }

  /**
   * POST /api/v1/Account/google-login
   * Use when the frontend already has a Google ID token (client-side SDK flow).
   * Body: { provider: string, providerKey: string, email: string, name: string }
   * Response: AuthResponse (may include requiresTwoFactor: true)
   */
  googleLogin(data: { provider: string; providerKey: string; email: string; name: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/google-login`, data).pipe(
      tap((res: AuthResponse) => {
        if (!res.requiresTwoFactor) {
          this.handleAuthentication(res);
        }
      })
    );
  }

  /**
   * Called by the Google-callback route after the backend redirects back
   * with accessToken + refreshToken in query params.
   */
  handleGoogleCallback(accessToken: string, refreshToken: string): void {
    // We only have tokens here — build a minimal session and fetch the profile
    // lazily. The token itself encodes the role so routing works immediately.
    localStorage.setItem('auth_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);

    // Decode the JWT payload (no verify needed — server already verified)
    try {
      const payload = JSON.parse(atob(accessToken.split('.')[1]));
      const roles: string[] = payload['role'] ?? payload['roles'] ?? [];
      const email: string = payload['email'] ?? payload['sub'] ?? '';
      const id: string = payload['nameid'] ?? payload['sub'] ?? '';

      const mappedUser: User = {
        id,
        name: email.split('@')[0].replace(/[._]/g, ' '),
        email,
        role: (roles[0]?.toLowerCase() as any) ?? 'student'
      };

      localStorage.setItem('user', JSON.stringify(mappedUser));
      this.currentUserSubject.next(mappedUser);
      this.isAuthenticated.set(true);
    } catch {
      // Fallback: clear tokens if JWT decode fails
      this.clearLocalSession();
    }
  }

  // ─────────────────────────────────────────────────────────────
  //  Email Confirmation
  // ─────────────────────────────────────────────────────────────

  /**
   * POST /api/v1/Account/send-email-confirmation
   * Body: email (raw JSON string)
   */
  sendEmailConfirmation(email: string): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(
      `${this.baseUrl}/send-email-confirmation`, JSON.stringify(email),
      { headers: { 'Content-Type': 'application/json' } }
    );
  }

  /**
   * POST /api/v1/Account/confirm-email
   * Body: { userId, token }
   */
  confirmEmail(userId: string, token: string): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(
      `${this.baseUrl}/confirm-email`, { userId, token }
    );
  }

  // ─────────────────────────────────────────────────────────────
  //  Two-Factor Authentication
  // ─────────────────────────────────────────────────────────────

  /**
   * POST /api/v1/Account/2fa/setup
   * Body: email (raw JSON string)
   * Response: { success, message, secret, qrCodeUri }
   */
  setup2FA(email: string): Observable<TwoFactorSetupResponse> {
    return this.http.post<TwoFactorSetupResponse>(
      `${this.baseUrl}/2fa/setup`, JSON.stringify(email),
      { headers: { 'Content-Type': 'application/json' } }
    );
  }

  /**
   * POST /api/v1/Account/2fa/enable
   * Body: { email, code }
   * Response: AuthResponse (with tokens + user)
   */
  enable2FA(data: TwoFactorRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/2fa/enable`, data).pipe(
      tap((res: AuthResponse) => this.handleAuthentication(res))
    );
  }

  /**
   * POST /api/v1/Account/2fa/verify
   */
  verifyTwoFactor(data: TwoFactorRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/2fa/verify`, data).pipe(
      tap((res: AuthResponse) => this.handleAuthentication(res))
    );
  }

  /**
   * POST /api/v1/Account/logout
   */
  logout() {
    const token = localStorage.getItem('auth_token');
    this.http.post(`${this.baseUrl}/logout`, JSON.stringify(token ?? ''), {
      headers: { 'Content-Type': 'application/json' }
    }).subscribe({
      next: () => this.clearLocalSession(),
      error: () => this.clearLocalSession()   // always clear locally
    });
  }

  private clearLocalSession() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    this.currentUserSubject.next(null);
    this.isAuthenticated.set(false);
    this.router.navigate(['/auth/login']);
  }

  private handleAuthentication(res: AuthResponse) {
    if (res && res.success && res.token && res.token.accessToken) {
      localStorage.setItem('auth_token', res.token.accessToken);
      localStorage.setItem('refresh_token', res.token.refreshToken ?? '');

      // API does not return fullName — derive display name from email
      const displayName = res.user.email
        ? res.user.email.split('@')[0].replace(/[._]/g, ' ')
        : 'User';

      const mappedUser: User = {
        id: res.user.id,
        name: displayName,
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

  // ─────────────────────────────────────────────────────────────
  //  Password Reset
  // ─────────────────────────────────────────────────────────────

  /**
   * POST /api/v1/Account/forgot-password
   */
  forgotPassword(data: ForgotPasswordRequest): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(`${this.baseUrl}/forgot-password`, data);
  }

  /**
   * POST /api/v1/Account/reset-password
   */
  resetPassword(data: ResetPasswordRequest): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(`${this.baseUrl}/reset-password`, data);
  }

  updateAvatar(avatarUrl: string | null) {
    const user = this.currentUserValue;
    if (user) {
      user.avatarUrl = avatarUrl || undefined;
      this.currentUserSubject.next({ ...user });
      localStorage.setItem('user', JSON.stringify(user));
    }
  }
}
