import { TestBed } from '@angular/core/testing';
import { ThemeService } from './theme.service';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { PLATFORM_ID } from '@angular/core';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { provideHttpClient, withJsonpSupport, withInterceptors } from '@angular/common/http';

describe('ThemeService', () => {
    let service: ThemeService;
    let httpMock: HttpTestingController;
    let documentSpy: Document;

    const mockTheme = {
        schemes: {
            light: {
                primary: '#ffffff',
                secondary: '#000000'
            },
            dark: {
                primary: '#000000',
                secondary: '#ffffff'
            }
        }
    };

    beforeEach(() => {
        const documentMock = {
            documentElement: {
                style: {
                    setProperty: jasmine.createSpy('setProperty')
                }
            },
            body: {
                classList: {
                    remove: jasmine.createSpy('remove'),
                    add: jasmine.createSpy('add')
                }
            }
        };

        TestBed.configureTestingModule({
            providers: [
                provideHttpClient(
                  withJsonpSupport(), // Support JSONP si besoin
                  withInterceptors([]) // Pas d'intercepteurs dans ce test
                ),
                provideHttpClientTesting(),
                ThemeService,
                { provide: PLATFORM_ID, useValue: 'browser' },
                { provide: DOCUMENT, useValue: documentMock }
            ]
        });

        service = TestBed.inject(ThemeService);
        httpMock = TestBed.inject(HttpTestingController);
        documentSpy = TestBed.inject(DOCUMENT);
    });

    afterEach(() => {
        httpMock.verify();
    });

    it('devrait être créé', () => {
        expect(service).toBeTruthy();
    });

});
