import { DEFAULT_CURRENCY_CODE, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppComponent } from './app.component';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideRouter, RouterModule } from '@angular/router';
import { APP_ROUTES } from './app.routes';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { registerLocaleData } from '@angular/common';
import { LOCALE_ID } from '@angular/core';
import localeFr from '@angular/common/locales/fr';
import { ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';


registerLocaleData(localeFr, 'fr');


@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    RouterModule.forRoot(APP_ROUTES),
    MatDialogModule,
    ReactiveFormsModule,
    MatInputModule,
    MatCheckboxModule,
  ],
  providers: [
    { provide: LOCALE_ID, useValue: 'fr' },
    { provide: DEFAULT_CURRENCY_CODE, useValue: 'EUR' },
    provideHttpClient(withFetch()),
    provideRouter(APP_ROUTES),
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
