// src/app/services/theme.service.ts
import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private themeUrl = 'assets/themes/theme.json';
  private isBrowser: boolean;
  renderer: any;

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  loadTheme(): Observable<any> {
    return this.http.get(this.themeUrl);
  }

  applyTheme(theme: any): void {
    if (this.isBrowser) {
      const root = document.documentElement;

      // Exemple : Appliquez chaque propriété JSON comme une variable CSS
      Object.keys(theme).forEach((key) => {
        if (typeof theme[key] === 'object') {
          Object.keys(theme[key]).forEach((subKey) => {
            const varName = `--${key}-${subKey}`;
            root.style.setProperty(varName, theme[key][subKey]);
          });
        } else {
          const varName = `--${key}`;
          root.style.setProperty(varName, theme[key]);
        }
      });
    }
  }

  setTheme(theme: string) {
    // console.log('📋 ThemeService -> setTheme -> theme :', theme);
    if (this.isBrowser) {
      const themes = ['dark', 'light'];
      themes.forEach((t) => document.body.classList.remove(t));
      document.body.classList.add(theme);

      this.loadTheme().subscribe((themesData) => {
        const selectedTheme = themesData.schemes[theme];
        if (selectedTheme) {
          this.applyTheme(selectedTheme);
        } else {
          console.error('Theme not found:', theme);
        }
      })
    }
  }
}

