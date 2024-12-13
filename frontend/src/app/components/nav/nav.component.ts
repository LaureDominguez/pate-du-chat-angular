import { Component, inject } from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { AsyncPipe, CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { Observable } from 'rxjs';
import { filter, map, shareReplay } from 'rxjs/operators';
import { ActivatedRoute, NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialogModule } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-nav',
  standalone: true,
  templateUrl: './nav.component.html',
  styleUrls: ['./nav.component.scss'],
  imports: [
    MatToolbarModule,
    MatButtonModule,
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    MatDialogModule,
    ReactiveFormsModule,
    MatInputModule,
    MatCheckboxModule,
    AsyncPipe,
    CommonModule,
    RouterLink,
    RouterOutlet,
  ],
})
export class NavComponent {
  private breakpointObserver = inject(BreakpointObserver);

  navItems = [
    { title: 'Accueil', link: '/' },
    { title: 'Les Produits', link: '/products' },
    // { title: 'La Boutique', link: '/shop' },
    // { title: 'L\'Atelier', link: '/about' },
    { title: 'Contact', link: '/contact' },
    { title: 'Gestion du site', link: '/admin' },
  ];

  isHandset$: Observable<boolean> = this.breakpointObserver
    .observe(Breakpoints.Handset)
    .pipe(
      map((result) => result.matches),
      shareReplay()
    );

  pageTitle: string = '';

  constructor(private router: Router, private activatedRoute: ActivatedRoute) {}

  ngOnInit(): void {
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd), // On réagit seulement après la fin de la navigation
        map(() => {
          let route = this.activatedRoute;
          while (route.firstChild) {
            route = route.firstChild; // On descend dans les routes enfants si présents
          }
          return route;
        }),
        map((route) => route.snapshot.data['title']) // Récupère le titre défini dans la route
      )
      .subscribe((title: string) => {
        this.pageTitle = title; // Mise à jour du titre
      });
  }
}
