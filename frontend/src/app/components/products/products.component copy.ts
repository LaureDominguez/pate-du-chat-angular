import { Component, OnInit } from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { map } from 'rxjs/operators';
import { ProductService, Product } from '../../services/product.service';
import { Observable } from 'rxjs';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatGridListModule } from '@angular/material/grid-list';
import { ChangeDetectorRef } from '@angular/core';
import { ProductCardComponent } from '../product-card/product-card.component';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatGridListModule, ProductCardComponent],
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.sass'],
})
export class ProductsComponent implements OnInit {
  products$: Observable<Product[]> = this.productService.getProducts();
  products: Product[] = [];

  selectedProduct: Product | null = null;

  cols: number = 3;

  showNormalGrid = false;
  showSelectedGrid = false;
  grid1: Product[] = [];
  grid2: Product[] = [];

  constructor(
    private productService: ProductService,
    private breakpointObserver: BreakpointObserver,
    private cdRef: ChangeDetectorRef
  ) {}

  ngOnInit() {
    // this.products$.subscribe((products) => {
    //   this.products = products;
    //   if (this.selectedProduct == null) {
    //     this.showNormalGrid = true;
    //     this.showSelectedGrid = false;
    //   } else {
    //     this.showNormalGrid = false;
    //     this.showSelectedGrid = true;
    //   }
    // });

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
    this.showNormalGrid = false;
    this.showSelectedGrid = true;
    this.updateGrid();
  }

  isSelected(product: Product): boolean {
    return this.selectedProduct === product;
  }

  deselectProduct(event: Event) {
    event.stopPropagation();
    this.selectedProduct = null;
    this.showNormalGrid = true;
    this.showSelectedGrid = false;
  }

  updateGrid(): void {
    if (this.selectedProduct) {
      const selectedIndex = this.products.indexOf(this.selectedProduct);
      const previousProduct = this.products[selectedIndex - 1];
      const nextProduct = this.products[selectedIndex + 1];

      // mise à jour de la structure de la grille de produits
      this.grid1 = this.products.slice(0, selectedIndex);
      this.grid2 = this.products.slice(selectedIndex + 1);
      this.cdRef.detectChanges();

      // affichage des produits dans les deux grilles
      this.displayProducts(this.grid1, this.grid2);
      console.log('grid1', this.grid1, 'grid2', this.grid2);
    }
  }

  displayProducts(grid1: any[], grid2: any[]): void {
    // code pour afficher les produits dans les deux grilles
  }
}
