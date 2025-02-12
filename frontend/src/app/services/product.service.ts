import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, catchError, Observable, tap, throwError } from 'rxjs';

import { FinalProduct, Product } from '../models/product';

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private apiUrl = 'http://localhost:5000/api/products';
  private productSubject = new BehaviorSubject<Product[]>([]);
  products$ = this.productSubject.asObservable(); // Observable écoutable
  private finalProductSubject = new BehaviorSubject<FinalProduct[]>([]);
  finalProducts$ = this.finalProductSubject.asObservable(); // Observable écoutable

  constructor(private http: HttpClient) {
    this.loadProducts(); // Charger les produits au démarrage
    this.loadFinalProducts(); // Charger les produits finaux au démarrage
  }

  ////////////////////////
  //////// Public products

  private loadFinalProducts(): void {
    this.http.get<FinalProduct[]>(`${this.apiUrl}?view=full`).subscribe((products) => {
      this.finalProductSubject.next(products); // Met à jour les abonnés
    });
  }

  getFinalProducts(): Observable<FinalProduct[]> {
    return this.finalProducts$;
  }

  getFinalProductById(id: string): Observable<FinalProduct> {
    const url = `${this.apiUrl}/${id}?view=full`;
    return this.http.get<FinalProduct>(url);
  }

  ////////////////////////
  //////// Admin products

  private loadProducts(): void {
    this.http.get<Product[]>(this.apiUrl).subscribe((products) => {
      this.productSubject.next(products); // Met à jour les abonnés
    });
  }

  getProducts(): Observable<Product[]> {
    return this.products$;
  }

  getProductById(id: string): Observable<Product> {
    const url = `${this.apiUrl}/${id}`;
    return this.http.get<Product>(url);
  }

  createProduct(payload: any): Observable<Product> {
    return this.http.post<Product>(this.apiUrl, payload).pipe(
      catchError(this.handleError),
      tap(() => this.loadFinalProducts()) // Recharge la liste après création
    );
  }

  updateProduct(id: string, payload: any): Observable<Product> {
    const url = `${this.apiUrl}/${id}`;
    return this.http.put<Product>(url, payload).pipe(
      catchError(this.handleError),
      tap(() => this.loadFinalProducts()) // Recharge la liste après création
    );
  }

  deleteProduct(id: string): Observable<{ message: string }> {
    const url = `${this.apiUrl}/${id}`;
    return this.http.delete<{ message: string }>(url).pipe(
      catchError(this.handleError),
      tap(() => this.loadFinalProducts())
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
export { FinalProduct, Product };
