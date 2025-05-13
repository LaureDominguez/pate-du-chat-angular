import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { ThemeService } from './services/theme.service';
import { NavComponent } from './components/nav/nav.component';
import { of } from 'rxjs';
import { By } from '@angular/platform-browser';

describe('AppComponent', () => {
  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;
  let themeServiceSpy: jasmine.SpyObj<ThemeService>;

  beforeEach(async () => {
    const themeServiceMock = jasmine.createSpyObj('ThemeService', ['initializeTheme', 'getActiveTheme']);
    themeServiceMock.getActiveTheme.and.returnValue(of('light'));

    await TestBed.configureTestingModule({
      declarations: [AppComponent],
      providers: [{ provide: ThemeService, useValue: themeServiceMock }],
      imports: [NavComponent], // Assure l'import correct de NavComponent
    }).compileComponents();

    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
    themeServiceSpy = TestBed.inject(ThemeService) as jasmine.SpyObj<ThemeService>;
  });

  it('should create the app component', () => {
    expect(component).toBeTruthy();
  });

  it('should have a title "les_pates_du_chat"', () => {
    expect(component.title).toBe('les_pates_du_chat');
  });

  it('should initialize theme on ngOnInit', () => {
    component.ngOnInit();
    expect(themeServiceSpy.initializeTheme).toHaveBeenCalled();
  });

  it('should render NavComponent', () => {
    fixture.detectChanges();
    const navElement = fixture.debugElement.query(By.directive(NavComponent));
    expect(navElement).toBeTruthy();
  });
});
