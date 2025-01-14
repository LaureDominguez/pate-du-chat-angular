import { Component, OnInit, ViewChild } from '@angular/core';
import { forkJoin } from 'rxjs';

import { Category, CategoryService } from '../../../services/category.service';
import { Ingredient, IngredientService } from '../../../services/ingredient.service';
import { Product, ProductService } from '../../../services/product.service';
import { ProductFormComponent } from './product-form/product-form.component';
import { ImageService } from '../../../services/image.service';

import { AdminModule } from '../admin.module';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';

@Component({
  selector: 'app-product-admin',
  imports: [AdminModule],
  templateUrl: './product-admin.component.html',
  styleUrls: ['./product-admin.component.scss', '../admin.component.scss'],
})
export class ProductAdminComponent implements OnInit {
  productsList = new MatTableDataSource<Product>([]);
  products: Product[] = [];
  categories: Category[] = [];
  ingredients: Ingredient[] = [];

  displayedProductsColumns: string[] = [
    'name',
    'category',
    'price',
    'stock',
    'actions',
  ];

  @ViewChild('productsPaginator') productsPaginator!: MatPaginator;
  @ViewChild('productsSort') productsSort!: MatSort;

  constructor(
    private productService: ProductService,
    private ingredientService: IngredientService,
    private categoryService: CategoryService,
    private imageService: ImageService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.fecthProducts();
    this.fetchCategories();
    this.fetchIngredients();
  }

  ngAfterViewInit(): void {
    this.productsList.paginator = this.productsPaginator;
    this.productsList.sort = this.productsSort;
    this.productsList.data = this.productsList.data;
  }

  fecthProducts(): void {
    this.productService.getProducts().subscribe((products) => {
      console.log('product-admin.component -> fecthProducts -> products : ', products);
      this.products = products;
      this.productsList.data = this.products;
    });
  }

  fetchCategories(): void {
    this.categoryService.getCategories().subscribe((categories) => {
      this.categories = categories;
    });
  }

  fetchIngredients(): void {
    this.ingredientService.getIngredients().subscribe((ingredients) => {
      this.ingredients = ingredients;
    });
  }

  openProductForm(product: Product | null): void {
    const categories$ = this.categoryService.getCategories();
    const ingredients$ = this.ingredientService.getIngredients();

    forkJoin([categories$, ingredients$]).subscribe(
      ([categories, ingredients]) => {
        const imageUrls =
          product?.images?.map((imagePath) =>
            this.imageService.getImageUrl(imagePath)
          ) || [];

        const dialogRef = this.dialog.open(ProductFormComponent, {
          width: '600px',
          data: {
            product,
            imageUrls,
            categories: categories,
            ingredients: ingredients,
          },
        });

        dialogRef.afterClosed().subscribe((result: any | undefined) => {
          if (result) {
            console.log('pouet :', result);
          }
        });
      }
    ),
      (error: any) => {
        console.error(
          'Erreur lors du chargement des catégories ou des ingrédients :',
          error
        );
      };
  }

  deleteProduct(product: Product): void {
    // Logique pour supprimer un produit
    console.log('Suppression du produit :', product);
  }
}
