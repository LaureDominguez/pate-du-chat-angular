import { Component, EventEmitter, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { firstValueFrom, Subject, takeUntil } from 'rxjs';

import { Category, CategoryService } from '../../../services/category.service';
import { Ingredient, IngredientService } from '../../../services/ingredient.service';
import { FinalProduct, Product, ProductService } from '../../../services/product.service';
import { ProductFormComponent } from './product-form/product-form.component';
import { ImageService } from '../../../services/image.service';

import { AdminModule } from '../admin.module';
import { DEFAULT_CATEGORY } from '../../../models/category';
import { DeviceService } from '../../../services/device.service';
import { DialogService } from '../../../services/dialog.service';

import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';

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
  dlcsList: string[] = [];

  isMobile = false;

  private unsubscribe$ = new Subject<void>(); // Permet de gérer les souscriptions

  displayedProductsColumns: string[] = [
    'name',
    'category',
    'allergens',
    'vegan',
    'vegeta',
    'price',
    'stockQuantity',
    'unite',
    'stock',
    'actions',
  ];

  @ViewChild('productsPaginator') productsPaginator!: MatPaginator;
  @ViewChild('productsSort') productsSort!: MatSort;

  @Output() countChanged = new EventEmitter<number>();


  constructor(
    private productService: ProductService,
    private ingredientService: IngredientService,
    private categoryService: CategoryService,
    private imageService: ImageService,
    private deviceService: DeviceService,
    private dialog: MatDialog,
    private dialogService: DialogService
  ) {}

  ngOnInit(): void {
    this.loadData();
    this.fetchDlcs();
    this.deviceService.isMobile$
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((isMobile) => {
        this.isMobile = isMobile;
        // console.log('Mobile :', this.deviceService.isMobile);
        // console.log('OS :', this.deviceService.os);
        // console.log('Navigateur :', this.deviceService.browser);
      });
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
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((products) => {
        this.products.data = products.map((product) => ({
          ...product,
          category: product.category ? product.category : DEFAULT_CATEGORY,
        }));
        this.countChanged.emit(products.length);
      });


    this.categoryService.categories$
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((categories) => {
        this.categories = categories;
      });

    this.ingredientService.ingredients$
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((ingredients) => {
        this.ingredients = ingredients;
        this.productService.loadFinalProducts();
      });
  }

  fetchDlcs(): void {
    this.productService.getDlcs().subscribe((dlcs) => {
      this.dlcsList = dlcs;
    });
  }

  openProductForm(product: Product | null): void {
    const imageUrls =
      product?.images?.map((imagePath) =>
        this.imageService.getImageUrl(imagePath)
      ) || [];
    const dialogRef = this.dialog.open(ProductFormComponent, {
      panelClass: 'custom-dialog',
      data: {
        product: product || null,
        imageUrls: imageUrls,
        imagePaths: product?.images || [],
        categories: this.categories,
        ingredients: this.ingredients,
        dlcs: this.dlcsList,
      },
    });

    const instance = dialogRef.componentInstance;

    instance.checkNameExists.subscribe((name: string) => {
      const excludedId = product?._id;

      this.productService.checkExistingProducName(name, excludedId).subscribe((exists: boolean) => {
        if (exists) {
            this.dialogService.error(`Le nom "${name}" existe déjà.`);
        } else {
          instance.validateAndSubmit();
        }
      });
    });

    instance.formValidated.subscribe((formResult) => {
      this.handleProductFormSubmit(formResult, dialogRef);
      console.log('Formulaire validé avec succès :', formResult);
    });
  }

  handleProductFormSubmit(result: {
    productData: any;
    selectedFiles: File[];
    removedExistingImages: string[];
    imageOrder: string[];
  },
  dialogRef: MatDialogRef<ProductFormComponent>
): void {
    const { productData, selectedFiles, removedExistingImages, imageOrder } = result;
    const productId = productData._id;
    const onSuccess = () => {
      dialogRef.close(result);
    };

    removedExistingImages.forEach((path) => {
      const filename = path.replace(/^\/?uploads\/?/, '');
      this.imageService.deleteImage(filename).subscribe();
    });

    if (selectedFiles.length > 0) {
      this.imageService.uploadImages(selectedFiles).subscribe({
        next: (response) => {
          const uploadedPaths = response.imagePath;
          const uploadedNames = selectedFiles.map((f) => f.name);

          productData.images = imageOrder.map((entry) => {
            if (entry.startsWith('/uploads/')) {
              return entry;
            }

            const index = uploadedNames.findIndex((name) => entry.includes(name));
            return uploadedPaths[index] || '';
          }).filter(Boolean);

          delete productData.existingImages;
          this.submitProductForm(productId, productData, onSuccess);
        },
        error: (error) => {
          this.dialogService.error(error.message);
        },
      });
    } else {
      productData.images = imageOrder.filter((entry) => entry.startsWith('/uploads/'));
      this.submitProductForm(productId, productData, onSuccess);
    }
  }
  

  submitProductForm(
    productId?: string, 
    productData?: any,
    onSuccess?: () => void
  ): void {
    // console.log('🚀 Envoi du produit au backend :', productData); // LOG ICI 🔍
    if (productId) {
      this.productService
        .updateProduct(productId, productData)
        .subscribe({
          next: () => {
            this.dialogService.success(`Le produit <span class="bold-text">"${productData.name}"</span> a bien été modifié.`);
            onSuccess?.();
          },
          error: (error) => {
            this.dialogService.error(error.message);
          },
        });
    } else {
      this.productService.createProduct(productData).subscribe({
        next: () => {
          this.dialogService.success(`Le produit <span class="bold-text">"${productData.name}"</span> a bien été créé.`);
          onSuccess?.();
        },
        error: (error) => {
          this.dialogService.error(error.message);
        },
      });
    }
  }

  ///////////////////////////////////////////////////////////////
  // Suppression d'un produit
  deleteProduct(product: Product): void {
    if (!product.images || product.images.length === 0) {
      this.confirmDeleteProduct(product);
      return;
    }

    this.dialogService.confirm(
      `Le produit <br> <span class="bold-text">"${product.name}"</span> a <span class="bold-text">${product.images.length}</span> image(s). <br> Voulez-vous les télécharger avant suppression ?`,
      {
        confirmText: 'Ignorer',
        cancelText: 'Annuler',
        extraText: 'Télécharger',
      }
    ).subscribe((result) => {
      switch (result) {
        case 'cancel':
          return;

        case 'extra':
          this.downloadProductImages(product);
          // ✅ On relance ensuite une confirmation explicite
          this.dialogService.confirm(
            `Les images ont été téléchargées.<br>Souhaitez-vous supprimer le produit <span class="bold-text">"${product.name}"</span> ?`,
            {
              confirmText: 'Oui',
              cancelText: 'Non',
            }
          ).subscribe((secondResult) => {
            if (secondResult === 'confirm') {
              this.removeProductAndImages(product);
            }
          });
          return;

        case 'confirm':
          this.removeProductAndImages(product);
          return;

        default:
          return;
      }
    });
  }

  // ⏬ Nouvelle méthode explicite
  private removeProductAndImages(product: Product): void {
    product.images?.forEach((imageUrl) => {
      const filename = imageUrl.replace(/^\/?uploads\/?/, '');
      this.imageService.deleteImage(filename).subscribe();
    });
    this.confirmDeleteProduct(product);
  }


  // >> Télécharger les images avant suppression
  private downloadProductImages(product: Product): void {
    if (product.images?.length) {
      product.images.forEach((imageUrl) => {
        this.imageService.downloadImage(imageUrl, product.name);
      });
    }
  }

  private async confirmDeleteProduct(product: Product): Promise<void> {
    try {
      await firstValueFrom(this.productService.deleteProduct(product._id!));
      this.dialogService.success(`Le produit <br> <span class="bold-text">"${product.name}"</span> a bien été supprimé.`);
    } catch (error) {
      this.dialogService.error('Une erreur est survenue lors de la suppression du produit :<br> <span class="bold-text">"${product.name}"</span>');
    }
  }
}
