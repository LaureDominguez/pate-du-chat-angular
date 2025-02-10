import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, map, Observable, tap } from 'rxjs';

import { Ingredient } from '../models/ingredient';

@Injectable({
  providedIn: 'root',
})
export class IngredientService {
  private apiUrl = 'http://localhost:5000/api/ingredients';
  private allergenesUrl = '../assets/data/allergenes.json';

  // Stockage local des ingrédients
  private ingredientsSubject = new BehaviorSubject<Ingredient[]>([]);
  ingredients$ = this.ingredientsSubject.asObservable(); // Observable écoutable

  constructor(private http: HttpClient) {
    this.loadIngredients(); // Charger les ingrédients au démarrage
  }

  // Charge les ingrédients et met à jour le BehaviorSubject
  private loadIngredients(): void {
    this.http.get<Ingredient[]>(this.apiUrl).subscribe((ingredients) => {
      // console.log('📡 Chargement des ingrédients :', ingredients);
      this.ingredientsSubject.next(ingredients); // Met à jour les abonnés
    });
  }

  getIngredients(): Observable<Ingredient[]> {
    console.log('>>>📡 liste des Ingredients chargés');
    // return this.http.get<Ingredient[]>(this.apiUrl);
    return this.ingredients$;
  }

  getIngredientById(id: string): Observable<Ingredient> {
    const url = `${this.apiUrl}/${id}`;
    return this.http.get<Ingredient>(url);
  }

  getAllergenes(): Observable<string[]> {
    return this.http
      .get<{ allergenes: string[] }>(this.allergenesUrl)
      .pipe(map((data) => data.allergenes));
  }

  createIngredient(payload: any): Observable<Ingredient> {
    // console.log('ingredient.service -> payload :', payload);
    // return this.http.post<Ingredient>(this.apiUrl, payload);
    return this.http.post<Ingredient>(this.apiUrl, payload).pipe(
      tap(() => this.loadIngredients()) // Recharge la liste après création
    );
  }

  updateIngredient(id: string, payload: any): Observable<Ingredient> {
    const url = `${this.apiUrl}/${id}`;
    // return this.http.put<Ingredient>(url, payload);
    return this.http.put<Ingredient>(url, payload).pipe(
      tap(() => this.loadIngredients()) // Recharge la liste après modification
    );
  }

  deleteIngredient(id: string): Observable<{ message: string }> {
    const url = `${this.apiUrl}/${id}`;
  // console.log('ingredient.service :', url);
    // return this.http.delete<{ message: string }>(url);
    return this.http.delete<{ message: string }>(url).pipe(
      tap(() => this.loadIngredients()) // Recharge la liste après suppression
    );
  }
}
export { Ingredient };