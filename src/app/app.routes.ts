import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { AboutComponent } from './about/about.component';
import { ShopComponent } from './shop/shop.component';
import { ContactComponent } from './contact/contact.component';
import { ProductsComponent } from './products/products.component';


export const routes: Routes = [
  { path: '', title: 'Accueil', component: HomeComponent }, //Home
  { path: 'about', title: "L'Atelier", component: AboutComponent }, //About
  { path: 'products', title: 'Les Produits', component: ProductsComponent}, //Products
  { path: 'shop', title: 'La Boutique', component: ShopComponent }, //Shop
  { path: 'contact', title: 'Contact', component: ContactComponent }, //Contact
  { path: '**', redirectTo: '', pathMatch: 'full' }, //Error
];
