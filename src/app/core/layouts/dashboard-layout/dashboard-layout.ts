import { Component, inject, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-dashboard-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './dashboard-layout.html'
})
export class DashboardLayout {
  private authService = inject(AuthService);
  private themeService = inject(ThemeService);
  
  user = this.authService.currentUser$;
  isSidebarOpen = signal(true);
  isProfileMenuOpen = signal(false);
  isNotificationsOpen = signal(false);
  isDark = this.themeService.isDark;

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
