import { Component, EventEmitter, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { firstValueFrom, Subject, takeUntil } from 'rxjs';

import { Ingredient, IngredientService, } from '../../../services/ingredient.service';
import { Supplier, SupplierService } from '../../../services/supplier.service';
import { DEFAULT_SUPPLIER } from '../../../models/supplier';
import { ProductService } from '../../../services/product.service';
import { ImageService } from '../../../services/image.service';
import { SharedDataService } from '../../../services/shared-data.service';
import { DialogService } from '../../../services/dialog.service';

import { IngredientFormComponent } from './ingredient-form/ingredient-form.component';
import { ADMIN_SHARED_IMPORTS } from '../admin-material';
import { ADMIN_SHARED_PROVIDERS } from '../admin.providers';


@Component({
  selector: 'app-ingredient-admin',
  imports: [ADMIN_SHARED_IMPORTS],
  providers: [ADMIN_SHARED_PROVIDERS],
  templateUrl: './ingredient-admin.component.html',
  styleUrls: ['./ingredient-admin.component.scss', '../admin.component.scss'],
})
export class IngredientAdminComponent implements OnInit, OnDestroy {
  ingredients = new MatTableDataSource<Ingredient>([]);
  allIngredients: Ingredient[] = [];
  allergenesList: string[] = [];
  suppliers: Supplier[] = [];
  originesList: string[] = [];
  originIcon: string = '';

  highlightedIngredientId: string | null = null;

  private unsubscribe$ = new Subject<void>();

  displayedIngredientsColumns: string[] = [
    'name',
    'supplier',
    'allergens',
    'vegan',
    'vegeta',
    'origin',
    'actions',
  ];

  @ViewChild('ingredientsPaginator') ingredientsPaginator!: MatPaginator;
  @ViewChild('ingredientsSort') ingredientsSort!: MatSort;

  @Output() countChanged = new EventEmitter<number>();


  constructor(
    private sharedDataService: SharedDataService,
    private ingredientService: IngredientService,
    private imageService: ImageService,
    private productService: ProductService,
    private supplierService: SupplierService,
    private dialogService: DialogService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadData();    
    this.fetchAllergenes();
    this.fetchOrigines();
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  ngAfterViewInit(): void {
    this.ingredients.paginator = this.ingredientsPaginator;
    this.ingredients.sort = this.ingredientsSort;

    setTimeout(() => {
      this.ingredients.sort!.active = 'name';
      this.ingredients.sort!.direction = 'asc';
      this.ingredients.sort!.sortChange.emit({
        active: 'name',
        direction: 'asc'
      });

      this.ingredients.sortingDataAccessor = (item: Ingredient, property: string) => {
        if (item._id === this.highlightedIngredientId) return '\u0000';
        switch (property) {
          case 'name':
          case 'origin':
            return item[property]?.normalize?.('NFD')?.replace(/[\u0300-\u036f]/g, '')?.toLowerCase() || '';
          case 'supplier':
            return (item.supplier as Supplier)?.name?.toLowerCase?.() || '';
          case 'allergens':
            return (item.allergens || []).join(', ');
          default:
            return (item as any)[property];
        }
      };
    });
  }

  loadData(): void {
    this.ingredientService.ingredients$
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((ingredients) => {
        this.ingredients.data = ingredients.map((ingredient) => ({
          ...ingredient,
          supplier: ingredient.supplier ? ingredient.supplier : DEFAULT_SUPPLIER,
          originIcon: this.ingredientService.getOriginIcon(ingredient.origin),
        }))
        this.allIngredients = ingredients;
        this.countChanged.emit(ingredients.length);
      })

    this.supplierService.suppliers$
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((suppliers) => {
        this.suppliers = suppliers;
      })

    this.sharedDataService.requestNewIngredient$.subscribe(() => {
      const searchedValue = this.sharedDataService.getSearchedIngredient();
      this.openIngredientForm(null, searchedValue);
    });
  }

  fetchAllergenes(): void {
    this.ingredientService.getAllergenes().subscribe((allergenes) => {
      this.allergenesList = allergenes;
    });
  }

  fetchOrigines(): void {
    this.ingredientService.getOrigines().subscribe({
      next: (origines) => {
        this.originesList = origines;
      },
      error: (err) => console.error('❌ Erreur de récupération des origines:', err),
    });
  }

    downloadImage(data: {imagePath: string, objectName: string}): void {
      this.imageService.downloadImage(data.imagePath, data.objectName);
    }

  onRowClick(event: MouseEvent, ingredient: Ingredient): void {
    const target = event.target as HTMLElement;

    // Ne pas ouvrir le formulaire si l'utilisateur clique sur un bouton ou un icône
    if (
      target.closest('button') ||         // clique sur un bouton
      target.closest('mat-icon-button') || // clique sur un bouton Angular Material
      target.tagName === 'MAT-ICON'        // clique directement sur l'icône
    ) {
      return;
    }

    this.openIngredientForm(ingredient);
  }

  // // Télécharger une image
  downloadIngredientImage(imagePath: string, ingredientName: string) {
    this.imageService.downloadImage(imagePath, ingredientName);
  }

  openIngredientForm(
    ingredient: Ingredient | null,
    searchedValue: string = ''
  ): void {
    const imageUrls =
      ingredient?.images?.map((imagePath) =>
        this.imageService.getImageUrl(imagePath)
      ) || [];

    // Récupérer tous les ingrédients disponibles pour permettre la sélection des sous-ingrédients
      const dialogRef = this.dialog.open(IngredientFormComponent, {
        autoFocus: true,
        restoreFocus: true,
        panelClass: 'custom-dialog',
        data: {
          ingredient: ingredient,
          allergenesList: this.allergenesList,
          originesList: this.originesList,
          suppliers: this.suppliers,
          imageUrls: imageUrls,
          imagePaths: ingredient?.images || [],
          searchedValue: searchedValue,
          ingredients: this.allIngredients, // ✅ Passage des ingrédients disponibles
        },
      });

      // Vérification des infos avant de fermer la modale
      const instance = dialogRef.componentInstance;

      instance.downloadImage.subscribe((data: { imagePath: string; objectName: string }) => {
        this.imageService.downloadImage(data.imagePath, data.objectName);
      });

      instance.checkNameExists.subscribe((name: string) => {
        const excludedId = ingredient?._id;

        this.ingredientService.checkExistingIngredientName(name, excludedId).subscribe((exists: boolean) => {
          if (exists) {
            this.dialogService.error(`Le nom "${name}" existe déjà.`);
          } else {
            instance.validateAndSubmit();
          }
        });
      });

      instance.formValidated.subscribe((formResult) => {
        this.handleIngredientFormSubmit(formResult, dialogRef);
      });
  }

  handleIngredientFormSubmit(
    result: {
      ingredientData: any;
      selectedFiles: File[];
      removedExistingImages: string[];
      imageOrder: string[];
    },
    dialogRef: MatDialogRef<IngredientFormComponent>
  ): void {
    const { ingredientData, selectedFiles, removedExistingImages, imageOrder } = result;
    const ingredientId = ingredientData._id;
    const onSuccess = () => {
      dialogRef.close(result); // Fermer uniquement en cas de succès
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

          ingredientData.images = imageOrder.map((entry) => {
            if (entry.startsWith('/uploads/')) {
              return entry;
            }

            const index = uploadedNames.findIndex((name) => entry.includes(name));
            return uploadedPaths[index] || '';
          }).filter(Boolean);

          delete ingredientData.existingImages;
          this.submitIngredientForm(ingredientId, ingredientData, onSuccess);
        },
        error: (err) => this.dialogService.error(err.message),
      });
    } else {
      ingredientData.images = imageOrder.filter((entry) => entry.startsWith('/uploads/'));
      this.submitIngredientForm(ingredientId, ingredientData, onSuccess);
    }
  }

  // 3️⃣ Soumettre le formulaire (création ou mise à jour)
  submitIngredientForm(
    ingredientId?: string, 
    ingredientData?: any,
    onSuccess?: () => void
  ): void {
    if (ingredientId) {
      this.ingredientService
        .updateIngredient(ingredientId, ingredientData)
        .subscribe({
          next: () => {
            this.dialogService.success(`L’ingrédient <b>"${ingredientData.name}"</b> a bien été modifié.`);
            onSuccess?.();
          },
          error: (error) => {
            this.dialogService.error(error.message);
          },
        });
    } else {
      this.ingredientService.createIngredient(ingredientData).subscribe({
        next: (res) => {
          this.sharedDataService.resultIngredientCreated(res);
          this.highlightedIngredientId = res._id ?? null;
          this.dialogService.success(`L’ingrédient <b>"${res.name}"</b> a bien été créé.`);
          onSuccess?.();
        },
        error: (error) => {
          this.dialogService.error(error.message);
        },
      });
    }
  }

  ///////////////////////////////////////////////////////////////
  // suppression d'un ingrédient
  deleteIngredient(ingredient: Ingredient): void {
    this.checkIngredientInProducts(ingredient);
  }

  private async checkIngredientInProducts(
    ingredient: Ingredient,
    canRetry: boolean = true
  ): Promise<void> {
    try {
      const products = await firstValueFrom(
        this.productService.getProductsByIngredient(ingredient._id!)
      );

      const isUsedInProducts = products.length > 0;
      let message = `Êtes-vous sûr de vouloir supprimer l’ingrédient <b>"${ingredient.name}"</b> ?`;

      if (isUsedInProducts) {
        message = `L’ingrédient <b>"${ingredient.name}"</b> est utilisé dans <b>${products.length} produit(s)</b>.<br> Voulez-vous quand même le supprimer ?`;
      }

      const result = await firstValueFrom(
        this.dialogService.confirm(message, {
          confirmText: 'Supprimer',
          cancelText: 'Annuler',
          extraText: isUsedInProducts ? 'Voir les produits' : undefined,
        })
      );

      if (result === 'cancel') return;

      if (result === 'extra' && canRetry) {
        await this.showRelatedProducts(ingredient);
        await this.checkIngredientInProducts(ingredient, false); // 🌀 recall avec canRetry = false
        return;
      }

      this.checkIngredientImages(ingredient);
    } catch (error) {
      this.dialogService.error(
        `Erreur lors de la vérification des produits liés à "${ingredient.name}".`
      );
    }
  }

  private async showRelatedProducts(ingredient: Ingredient): Promise<void> {
  try {
    const products = await firstValueFrom(
      this.productService.getProductsByIngredient(ingredient._id!)
    );

    if (!products.length) {
      await firstValueFrom(
        this.dialogService.info(`Aucun produit n’utilise "${ingredient.name}".`, 'Produits liés')
      );
      return;
    }

    const productList = products.map((p) => `<li>${p.name}</li>`).join('');
    await firstValueFrom(
    this.dialogService.info(
      `L’ingrédient <b>"${ingredient.name}"</b> est utilisé dans ${products.length} produit(s) :<br>${productList}`,
      'Produits liés')
    );
  } catch (err) {
    this.dialogService.error('Erreur lors de la récupération des produits liés.');
  }
}


  // >> Vérifier les images avant suppression
  async checkIngredientImages(ingredient: Ingredient): Promise<void> {
    if (!ingredient.images || ingredient.images.length === 0) {
      await this.confirmIngredientDeletion(ingredient);
      return;
    }

    const result = await firstValueFrom(
      this.dialogService.confirm(
        `L'ingrédient <b>"${ingredient.name}"</b> a <b>${ingredient.images.length} image(s) associée(s)</b>.<br> Voulez-vous les télécharger avant suppression ?`,
        {
          confirmText: 'Ignorer',
          cancelText: 'Annuler',
          extraText: 'Télécharger',
        }
      )
    );

    if (result === 'cancel') return;

    if (result === 'extra') {
      this.downloadIngredientImagesBeforeDelete(ingredient);

      // ✅ Ajout : demander explicitement si on poursuit la suppression
      const confirmResult = await firstValueFrom(
        this.dialogService.confirm(
          `Les images ont été téléchargées.<br>Souhaitez-vous supprimer l’ingrédient <b>"${ingredient.name}"</b> ?`,
          {
            confirmText: 'Supprimer',
            cancelText: 'Annuler',
          }
        )
      );

      if (confirmResult !== 'confirm') return;
    }

    // ✅ Suppression des images
    for (const imgPath of ingredient.images) {
      const filename = imgPath.replace(/^\/?uploads\/?/, '');
      this.imageService.deleteImage(filename).subscribe();
    }

    await this.confirmIngredientDeletion(ingredient);
  }


  // >> Télécharger les images avant suppression
  private downloadIngredientImagesBeforeDelete(ingredient: Ingredient): void {
    if (ingredient.images?.length) {
      ingredient.images.forEach((imageUrl) => {
        this.imageService.downloadImage(imageUrl, ingredient.name);
      });
    }
  }

  // >> Confirmation de la suppression
  private async confirmIngredientDeletion(
    ingredient: Ingredient
  ): Promise<void> {
    try {
      await firstValueFrom(
        this.ingredientService.deleteIngredient(ingredient._id!)
      );
      this.dialogService.success(`L'ingrédient <b>"${ingredient.name}"</b> a bien été supprimé.`);
    } catch (error) {
      this.dialogService.error(`Une erreur est survenue lors de la suppression de l’ingrédient :<br><b>"${ingredient.name}"</b>.`);
    }
  }
}



