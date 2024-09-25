import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.component.html',
  styleUrl: './app.component.sass', 
})
export class AppComponent {
  title = 'les_pates_du_chat';
  
  navItems = [
    { title: 'Accueil', link: '/' },
    { title: 'L\'Atelier', link: '/about' },
    { title: 'Les Produits', link: '/products' },
    { title: 'La Boutique', link: '/shop' },
    { title: 'Contact', link: '/contact' }
  ];
}

