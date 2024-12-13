import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { ProductService, Product } from '../../services/product.service';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatGridListModule } from '@angular/material/grid-list';
import { ProductCardComponent } from '../product-card/product-card.component';
import { forkJoin, map, Observable, Subject, takeUntil } from 'rxjs';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import {
  Ingredient,
  IngredientService,
} from '../../services/ingredient.service';

@Component({
  selector: 'app-products',
  standalone: true,
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.scss'],
  imports: [
    CommonModule,
    MatCardModule,
    MatGridListModule,
    ProductCardComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductsComponent implements OnInit, OnDestroy {
  products$: Observable<Product[]> = this.productService.getProducts();
  ingredients$: Observable<Ingredient[]> =
    this.ingredientService.getIngredients();

  products: Product[] = [];
  ingredients: Ingredient[] = [];

  allergensList: string[] = [];
  isVegeta: boolean = true;
  isVegan: boolean = true;

  cols: number = 3;

  selectedProduct: Product | null = null;
  isSelected: boolean = false;
  showNormalGrid: boolean = true;
  showSelectedGrid: boolean = false;

  grid1: Product[] = [];
  grid2: Product[] = [];

  private destroy$ = new Subject<void>();

  constructor(
    private productService: ProductService,
    private ingredientService: IngredientService,
    private breakpointObserver: BreakpointObserver,
    private cdRef: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.products$.pipe(takeUntil(this.destroy$)).subscribe((products) => {
      this.products = products;
      this.updateGrid();
    });

    //media queries
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

  // gestion des grilles d'affichage
  selectProduct(product: Product): void {
    if (!this.products || this.products.length === 0) {
      console.warn('Les produits ne sont pas encore chargés.');
      return;
    }

    this.selectedProduct = product;
    this.isSelected = true;
    this.showNormalGrid = false;
    this.showSelectedGrid = true;

    this.updateGrid();
    console.log('Produit sélectionné :', product);
    this.getIngredientsForSelectedProduct();

    console.log('Grille mise à jour après sélection :', this.grid1, this.grid2);
    this.cdRef.detectChanges();
  }

  //affiche les ingredients
  getIngredientsForSelectedProduct() {
    if (!this.selectedProduct?.composition) return;

    forkJoin(
      this.selectedProduct.composition.map((id: string) =>
        this.ingredientService.getIngredientById(id)
      )
    )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (ingredients: Ingredient[]) => {
          this.ingredients = ingredients;
          this.processIngredients(ingredients);
        },
        error: (error) => {
          console.error(
            'Erreur lors de la récupération des ingrédients:',
            error
          );
        },
      });
  }

  // Traiter les ingrédients pour allergènes et régimes alimentaires
  private processIngredients(ingredients: Ingredient[]) {
    const allergensSet = new Set<string>();
    let isVegeta = true;
    let isVegan = true;

    ingredients.forEach((ingredient) => {
      if (ingredient.allergens) {
        ingredient.allergens.forEach((allergen) => allergensSet.add(allergen));
      }
      if (!ingredient.vegeta) isVegeta = false;
      if (!ingredient.vegan) isVegan = false;
    });

    this.allergensList = Array.from(allergensSet);
    this.isVegeta = isVegeta;
    this.isVegan = isVegan;

    if (this.selectedProduct) {
      this.selectedProduct.allergens = this.allergensList;
      this.selectedProduct.vegeta = this.isVegeta;
      this.selectedProduct.vegan = this.isVegan;
    }
    this.cdRef.markForCheck();
  }

  onCloseClick(): void {
    this.selectedProduct = null;
    this.isSelected = false;
    this.showNormalGrid = true;
    this.showSelectedGrid = false;
    this.ingredients = [];
    this.updateGrid();
  }

  //changer les 2 types d'affichage de grille par un seul :
  // 2 grilles + produit selectionné
  // selected product = null
  // grid1 = contient tous les produits
  // grid2 = contient aucun produit

  updateGrid(): void {
    console.log('Mise à jour de la grille. Produits :', this.products);

    if (this.selectedProduct) {
      const selectedIndex = this.products.indexOf(this.selectedProduct);
      // const selectedIndex = this.products.findIndex(product => product.id === this.selectedProduct?.id);
      console.log('pouet : ', selectedIndex, " ; ", this.selectedProduct);
      
      this.grid1 = this.products.slice(0, selectedIndex);
      this.grid2 = this.products.slice(selectedIndex + 1);
    } else {
      this.grid1 = [];
      this.grid2 = [];
    }

    this.cdRef.detectChanges();
    console.log('Grille avant produit sélectionné :', this.grid1);
    console.log('Grille après produit sélectionné :', this.grid2);

  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
