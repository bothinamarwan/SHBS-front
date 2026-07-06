import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Notification } from '../models/notification.model';

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

  getUnreadCount(): Observable<number> {
    return this.http.get<number>(`${this.baseUrl}/count/unread`);
  }

  filterByType(type: number): Observable<Notification[]> {
    return this.http.get<Notification[]>(`${this.baseUrl}/filter/by-type/${type}`);
  }

  getAdminPending(): Observable<Notification[]> {
    return this.http.get<Notification[]>(`${this.baseUrl}/admin/pending`);
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
}
