import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError, of } from 'rxjs';
import { Notification, UpdateNotificationRequest } from '../models/notification.model';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private baseUrl = '/api/Notification';

  constructor(private http: HttpClient) {}

  getAll(): Observable<Notification[]> {
    return this.http.get<Notification[]>(this.baseUrl);
  }

  getById(id: string): Observable<Notification> {
    return this.http.get<Notification>(`${this.baseUrl}/${id}`);
  }

  getByUserId(userId: string): Observable<Notification[]> {
    return this.http.get<Notification[]>(`${this.baseUrl}/user/${userId}`).pipe(
      catchError((error) => {
        if (error.status === 404) {
          return of([]);
        }
        return throwError(() => error);
      })
    );
  }

  getUnseenCount(): Observable<number> {
    return this.http.get<number>(`${this.baseUrl}/count/unseen`).pipe(
      catchError((error) => {
        if (error.status === 404) {
          return of(0);
        }
        return throwError(() => error);
      })
    );
  }

  markAsSeen(id: string): Observable<Notification> {
    const request: UpdateNotificationRequest = { isSeen: true };
    return this.http.put<Notification>(`${this.baseUrl}/${id}`, request);
  }

  markAllAsSeen(userId: string): Observable<any> {
    return this.http.put(`${this.baseUrl}/user/${userId}/mark-all-seen`, {});
  }

  create(notification: Omit<Notification, 'notificationId' | 'createdAt'>): Observable<Notification> {
    return this.http.post<Notification>(this.baseUrl, notification);
  }

  delete(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${id}`);
  }
}
