import { HttpInterceptorFn, HttpErrorResponse, HttpRequest, HttpHandlerFn, HttpEvent } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { throwError, BehaviorSubject, catchError, switchMap, filter, take, Observable } from 'rxjs';

let isRefreshing = false;
const refreshTokenSubject = new BehaviorSubject<string | null>(null);

export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> => {
  const authService = inject(AuthService);
  const token = localStorage.getItem('auth_token');

  let authReq = req;
  if (token) {
    authReq = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Catch 401 Unauthorized errors to attempt token refresh
      if (
        error.status === 401 &&
        token &&
        !req.url.includes('/login') &&
        !req.url.includes('/refresh-token') &&
        !req.url.includes('/logout')
      ) {
        return handle401Error(authReq, next, authService);
      }
      return throwError(() => error);
    })
  );
};

function handle401Error(req: HttpRequest<unknown>, next: HttpHandlerFn, authService: AuthService): Observable<HttpEvent<unknown>> {
  if (!isRefreshing) {
    isRefreshing = true;
    refreshTokenSubject.next(null);

    const token = localStorage.getItem('auth_token') || '';

    return authService.refreshToken(token).pipe(
      switchMap((res: any) => {
        isRefreshing = false;

        if (res && res.success && res.token && res.token.accessToken) {
          localStorage.setItem('auth_token', res.token.accessToken);
          localStorage.setItem('refresh_token', res.token.refreshToken || '');
          refreshTokenSubject.next(res.token.accessToken);

          return next(
            req.clone({
              setHeaders: { Authorization: `Bearer ${res.token.accessToken}` }
            })
          );
        }

        // Refresh was ostensibly successful but no valid token returned
        authService.logout();
        return throwError(() => new Error('Refresh failed - invalid token payload'));
      }),
      catchError((err) => {
        isRefreshing = false;
        authService.logout();
        return throwError(() => err);
      })
    );
  } else {
    // If a refresh is already in progress, wait for the subject to emit the new token
    return refreshTokenSubject.pipe(
      filter((token) => token !== null),
      take(1),
      switchMap((jwt) => {
        return next(
          req.clone({
            setHeaders: { Authorization: `Bearer ${jwt}` }
          })
        );
      })
    );
  }
}
