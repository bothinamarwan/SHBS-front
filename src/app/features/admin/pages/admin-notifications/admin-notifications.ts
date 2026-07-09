import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NotificationService } from '../../../../core/services/notification.service';
import { Notification, NotificationType } from '../../../../core/models/notification.model';

@Component({
  selector: 'app-admin-notifications',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-notifications.html'
})
export class AdminNotifications implements OnInit {
  private router = inject(Router);
  private notificationService = inject(NotificationService);

  notifications = signal<Notification[]>([]);
  isLoading = signal(true);
  unseenCount = signal(0);

  NotificationType = NotificationType;

  ngOnInit() {
    this.loadNotifications();
    this.loadUnseenCount();
  }

  loadNotifications() {
    const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const userId = user?.adminId || user?.id;

    if (userId) {
      this.notificationService.getByUserId(userId).subscribe({
        next: (data) => {
          this.notifications.set(data);
          this.isLoading.set(false);
        },
        error: (err) => {
          console.error('Failed to load notifications', err);
          this.isLoading.set(false);
        }
      });
    }
  }

  loadUnseenCount() {
    this.notificationService.getUnseenCount().subscribe({
      next: (count) => {
        this.unseenCount.set(count);
      },
      error: (err) => {
        console.error('Failed to load unseen count', err);
      }
    });
  }

  markAsSeen(notificationId: string) {
    this.notificationService.markAsSeen(notificationId).subscribe({
      next: () => {
        this.notifications.update(prev => 
          prev.map(n => n.notificationId === notificationId ? { ...n, isSeen: true } : n)
        );
        this.loadUnseenCount();
      },
      error: (err) => {
        console.error('Failed to mark notification as seen', err);
      }
    });
  }

  markAllAsSeen() {
    const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const userId = user?.adminId || user?.id;

    if (userId) {
      this.notificationService.markAllAsSeen(userId).subscribe({
        next: () => {
          this.notifications.update(prev => 
            prev.map(n => ({ ...n, isSeen: true }))
          );
          this.loadUnseenCount();
        },
        error: (err) => {
          console.error('Failed to mark all notifications as seen', err);
        }
      });
    }
  }

  deleteNotification(notificationId: string) {
    this.notificationService.delete(notificationId).subscribe({
      next: () => {
        this.notifications.update(prev => 
          prev.filter(n => n.notificationId !== notificationId)
        );
        this.loadUnseenCount();
      },
      error: (err) => {
        console.error('Failed to delete notification', err);
      }
    });
  }

  getTypeIcon(type: string): string {
    switch (type) {
      case 'Booking': return 'fa-calendar-check';
      case 'Payment': return 'fa-credit-card';
      case 'Complaint': return 'fa-exclamation-triangle';
      case 'Review': return 'fa-star';
      case 'System': return 'fa-cog';
      case 'Admin': return 'fa-user-shield';
      default: return 'fa-bell';
    }
  }

  getTypeClass(type: string): string {
    switch (type) {
      case 'Booking': return 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400';
      case 'Payment': return 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400';
      case 'Complaint': return 'bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400';
      case 'Review': return 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400';
      case 'System': return 'bg-slate-50 text-slate-600 dark:bg-slate-900/20 dark:text-slate-400';
      case 'Admin': return 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400';
      default: return 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400';
    }
  }
}
