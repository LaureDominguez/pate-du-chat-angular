import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DeviceService {

  private readonly MOBILE_BREAKPOINT = 768;

  private isMobileSubject = new BehaviorSubject<boolean>(this.checkIfMobile());
  public isMobile$ = this.isMobileSubject.asObservable();
  
  constructor() {
    if (this.isBrowser()) {
      window.addEventListener('resize', () => {
        const isMobile = this.checkIfMobile();
        if (this.isMobileSubject.value !== isMobile) {
          this.isMobileSubject.next(isMobile);
        }
      });
    }
  }

  private isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof document !== 'undefined';
  }

  private checkIfMobile(): boolean {
    return this.isBrowser() && window.innerWidth < this.MOBILE_BREAKPOINT;
  }

  public get isMobile(): boolean {
    return this.isMobileSubject.value;
  }
}
