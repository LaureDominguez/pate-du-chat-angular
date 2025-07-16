import { TestBed, ComponentFixture } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { ThemeService } from './services/theme.service';
import { provideRouter } from '@angular/router';
import { APP_ROUTES } from './app.routes';
import { of } from 'rxjs';

describe('AppComponent', () => {
  let fixture: ComponentFixture<AppComponent>;
  let component: AppComponent;
  let themeServiceSpy: jasmine.SpyObj<ThemeService>;

  beforeEach(() => {
  themeServiceSpy = jasmine.createSpyObj('ThemeService', ['initializeTheme', 'getActiveTheme']);
  themeServiceSpy.getActiveTheme.and.returnValue(of('light'));

    TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        { provide: ThemeService, useValue: themeServiceSpy },
        provideRouter(APP_ROUTES),
      ]
    });

    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
  });

  it('devrait être créé', () => {
    expect(component).toBeTruthy();
  });

  it('devrait avoir pour titre "les_pates_du_chat"', () => {
    expect(component.title).toBe('les_pates_du_chat');
  });

  it('devrait appeler themeService.initializeTheme() au démarrage', () => {
    component.ngOnInit();
    expect(themeServiceSpy.initializeTheme).toHaveBeenCalled();
  });
});
