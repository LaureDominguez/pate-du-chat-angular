import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.sass'],
})
export class AppComponent {
  title = 'les_pates_du_chat';

  navItems = [
    { title: 'Accueil', link: '/' },
    { title: 'Les Produits', link: '/products' },
    // { title: 'La Boutique', link: '/shop' },
    // { title: 'L\'Atelier', link: '/about' },
    { title: 'Contact', link: '/contact' },
    { title: 'Gestion du site', link: '/admin' },
  ];
}

