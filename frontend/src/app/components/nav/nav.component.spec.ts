import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NavComponent } from './nav.component';
import { ThemeService } from '../../services/theme.service';
import { RouterTestingHarness } from '@angular/router/testing';
import { of } from 'rxjs';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { Component } from '@angular/core';
import { APP_ROUTES } from '../../app.routes';
import { provideRouter } from '@angular/router';
import { By } from '@angular/platform-browser';

@Component({
  selector: 'app-mock',
  standalone: true,
  template: `<p>Mock</p>`
})
class DummyComponent {}

describe('NavComponent', () => {
  let component: NavComponent;
  let fixture: ComponentFixture<NavComponent>;
  let themeServiceSpy: jasmine.SpyObj<ThemeService>;
  let router: Router;

  beforeEach(async () => {
    themeServiceSpy = jasmine.createSpyObj('ThemeService', ['getActiveTheme', 'toggleTheme']);
    themeServiceSpy.getActiveTheme.and.returnValue(of('light'));

    await TestBed.configureTestingModule({
      imports: [NavComponent],
      providers: [
        { provide: ThemeService, useValue: themeServiceSpy },
        provideRouter(APP_ROUTES)
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    fixture = TestBed.createComponent(NavComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('devrait être créé', () => {
    expect(component).toBeTruthy();
  });

  it('devrait exposer le thème actif', (done) => {
    component.activeTheme$.subscribe(theme => {
      expect(theme).toBe('light');
      done();
    });
  });

  it('devrait appeler toggleTheme() du service', () => {
    component.onToggleTheme();
    expect(themeServiceSpy.toggleTheme).toHaveBeenCalled();
  });

  it('devrait mettre à jour le titre de page lors de la navigation', async () => {
    await router.navigateByUrl('/contact');
    fixture.detectChanges();
    expect(component.pageTitle).toBe('Contact');
  });
});
