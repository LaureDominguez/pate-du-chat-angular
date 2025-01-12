import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Category {
  _id?: string | null;
  name: string;
  description?: string;
}

@Injectable({
  providedIn: 'root',
})
export class CategoryService {
  private apiUrl = 'http://localhost:5000/api/categories';

  constructor(private http: HttpClient) {}

  // Récupérer toutes les catégories
  getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(this.apiUrl);
  }

  // Récupérer une catégorie par son ID
  getCategoryById(id: string): Observable<Category> {
    const url = `${this.apiUrl}/${id}`;
    return this.http.get<Category>(url);
  }

  // Créer une nouvelle catégorie
  createCategory(category: Category): Observable<Category> {
    return this.http.post<Category>(this.apiUrl, category);
  }

  // Mettre à jour une catégorie existante
  updateCategory(category: Category): Observable<Category> {
    const url = `${this.apiUrl}/${category._id}`;
    return this.http.put<Category>(url, category);
  }

  // Supprimer une catégorie
  deleteCategory(id: string): Observable<{ message: string }> {
    const url = `${this.apiUrl}/${id}`;
    return this.http.delete<{ message: string }>(url);
  }
}
