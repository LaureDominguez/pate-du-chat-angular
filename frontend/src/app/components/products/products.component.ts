import { Component, OnInit } from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { map } from 'rxjs/operators';
import { ProductService, Product } from '../../services/product.service';
import { Observable } from 'rxjs';
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
  products$: Observable<Product[]> = this.productService.getProducts();
  cols: number = 3;
  selectedProduct: Product | null = null;

  constructor(
    private productService: ProductService,
    private breakpointObserver: BreakpointObserver
  ) {}

  ngOnInit() {
    this.products$ = this.productService.getProducts();

    this.breakpointObserver
      .observe([Breakpoints.Medium, Breakpoints.Large])
      .pipe(
        map(({ breakpoints }) => {
          if (breakpoints[Breakpoints.Large]) {
            return 5; // medium
          } else if (breakpoints[Breakpoints.Medium]) {
            return 2; // small
          } else {
            return 8; // Large
          }
        })
      )
      .subscribe((cols: number) => (this.cols = cols));
  }

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
