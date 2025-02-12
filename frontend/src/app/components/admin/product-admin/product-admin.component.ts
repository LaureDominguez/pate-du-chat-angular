import { Component, OnInit, ViewChild } from '@angular/core';
import { forkJoin } from 'rxjs';

import { Category, CategoryService } from '../../../services/category.service';
import {
  Ingredient,
  IngredientService,
} from '../../../services/ingredient.service';
import { FinalProduct, Product, ProductService } from '../../../services/product.service';
import { ProductFormComponent } from './product-form/product-form.component';
import { ImageService } from '../../../services/image.service';

import { AdminModule } from '../admin.module';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { ConfirmDialogComponent } from '../../dialog/confirm-dialog/confirm-dialog.component';
import { ErrorDialogComponent } from '../../dialog/error-dialog/error-dialog.component';

@Component({
  selector: 'app-product-admin',
  standalone: true,
  imports: [AdminModule],
  templateUrl: './product-admin.component.html',
  styleUrls: ['./product-admin.component.scss', '../admin.component.scss'],
})
export class ProductAdminComponent implements OnInit {
  products = new MatTableDataSource<FinalProduct>([]);
  categories: Category[] = [];
  ingredients: Ingredient[] = [];

  displayedProductsColumns: string[] = [
    'name',
    'category',
    'allergens',
    'vegan',
    'vegeta',
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
    this.loadData(); // Charge les données initiales

  //   this.productService.finalProducts$.subscribe((products) => {
  //     this.products.data = products;
  //   });

  //   // Écoute en temps réel les mises à jour des catégories et ingrédients
  // this.categoryService.categories$.subscribe((categories) => {
  //   this.categories = categories;
  // });

  //   this.ingredientService.getIngredients().subscribe((ingredients) => {
  //     this.ingredients = ingredients;
  //   });
  }

  ngAfterViewInit(): void {
    this.products.paginator = this.productsPaginator;
    this.products.sort = this.productsSort;
  }

  loadData(): void {
    // this.productService.getFinalProducts().subscribe((products) => {
    //   this.products.data = products;
    // });

    this.productService.finalProducts$.subscribe((products) => {
      this.products.data = products;
    });

    // Écoute en temps réel les mises à jour des catégories et ingrédients
    this.categoryService.categories$.subscribe((categories) => {
      this.categories = categories;
    });

    this.ingredientService.getIngredients().subscribe((ingredients) => {
      this.ingredients = ingredients;
    });
  }

  openProductForm(product: Product | null): void {
    const imageUrls =
      product?.images?.map((imagePath) =>
        this.imageService.getImageUrl(imagePath)
      ) || [];
    const dialogRef = this.dialog.open(ProductFormComponent, {
      width: '600px',
      data: {
        product: product || null,
        imageUrls: imageUrls,
        categories: this.categories,
        ingredients: this.ingredients,
      },
    });

    dialogRef.afterClosed().subscribe(
      (
        result:
          | {
              productData: any;
              selectedFiles: File[];
              removedExistingImages: string[];
            }
          | undefined
      ) => {
        if (result) {
          this.handleProductFormSubmit(result);
        }
      }
    ),
      (error: any) => {
        console.error(
          'Erreur lors du chargement des catégories ou des ingrédients :',
          error
        );
      };
  }

  handleProductFormSubmit(result: {
    productData: any;
    selectedFiles: File[];
    removedExistingImages: string[];
  }): void {
    const { productData, selectedFiles } = result;
    const existingImages = productData.existingImages ?? [];
    const productId = productData._id;

    if (result.removedExistingImages?.length) {
      result.removedExistingImages.forEach((imgPath) => {
        const filename = imgPath.replace('/^/?uploads/?/', '');
        this.imageService.deleteImage(filename).subscribe(() => {});
      });
    }

    const finalImages = [...existingImages];
    delete productData.existingImages;

    const submitForm = () => {
      productData.images = finalImages;
      this.submiteProductForm(productData, productId);
    };

    if (selectedFiles.length > 0) {
      this.imageService.uploadImages(selectedFiles).subscribe({
        next: (uploadResponse) => {
          const newFilePaths = uploadResponse.imagePath;
          finalImages.push(...newFilePaths);
        },
        error: (error) => {
          console.error("Erreur lors de l'upload des images :", error);
          this.showErrorDialog(error.message);
        },
        complete: submitForm,
      });
    } else {
      submitForm();
    }
  }

  submiteProductForm(productData: any, productId?: string): void {
    console.log('🚀 Envoi du produit au backend :', productData); // LOG ICI 🔍
    if (productId) {
      this.productService
        .updateProduct(productId, productData)
        .subscribe(() => {
          // this.loadData();
        });
    } else {
      this.productService.createProduct(productData).subscribe(() => {
        // this.loadData();
      });
    }
  }

    private showErrorDialog(message: string): void {
      console.log(message);
      this.dialog.open(ErrorDialogComponent, {
        data: { message },
      });
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
          // this.loadData();
        });
      }
    });
  }
}
