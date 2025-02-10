import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';

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
    // console.log('📡 Chargement des catégories :', categories);
      this.categoriesSubject.next(categories); // Met à jour les abonnés
    });
  }

  // Récupérer toutes les catégories
  getCategories(): Observable<Category[]> {
  // console.log('liste des Catégories chargées');
    // return this.http.get<Category[]>(this.apiUrl);
    return this.categories$;
  }

  // Récupérer une catégorie par son ID
  getCategoryById(id: string): Observable<Category> {
    const url = `${this.apiUrl}/${id}`;
    return this.http.get<Category>(url);
  }

  // Créer une nouvelle catégorie
  createCategory(category: Category): Observable<Category> {
    // return this.http.post<Category>(this.apiUrl, category);
    return this.http.post<Category>(this.apiUrl, category).pipe(
      tap(() => this.loadCategories()) // Met à jour après création
    );
  }

  // Mettre à jour une catégorie existante
  updateCategory(category: Category): Observable<Category> {
    const url = `${this.apiUrl}/${category._id}`;
    // return this.http.put<Category>(url, category);
    return this.http.put<Category>(url, category).pipe(
      tap(() => this.loadCategories()) // Met à jour après modification
    );
  }

  // Supprimer une catégorie
  deleteCategory(id: string): Observable<{ message: string }> {
    const url = `${this.apiUrl}/${id}`;
    // return this.http.delete<{ message: string }>(url);
    return this.http.delete<{ message: string }>(url).pipe(
      tap(() => this.loadCategories()) // Met à jour après suppression
    );
  }
}

export { Category };
