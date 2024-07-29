import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BrowserModule } from '@angular/platform-browser';
import { AppComponent } from './app.component';
import { ProductsComponent } from './components/products/products.component';
import { ProductService } from './services/product.service';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { APP_ROUTES } from './app.routes';

@NgModule({
  declarations: [AppComponent, ProductsComponent],
  imports: [BrowserModule],
  providers: [
    provideHttpClient(),
    provideRouter(APP_ROUTES)
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
