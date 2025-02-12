import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, catchError, Observable, tap, throwError } from 'rxjs';

import { Category } from '../models/category';

@Injectable({
  providedIn: 'root',
})
export class CategoryService {
  private apiUrl = 'http://localhost:5000/api/categories';
  private categoriesSubject = new BehaviorSubject<Category[]>([]);
  categories$ = this.categoriesSubject.asObservable(); // Observable écoutable

  constructor(private http: HttpClient) {
    this.loadCategories(); // Charger les catégories au démarrage
  }

  // Charge les catégories et met à jour le BehaviorSubject
  private loadCategories(): void {
    this.http.get<Category[]>(this.apiUrl).subscribe((categories) => {
      this.categoriesSubject.next(categories); // Met à jour les abonnés
    });
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
    console.log('🔍 Données envoyées au serveur :', payload);
    return this.http.post<Category>(this.apiUrl, payload).pipe(
      catchError(this.handleError),
      tap(() => this.loadCategories()) // Met à jour après création
    );
  }

  // Mettre à jour une catégorie existante
  updateCategory(id: string, payload: any): Observable<Category> {
    const url = `${this.apiUrl}/${id}`;
    return this.http.put<Category>(url, payload).pipe(
      catchError(this.handleError),
      tap(() => this.loadCategories()) // Met à jour après modification
    );
  }

  // Supprimer une catégorie
  deleteCategory(id: string): Observable<{ message: string }> {
    const url = `${this.apiUrl}/${id}`;
    return this.http.delete<{ message: string }>(url).pipe(
      catchError(this.handleError),
      tap(() => this.loadCategories()) // Met à jour après suppression
    );
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Une erreur inconnue est survenue.';

    if (error.status === 400) {
      if (error.error.errors) {
        // Express Validator envoie un tableau d'erreurs → on concatène les messages
        errorMessage = error.error.errors
          .map((err: any) => err.msg)
          .join('<br>');
      } else if (error.error.msg) {
        // Cas d'une erreur unique (ex: "Cet ingrédient existe déjà.")
        errorMessage = error.error.msg;
      } else {
        errorMessage = 'Requête invalide. Vérifiez vos champs.';
      }
    } else if (error.status === 404) {
      errorMessage = error.error.msg || 'Erreur 404 : Ressource introuvable.';
    } else if (error.status === 500) {
      errorMessage = 'Erreur serveur. Veuillez réessayer plus tard.';
    }

    return throwError(() => new Error(errorMessage));
  }
}

export { Category };
