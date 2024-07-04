import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { AboutComponent } from './about/about.component';
import { ShopComponent } from './shop/shop.component';
import { ContactComponent } from './contact/contact.component';


export const routes: Routes = [
    { path: '', component: HomeComponent }, //Home
    { path: 'about', component: AboutComponent }, //About
    { path: 'shop', component: ShopComponent }, //Shop
    { path: 'contact', component: ContactComponent}, //Contact
    { path: '**', redirectTo: '', pathMatch: 'full' } //Error
];
