import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { AboutComponent } from './components/about/about.component';
import { ShopComponent } from './components/shop/shop.component';
import { ContactComponent } from './components/contact/contact.component';
import { ProductsComponent } from './components/products/products.component';
import { AdminComponent } from './admin/admin.component';

export const APP_ROUTES: Routes = [
  { path: '', title: 'Accueil', component: HomeComponent }, //Home
  { path: 'about', title: "L'Atelier", component: AboutComponent }, //About
  { path: 'products', title: 'Les Produits', component: ProductsComponent }, //Products
  { path: 'shop', title: 'La Boutique', component: ShopComponent }, //Shop
  { path: 'contact', title: 'Contact', component: ContactComponent }, //Contact
  { path: 'admin', title: 'Gestion du site', component: AdminComponent },
  { path: '**', redirectTo: '', pathMatch: 'full' }, //Error
];
