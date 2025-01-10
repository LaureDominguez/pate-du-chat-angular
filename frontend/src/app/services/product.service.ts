import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Product {
  _id?: string;
  name: string;
  category: string;
  description: string;
  composition: string[];
  price: number;
  allergens: string[];
  vegan: boolean;
  vegeta: boolean;
  stock: boolean;
  images?: string[];
}

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private apiUrl = 'http://localhost:5000/api/products';

  constructor(private http: HttpClient) {}

  getProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(this.apiUrl);
  }

  getProductById(id: string): Observable<Product> {
    const url = `${this.apiUrl}/${id}`;
    return this.http.get<Product>(url);
  }

  createProduct(payload: any): Observable<Product> {
    console.log( "Product.service -> payload :", payload);
    return this.http.post<Product>(this.apiUrl, payload);
  }
  
  updateProduct(id: string, payload: any): Observable<Product> {
    const url = `${this.apiUrl}/${id}`;
    return this.http.put<Product>(url, payload);
  }

  deleteProduct(id: string): Observable<{ message: string }> {
    const url = `${this.apiUrl}/${id}`;
    console.log( "Product.service :", url);
    return this.http.delete<{ message: string }>(url);
  }
}
