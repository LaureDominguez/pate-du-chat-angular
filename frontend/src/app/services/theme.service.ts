// src/app/services/theme.service.ts
import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  // private themeUrl = 'assets/themes/theme.json';
  private isBrowser: boolean;
  private activeTheme$ = new BehaviorSubject<string>('light');

  constructor(
    // private http: HttpClient,
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

  // setTheme(theme: 'light' | 'dark'): void {
  //   this.loadTheme().subscribe((themesData) => {
  //     this.applyTheme(themesData, theme);
  //     this.activeTheme$.next(theme);
  //     localStorage.setItem('theme', theme); // Sauvegarder dans localStorage
  //   });
  // }

  // private loadTheme(): Observable<any> {
  //   return this.http.get(this.themeUrl);
  // }

  // private applyTheme(themesData: any, theme: string): void {
  //   if (this.isBrowser) {
  //     const root = document.documentElement;
  //     const selectedTheme = themesData.schemes[theme];
  //     if (selectedTheme) {
  //       Object.keys(selectedTheme).forEach((key) => {
  //         root.style.setProperty(`--${key}`, selectedTheme[key]);
  //       });
  //     }
  //   }
  // }
}

