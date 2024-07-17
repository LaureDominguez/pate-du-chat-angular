import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppComponent } from './app.component';
import { ProductsComponent } from './components/products/products.component';
import { BrowserModule } from '@angular/platform-browser';
import { ProductService } from './services/product.service';
import { HttpClientModule, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';



@NgModule({
  declarations: [AppComponent, ProductsComponent],
  imports: [
    CommonModule,
    BrowserModule,
    HttpClientModule,
    // provideHttpClient(withInterceptorsFromDi()),
  ],
  providers: [ProductService],
  bootstrap: [AppComponent],
})
export class AppModule {}
