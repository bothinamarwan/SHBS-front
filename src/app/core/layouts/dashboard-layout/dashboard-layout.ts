import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';
import { NotificationService } from '../../services/notification.service';
import { Notification, NotificationType } from '../../models/notification.model';

@Component({
  selector: 'app-dashboard-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './dashboard-layout.html'
})
export class DashboardLayout implements OnInit {
  private authService = inject(AuthService);
  private themeService = inject(ThemeService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);

  user = this.authService.currentUser$;
  isSidebarOpen = signal(true);
  isProfileMenuOpen = signal(false);
  isNotificationsOpen = signal(false);
  isDark = this.themeService.isDark;

  unreadCount = signal(0);
  recentNotifications = signal<Notification[]>([]);

  // Derived role signal for template switching
  userRole = computed(() => this.authService.currentUserValue?.role ?? 'student');

  ngOnInit() {
    this.loadNotifications();
  }

  loadNotifications() {
    if (!this.authService.currentUserValue) return;
    
    this.notificationService.getUnreadCount().subscribe({
      next: (count) => this.unreadCount.set(count),
      error: () => {}
    });

    this.notificationService.getAll().subscribe({
      next: (response: any) => {
        const notifications: Notification[] = Array.isArray(response) ? response : (response?.data || response?.items || response?.$values || []);
        this.recentNotifications.set(notifications.filter(n => !n.isRead).slice(0, 3));
      },
      error: () => {}
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

  markAsRead(id: string) {
    this.notificationService.markAsRead(id).subscribe({
      next: () => this.loadNotifications(),
      error: () => {}
    });
  }

  markAllAsRead() {
    this.notificationService.markAllAsRead().subscribe({
      next: () => this.loadNotifications(),
      error: () => {}
    });
  }

  viewAllNotifications() {
    this.isNotificationsOpen.set(false);
    const role = this.userRole();
    this.router.navigate([`/${role}/notifications`]);
  }

  toggleTheme() {
    this.themeService.toggleTheme();
  }

  toggleSidebar() {
    this.isSidebarOpen.update(v => !v);
  }

  logout() {
    this.authService.logout();
  }
}
