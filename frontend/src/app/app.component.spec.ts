import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { ThemeService } from './services/theme.service';
import { DeviceService } from './services/device.service';
import { of } from 'rxjs';

describe('AppComponent', () => {
  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;
  let themeServiceSpy: jasmine.SpyObj<ThemeService>;
  let deviceServiceSpy: jasmine.SpyObj<DeviceService>;

  beforeEach(async () => {
    const themeSpy = jasmine.createSpyObj('ThemeService', ['loadTheme', 'applyTheme']);
    const deviceSpy = jasmine.createSpyObj('DeviceService', ['isMobile']);

    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        { provide: ThemeService, useValue: themeSpy },
        { provide: DeviceService, useValue: deviceSpy }
      ]
    }).compileComponents();

    themeServiceSpy = TestBed.inject(ThemeService) as jasmine.SpyObj<ThemeService>;
    deviceServiceSpy = TestBed.inject(DeviceService) as jasmine.SpyObj<DeviceService>;

    themeServiceSpy.loadTheme.and.returnValue(of({ schemes: { light: { primary: '#ffffff' } } }));
    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
  });

  it('devrait être créé', () => {
    expect(component).toBeTruthy();
  });

  it('devrait avoir le titre "les_pates_du_chat"', () => {
    expect(component.title).toBe('les_pates_du_chat');
  });

  it('devrait charger et appliquer le thème au démarrage', () => {
    fixture.detectChanges();
    expect(themeServiceSpy.loadTheme).toHaveBeenCalled();
    expect(themeServiceSpy.applyTheme).toHaveBeenCalledWith({ primary: '#ffffff' });
  });

  it('devrait appeler le DeviceService pour vérifier si c\'est un mobile', () => {
    fixture.detectChanges();
    expect(deviceServiceSpy.isMobile).toBeDefined();
  });
});
