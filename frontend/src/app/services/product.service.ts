import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, catchError, map, merge, Observable, tap, throwError } from 'rxjs';

import { Product } from '../models/product';
import { DEFAULT_CATEGORY } from '../models/category';
import { SharedDataService } from './shared-data.service';

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private apiUrl = 'http://localhost:5000/api/products';

  private productSubject = new BehaviorSubject<Product[]>([]);
  products$ = this.productSubject.asObservable();

  private dlcsUrl = '../assets/data/dlcs.json';


  constructor(
    private http: HttpClient,
    private sharedDataService: SharedDataService
  ) {
    this.loadProducts();

    merge(
      this.sharedDataService.productListUpdate$,
      this.sharedDataService.categoryListUpdate$,
      this.sharedDataService.ingredientListUpdate$
    ).subscribe(() => {
      this.loadProducts();
    })

    // this.sharedDataService.productListUpdate$.subscribe(() => {
    //   this.loadProducts();
    // });

    // this.sharedDataService.categoryListUpdate$.subscribe(() => {
    //   this.loadProducts();
    // });

    // this.sharedDataService.ingredientListUpdate$.subscribe(() => {
    //   this.loadProducts();
    // });

  }

  private loadProducts(): void {
    console.trace('Chargement des produits depuis le serveur...');
    this.http.get<Product[]>(this.apiUrl).pipe(
      map((products) =>
        products.map((product) => ({
          ...product,
          category: product.category ? product.category : DEFAULT_CATEGORY,
        }))
      )
    ).subscribe((products) => {
      this.productSubject.next(products); 
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
        category: product.category || DEFAULT_CATEGORY,
      }))
    );
  }

  getProductsByCategory(categoryId: string): Observable<Product[]> {
    const url = `${this.apiUrl}/by-category/${categoryId}`;
    return this.http.get<Product[]>(url).pipe(
      map((products) =>
        products.map((product) => ({
          ...product,
          category: product.category || DEFAULT_CATEGORY,
        }))
      )
    );
  }

  getProductsByIngredient(ingredientId: string): Observable<Product[]> {
    const url = `${this.apiUrl}/by-ingredient/${ingredientId}`;
    return this.http.get<Product[]>(url).pipe(
      map((products) =>
        products.map((product) => ({
          ...product,
          category: product.category || DEFAULT_CATEGORY,
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

  checkExistingProductName(name: string, excludedId?: string): Observable<boolean> {
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
        this.sharedDataService.notifyProductUpdate();
      }) 
    );
  }

  updateProduct(id: string, payload: any): Observable<Product> {
    const url = `${this.apiUrl}/${id}`;
    return this.http.put<Product>(url, payload).pipe(
      catchError(this.handleError),
      tap(() => {
        this.sharedDataService.notifyProductUpdate();
      }) 
    );
  }

  deleteProduct(id: string): Observable<{ message: string }> {
    const url = `${this.apiUrl}/${id}`;
    return this.http.delete<{ message: string }>(url).pipe(
      catchError(this.handleError),
      tap(() => {
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
export { Product };
