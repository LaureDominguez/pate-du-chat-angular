import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { forkJoin, Subject, takeUntil } from 'rxjs';

import { Category, CategoryService } from '../../../services/category.service';
import {
  Ingredient,
  IngredientService,
} from '../../../services/ingredient.service';
import {
  FinalProduct,
  Product,
  ProductService,
} from '../../../services/product.service';
import { ProductFormComponent } from './product-form/product-form.component';
import { ImageService } from '../../../services/image.service';

import { AdminModule } from '../admin.module';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { ConfirmDialogComponent } from '../../dialog/confirm-dialog/confirm-dialog.component';
import { InfoDialogComponent } from '../../dialog/info-dialog/info-dialog.component';
import { DEFAULT_CATEGORY } from '../../../models/category';

@Component({
  selector: 'app-product-admin',
  standalone: true,
  imports: [AdminModule],
  templateUrl: './product-admin.component.html',
  styleUrls: ['./product-admin.component.scss', '../admin.component.scss'],
})
export class ProductAdminComponent implements OnInit, OnDestroy {
  products = new MatTableDataSource<FinalProduct>([]);
  categories: Category[] = [];
  ingredients: Ingredient[] = [];

  private unsubscribe$ = new Subject<void>(); // Permet de gérer les souscriptions

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
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  ngAfterViewInit(): void {
    this.products.paginator = this.productsPaginator;
    this.products.sort = this.productsSort;
  }

  loadData(): void {
    this.productService.finalProducts$
      .pipe(takeUntil(this.unsubscribe$)) // Nettoie les souscriptions à la destruction du composant
      .subscribe((products) => {
        this.products.data = products.map((product) => ({
          ...product,
          category: product.category ? product.category : DEFAULT_CATEGORY,
        }));
        // console.log('🚀 Produits finaux mis à jour :', products);
      });

    this.categoryService.categories$
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((categories) => {
        this.categories = categories;
        // console.log('🚀 Catégories mises à jour :', categories);
      });

    this.ingredientService.ingredients$
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((ingredients) => {
        this.ingredients = ingredients;
        // console.log('🚀 Ingrédients mis à jour :', ingredients);
        this.productService.loadFinalProducts(); // Rafraîchir les produits **UNE SEULE FOIS**
      });
  }

  openProductForm(product: Product | null): void {
    // console.log('🔍 Chargement des catégories et des ingrédients...');
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
    const { productData, selectedFiles, removedExistingImages } = result;
    const productId = productData._id;
    const existingImages = productData.existingImages ?? [];
    const finalImages = [...existingImages];

    delete productData.existingImages;

    // 1️⃣ Supprimer les images marquées pour suppression
    if (removedExistingImages.length) {
      removedExistingImages.forEach((imgPath) => {
        const filename = imgPath.replace('/^/?uploads/?/', '');
        this.imageService.deleteImage(filename).subscribe();
      });
    }

    // 2️⃣ Vérifier s’il y a des nouvelles images à uploader
    if (selectedFiles.length > 0) {
      this.imageService.uploadImages(selectedFiles).subscribe({
        next: (uploadResponse) => {
          finalImages.push(...uploadResponse.imagePath);
        },
        error: (error) => {
          console.error("Erreur lors de l'upload des images :", error);
          this.showErrorDialog(error.message);
        },
        complete: () => {
          this.submitProductForm(productId, {
            ...productData,
            images: finalImages,
          });
        },
      });
    } else {
      this.submitProductForm(productId, {
        ...productData,
        images: finalImages,
      });
    }
  }

  // 3️⃣ Soumettre le formulaire (création ou mise à jour)
  submitProductForm(productId?: string, productData?: any): void {
    console.log('🚀 Envoi du produit au backend :', productData); // LOG ICI 🔍
    if (productId) {
      this.productService.updateProduct(productId, productData).subscribe({
        error: (error) => this.showErrorDialog(error.message, 'error'),
      });
    } else {
      this.productService.createProduct(productData).subscribe({
        error: (error) => this.showErrorDialog(error.message, 'error'),
      });
    }
  }

  // Afficher les erreurs dans une fenêtre modale
  private showErrorDialog(message: string, type = 'error'): void {
    this.dialog.open(InfoDialogComponent, {
      data: { message, type },
    });
  }

  ///////////////////////////////////////////////////////////////
  // Suppression d'un produit
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
