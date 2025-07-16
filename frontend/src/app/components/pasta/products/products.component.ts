import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
} from '@angular/core';

import {
  ProductService,
  Product,
} from '../../../services/product.service';

import { Observable, Subject, takeUntil } from 'rxjs';
import { ProductCardComponent } from '../product-card/product-card.component';
import { MATERIAL_IMPORTS } from '../../../app-material';

@Component({
  selector: 'app-products',
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.scss'],
  standalone: true,
  imports: [MATERIAL_IMPORTS, ProductCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductsComponent implements OnInit, OnDestroy {
  // Observables pour les produits et les ingrédients
  products$: Observable<Product[]> = this.productService.getProducts();

  // Données locales
  products: Product[] = [];

  // Grille d'affichage
  cols: number = 5;
  grid1: Product[] = [];
  grid2: Product[] = [];

  // Gestion de la sélection
  selectedProduct: Product | null = null;
  isSelected: boolean = false;

  // Observable pour la destruction
  private destroy$ = new Subject<void>();

  constructor(
    private productService: ProductService,
    private cdRef: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Charger les produits et mettre à jour la grille
    this.products$.pipe(takeUntil(this.destroy$)).subscribe((products) => {
      this.products = products;
      this.updateGrid();
    });
  }

  // Sélectionner un produit
  selectProduct(product: Product): void {
    if (!this.products || this.products.length === 0) {
      console.warn('Les produits ne sont pas encore chargés.');
      return;
    }

    this.selectedProduct = product;
    this.isSelected = true;

    this.updateGrid();
  }


  // Réinitialiser la sélection
  onCloseClick(): void {
    this.selectedProduct = null;
    this.isSelected = false;
    this.updateGrid();
  }

  // Mettre à jour la grille d'affichage
  private updateGrid(): void {
    if (this.selectedProduct) {
      const selectedIndex = this.products.indexOf(this.selectedProduct);
      this.grid1 = this.products.slice(0, selectedIndex);
      this.grid2 = this.products.slice(selectedIndex + 1);
    } else {
      this.grid1 = this.products;
      this.grid2 = [];
    }

    this.cdRef.markForCheck();
  }

  // Détruire les abonnements lors de la destruction du composant
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
