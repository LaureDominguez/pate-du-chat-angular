// src/app/services/theme.service.spec.ts
import { TestBed } from '@angular/core/testing';
import { ThemeService } from './theme.service';
import { PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { take } from 'rxjs';

describe('ThemeService', () => {
    let service: ThemeService;

    beforeEach(() => {
        // Simule un environnement navigateur (Browser)
        TestBed.configureTestingModule({
            providers: [
                ThemeService,
                { provide: PLATFORM_ID, useValue: 'browser' },
            ]
        });

        // Nettoie les classes de body et le localStorage avant chaque test
        document.body.classList.remove('dark');
        localStorage.clear();

        service = TestBed.inject(ThemeService);
    });

    it('devrait être créé', () => {
        expect(service).toBeTruthy();
    });

    it('devrait appliquer le thème clair par défaut', (done) => {
        service.getActiveTheme().subscribe((theme) => {
            expect(theme).toBe('light');
            expect(document.body.classList.contains('dark')).toBeFalse();
            done();
        });
    });

    it('devrait appliquer le thème sombre si enregistré dans localStorage', (done) => {
        localStorage.setItem('theme', 'dark');
        service.initializeTheme();

        service.getActiveTheme().subscribe((theme) => {
            expect(theme).toBe('dark');
            expect(document.body.classList.contains('dark')).toBeTrue();
            done();
        });
    });


    it('devrait alterner entre les thèmes clair et sombre', (done) => {
    const expectedThemes = ['dark', 'light'];
    const actualThemes: string[] = [];

    // On ignore la première émission ('light' par défaut) en ne prenant que les suivantes
    service.getActiveTheme().subscribe((theme) => {
        if (actualThemes.length > 0 || theme !== 'light') {
        actualThemes.push(theme);
        }

        if (actualThemes.length === expectedThemes.length) {
        expect(actualThemes[0]).toBe('dark');
        expect(actualThemes[1]).toBe('light');
        expect(document.body.classList.contains('dark')).toBeFalse(); // après 2 toggles
        done();
        }
    });

    service.toggleTheme(); // light → dark
    service.toggleTheme(); // dark → light
    });


    it('devrait enregistrer le thème sélectionné dans localStorage', () => {
        service.setTheme('dark');
        expect(localStorage.getItem('theme')).toBe('dark');
        expect(document.body.classList.contains('dark')).toBeTrue();

        service.setTheme('light');
        expect(localStorage.getItem('theme')).toBe('light');
        expect(document.body.classList.contains('dark')).toBeFalse();
    });
});
