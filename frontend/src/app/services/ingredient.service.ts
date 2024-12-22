import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Ingredient {
  _id?: string;
  name: string;
  supplier: string;
  allergens: string[];
  vegan: boolean;
  vegeta: boolean;
  images?: string[];
}

@Injectable({
  providedIn: 'root',
})
export class IngredientService {
  private apiUrl = 'http://localhost:5000/api/ingredients';

  constructor(private http: HttpClient) {}

  getIngredients(): Observable<Ingredient[]> {
    return this.http.get<Ingredient[]>(this.apiUrl);
  }

  getIngredientById(id: string): Observable<Ingredient> {
    const url = `${this.apiUrl}/${id}`;
    return this.http.get<Ingredient>(url);
  }

  createIngredient(ingredient: FormData): Observable<Ingredient> {
    console.log("ingredient.service :", this.apiUrl, ' ', ingredient);
    console.log('FormData Keys:', Array.from((ingredient as any).keys()));
    console.log('FormData Values:', Array.from((ingredient as any).values()));
    console.log('FormData Entries:', Array.from((ingredient as any).entries()));

    
    return this.http.post<Ingredient>(this.apiUrl, ingredient);
  }
  
  updateIngredient(id: string, ingredient: FormData): Observable<Ingredient> {
    const url = `${this.apiUrl}/${id}`;
    return this.http.put<Ingredient>(url, ingredient);
  }

  deleteIngredient(id: string): Observable<{ message: string }> {
    const url = `${this.apiUrl}/${id}`;
    console.log( "ingredient.service :", url);
    return this.http.delete<{ message: string }>(url);
  }
}
