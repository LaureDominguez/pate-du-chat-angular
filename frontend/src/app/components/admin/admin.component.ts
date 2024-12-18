import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { Product, ProductService } from '../../services/product.service';
import {
  Ingredient,
  IngredientService,
} from '../../services/ingredient.service';
import { MatDialog } from '@angular/material/dialog';
import { IngredientFormComponent } from './ingredient-form/ingredient-form.component';
import { MatIconModule } from '@angular/material/icon';
import { ConfirmDialogComponent } from './confirm-dialog/confirm-dialog.component';
import { ProductFormComponent } from './product-form/product-form.component';
import { MatChipsModule } from '@angular/material/chips';

@Component({
  selector: 'app-admin',
  imports: [
    CommonModule,
    MatButtonModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatIconModule,

    MatChipsModule,
  ],
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss'],
})
export class AdminComponent implements OnInit {
  products = new MatTableDataSource<Product>([]);
  ingredients = new MatTableDataSource<Ingredient>([]);

  displayedProductsColumns: string[] = [
    'name',
    'category',
    'price',
    'stock',
    'actions',
  ];
  displayedIngredientsColumns: string[] = [
    'name',
    'supplier',
    'allergens',
    'vegan',
    'vegeta',
    'actions',
  ];

  @ViewChild('productsPaginator') productsPaginator!: MatPaginator;
  @ViewChild('productsSort') productsSort!: MatSort;

  @ViewChild('ingredientsPaginator') ingredientsPaginator!: MatPaginator;
  @ViewChild('ingredientsSort') ingredientsSort!: MatSort;

  constructor(
    private productService: ProductService,
    private ingredientService: IngredientService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.fecthProducts();
    this.fetchIngredients();
  }

  ngAfterViewInit() {
    this.products.paginator = this.productsPaginator;
    this.products.sort = this.productsSort;

    this.ingredients.paginator = this.ingredientsPaginator;
    this.ingredients.sort = this.ingredientsSort;

    this.products.data = this.products.data; // Pour actualiser les données
    this.ingredients.data = this.ingredients.data; // Idem pour les ingrédients
  }

  ////////////////////////////////////
  // Produits
  ////////////////////////////////////

  fecthProducts(): void {
    this.productService.getProducts().subscribe((products) => {
      this.products.data = products;
    });
  }

  openProductForm(product: Product | null): void {
    const dialogRef = this.dialog.open(ProductFormComponent, {
      width: '400px',
      data: { product },
    });

    dialogRef.afterClosed().subscribe((result: Product | null) => {
      if (result) {
        if (product) {
          this.updateProduct(product.id!, result);
        } else {
          this.addProduct(result);
        }
      }
    });
  }

  addProduct(product: Product): void {
    // Logique pour ajouter un ProductService
    console.log('Ajout du-produit :');
  }

  updateProduct(id: string, product: Product): void {
    // Logique pour modifier un produit
    console.log('Modification du produit :', product);
  }

  deleteProduct(product: Product): void {
    // Logique pour supprimer un produit
    console.log('Suppression du produit :', product);
  }

  //////////////////////////////////////
  // Ingrédients
  ////////////////////////////////////

  fetchIngredients(): void {
    this.ingredientService.getIngredients().subscribe((ingredients) => {
      this.ingredients.data = ingredients;
    });
  }

  openIngredientForm(ingredient: Ingredient | null): void {
    const dialogRef = this.dialog.open(IngredientFormComponent, {
      width: '400px',
      data: { ingredient },
    });

    dialogRef.afterClosed().subscribe((result: Ingredient | null) => {
      if (result) {
        if (ingredient) {
          this.updateIngredient(ingredient._id!, result);
        } else {
          this.addIngredient(result);
        }
      }
    });
  }

  addIngredient(ingredient: Ingredient): void {
    this.ingredientService.createIngredient(ingredient).subscribe(() => {
      this.fetchIngredients();
    });
    console.log('Ajout du nouvel ingrédient : ', ingredient);
  }

  updateIngredient(id: string, updateIngredient: Ingredient): void {
    this.ingredientService
      .updateIngredient(id, updateIngredient)
      .subscribe(() => {
        this.fetchIngredients();
      });
    console.log("Modification de l'ingrédient :", updateIngredient);
  }

  deleteIngredient(ingredient: Ingredient): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        message: `Êtes-vous sûr de vouloir supprimer cet ingrédient : "${ingredient.name}" ?`,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        console.log('admin.component : ', ingredient._id!);
        this.ingredientService
          .deleteIngredient(ingredient._id!)
          .subscribe(() => {
            this.fetchIngredients();
            console.log('admin.component : ', result);
          });
        console.log("Suppression de l'ingrédient : ", ingredient);
      }
    });
  }
}
