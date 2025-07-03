import { ApplicationRef, Component, EventEmitter, NgZone, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { debounceTime, filter, first, firstValueFrom, Subject, take, takeUntil } from 'rxjs';

import { Category, CategoryService } from '../../../services/category.service';
import { Ingredient, IngredientService } from '../../../services/ingredient.service';
import { Product, ProductService } from '../../../services/product.service';
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
  products = new MatTableDataSource<Product>([]);
  categories: Category[] = [];
  ingredients: Ingredient[] = [];
  dlcsList: string[] = [];

  highlightedProductId: string | null = null; 
  isMobile = false;

  private unsubscribe$ = new Subject<void>();
  // private firstLoadDone = false;
  noComposition: string[] = []; // Liste des produits sans composition


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
    private dialogService: DialogService,
      private ngZone: NgZone,
  private appRef: ApplicationRef,
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
      // console.log('pas de composition oninit :', this.noComposition);
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  ngAfterViewInit(): void {
    // console.log('pas de composition afterinit :', this.noComposition);

    this.products.paginator = this.productsPaginator;
    this.products.sort = this.productsSort;

    setTimeout(() => {
      this.products.sort!.active = 'name';
      this.products.sort!.direction = 'asc';
      this.products.sort!.sortChange.emit({
        active: 'name',
        direction: 'asc',
      });
      
      this.products.sortingDataAccessor = (item: Product, property: string) => {
        if (item._id === this.highlightedProductId) {
          switch (property) {
            case 'price':
            case 'stockQuantity':
            case 'stock':
              return -Infinity; // pour les valeurs numériques
            default:
              return '\u0000';   // pour les strings
          }
        }
        switch (property) {
          case 'name':
            return item.name.toLowerCase();
          case 'category':
            return (item.category as Category)?.name.toLowerCase() || '';
          case 'allergens':
            return (item.allergens || []).join(', ');
          case 'vegan':
            return item.vegan ? 'Oui' : 'Non';
          case 'vegeta':
            return item.vegeta ? 'Oui' : 'Non';
          case 'price':
            return item.price ? parseFloat(item.price.toString()) : 0;
          case 'stockQuantity':
            return item.stockQuantity ? parseFloat(item.stockQuantity.toString()) : 0;
          case 'stock':
            return item.stock ? 'Oui' : 'Non';
          default:
            return (item as any)[property];
        }
      };
    });      
  }

  loadData(): void {
    this.productService.products$
    .pipe(takeUntil(this.unsubscribe$))
    .subscribe((products) => {
            this.noComposition = [];

      this.products.data = products.map(product => {
        const hasNoComposition = !product.composition || product.composition.length === 0;

        if (hasNoComposition) {
          this.noComposition.push(`- ${product.name}`);
        }

        return {
          ...product,
          category: product.category || DEFAULT_CATEGORY,
          invalidComposition: hasNoComposition,
        };
      });

      this.countChanged.emit(this.products.data.length);

      if (this.noComposition.length > 0) {
        this.showNoCompositionWarning();
      }
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
      });
  }

  private showNoCompositionWarning(): void {
    const message = `⚠️ Produits sans composition détectés :\n\n${this.noComposition.join('\n')}`;
    requestAnimationFrame(() => {
      this.dialogService.error(message, 'Produits incomplets');
    });
  }


  fetchDlcs(): void {
    this.productService.getDlcs().subscribe((dlcs) => {
      this.dlcsList = dlcs;
    });
  }

  // Ouvrir le formulaire de modif en cliquant sur la ligne
  onRowClick(event: MouseEvent, product: Product): void {
    const target = event.target as HTMLElement;

    // Ne pas ouvrir le formulaire si l'utilisateur clique sur un bouton ou un icône
    if (
      target.closest('button') ||         // clique sur un bouton
      target.closest('mat-icon-button') || // clique sur un bouton Angular Material
      target.tagName === 'MAT-ICON'        // clique directement sur l'icône
    ) {
      return;
    }

    this.openProductForm(product);
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

    instance.downloadImage.subscribe((data: { imagePath: string; objectName: string }) => {
      this.imageService.downloadImage(data.imagePath, data.objectName);
    });

    instance.checkNameExists.subscribe((name: string) => {
      const excludedId = product?._id;

      this.productService.checkExistingProductName(name, excludedId).subscribe((exists: boolean) => {
        if (exists) {
            this.dialogService.error(`Le nom "${name}" existe déjà.`);
        } else {
          instance.validateAndSubmit();
        }
      });
    });

    instance.formValidated.subscribe((formResult) => {
      this.handleProductFormSubmit(formResult, dialogRef);
      // console.log('Formulaire validé avec succès :', formResult);
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
        next: (res) => {
          this.dialogService.success(`Le produit <span class="bold-text">"${productData.name}"</span> a bien été créé.`);
          this.highlightedProductId = res._id ?? null; // Mettre en surbrillance le produit créé
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
          this.downloadProductImagesBeforeDelete(product);
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
  private downloadProductImagesBeforeDelete(product: Product): void {
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
