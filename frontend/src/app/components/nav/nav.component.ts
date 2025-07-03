import { Component, OnInit } from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Observable } from 'rxjs';
import { filter, map, shareReplay } from 'rxjs/operators';
import { ActivatedRoute, NavigationEnd, Router, RouterModule } from '@angular/router';
import { ThemeService } from '../../services/theme.service';
import { MATERIAL_IMPORTS } from '../../app-material';

@Component({
  selector: 'app-nav',
  templateUrl: './nav.component.html',
  styleUrls: ['./nav.component.scss'],
  standalone: true,
  imports: [
    MATERIAL_IMPORTS,
    RouterModule,
  ],
})
export class NavComponent implements OnInit {
  activeTheme$: Observable<string>;

  pageTitle: string = '';

  navItems = [
    { title: 'Accueil', link: '/' },
    { title: 'Les Produits', link: '/shop' },
    { title: 'Contact', link: '/contact' },
    { title: 'Gestion du site', link: '/admin' },
  ];

  isHandset$: Observable<boolean>;

  constructor(
    private breakpointObserver: BreakpointObserver,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    public themeService: ThemeService // Injecter le service de thème
  ) 
  {
    // Observer pour détecter les changements de taille d'écran
    this.isHandset$ = this.breakpointObserver.observe(Breakpoints.Handset).pipe(
      map((result) => result.matches),
      shareReplay()
    );

    // Initialiser le thème actif
    this.activeTheme$ = this.themeService.getActiveTheme();
    // console.log('activeTheme$ :', this.activeTheme$);
  }

  ngOnInit(): void {
    // Gestion de la navigation et du titre de la page
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

  onToggleTheme() {
    this.themeService.toggleTheme();
    // console.log('activeTheme :', this.activeTheme$);
  }
}
