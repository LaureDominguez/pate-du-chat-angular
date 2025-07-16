import { TestBed } from '@angular/core/testing';

import { DeviceService } from './device.service';

describe('DeviceService', () => {
  let service: DeviceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DeviceService);
  });

  it('devrait être crée', () => {
    expect(service).toBeTruthy();
  });

  it('doit détecter un appareil mobile quand userAgent contient "Android"', () => {
    // Simulation d'un userAgent Android
    spyOnProperty(window.navigator, 'userAgent', 'get').and.returnValue('Mozilla/5.0 (Linux; Android 10)');
    spyOnProperty(window, 'innerWidth', 'get').and.returnValue(400);

    const newService = new DeviceService();
    expect(newService.isMobile).toBeTrue();
  });
});
