import { Component, OnInit } from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Observable } from 'rxjs';
import { filter, map, shareReplay } from 'rxjs/operators';
import { ActivatedRoute, NavigationEnd, Router, RouterModule } from '@angular/router';
import { AppModule } from '../../app.module';

@Component({
  selector: 'app-nav',
  templateUrl: './nav.component.html',
  styleUrls: ['./nav.component.scss'],
  standalone: true,
  imports: [
    AppModule,
    // Module pour les routes
    RouterModule,
  ],
})
export class NavComponent implements OnInit {
  navItems = [
    { title: 'Accueil', link: '/' },
    { title: 'Les Produits', link: '/shop' },
    { title: 'Contact', link: '/contact' },
    { title: 'Gestion du site', link: '/admin' },
  ];

  isHandset$: Observable<boolean>;
  pageTitle: string = '';

  constructor(
    private breakpointObserver: BreakpointObserver,
    private router: Router,
    private activatedRoute: ActivatedRoute
  ) {
    this.isHandset$ = this.breakpointObserver.observe(Breakpoints.Handset).pipe(
      map((result) => result.matches),
      shareReplay()
    );
  }
  ngOnInit(): void {
    // Écouter les changements de navigation
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd), // Filtrer les événements de navigation
        map(() => {
          let route = this.activatedRoute;
          while (route.firstChild) {
            route = route.firstChild; // Descendre jusqu'à la route enfant active
          }
          return route.snapshot.data['title']; // Récupérer le titre
        })
      )
      .subscribe((title: string) => {
        this.pageTitle = title || 'Les Pâtes du Chat'; // Mettre à jour le titre ou définir un titre par défaut
      });
  }
}
