import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DeviceService {

  private readonly MOBILE_BREAKPOINT = 768;

  private isMobileSubject = new BehaviorSubject<boolean>(false);
  public isMobile$ = this.isMobileSubject.asObservable();

  // private _deviceOS: string = 'unknown';

  public os: 'android' | 'ios' | 'windows' | 'macos' | 'linux' | 'unknown' = 'unknown';
  public browser: string = 'unknown';
  
  constructor() {
    if (this.isBrowser()) {
      this.detectOS();
      this.detectBrowser();

      this.updateMobileStatus();

      window.addEventListener('resize', () => {
        this.updateMobileStatus();
      });
    }
  }

  private isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof document !== 'undefined';
  }

  private updateMobileStatus(): void {
    const width = window.innerWidth;
    const isSmallScreen = width < this.MOBILE_BREAKPOINT;
    const isMobileOS = ['android', 'ios'].includes(this.os);
    const result = isSmallScreen && isMobileOS;
    this.isMobileSubject.next(result);
    console.log('📏 Écran petit :', isSmallScreen);
    console.log('📱 OS mobile :', isMobileOS);
    console.log('✅ isMobile :', result);
  }

  private detectOS(): void {
    if (!this.isBrowser()) {
      this.os = 'unknown';
      return;
      };

    const userAgent = navigator.userAgent.toLocaleLowerCase();
    console.log('Unknown OS:', userAgent);

    if (userAgent.includes('android')) {
      this.os = 'android';
    } else if (userAgent.includes('iphone') || userAgent.includes('ipad') || userAgent.includes('ipod')) {
      this.os = 'ios';
    } else if (userAgent.includes('windows nt')) {
      this.os = 'windows';
    } else if (userAgent.includes('macintosh')) {
      this.os = 'macos';
    } else if (userAgent.includes('linux')) {
      this.os = 'linux';
    } else {
      this.os = 'unknown';
    }
  }

  private detectBrowser(): void {
    const ua = navigator.userAgent.toLocaleLowerCase();
    if (ua.includes('opr') || ua.includes('opera')) {
      this.browser = 'opera';
    } else if (ua.includes('edg')) {
      this.browser = 'edge';
    } else if (ua.includes('chrome') || ua.includes('crios') || ua.includes('crmo')) {
      this.browser = 'chrome';
    } else if (ua.includes('firefox') || ua.includes('fxios')) {
      this.browser = 'firefox';
    } else if (ua.includes('safari')) {
      this.browser = 'safari';
    } else {
      this.browser = 'unknown';
    }
  }


  public get isMobile(): boolean {
    return this.isMobileSubject.value;
  }

}
