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
  activeTab = signal<'all' | 'unread'>('all');

  ngOnInit() {
    const role = this.authService.currentUserValue?.role;
    this.isAdmin.set(role === 'admin');
    this.loadNotifications();
  }

  loadNotifications() {
    this.isLoading.set(true);

    if (this.activeTab() === 'unread') {
      this.notificationService.getAll(1, 50, undefined, false).subscribe({
        next: (response: Notification[]) => {
          const data: Notification[] = Array.isArray(response) ? response : (response as any)?.data || (response as any)?.items || (response as any)?.$values || [];
          this.notifications.set(data);
          this.isLoading.set(false);
        },
        error: () => this.isLoading.set(false)
      });
    } else {
      this.notificationService.getAll(1, 50).subscribe({
        next: (response: Notification[]) => {
          const data: Notification[] = Array.isArray(response) ? response : (response as any)?.data || (response as any)?.items || (response as any)?.$values || [];
          this.notifications.set(data);
          this.isLoading.set(false);
        },
        error: () => this.isLoading.set(false)
      });
    }
  }

  setTab(tab: 'all' | 'unread') {
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

  getNotificationIcon(type: string): string {
    switch (type) {
      case 'Booking': return 'fas fa-calendar-check text-emerald-600 dark:text-emerald-400';
      case 'Payment': return 'fas fa-receipt text-indigo-600 dark:text-indigo-400';
      case 'Admin': return 'fas fa-shield-alt text-rose-600 dark:text-rose-400';
      case 'System': return 'fas fa-cog text-neutral-600 dark:text-neutral-400';
      case 'Complaint': return 'fas fa-exclamation-triangle text-amber-600 dark:text-amber-400';
      case 'Review': return 'fas fa-star text-yellow-600 dark:text-yellow-400';
      default: return 'fas fa-info-circle text-blue-600 dark:text-blue-400';
    }
  }

  getNotificationBg(type: string): string {
    switch (type) {
      case 'Booking': return 'bg-emerald-100 dark:bg-emerald-900/30';
      case 'Payment': return 'bg-indigo-100 dark:bg-indigo-900/30';
      case 'Admin': return 'bg-rose-100 dark:bg-rose-900/30';
      case 'System': return 'bg-neutral-100 dark:bg-neutral-900/30';
      case 'Complaint': return 'bg-amber-100 dark:bg-amber-900/30';
      case 'Review': return 'bg-yellow-100 dark:bg-yellow-900/30';
      default: return 'bg-blue-100 dark:bg-blue-900/30';
    }
  }
}
