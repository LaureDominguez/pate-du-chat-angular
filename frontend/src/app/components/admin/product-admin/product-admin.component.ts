import { Component, OnInit, ViewChild } from '@angular/core';
import { forkJoin } from 'rxjs';

import { CategoryService } from '../../../services/category.service';
import { ImageService } from '../../../services/image.service';
import { IngredientService } from '../../../services/ingredient.service';
import { ProductService } from '../../../services/product.service';
import { Product, ProductFormComponent } from './product-form/product-form.component';

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
  products = new MatTableDataSource<Product>([]);

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
  }

  ngAfterViewInit(): void {
    this.products.paginator = this.productsPaginator;
    this.products.sort = this.productsSort;
    this.products.data = this.products.data;
  }

  fecthProducts(): void {
    this.productService.getProducts().subscribe((products) => {
      // this.products.data = products;
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
