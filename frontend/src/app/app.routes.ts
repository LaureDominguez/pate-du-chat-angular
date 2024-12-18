import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { AboutComponent } from './components/about/about.component';
import { ShopComponent } from './components/shop/shop.component';
import { ContactComponent } from './components/contact/contact.component';
import { ProductsComponent } from './components/pasta/products/products.component';
import { AdminComponent } from './components/admin/admin.component';

export const APP_ROUTES: Routes = [
  { path: '', data: { title: 'Accueil' }, component: HomeComponent }, //Home
  { path: 'about', data: { title: "L'Atelier" }, component: AboutComponent }, //About
  {
    path: 'products',
    data: { title: 'Les Produits' },
    component: ProductsComponent,
  }, //Products
  { path: 'shop', data: { title: 'La Boutique' }, component: ShopComponent }, //Shop
  { path: 'contact', data: { title: 'Contact' }, component: ContactComponent }, //Contact
  {
    path: 'admin',
    data: { title: 'Gestion du site' },
    component: AdminComponent,
  },
  { path: '**', redirectTo: '', pathMatch: 'full' }, //Error
];
