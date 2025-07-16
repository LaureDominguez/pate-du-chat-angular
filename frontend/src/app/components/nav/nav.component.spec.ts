import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NavComponent } from './nav.component';
import { ThemeService } from '../../services/theme.service';
import { BreakpointObserver } from '@angular/cdk/layout';
import { of } from 'rxjs';
import { provideRouter, Router } from '@angular/router';
import { Component } from '@angular/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

// ------------------------------------------------------------------
//  Spécifications – NavComponent (layout)
// ------------------------------------------------------------------
//  Vérifie : exposition du thème, toggle, titre de page via navigation
// ------------------------------------------------------------------

@Component({ selector: 'app-dummy', standalone: true, template: 'Dummy' })
class DummyComponent {}

const routes = [
  { path: '', component: DummyComponent, data: { title: 'Accueil' } },
  { path: 'contact', component: DummyComponent, data: { title: 'Contact' } },
];

describe('NavComponent', () => {
  let fixture: ComponentFixture<NavComponent>;
  let component: NavComponent;
  let themeSpy: jasmine.SpyObj<ThemeService>;
  let router: Router;

  beforeEach(async () => {
    themeSpy = jasmine.createSpyObj('ThemeService', ['getActiveTheme', 'toggleTheme']);
    themeSpy.getActiveTheme.and.returnValue(of('light'));

    await TestBed.configureTestingModule({
      imports: [NavComponent, DummyComponent, NoopAnimationsModule],
      providers: [
        provideRouter(routes),
        { provide: ThemeService, useValue: themeSpy },
        { provide: BreakpointObserver, useValue: { observe: () => of({ matches: false }) } },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    fixture = TestBed.createComponent(NavComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // ---------------------------------------------------------------
  //  Base
  // ---------------------------------------------------------------
  it('doit être créé', () => {
    expect(component).toBeTruthy();
  });

  // ---------------------------------------------------------------
  //  activeTheme$
  // ---------------------------------------------------------------
  it('doit exposer le thème actif', (done) => {
    component.activeTheme$.subscribe((t) => {
      expect(t).toBe('light');
      done();
    });
  });

  // ---------------------------------------------------------------
  //  Toggle thème
  // ---------------------------------------------------------------
  it('doit déléguer à ThemeService.toggleTheme()', () => {
    component.onToggleTheme();
    expect(themeSpy.toggleTheme).toHaveBeenCalled();
  });

  // ---------------------------------------------------------------
  //  Titre de page
  // ---------------------------------------------------------------
  it('doit mettre à jour pageTitle après navigation', async () => {
    await router.navigateByUrl('/contact');
    fixture.detectChanges();
    expect(component.pageTitle).toBe('Contact');
  });
});
