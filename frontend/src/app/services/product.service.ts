import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { FinalProduct, Product } from '../models/product';

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private apiUrl = 'http://localhost:5000/api/products';

  constructor(private http: HttpClient) {}

  ////////////////////////
  //////// Public products

  getFinalProducts(): Observable<FinalProduct[]> {
  // console.log('liste des Produits Finaux chargé')
    return this.http.get<FinalProduct[]>(`${this.apiUrl}?view=full`);
  }

  getFinalProductById(id: string): Observable<FinalProduct> {
    const url = `${this.apiUrl}/${id}?view=full`;
    return this.http.get<FinalProduct>(url);
  }

  ////////////////////////
  //////// Admin products

  getProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(this.apiUrl);
  }

  getProductById(id: string): Observable<Product> {
    const url = `${this.apiUrl}/${id}`;
    return this.http.get<Product>(url);
  }

  createProduct(payload: any): Observable<Product> {
    return this.http.post<Product>(this.apiUrl, payload);
  }

  updateProduct(id: string, payload: any): Observable<Product> {
    const url = `${this.apiUrl}/${id}`;
    return this.http.put<Product>(url, payload);
  }

  deleteProduct(id: string): Observable<{ message: string }> {
    const url = `${this.apiUrl}/${id}`;
    return this.http.delete<{ message: string }>(url);
  }
}
export { FinalProduct, Product };
