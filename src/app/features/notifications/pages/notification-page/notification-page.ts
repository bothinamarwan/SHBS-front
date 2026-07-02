import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../../../core/services/notification.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Notification, NotificationType } from '../../../../core/models/notification.model';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notification-page.html'
})
export class NotificationPage implements OnInit {
  private notificationService = inject(NotificationService);
  private authService = inject(AuthService);

  notifications = signal<Notification[]>([]);
  isLoading = signal(true);
  
  isAdmin = signal(false);
  activeTab = signal<'all' | 'unread' | 'pending'>('all');

  ngOnInit() {
    const role = this.authService.currentUserValue?.role;
    this.isAdmin.set(role === 'admin');
    this.loadNotifications();
  }

  loadNotifications() {
    this.isLoading.set(true);

    if (this.activeTab() === 'pending' && this.isAdmin()) {
      this.notificationService.getAdminPending().subscribe({
        next: (data) => {
          this.notifications.set(data);
          this.isLoading.set(false);
        },
        error: () => this.isLoading.set(false)
      });
      return;
    }

    this.notificationService.getAll().subscribe({
      next: (response: any) => {
        const data: Notification[] = Array.isArray(response) ? response : (response?.data || response?.items || response?.$values || []);
        let filtered = data;
        if (this.activeTab() === 'unread') {
          filtered = data.filter(n => !n.isRead);
        }
        this.notifications.set(filtered);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  setTab(tab: 'all' | 'unread' | 'pending') {
    this.activeTab.set(tab);
    this.loadNotifications();
  }

  markAsRead(n: Notification) {
    if (n.isRead) return;
    this.notificationService.markAsRead(n.notificationId).subscribe(() => {
      this.notifications.update(prev => 
        prev.map(x => x.notificationId === n.notificationId ? { ...x, isRead: true } : x)
      );
    });
  }

  markAllAsRead() {
    this.notificationService.markAllAsRead().subscribe(() => {
      this.notifications.update(prev => prev.map(x => ({ ...x, isRead: true })));
    });
  }

  getNotificationIcon(type: NotificationType): string {
    switch (Number(type)) {
      case NotificationType.Booking: return 'fas fa-calendar-check text-emerald-600 dark:text-emerald-400';
      case NotificationType.Payment: return 'fas fa-receipt text-indigo-600 dark:text-indigo-400';
      case NotificationType.Admin: return 'fas fa-shield-alt text-rose-600 dark:text-rose-400';
      case NotificationType.System: return 'fas fa-cog text-neutral-600 dark:text-neutral-400';
      default: return 'fas fa-info-circle text-blue-600 dark:text-blue-400';
    }
  }

  getNotificationBg(type: NotificationType): string {
    switch (Number(type)) {
      case NotificationType.Booking: return 'bg-emerald-100 dark:bg-emerald-900/30';
      case NotificationType.Payment: return 'bg-indigo-100 dark:bg-indigo-900/30';
      case NotificationType.Admin: return 'bg-rose-100 dark:bg-rose-900/30';
      case NotificationType.System: return 'bg-neutral-100 dark:bg-neutral-900/30';
      default: return 'bg-blue-100 dark:bg-blue-900/30';
    }
  }
}
