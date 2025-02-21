import { Component, OnInit, ViewChild } from '@angular/core';

import {
  Ingredient,
  IngredientService,
} from '../../../services/ingredient.service';
import { ImageService } from '../../../services/image.service';

import { IngredientFormComponent } from './ingredient-form/ingredient-form.component';
import { ConfirmDialogComponent } from '../../dialog/confirm-dialog/confirm-dialog.component';

import { AdminModule } from '../admin.module';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { SharedDataService } from '../../../services/shared-data.service';
import { firstValueFrom } from 'rxjs';
import { InfoDialogComponent } from '../../dialog/info-dialog/info-dialog.component';
import { ProductService } from '../../../services/product.service';

@Component({
  selector: 'app-ingredient-admin',
  imports: [AdminModule],
  templateUrl: './ingredient-admin.component.html',
  styleUrls: ['./ingredient-admin.component.scss', '../admin.component.scss'],
})
export class IngredientAdminComponent implements OnInit {
  ingredients = new MatTableDataSource<Ingredient>([]);
  allergenesList: string[] = [];

  displayedIngredientsColumns: string[] = [
    'name',
    'supplier',
    'allergens',
    'vegan',
    'vegeta',
    'actions',
  ];

  @ViewChild('ingredientsPaginator') ingredientsPaginator!: MatPaginator;
  @ViewChild('ingredientsSort') ingredientsSort!: MatSort;

  constructor(
    private sharedDataService: SharedDataService,
    private ingredientService: IngredientService,
    private imageService: ImageService,
    private productService: ProductService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.ingredientService.getIngredients().subscribe((ingredients) => {
      this.ingredients.data = ingredients;
    });

    this.fetchAllergenes();

    this.sharedDataService.openIngredientForm$.subscribe(() => {
      const searchedValue = this.sharedDataService.getSearchedIngredient();
      this.openIngredientForm(null, searchedValue);
    });

    this.sharedDataService.downloadImage$.subscribe((data) => {
      if (data) {
        this.downloadIngredientImage(data.imagePath, data.objectName);
      }
    });
  }

  ngAfterViewInit(): void {
    this.ingredients.paginator = this.ingredientsPaginator;
    this.ingredients.sort = this.ingredientsSort;
  }

  fetchAllergenes(): void {
    this.ingredientService.getAllergenes().subscribe((allergenes) => {
      this.allergenesList = allergenes;
    });
  }

  // Télécharger une image
  downloadIngredientImage(imagePath: string, ingredientName: string) {
    this.imageService.downloadImage(imagePath, ingredientName);
  }

  // ouvrir le formulaire d'ingrédient
  openIngredientForm(
    ingredient: Ingredient | null,
    searchedValue: string = ''
  ): void {
    const imageUrls =
      ingredient?.images?.map((imagePath) =>
        this.imageService.getImageUrl(imagePath)
      ) || [];

    const dialogRef = this.dialog.open(IngredientFormComponent, {
      width: '600px',
      data: {
        ingredient: ingredient,
        allergenesList: this.allergenesList,
        imageUrls: imageUrls,
        searchedValue: searchedValue,
      },
    });

    dialogRef.afterClosed().subscribe(
      (
        result:
          | {
              ingredientData: any;
              selectedFiles: File[];
              removedExistingImages: string[];
            }
          | undefined
      ) => {
        if (result) {
          this.handleIngredientFormSubmit(result);
        }
      }
    ),
      (error: any) => {
        console.error('Erreur lors du chargement des ingrédients :', error);
      };
  }

  handleIngredientFormSubmit(result: {
    ingredientData: any;
    selectedFiles: File[];
    removedExistingImages: string[];
  }): void {
    const { ingredientData, selectedFiles, removedExistingImages } = result;
    const ingredientId = ingredientData._id;
    const existingImages = ingredientData.existingImages ?? [];
    const finalImages = [...existingImages];

    delete ingredientData.existingImages;

    // 1️⃣ Supprimer les images marquées pour suppression
    if (removedExistingImages?.length) {
      removedExistingImages.forEach((imgPath) => {
        const filename = imgPath.replace('/^/?uploads/?/', '');
        this.imageService.deleteImage(filename).subscribe();
      });
    }

    // 2️⃣ Vérifier s’il y a des nouvelles images à uploader
    if (selectedFiles.length > 0) {
      this.imageService.uploadImages(selectedFiles).subscribe({
        next: (uploadResponse) => {
          finalImages.push(...uploadResponse.imagePath); // Ajouter les nouvelles images
        },
        error: (error) => {
          this.showErrorDialog(error.message);
        },
        complete: () => {
          this.submitIngredientForm(ingredientId, {
            ...ingredientData,
            images: finalImages,
          });
        },
      });
    } else {
      this.submitIngredientForm(ingredientId, {
        ...ingredientData,
        images: finalImages,
      });
    }
  }

  // 3️⃣ Soumettre le formulaire (création ou mise à jour)
  submitIngredientForm(ingredientId?: string, ingredientData?: any): void {
    if (ingredientId) {
      this.ingredientService
        .updateIngredient(ingredientId, ingredientData)
        .subscribe({
          error: (error) => {
            this.showErrorDialog(error.message);
          },
        });
    } else {
      this.ingredientService.createIngredient(ingredientData).subscribe({
        next: (res) => {
          this.sharedDataService.resultIngredientCreated(res);
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

      console.log('result', result);

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
    if (!ingredient.images) {
      // ✅ Pas d'images, on passe directement à la suppression
      console.log("✅ Pas d'images, on passe directement à la suppression");
      this.confirmIngredientDeletion(ingredient);
      return;
    }

    this.dialog
      .open(ConfirmDialogComponent, {
        width: '400px',
        data: {
          message: `L'ingrédient <span class="bold-text">"${ingredient.name}"</span> a <span class="bold-text">${ingredient.images.length} image(s) associée(s)</span>.<br> Voulez-vous les télécharger avant suppression ?`,
          confirmButtonText: 'Ignorer',
          cancelButtonText: 'Annuler',
          extraButton: 'Télécharger',
        },
      })
      .afterClosed()
      .subscribe((result) => {
        console.log('result', result);

        if (result) {
          switch (result) {
            case 'cancel':
              return;
            case 'extra':
              this.downloadIngredientImages(ingredient);
              break;
            // case 'confirm':
            //   break;
            default:
              break;
          }
        }
        // Vérifier et supprimer les images existantes marquées pour suppression

        ingredient.images?.forEach((imgPath) => {
          const filename = imgPath.replace('/^/?uploads/?/', '');
          this.imageService.deleteImage(filename).subscribe();
        });
        this.confirmIngredientDeletion(ingredient);
      });
  }

  // >> Télécharger les images avant suppression
  private downloadIngredientImages(ingredient: Ingredient): void {
    if (ingredient.images?.length) {
      ingredient.images.forEach((imageUrl) => {
        console.log('imageUrl', imageUrl);
        this.imageService.downloadImage(imageUrl, ingredient.name);
        // this.sharedDataService.emitDownloadImage(imageUrl, ingredient.name);
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
            'Erreur lors de la suppression de l’ingrédient :<br><span class="bold-text">"${ingredient.name}"</span>.',
          type: 'error',
        },
      });
    }
  }
}
