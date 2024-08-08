import { Component, OnInit } from '@angular/core';
import { ProductService, Product } from '../../services/product.service';
import { Observable, tap } from 'rxjs';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatGridListModule } from '@angular/material/grid-list';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatGridListModule],
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.sass'],
})
export class ProductsComponent implements OnInit {
  products$!: Observable<Product[]>;

  constructor(private productService: ProductService) {}

  ngOnInit(): void {
    this.products$ = this.productService
      .getProducts()
      .pipe(tap((products) => console.log('Products loaded: ', products)));
  }

  selectedProduct: Product | null = null;

  selectProduct(product: Product) {
    this.selectedProduct = product;
  }

  isSelected(product: Product): boolean {
    return this.selectedProduct === product;
  }

  deselectProduct(event: Event) {
    event.stopPropagation(); 
    this.selectedProduct = null;
  }
}
