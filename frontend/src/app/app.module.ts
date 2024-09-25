import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppComponent } from './app.component';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { APP_ROUTES } from './app.routes';
import { MatCardModule } from '@angular/material/card';
import { MatGridListModule } from '@angular/material/grid-list';



@NgModule({
  declarations: [AppComponent],
  imports: [BrowserModule, MatCardModule, MatGridListModule],
  providers: [provideHttpClient(withFetch()), provideRouter(APP_ROUTES)],
  bootstrap: [AppComponent],
})
export class AppModule {}
