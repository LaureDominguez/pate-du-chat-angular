import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
} from '@angular/core';

import { ProductService, Product } from '../../../services/product.service';
import {
  IngredientService,
  Ingredient,
} from '../../../services/ingredient.service';

import { forkJoin, map, Observable, Subject, takeUntil } from 'rxjs';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { ProductCardComponent } from '../product-card/product-card.component';
import { AppModule } from '../../../app.module';

@Component({
  selector: 'app-products',
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.scss'],
  standalone: true,
  imports: [
    AppModule,
    ProductCardComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductsComponent implements OnInit, OnDestroy {
  // Observables pour les produits et les ingrédients
  products$: Observable<Product[]> = this.productService.getProducts();
  ingredients$: Observable<Ingredient[]> =
    this.ingredientService.getIngredients();

  // Données locales
  products: Product[] = [];
  ingredients: Ingredient[] = [];
  allergensList: string[] = [];
  isVegeta: boolean = true;
  isVegan: boolean = true;

  // Grille d'affichage
  cols: number = 3;
  grid1: Product[] = [];
  grid2: Product[] = [];

  // Gestion de la sélection
  selectedProduct: Product | null = null;
  isSelected: boolean = false;

  // Observable pour la destruction
  private destroy$ = new Subject<void>();

  constructor(
    private productService: ProductService,
    private ingredientService: IngredientService,
    private breakpointObserver: BreakpointObserver,
    private cdRef: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Charger les produits et mettre à jour la grille
    this.products$.pipe(takeUntil(this.destroy$)).subscribe((products) => {
      this.products = products;
      this.updateGrid();
    });

    // Configurer la grille en fonction des tailles d'écran
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
        }),
        takeUntil(this.destroy$)
      )
      .subscribe((cols: number) => {
        this.cols = cols;
        this.cdRef.markForCheck();
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
    this.getIngredientsForSelectedProduct();
  }

  // Récupérer les ingrédients du produit sélectionné
  private getIngredientsForSelectedProduct(): void {
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
            'Erreur lors de la récupération des ingrédients :',
            error
          );
        },
      });
  }

  // Traiter les ingrédients pour déterminer les allergènes et les régimes alimentaires
  private processIngredients(ingredients: Ingredient[]): void {
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

  // Réinitialiser la sélection
  onCloseClick(): void {
    this.selectedProduct = null;
    this.isSelected = false;
    this.ingredients = [];
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
