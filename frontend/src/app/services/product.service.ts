import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, catchError, map, Observable, Subject, tap, throwError } from 'rxjs';

import { FinalProduct, Product } from '../models/product';
import { DEFAULT_CATEGORY } from '../models/category';
import { SharedDataService } from './shared-data.service';

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private apiUrl = 'http://localhost:5000/api/products';

  private productSubject = new BehaviorSubject<Product[]>([]);
  products$ = this.productSubject.asObservable(); // Observable écoutable

  private finalProductSubject = new BehaviorSubject<FinalProduct[]>([]);
  finalProducts$ = this.finalProductSubject.asObservable(); // Observable écoutable

  private dlcsUrl = '../assets/data/dlcs.json';

  constructor(
    private http: HttpClient,
    private sharedDataService: SharedDataService
  ) {
    this.loadProducts(); // Charger les produits au démarrage
    this.loadFinalProducts(); // Charger les produits finaux au démarrage

    this.sharedDataService.productListUpdate$.subscribe(() => {
      this.loadProducts();
      this.loadFinalProducts();
    });

    this.sharedDataService.categoryListUpdate$.subscribe(() => {
      this.loadProducts();
      this.loadFinalProducts();
    });

    this.sharedDataService.ingredientListUpdate$.subscribe(() => {
      this.loadProducts();
      this.loadFinalProducts();
    });
  }

  ////////////////////////
  //////// Public products

  loadFinalProducts(): void {
    this.http
      .get<FinalProduct[]>(`${this.apiUrl}?view=full`).pipe(
        map((products) => products.map((product) => ({
          ...product,
          category: product.category ? product.category : DEFAULT_CATEGORY,
        })))
      )
      .subscribe((products) => {
        this.finalProductSubject.next(products); // Met à jour les abonnés
      });
  }

  getFinalProducts(): Observable<FinalProduct[]> {
    return this.finalProducts$;
  }

  getFinalProductById(id: string): Observable<FinalProduct> {
    const url = `${this.apiUrl}/${id}?view=full`;
    return this.http.get<FinalProduct>(url).pipe(
      map((product) => ({
        ...product,
        category: product.category ? product.category : DEFAULT_CATEGORY,
      }))
    );
  }

  ////////////////////////
  //////// Admin products

  loadProducts(): void {
    this.http.get<Product[]>(this.apiUrl).pipe(
      map((products) =>
        products.map((product) => ({
          ...product,
          category: product.category ? product.category : DEFAULT_CATEGORY,
        }))
      )
    ).subscribe((products) => {
      this.productSubject.next(products); // Met à jour les abonnés
    });
  }

  getProducts(): Observable<Product[]> {
    return this.products$;
  }

  getProductById(id: string): Observable<Product> {
    const url = `${this.apiUrl}/${id}`;
    return this.http.get<Product>(url).pipe(
      map((product) => ({
        ...product,
        category: product.category ? product.category : DEFAULT_CATEGORY,
      }))
    );
  }

  getProductsByIngredient(ingredientId: string): Observable<Product[]> {
    const url = `${this.apiUrl}/by-ingredient/${ingredientId}`;
    return this.http.get<Product[]>(url).pipe(
      map((products) =>
        products.map((product) => ({
          ...product,
          category: product.category ? product.category : DEFAULT_CATEGORY,
        }))
      )
    );
  }

  getDlcs(): Observable<any> {
    return this.http
      .get(this.dlcsUrl)
      .pipe(
        catchError((error) => {
          console.error('❌ Erreur lors du chargement des DLCs:', error);
          return throwError(() => new Error('Impossible de charger les DLCs.'));
        }),
      );
  }

  checkExistingProducName(name: string, excludedId?: string): Observable<boolean> {
    let url = `${this.apiUrl}/check-name/${encodeURIComponent(name)}`;
    if (excludedId) {
      url += `?excludedId=${excludedId}`;
      console.log('Excluded ID:', excludedId);
      console.log('URL:', url);
    }
    return this.http
      .get<boolean>(url)
      .pipe(
        catchError((error) => {
          console.error('❌ Erreur lors de la recherche du produit:', error);
          return throwError(() => new Error('Impossible de charger le produit.'));
        }),
      );
  }

  createProduct(payload: any): Observable<Product> {
    return this.http.post<Product>(this.apiUrl, payload).pipe(
      catchError(this.handleError),
      tap(() => {
        this.loadFinalProducts()
        this.sharedDataService.notifyProductUpdate();
      }) // Recharge la liste après création
    );
  }

  updateProduct(id: string, payload: any): Observable<Product> {
    const url = `${this.apiUrl}/${id}`;
    return this.http.put<Product>(url, payload).pipe(
      catchError(this.handleError),
      tap(() => {
        this.loadFinalProducts()
        this.sharedDataService.notifyProductUpdate();
      }) // Recharge la liste après création
    );
  }

  deleteProduct(id: string): Observable<{ message: string }> {
    const url = `${this.apiUrl}/${id}`;
    return this.http.delete<{ message: string }>(url).pipe(
      catchError(this.handleError),
      tap(() => {
        this.loadFinalProducts()
        this.sharedDataService.notifyProductUpdate();
      })
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
