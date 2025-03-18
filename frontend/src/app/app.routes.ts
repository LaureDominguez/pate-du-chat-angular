import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { ContactComponent } from './components/contact/contact.component';
import { ShopGridComponent } from './components/shop/shop-grid/shop-grid.component';

export const APP_ROUTES: Routes = [
  { path: '', data: { title: 'Accueil' }, component: HomeComponent },
  { path: 'shop', data: { title: 'La Boutique' }, component: ShopGridComponent },
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
