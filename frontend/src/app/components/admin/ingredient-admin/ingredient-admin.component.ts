import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { firstValueFrom, Subject, takeUntil } from 'rxjs';
import { AdminModule } from '../admin.module';

import { Ingredient, IngredientService, } from '../../../services/ingredient.service';
import { Supplier, SupplierService } from '../../../services/supplier.service';
import { DEFAULT_SUPPLIER } from '../../../models/supplier';
import { ProductService } from '../../../services/product.service';
import { ImageService } from '../../../services/image.service';
import { SharedDataService } from '../../../services/shared-data.service';

import { IngredientFormComponent } from './ingredient-form/ingredient-form.component';

import { ConfirmDialogComponent } from '../../dialog/confirm-dialog/confirm-dialog.component';
import { InfoDialogComponent } from '../../dialog/info-dialog/info-dialog.component';


@Component({
  selector: 'app-ingredient-admin',
  imports: [AdminModule],
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

  constructor(
    private sharedDataService: SharedDataService,
    private ingredientService: IngredientService,
    private imageService: ImageService,
    private productService: ProductService,
    private supplierService: SupplierService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadData();    
    this.fetchAllergenes();
    this.fetchOrigines();

    // console.log('fournisseurs :', this.suppliers)
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

    console.log('ingredients : ', this.ingredients)
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
        // console.log('🚀 ingredient-admin -> onInit -> Ingrédients mis à jour :', this.allIngredients);
      })

    // this.ingredientService.getIngredients().subscribe((ingredients) => {
    //   this.ingredients.data = ingredients;
    //   this.allIngredients = ingredients;
    //   console.log('🚀 ingredient-admin -> onInit -> Ingrédients mis à jour :', ingredients);
    // });

    this.supplierService.suppliers$
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((suppliers) => {
        this.suppliers = suppliers;
      })

    this.sharedDataService.requestNewIngredient$.subscribe(() => {
      const searchedValue = this.sharedDataService.getSearchedIngredient();
      this.openIngredientForm(null, searchedValue);
    });

    this.sharedDataService.downloadImage$.subscribe((data) => {
      if (data) {
        this.downloadIngredientImage(data.imagePath, data.objectName);
      }
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
        // console.log('🚀 Liste des origines dans ingredient-admin:', this.originesList);
      },
      error: (err) => console.error('❌ Erreur de récupération des origines:', err),
    });
  }
  

  // Télécharger une image
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
        width: '600px',
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

      const instance = dialogRef.componentInstance;

      instance.checkNameExists.subscribe((name: string) => {
        const excludedId = ingredient?._id;

        this.ingredientService.checkExistingIngredientName(name, excludedId).subscribe((exists: boolean) => {
          if (exists) {
            this.dialog.open(InfoDialogComponent, {
              data: {
                message: `Le nom "${name}" existe déjà.`,
                type: 'error',
              },
            });
          } else {
            instance.validateAndSubmit();
          }
        });
      });

      instance.formValidated.subscribe((formResult) => {
        this.handleIngredientFormSubmit(formResult, dialogRef); // Ajoute le dialogRef
      });


      // dialogRef.afterClosed().subscribe(
      //   (
      //     result:
      //       | {
      //           ingredientData: any;
      //           selectedFiles: File[];
      //           removedExistingImages: string[];
      //           imageOrder: string[];
      //         }
      //       | undefined
      //   ) => {
      //     if (result) {
      //       this.handleIngredientFormSubmit(result);
      //     }
      //   }
      // ),
      //   (error: any) => {
      //     console.error(
      //       'Erreur lors du chargement des catégories ou des ingrédients :',
      //       error
      //     );
      //   };
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

      console.log('Formulaire soumis avec succès !', result);
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
        error: (err) => this.showErrorDialog(err.message),
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
            // console.log('ingredient-admin -> submitIngredientForm -> Ingrédient mis à jour !');
            this.sharedDataService.notifyIngredientCompositionUpdate();
            onSuccess?.();
          },
          error: (error) => {
            this.showErrorDialog(error.message);
          },
        });
    } else {
      this.ingredientService.createIngredient(ingredientData).subscribe({
        next: (res) => {
          // console.log('ingredient-admin -> submitIngredientForm à SharedData -> res', res);
          this.sharedDataService.resultIngredientCreated(res);
          this.highlightedIngredientId = res._id ?? null;
          onSuccess?.();
        },
        error: (error) => {
          this.showErrorDialog(error.message);
        },
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
  // suppression d'un ingrédient
  deleteIngredient(ingredient: Ingredient): void {
    this.checkIngredientInProducts(ingredient);
  }

  // >> Vérifier si l'ingrédient est utilisé dans un produit
  private async checkIngredientInProducts(
    ingredient: Ingredient
  ): Promise<void> {
    try {
      const products = await firstValueFrom(
        this.productService.getProductsByIngredient(ingredient._id!)
      );

      const isUsedInProducts = products.length > 0;
      let message = `Êtes-vous sûr de vouloir supprimer cet ingrédient : <br> <span class="bold-text">"${ingredient.name}"</span> ?`;

      if (isUsedInProducts) {
        message = `L'ingrédient <span class="bold-text">"${ingredient.name}"</span> est utilisé dans <span class="bold-text">${products.length} produit(s)</span>.<br> Voulez-vous quand même le supprimer ?`;
      }

      // Affichage de la confirmation utilisateur
      const dialogRef = this.dialog.open(ConfirmDialogComponent, {
        width: '400px',
        data: { message },
      });

      const result = await firstValueFrom(dialogRef.afterClosed());

      // console.log('result', result);

      if (result === 'cancel') return;

      this.checkIngredientImages(ingredient);
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des produits :', error);
      this.dialog.open(InfoDialogComponent, {
        width: '400px',
        data: {
          message:
            'Erreur lors de la vérification des produits liés à cet ingrédient.',
          type: 'error',
        },
      });
    }
  }

  // >> Vérifier les images avant suppression
  checkIngredientImages(ingredient: Ingredient): void {
    // ✅ Pas d'images, on passe directement à la suppression
    if (!ingredient.images || ingredient.images.length === 0) {
      this.confirmIngredientDeletion(ingredient);
      return;
    }
    // ✅ L'ingrédient a des images, afficher la boîte de dialogue de confirmation
    this.dialog
      .open(ConfirmDialogComponent, {
        width: '400px',
        data: {
          message: `L'ingrédient <span class="bold-text">"${ingredient.name}"</span> a <span class="bold-text">${ingredient.images?.length} image(s) associée(s)</span>.<br> Voulez-vous les télécharger avant suppression ?`,
          confirmButtonText: 'Ignorer',
          cancelButtonText: 'Annuler',
          extraButton: 'Télécharger',
        },
      })
      .afterClosed()
      .subscribe((result) => {
        // console.log('result', result);
        switch (result) {
          case 'cancel':
            return;
          case 'extra':
            this.downloadIngredientImages(ingredient);
            break;
          case 'confirm':
            break;
          default:
            break;
        }
        // ✅ Suppression des images avant suppression de l’ingrédient
        ingredient.images?.forEach((imgPath) => {
          const filename = imgPath.replace('/^/?uploads/?/', '');
          this.imageService.deleteImage(filename).subscribe();
        });
        // ✅ Suppression finale de l’ingrédient
        this.confirmIngredientDeletion(ingredient);
      });
  }

  // >> Télécharger les images avant suppression
  private downloadIngredientImages(ingredient: Ingredient): void {
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
      this.dialog.open(InfoDialogComponent, {
        width: '400px',
        data: {
          message: `L'ingrédient <span class="bold-text">"${ingredient.name}"</span> a bien été supprimé.`,
          type: 'success',
        },
      });
    } catch (error) {
      this.dialog.open(InfoDialogComponent, {
        width: '400px',
        data: {
          message:
            'Une erreur est survenue lors de la suppression de l’ingrédient :<br><span class="bold-text">"${ingredient.name}"</span>.',
          type: 'error',
        },
      });
    }
  }
}
