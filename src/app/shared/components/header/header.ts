import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ThemeService } from '../../../core/services/theme.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header {
  private authService = inject(AuthService);
  private themeService = inject(ThemeService);
  
  menuOpen = signal(false);
  isAuthenticated = this.authService.isAuthenticated;
  isDark = this.themeService.isDark;

  toggleTheme() {
    this.themeService.toggleTheme();
  }

  toggleMenu() {
    this.menuOpen.update(v => !v);
  }

  logout() {
    this.authService.logout();
    this.menuOpen.set(false);
  }
}
