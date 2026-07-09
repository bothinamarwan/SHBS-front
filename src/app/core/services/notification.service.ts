import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError, of } from 'rxjs';
import { Notification } from '../models/notification.model';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private baseUrl = '/api/Notification';

  constructor(private http: HttpClient) {}

  getAll(pageNumber: number = 1, pageSize: number = 10, type?: string, isRead?: boolean): Observable<Notification[]> {
    let params: any = { pageNumber, pageSize };
    if (type) params.type = type;
    if (isRead !== undefined) params.isRead = isRead;
    
    return this.http.get<Notification[]>(this.baseUrl, { params });
  }

  getById(id: string): Observable<Notification> {
    return this.http.get<Notification>(`${this.baseUrl}/${id}`);
  }

  filterByType(type: string, pageNumber: number = 1, pageSize: number = 10): Observable<Notification[]> {
    return this.http.get<Notification[]>(`${this.baseUrl}/filter/by-type/${type}`, {
      params: { pageNumber, pageSize }
    });
  }

  getAdminPending(pageNumber: number = 1, pageSize: number = 10): Observable<Notification[]> {
    return this.http.get<Notification[]>(`${this.baseUrl}/admin/pending`, {
      params: { pageNumber, pageSize }
    });
  }

  getUnreadCount(): Observable<number> {
    return this.http.get<number>(`${this.baseUrl}/count/unread`).pipe(
      catchError((error) => {
        if (error.status === 404) {
          return of(0);
        }
        return throwError(() => error);
      })
    );
  }

  markAsRead(id: string): Observable<any> {
    return this.http.put(`${this.baseUrl}/${id}/mark-as-read`, {});
  }

  markAllAsRead(): Observable<any> {
    return this.http.put(`${this.baseUrl}/mark-all-as-read`, {});
  }

  create(notification: Omit<Notification, 'notificationId' | 'createdAt'>): Observable<Notification> {
    return this.http.post<Notification>(this.baseUrl, notification);
  }

  delete(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${id}`);
  }
}
