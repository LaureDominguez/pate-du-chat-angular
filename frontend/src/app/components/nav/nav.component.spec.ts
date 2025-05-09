import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NavComponent } from './nav.component';
import { Router, ActivatedRoute, RouterModule, NavigationEnd } from '@angular/router';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { ThemeService } from '../../services/theme.service';
import { of, BehaviorSubject } from 'rxjs';

describe('NavComponent', () => {
  let component: NavComponent;
  let fixture: ComponentFixture<NavComponent>;
  let mockRouter: any;
  let mockActivatedRoute: any;

  beforeEach(async () => {
    mockRouter = {
      events: new BehaviorSubject(new NavigationEnd(1, '/', '/')),
      navigate: jasmine.createSpy('navigate')
    };

    mockActivatedRoute = {
      snapshot: {
        data: {}
      }
    };

    await TestBed.configureTestingModule({
      imports: [
        RouterModule,
        NavComponent
      ],
      providers: [
        {
          provide: BreakpointObserver,
          useValue: {
            observe: () => of({ matches: false })
          }
        },
        {
          provide: Router,
          useValue: mockRouter
        },
        {
          provide: ActivatedRoute,
          useValue: mockActivatedRoute
        },
        {
          provide: ThemeService,
          useValue: {
            toggleTheme: jasmine.createSpy('toggleTheme')
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(NavComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('devrait être créé', () => {
    expect(component).toBeTruthy();
  });

  it('devrait initialiser la propriété isHandset$ en fonction de BreakpointObserver', (done) => {
    component.isHandset$.subscribe((isHandset) => {
      expect(isHandset).toBeFalse();
      done();
    });
  });

  it('devrait changer la pageTitle en fonction de la route', () => {
    mockRouter.events.next(new NavigationEnd(1, '/shop', '/shop'));
    fixture.detectChanges();
    expect(component.pageTitle).toBe('Les Produits');
  });

  it('devrait appeler ThemeService.toggleTheme() lorsque le thème est changé', () => {
    const themeService = TestBed.inject(ThemeService);
    themeService.toggleTheme();
    expect(themeService.toggleTheme).toHaveBeenCalled();
  });
});
