import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withRouterConfig } from '@angular/router';

import { APP_ROUTES } from './app.routes';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideHttpClient(withFetch()),
    provideRouter(APP_ROUTES, withRouterConfig({ onSameUrlNavigation: 'reload' })),
    // provideClientHydration(),
    provideAnimations(),
    // provideNoopAnimations()
  ],
};
