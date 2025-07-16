import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private isBrowser: boolean;
  private activeTheme$ = new BehaviorSubject<string>('light');

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
    this.initializeTheme();
  }

  initializeTheme(): void {
    if (this.isBrowser) {
      const savedTheme = localStorage.getItem('theme') || 'light';
      this.applyTheme(savedTheme);
      this.activeTheme$.next(savedTheme);
    }
  }

  getActiveTheme(): Observable<string> {
    return this.activeTheme$.asObservable();
  }

  toggleTheme(): void {
    const newTheme = this.activeTheme$.value === 'light' ? 'dark' : 'light';
    this.setTheme(newTheme);
  }

  setTheme(theme: 'light' | 'dark'): void {
    if (this.isBrowser) {
      this.applyTheme(theme);
      this.activeTheme$.next(theme);
      localStorage.setItem('theme', theme);
    }
  }

  private applyTheme(theme: string): void {
    const body = document.body;
    if (theme === 'dark') {
      body.classList.add('dark');
    } else {
      body.classList.remove('dark');
    }
  }
}

