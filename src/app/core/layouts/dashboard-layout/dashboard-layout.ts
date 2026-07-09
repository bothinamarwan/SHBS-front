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
      next: (count: number) => this.unreadCount.set(count),
      error: () => {}
    });

    this.notificationService.getAll(1, 3, undefined, false).subscribe({
      next: (response: Notification[]) => {
        const notifications: Notification[] = Array.isArray(response) ? response : (response as any)?.data || (response as any)?.items || (response as any)?.$values || [];
        this.recentNotifications.set(notifications);
      },
      error: () => {}
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
