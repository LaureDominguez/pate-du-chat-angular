import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { first, firstValueFrom, forkJoin, Subject, takeUntil } from 'rxjs';

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
import { MobileViewComponent } from "../mobile-view/mobile-view.component";

@Component({
  selector: 'app-product-admin',
  standalone: true,
  imports: [AdminModule, MobileViewComponent],
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

  constructor(
    private productService: ProductService,
    private ingredientService: IngredientService,
    private categoryService: CategoryService,
    private imageService: ImageService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadData(); // Charge les données initiales
    this.fetchDlcs(); // Récupère la liste des DLCs
    this.checkIfMobile();
    window.addEventListener('resize', this.checkIfMobile.bind(this));
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
        // console.log('🚀 product-admin -> Ingrédients mis à jour :', ingredients);
        this.productService.loadFinalProducts(); // Rafraîchir les produits **UNE SEULE FOIS**
      });
  }

  fetchDlcs(): void {
    // console.log('🔍 Récupération des DLCs...');
    this.productService.getDlcs().subscribe((dlcs) => {
      this.dlcsList = dlcs;
      // console.log('🚀 DLCs mis à jour :', dlcs);
    });
  }

  checkIfMobile() {
    this.isMobile = window.innerWidth < 768;
  }

  openProductForm(product: Product | null): void {
    // console.log('🔍 Chargement des catégories et des ingrédients...');
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
      console.log('🔍 Vérification de l\'existence du nom :', name, excludedId);

      this.productService.checkExistingProducName(name, excludedId).subscribe((exists: boolean) => {
        if (exists) {
          this.dialog.open(InfoDialogComponent, {
            data: {
              message: `Le nom "${name}" existe déjà.`,
              type: 'error',
            },
          });
        } else {
          console.log('✅ Le nom est disponible !');
          instance.validateStockAndPrice();
        }
      });
    });

    dialogRef.afterClosed().subscribe(
      (
        result:
          | {
              productData: any;
              selectedFiles: File[];
              removedExistingImages: string[];
              imageOrder: string[];
            }
          | undefined
      ) => {
        if (result) {
          console.log(
            '🔍 Résultat du formulaire de produit :',
            result.productData,
            result.selectedFiles,
            result.removedExistingImages,
            result.imageOrder
          );
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
    imageOrder: string[];
  }): void {
    const { productData, selectedFiles, removedExistingImages, imageOrder } = result;
    const productId = productData._id;
    // const existingImages = productData.existingImages ?? [];

    // console.log('handleProductFormSubmit() :');
    // console.log('📤 ImageOrder reçu du form :', imageOrder);
    // console.log('📤 Fichiers sélectionnés :', selectedFiles.map(f => f.name));
    // console.log('📤 Images existantes (paths) :', existingImages);

    // 1️⃣ Supprimer les anciennes images supprimées
    removedExistingImages.forEach((path) => {
      const filename = path.replace(/^\/?uploads\/?/, '');
      this.imageService.deleteImage(filename).subscribe();
    });

    // 2️⃣ Upload des nouvelles images si besoin
    if (selectedFiles.length > 0) {
      this.imageService.uploadImages(selectedFiles).subscribe({
        next: (response) => {
          const uploadedPaths = response.imagePath; // ['/uploads/xxx.jpg', ...]
          const uploadedNames = selectedFiles.map((f) => f.name);

          // console.log('📤 Images uploadées :', uploadedPaths);
          // console.log('📤 Noms des fichiers uploadés :', uploadedNames);

          // 3️⃣ Reconstituer `images[]` dans l'ordre voulu
          productData.images = imageOrder.map((entry) => {
            // ✅ 1. Ancienne image : elle est déjà un chemin complet
            if (entry.startsWith('/uploads/')) {
              return entry;
            }

            // ✅ 2. Image preview (fichier sélectionné) → on cherche le nom dans uploadedNames
            const index = uploadedNames.findIndex((name) => entry.includes(name));
            return uploadedPaths[index] || '';
          }).filter(Boolean);

          delete productData.existingImages;
          this.submitProductForm(productId, productData);
        },
        error: (err) => this.showErrorDialog(err.message),
      });
    } else {
      // 3️⃣ Sans nouveau fichier → reconstruire les chemins uniquement depuis les anciennes images
      productData.images = imageOrder.filter((entry) => entry.startsWith('/uploads/'));
      this.submitProductForm(productId, productData);
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
    if (!product.images || product.images.length === 0) {
      this.confirmDeleteProduct(product);
      return;
    }

    this.dialog
      .open(ConfirmDialogComponent, {
        width: '400px',
        data: {
          message: `Le produit <br> <span class="bold-text">"${product.name}"</span> a <span class="bold-text">${product.images.length}</span> image(s). <br> Voulez-vous les télécharger avant suppression ?`,
          confirmButtonText: 'Ignorer',
          cancelButtonText: 'Annuler',
          extraButton: 'Télécharger',
        },
      })
      .afterClosed()
      .subscribe((result) => {
        switch (result) {
          case 'cancel':
            return;
          case 'extra':
            this.downloadProductImages(product);
            break;
          case 'confirm':
            break;
          default:
            break;
        }
        // ✅ Suppression des images avant suppression de l’ingrédient
        product.images?.forEach((imageUrl) => {
          const filename = imageUrl.replace('/^/?uploads/?/', '');
          this.imageService.deleteImage(filename).subscribe();
        });
        // ✅ Suppression finale de l’ingrédient
        this.confirmDeleteProduct(product);
      });
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

      this.dialog.open(InfoDialogComponent, {
        width: '400px',
        data: {
          message: `Le produit <br> <span class="bold-text">"${product.name}"</span> a bien été supprimé.`,
          type: 'success',
        },
      });
    } catch (error) {
      this.dialog.open(InfoDialogComponent, {
        width: '400px',
        data: {
          message: `Une erreur est survenue lors de la suppression du produit :<br> <span class="bold-text">"${product.name}"</span>`,
          type: 'error',
        }
      });
    }
  }
}
