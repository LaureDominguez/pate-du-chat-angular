import { TestBed } from '@angular/core/testing';
import { ThemeService } from './theme.service';
import { PLATFORM_ID } from '@angular/core';

// ------------------------------------------------------------------
//  Spécifications – ThemeService
// ------------------------------------------------------------------
//  Vérifie : init par défaut, init depuis localStorage, toggle, setTheme + stockage
// ------------------------------------------------------------------

describe('ThemeService', () => {
    let service: ThemeService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [ThemeService, { provide: PLATFORM_ID, useValue: 'browser' }],
        });

        document.body.classList.remove('dark');
        localStorage.clear();

        service = TestBed.inject(ThemeService);
    });

    afterEach(() => {
        document.body.classList.remove('dark');
        localStorage.clear();
    });

    it('doit être créé', () => {
        expect(service).toBeTruthy();
    });

    it('doit appliquer le thème clair par défaut', (done) => {
        service.getActiveTheme().subscribe((t) => {
            expect(t).toBe('light');
            expect(document.body.classList.contains('dark')).toBeFalse();
            done();
        });
    });

    it('doit appliquer le thème sombre si présent dans localStorage', (done) => {
        localStorage.setItem('theme', 'dark');
        service.initializeTheme();

        service.getActiveTheme().subscribe((t) => {
            expect(t).toBe('dark');
            expect(document.body.classList.contains('dark')).toBeTrue();
            done();
        });
    });

    it('doit alterner entre dark ↔ light avec toggleTheme()', (done) => {
        const expected = ['dark', 'light'];
        const seen: string[] = [];

        service.getActiveTheme().subscribe((t) => {
            if (seen.length || t !== 'light') {
                seen.push(t);
            }
            if (seen.length === 2) {
                expect(seen).toEqual(expected);
                expect(document.body.classList.contains('dark')).toBeFalse();
                done();
            }
        });

        service.toggleTheme(); // light → dark
        service.toggleTheme(); // dark → light
    });

    it('doit enregistrer le thème dans localStorage via setTheme()', () => {
        service.setTheme('dark');
        expect(localStorage.getItem('theme')).toBe('dark');
        expect(document.body.classList.contains('dark')).toBeTrue();

        service.setTheme('light');
        expect(localStorage.getItem('theme')).toBe('light');
        expect(document.body.classList.contains('dark')).toBeFalse();
    });
});
