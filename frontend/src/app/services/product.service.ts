import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { auditTime, BehaviorSubject, catchError, finalize, map, merge, Observable, tap, throwError } from 'rxjs';

import { Product } from '../models/product';
import { DEFAULT_CATEGORY } from '../models/category';
import { SharedDataService } from './shared-data.service';
import { DialogService } from './dialog.service';

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private apiUrl = 'http://localhost:5000/api/products';

  private productSubject = new BehaviorSubject<Product[]>([]);
  products$ = this.productSubject.asObservable();

  private dlcsUrl = '../assets/data/dlcs.json';
  private isProcessing = false;

  constructor(
    private http: HttpClient,
    private sharedDataService: SharedDataService,
    private dialogService: DialogService
  ) {
    this.loadProducts();

    merge(
      this.sharedDataService.productListUpdate$,
      this.sharedDataService.categoryListUpdate$,
      this.sharedDataService.ingredientListUpdate$
    )
      .pipe(auditTime(50))
      .subscribe(() => {
        if (!this.isProcessing) {
          this.loadProducts();
        }
    })
  }

  private loadProducts(): void {
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
      tap(() => {
        this.sharedDataService.notifyProductUpdate();
      }),
      catchError(this.handleError.bind(this))
    );
  }

  updateProduct(id: string, payload: any): Observable<Product> {
    const url = `${this.apiUrl}/${id}`;
    return this.http.put<Product>(url, payload).pipe(
      tap(() => {
        this.sharedDataService.notifyProductUpdate();
      }),
      catchError(this.handleError.bind(this))
    );
  }

  deleteProduct(id: string): Observable<{ message: string }> {
    const url = `${this.apiUrl}/${id}`;
    return this.http.delete<{ message: string }>(url).pipe(
      tap(() => {
        this.sharedDataService.notifyProductUpdate();
      }),
      catchError(this.handleError.bind(this))
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
export { Product };
