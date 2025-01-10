import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { AboutComponent } from './components/about/about.component';
import { ShopComponent } from './components/shop/shop.component';
import { ContactComponent } from './components/contact/contact.component';
import { ProductsComponent } from './components/pasta/products/products.component';

export const APP_ROUTES: Routes = [
  { path: '', data: { title: 'Accueil' }, component: HomeComponent },
  { path: 'about', data: { title: "L'Atelier" }, component: AboutComponent },
  {
    path: 'products',
    data: { title: 'Les Produits' },
    component: ProductsComponent,
  },
  { path: 'shop', data: { title: 'La Boutique' }, component: ShopComponent },
  { path: 'contact', data: { title: 'Contact' }, component: ContactComponent },
  // Lazy-loaded admin module
  {
    path: 'admin',
    data: { title: 'Gestion du site' },
    loadComponent: () =>
      import('./components/admin/admin.component').then(
        (m) => m.AdminComponent
      ),
  },
  { path: '**', redirectTo: '', pathMatch: 'full' }, // Catch-all error route
];
