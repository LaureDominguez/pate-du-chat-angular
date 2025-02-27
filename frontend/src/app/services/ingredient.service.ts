import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, catchError, map, Observable, tap, throwError } from 'rxjs';

import { Ingredient } from '../models/ingredient';
import { SharedDataService } from './shared-data.service';

@Injectable({
  providedIn: 'root',
})
export class IngredientService {
  private apiUrl = 'http://localhost:5000/api/ingredients';
  private allergenesUrl = '../assets/data/allergenes.json';

  private ingredientsSubject = new BehaviorSubject<Ingredient[]>([]);
  ingredients$ = this.ingredientsSubject.asObservable(); // Observable écoutable

  constructor(
    private http: HttpClient,
    private sharedDataService: SharedDataService
  ) {
    this.loadIngredients(); // Charger les ingrédients au démarrage

    this.sharedDataService.ingredientListUpdate$.subscribe(() => {
      console.log('IngredientService -> SharedData -> ingredientListUpdate$');
      this.loadIngredients();
    });

    // console.log('IngredientService constructor -> ingredients$ :', this.ingredients$);
  }

  // Charge les ingrédients et met à jour le BehaviorSubject
  private loadIngredients(): void {
    console.log(
      '%c [IngredientService] → loadIngredients() appelée',
      'color: purple; font-weight: bold;'
    );
    this.http.get<Ingredient[]>(this.apiUrl).subscribe((ingredients) => {
      console.log(
        '%c [IngredientService] → Ingrédients reçus du serveur :',
        'color: purple; font-weight: bold;',
        ingredients
      );

      this.ingredientsSubject.next(ingredients); // Met à jour les abonnés

        console.log(
          '%c [IngredientService] → Fin loadIngredients()',
          'color: purple; font-weight: bold;'
        );
        
    });
  }

  getIngredients(): Observable<Ingredient[]> {
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
    return this.http.post<Ingredient>(this.apiUrl, payload).pipe(
      catchError(this.handleError),
      tap(() => this.loadIngredients()) // Recharge la liste après création
    );
  }

  updateIngredient(id: string, payload: any): Observable<Ingredient> {
    const url = `${this.apiUrl}/${id}`;
    return this.http.put<Ingredient>(url, payload).pipe(
      catchError(this.handleError),
      tap(() => this.loadIngredients()) // Recharge la liste après modification
    );
  }

  deleteIngredient(id: string): Observable<{ message: string }> {
    const url = `${this.apiUrl}/${id}`;
    return this.http.delete<{ message: string }>(url).pipe(
      catchError(this.handleError),
      tap(() => this.loadIngredients()) // Recharge la liste après suppression
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
export { Ingredient };