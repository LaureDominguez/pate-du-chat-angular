import { Component, OnInit, ViewChild } from '@angular/core';
import { forkJoin } from 'rxjs';

import { Category, CategoryService } from '../../../services/category.service';
import {
  Ingredient,
  IngredientService,
} from '../../../services/ingredient.service';
import { Product, ProductService } from '../../../services/product.service';
import { ProductFormComponent } from './product-form/product-form.component';
import { ImageService } from '../../../services/image.service';

import { AdminModule } from '../admin.module';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { SharedDataService } from '../../../services/shared-data.service';
import { ConfirmDialogComponent } from '../../dialog/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-product-admin',
  standalone: true,
  imports: [AdminModule],
  templateUrl: './product-admin.component.html',
  styleUrls: ['./product-admin.component.scss', '../admin.component.scss'],
})
export class ProductAdminComponent implements OnInit {
  products = new MatTableDataSource<Product>([]);
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
    private sharedDataService: SharedDataService,
    private productService: ProductService,
    private ingredientService: IngredientService,
    private categoryService: CategoryService,
    private imageService: ImageService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  ngAfterViewInit(): void {
    this.products.paginator = this.productsPaginator;
    this.products.sort = this.productsSort;
  }

  loadData(): void {
    forkJoin({
      products: this.productService.getProducts(),
      categories: this.categoryService.getCategories(),
      ingredients: this.ingredientService.getIngredients(),
    }).subscribe(({ products, categories, ingredients }) => {
      this.products.data = products;
      this.categories = categories;
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

        dialogRef.afterClosed().subscribe((result: any) => {
          if (result) {
            // console.log('product-admin -> ProductForm -> result :', result);
            // console.log('product-admin -> ProductForm -> product :', product);
            if (product) {
              const updatedId = product._id;
              // Mise à jour du produit existant
              this.productService
                .updateProduct(updatedId!, result)
                .subscribe(() => {
                  this.loadData();
                });
            } else {
              // Création d'un nouveau produit
              this.productService.createProduct(result).subscribe(() => {
                this.loadData();
              });
            }
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
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        message: `Êtes-vous sûr de vouloir supprimer ce produit : <br> <span class="bold-text">"${product.name}"</span> ?`,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.productService.deleteProduct(product._id!).subscribe(() => {
          this.loadData();
        });
      }
    });
  }
}
