import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ProductService, Product } from '../../services/product.service';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatGridListModule } from '@angular/material/grid-list';
import { ProductCardComponent } from '../product-card/product-card.component';
import { map, Observable } from 'rxjs';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatGridListModule,
    ProductCardComponent,
  ],
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.sass'],
})
export class ProductsComponent implements OnInit {
  products$: Observable<Product[]> = this.productService.getProducts();
  products: Product[] = [];

  cols: number = 3;

  isSelected: boolean = false;
  selectedProduct: Product | null = null;
  lastSelectedProduct: Product | null = null;

  showNormalGrid = true;
  showSelectedGrid = false;
  grid1: Product[] = [];
  grid2: Product[] = [];

  constructor(
    private productService: ProductService,
    private breakpointObserver: BreakpointObserver,
    private cdRef: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.products$.subscribe((products) => {
      this.products = products;
      if (this.selectedProduct == null) {
        this.showNormalGrid = true;
        this.showSelectedGrid = false;
      } else {
        this.showNormalGrid = false;
        this.showSelectedGrid = true;
        this.updateGrid();
      }
    });

    this.breakpointObserver
      .observe([
        Breakpoints.XSmall,
        Breakpoints.Small,
        Breakpoints.Medium,
        Breakpoints.Large,
        Breakpoints.XLarge,
      ])
      .pipe(
        map(({ breakpoints }) => {
          switch (true) {
            case breakpoints[Breakpoints.XSmall]:
              return 1;
            case breakpoints[Breakpoints.Small]:
              return 2;
            case breakpoints[Breakpoints.Medium]:
              return 3;
            case breakpoints[Breakpoints.Large]:
              return 5;
            case breakpoints[Breakpoints.XLarge]:
              return 9;
            default:
              return 3;
          }
        })
      )
      .subscribe((cols: number) => (this.cols = cols));
  }

  selectProduct(product: Product) {
    this.selectedProduct = product;
    this.isSelected = true;
    this.showNormalGrid = false;
    this.showSelectedGrid = true;
    this.updateGrid();
  }

  onCloseClick() {
    this.selectedProduct = null;
    this.isSelected = false;
    this.showNormalGrid = true;
    this.showSelectedGrid = false;
  }

  displayProducts(grid1: any[], grid2: any[]): void { }

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
}
