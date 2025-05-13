import { TestBed } from '@angular/core/testing';
import { ThemeService } from './theme.service';
import { PLATFORM_ID } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

describe('ThemeService', () => {
    let service: ThemeService;
    let localStorageSpy: jasmine.SpyObj<Storage>;
    const mockPlatformId = 'browser'; // Simule un environnement navigateur

    beforeEach(() => {
        localStorageSpy = jasmine.createSpyObj('localStorage', ['getItem', 'setItem']);
        localStorageSpy.getItem.and.returnValue(null);

        TestBed.configureTestingModule({
            providers: [
                ThemeService,
                { provide: PLATFORM_ID, useValue: mockPlatformId },
            ],
        });

        service = TestBed.inject(ThemeService);

        // Mock du localStorage pour les tests
        spyOn(localStorage, 'getItem').and.callFake((key) => localStorageSpy.getItem(key));
        spyOn(localStorage, 'setItem').and.callFake((key, value) => localStorageSpy.setItem(key, value));
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should initialize with light theme if no theme is saved', () => {
        localStorageSpy.getItem.and.returnValue(null); // Pas de thème enregistré
        service.initializeTheme();
        service.getActiveTheme().subscribe((theme) => {
            expect(theme).toBe('light');
        });
    });

    it('should initialize with saved theme from localStorage', () => {
        localStorageSpy.getItem.and.returnValue('dark');
        service.initializeTheme();
        service.getActiveTheme().subscribe((theme) => {
            expect(theme).toBe('dark');
        });
    });

    it('should toggle theme between light and dark', () => {
        service.setTheme('light');
        service.toggleTheme();
        service.getActiveTheme().subscribe((theme) => {
            expect(theme).toBe('dark');
        });

        service.toggleTheme();
        service.getActiveTheme().subscribe((theme) => {
            expect(theme).toBe('light');
        });
    });

    it('should save the theme to localStorage when set', () => {
        service.setTheme('dark');
        expect(localStorage.setItem).toHaveBeenCalledWith('theme', 'dark');

        service.setTheme('light');
        expect(localStorage.setItem).toHaveBeenCalledWith('theme', 'light');
    });

    it('should apply the theme correctly in the DOM', () => {
        const body = document.body;
        service.setTheme('dark');
        expect(body.classList.contains('dark')).toBeTrue();

        service.setTheme('light');
        expect(body.classList.contains('dark')).toBeFalse();
    });
});
