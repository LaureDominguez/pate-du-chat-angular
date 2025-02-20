import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, catchError, Observable, tap, throwError } from 'rxjs';

import { Category, DEFAULT_CATEGORY } from '../models/category';
import { SharedDataService } from './shared-data.service';

@Injectable({
  providedIn: 'root',
})
export class CategoryService {
  private apiUrl = 'http://localhost:5000/api/categories';

  private categoriesSubject = new BehaviorSubject<Category[]>([]);
  categories$ = this.categoriesSubject.asObservable(); // Observable écoutable

  constructor(
    private http: HttpClient,
    private sharedDataService: SharedDataService
  ) {
    this.loadCategories(); // Charger les catégories au démarrage

    this.sharedDataService.categoryListUpdate$.subscribe(() => {
      this.loadCategories();
    });

    this.sharedDataService.productListUpdate$.subscribe(() => {
      this.loadCategories();
    });
  }

  // Charge les catégories et met à jour le BehaviorSubject
  private loadCategories(): void {
    console.log('🔍 Chargement des catégories...');

    this.http
      .get<Category[]>(this.apiUrl)
      .pipe(
        tap((categories) => {
          if (!categories || categories.length === 0) {
            console.warn(
              "⚠️ Aucune catégorie trouvée, ajout de 'Sans catégorie'"
            );
            categories = [DEFAULT_CATEGORY];
          } else {
            categories = categories.sort((a, b) =>
              a._id === DEFAULT_CATEGORY._id
                ? -1
                : b._id === DEFAULT_CATEGORY._id
                ? 1
                : 0
            );
          }
          this.categoriesSubject.next(categories);
        }),
        catchError((error) => {
          console.error(
            '❌ Erreur lors de la récupération des catégories :',
            error
          );
          this.categoriesSubject.next([DEFAULT_CATEGORY]); // Sécurise le frontend pour éviter un crash
          return throwError(
            () => new Error('Erreur lors du chargement des catégories')
          );
        })
      )
      .subscribe(); // ✅ Permet de déclencher l'observable sans utiliser `.subscribe()` directement dans le callback
  }

  // Récupérer toutes les catégories
  getCategories(): Observable<Category[]> {
    return this.categories$;
  }

  // Récupérer une catégorie par son ID
  getCategoryById(id: string): Observable<Category> {
    const url = `${this.apiUrl}/${id}`;
    return this.http.get<Category>(url);
  }

  // Créer une nouvelle catégorie
  createCategory(payload: any): Observable<Category> {
    return this.http.post<Category>(this.apiUrl, payload).pipe(
      tap(() => {
        this.sharedDataService.notifyCategoryUpdate(); // Notifie les abonnés
      }),
      catchError(this.handleError)
    );
  }

  // Mettre à jour une catégorie existante
  updateCategory(id: string, payload: any): Observable<Category> {
    const url = `${this.apiUrl}/${id}`;
    return this.http.put<Category>(url, payload).pipe(
      tap(() => {
        this.sharedDataService.notifyCategoryUpdate(); // Notifie les abonnés
      }),
      catchError(this.handleError)
    );
  }

  // Supprimer une catégorie
  deleteCategory(id: string): Observable<{ message: string }> {
    const url = `${this.apiUrl}/${id}`;
    return this.http.delete<{ message: string }>(url).pipe(
      tap(() => {
        this.sharedDataService.notifyCategoryUpdate(); // Notifie les abonnés
      }),
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Une erreur inconnue est survenue.';

    if (error.status === 400) {
      errorMessage =
        error.error.errors?.map((err: any) => err.msg).join('<br>') ||
        'Requête invalide.';
    } else if (error.status === 404) {
      errorMessage = error.error.msg || 'Erreur 404 : Ressource introuvable.';
    } else if (error.status === 500) {
      errorMessage = 'Erreur serveur. Veuillez réessayer plus tard.';
    }

    return throwError(() => errorMessage);
  }
}

export { Category };
