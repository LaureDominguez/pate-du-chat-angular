import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ProductService, Product } from '../../services/product.service';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatGridListModule } from '@angular/material/grid-list';
import { ProductCardComponent } from '../product-card/product-card.component';
import { forkJoin, map, Observable } from 'rxjs';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Ingredient, IngredientService } from '../../services/ingredient.service';

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
  styleUrls: ['./products.component.scss'],
})
export class ProductsComponent implements OnInit {
  products$: Observable<Product[]> = this.productService.getProducts();
  products: Product[] = [];

  ingredients$: Observable<Ingredient[]> = this.ingredientService.getIngredients();
  ingredients: Ingredient[] = [];

  allergensList: string[] = [];
  isVegeta: boolean = true;
  isVegan: boolean = true;

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
    private ingredientService: IngredientService,
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
        this.getIngredientsForSelectedProduct();
        this.showNormalGrid = false;
        this.showSelectedGrid = true;
        this.updateGrid();
      }
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

  //affiche les ingredients
  getIngredientsForSelectedProduct() {
    if (this.selectedProduct && this.selectedProduct.composition) {
      const ingredientObservables: Observable<Ingredient>[] =
        this.selectedProduct.composition.map((id: string) =>
          this.ingredientService.getIngredientById(id)
        );

      forkJoin(ingredientObservables).subscribe({
        next: (ingredients: Ingredient[]) => {
          this.ingredients = ingredients;
          this.allergensList = [];
          this.isVegeta = true;
          this.isVegan = true;

          ingredients.forEach((ingredient) => { 
            if (ingredient.allergens && ingredient.allergens.length > 0) {
              ingredient.allergens.forEach((allergen: string) => {
                if (!this.allergensList.includes(allergen)) {
                  this.allergensList.push(allergen);
                }
              });
            }

            // Vérifier les mentions vegan et vegetarian
            if (ingredient.vegeta === false) {
              this.isVegeta = false;
            }
            if (ingredient.vegan === false || ingredient.vegeta === false) {
              this.isVegan = false;
            }
          });

          this.cdRef.markForCheck();
          console.log('Ingrédients sélectionés :', this.ingredients);
          console.log('Liste des allergènes :', this.allergensList);
          console.log('Est végétarien :', this.isVegeta);
          console.log('Est végan :', this.isVegan);
        },
        error: (error) => {
          console.error('Erreur lors de la sélection des ingrédients:', error);
        },
        complete: () => {
          console.log('Tous les ingrédients sont sélectionés');
        }
      });
    }
  }

  // gestion des grilles d'affichage
  selectProduct(product: Product) {
    this.selectedProduct = product;
    this.isSelected = true;
    this.ingredients = [];

    this.getIngredientsForSelectedProduct();

    this.showNormalGrid = false;
    this.showSelectedGrid = true;
    this.updateGrid();
  }

  onCloseClick() {
    this.selectedProduct = null;
    this.isSelected = false;
    this.ingredients = [];
    this.showNormalGrid = true;
    this.showSelectedGrid = false;
  }

  displayProducts(grid1: any[], grid2: any[]): void {}

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
    }
  }
}
