import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, catchError, firstValueFrom, map, Observable, tap, throwError } from 'rxjs';

import { Ingredient } from '../models/ingredient';
import { SharedDataService } from './shared-data.service';
import { originFlag } from '../../assets/data/origin-flags';

@Injectable({
  providedIn: 'root',
})
export class IngredientService {
  private apiUrl = 'http://localhost:5000/api/ingredients';
  private allergenesUrl = '../assets/data/allergenes.json';
  private originesUrl = '../assets/data/origines.json';

  private ingredientsSubject = new BehaviorSubject<Ingredient[]>([]);
  ingredients$ = this.ingredientsSubject.asObservable(); // Observable écoutable

  constructor(
    private http: HttpClient,
    private sharedDataService: SharedDataService
  ) {
    this.loadIngredients(); // Charger les ingrédients au démarrage
    this.handleSupplierReplacement();

    this.sharedDataService.ingredientListUpdate$.subscribe(() => {
      this.loadIngredients();
    });

    this.sharedDataService.supplierListUpdate$.subscribe(() => {
      this.loadIngredients(); // 👈 ou autre action de refresh
    });

  }

  // Charge les ingrédients et met à jour le BehaviorSubject
  private loadIngredients(): void {
    this.http.get<Ingredient[]>(this.apiUrl).subscribe((ingredients) => {
      this.ingredientsSubject.next(ingredients); // Met à jour les abonnés        
    });
  }

  getIngredients(): Observable<Ingredient[]> {
    return this.ingredients$;
  }

  getIngredientById(id: string): Observable<Ingredient> {
    const url = `${this.apiUrl}/${id}`;
    return this.http.get<Ingredient>(url);
  }

  // Allergènes
  getAllergenes(): Observable<string[]> {
    return this.http
      .get<{ allergenes: string[] }>(this.allergenesUrl)
      .pipe(map((data) => data.allergenes));
  }
  
  // Origines
  getOrigines(): Observable<any> {
    return this.http
      .get(this.originesUrl)
      .pipe(
        catchError((error) => {
          console.error('❌ Erreur lors du chargement des origines:', error);
          return throwError(() => new Error('Impossible de charger les origines.'));
        })
      );
  }

  getOriginIcon(origin: string): string {
    return originFlag[origin] || '❓';
  }

  createIngredient(payload: any): Observable<Ingredient> {
    return this.http.post<Ingredient>(this.apiUrl, payload).pipe(
      catchError(this.handleError),
      tap(() => this.loadIngredients()), // Recharge la liste après création
      tap(() => this.sharedDataService.notifySupplierUpdate())

    );
  }

  updateIngredient(id: string, payload: any): Observable<Ingredient> {
    const url = `${this.apiUrl}/${id}`;
    return this.http.put<Ingredient>(url, payload).pipe(
      catchError(this.handleError),
      tap(() => this.loadIngredients()), // Recharge la liste après modification
      tap(() => this.sharedDataService.notifySupplierUpdate())
    );
  }

  private handleSupplierReplacement(): void {
    this.sharedDataService.replaceSupplierInIngredients$.subscribe(
      ({ oldSupplierId, newSupplierId, ingredientIds }) => {
        const updates = ingredientIds.map(id =>
          firstValueFrom(this.updateIngredient(id, { supplier: newSupplierId }))
        );

        Promise.all(updates)
          .then(() => {
            console.log('✅ Tous les ingrédients ont été mis à jour avec le nouveau fournisseur.');
            this.sharedDataService.emitReplaceSupplierInIngredientsComplete(true);
          })
          .catch((error) => {
            console.error('❌ Erreur lors de la mise à jour des ingrédients :', error);
            this.sharedDataService.emitReplaceSupplierInIngredientsComplete(false);
          });
          console.log(`🔁 Remplacement du fournisseur ${oldSupplierId} → ${newSupplierId} pour :`, ingredientIds);
      }
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