import { Injectable, signal, effect, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type Theme = 'light' | 'dark';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private platformId = inject(PLATFORM_ID);
  private readonly STORAGE_KEY = 'uni-stay-theme';
  
  // Theme state using signals
  theme = signal<Theme>('light');
  isDark = signal<boolean>(false);

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.initializeTheme();
      
      // Auto-update when system preference changes (if no user preference exists)
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (!localStorage.getItem(this.STORAGE_KEY)) {
          this.setTheme(e.matches ? 'dark' : 'light', false);
        }
      });
    }

    // Effect to apply classes whenever theme changes
    effect(() => {
      const currentTheme = this.theme();
      this.isDark.set(currentTheme === 'dark');
      
      if (isPlatformBrowser(this.platformId)) {
        if (currentTheme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
    });
  }

  private initializeTheme() {
    const savedTheme = localStorage.getItem(this.STORAGE_KEY) as Theme;
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme) {
      this.theme.set(savedTheme);
    } else {
      this.theme.set(systemPrefersDark ? 'dark' : 'light');
    }
  }

  toggleTheme() {
    const nextTheme = this.theme() === 'light' ? 'dark' : 'light';
    this.setTheme(nextTheme, true);
  }

  setTheme(newTheme: Theme, save: boolean = true) {
    this.theme.set(newTheme);
    if (save && isPlatformBrowser(this.platformId)) {
      localStorage.setItem(this.STORAGE_KEY, newTheme);
    }
  }
}
