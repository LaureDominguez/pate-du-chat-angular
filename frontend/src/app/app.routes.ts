import { Routes } from '@angular/router';

export const APP_ROUTES: Routes = [
  { 
    path: '', 
    data: { title: 'Accueil' }, 
    loadComponent: () => import('./components/home/home.component').then(m => m.HomeComponent) 
  },
  { 
    path: 'shop', 
    data: { title: 'La Boutique' }, 
    loadComponent: () => import('./components/shop/shop.component').then(m => m.ShopComponent) 
  },
  { path: 'shop/:slug', 
    data: { title: 'Détail du produit' }, 
    loadComponent: () => import('./components/shop/shop-detail/shop-detail.component').then(m => m.ShopDetailComponent) 
  },
  { 
    path: 'contact', 
    data: { title: 'Contact' }, 
    loadComponent: () => import('./components/contact/contact.component').then(m => m.ContactComponent)
  },

  // Admin routes -> changer pour loadChildren si nécessaire
  {
    path: 'admin',
    data: { title: 'Gestion du site' },
    loadComponent: () => import('./components/admin/admin.component').then(m => m.AdminComponent),
  },

  // Fallback route
  { path: '**', redirectTo: '', pathMatch: 'full' }, // Catch-all error route
];
