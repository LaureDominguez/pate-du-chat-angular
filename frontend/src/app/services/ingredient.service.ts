import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { auditTime, BehaviorSubject, catchError, finalize, firstValueFrom, map, merge, Observable, tap, throwError } from 'rxjs';

import { Ingredient } from '../models/ingredient';
import { DEFAULT_SUPPLIER } from '../models/supplier';
import { SharedDataService } from './shared-data.service';
import { originFlag } from '../../assets/data/origin-flags';
import { DialogService } from './dialog.service';

@Injectable({
  providedIn: 'root',
})
export class IngredientService {
  private apiUrl = 'http://localhost:5000/api/ingredients';
  private allergenesUrl = '../assets/data/allergenes.json';
  private originesUrl = '../assets/data/origines.json';

  private ingredientsSubject = new BehaviorSubject<Ingredient[]>([]);
  ingredients$ = this.ingredientsSubject.asObservable(); // Observable écoutable
  private isProcessing = false; // Indicateur de traitement en cours

  constructor(
    private http: HttpClient,
    private sharedDataService: SharedDataService,
    private dialogService: DialogService
  ) {
    this.loadIngredients();

    merge(
      this.sharedDataService.ingredientListUpdate$,
      this.sharedDataService.supplierListUpdate$
    )
      .pipe(auditTime(50))
      .subscribe(() => {
        if (!this.isProcessing) {
          this.loadIngredients();
        }
    })
  }

  private loadIngredients(): void {
    this.http.get<Ingredient[]>(this.apiUrl).subscribe((ingredients) => {
      this.ingredientsSubject.next(ingredients); 
    });
  }

  getIngredients(): Observable<Ingredient[]> {
    return this.ingredients$;
  }

  getIngredientById(id: string): Observable<Ingredient> {
    const url = `${this.apiUrl}/${id}`;
    return this.http.get<Ingredient>(url);
  }

  getIngredientsBySupplier(supplierId: string): Observable<Ingredient[]> {
    const url = `${this.apiUrl}/by-supplier/${supplierId}`;
    return this.http.get<Ingredient[]>(url).pipe(
      map((ingredients) => 
        ingredients.map((ingredient) => ({
          ...ingredient,
          supplier: ingredient.supplier ? ingredient.supplier : DEFAULT_SUPPLIER,
        }))
      )
    );
  }

  getAllergenes(): Observable<string[]> {
    return this.http
      .get<{ allergenes: string[] }>(this.allergenesUrl)
      .pipe(map((data) => data.allergenes));
  }
  
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

  checkExistingIngredientName(name: string, excludedId?: string): Observable<boolean> {
    let url = `${this.apiUrl}/check-name/${encodeURIComponent(name)}`;
    if (excludedId) {
      url += `?excludedId=${encodeURIComponent(excludedId)}`;
    }
    return this.http
      .get<boolean>(url)
      .pipe(
        catchError((error: HttpErrorResponse) => {
          console.error('❌ Erreur lors de la recherche de l\'ingrédient:', error);
          return throwError(() => new Error('Impossible de charger l\'ingrédient.'));
        })
      );
  }

  createIngredient(payload: any): Observable<Ingredient> {
    return this.http.post<Ingredient>(this.apiUrl, payload).pipe(
      tap(() => {
        this.sharedDataService.notifyIngredientUpdate();
      }),
      catchError(this.handleError.bind(this))
    );
  }

  updateIngredient(id: string, payload: any): Observable<Ingredient> {
    const url = `${this.apiUrl}/${id}`;
    return this.http.put<Ingredient>(url, payload).pipe(
      tap(() => {
        this.sharedDataService.notifyIngredientUpdate();
      }), 
      catchError(this.handleError.bind(this))
    );
  }

  deleteIngredient(id: string): Observable<{ message: string }> {
    const url = `${this.apiUrl}/${id}`;
    return this.http.delete<{ message: string }>(url).pipe(
      tap(() => {
        this.sharedDataService.notifyIngredientUpdate();
      }),
      catchError(this.handleError.bind(this)),
    );
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Une erreur inconnue est survenue.';

    if (error.status === 400) {
      if (error.error.errors) {
        errorMessage = error.error.errors
          .map((err: any) => err.msg)
          .join('<br>');
      } else if (error.error.msg) {
        errorMessage = error.error.msg;
      } else {
        errorMessage = 'Requête invalide. Vérifiez vos champs.';
      }
    } else if (error.status === 404) {
      errorMessage = error.error.msg || 'Erreur 404 : Ressource introuvable.';
    } else if (error.status === 500) {
      errorMessage = 'Erreur serveur. Veuillez réessayer plus tard.';
    }
    this.dialogService.error(errorMessage);

    return throwError(() => new Error(errorMessage));
  }
}
export { Ingredient };