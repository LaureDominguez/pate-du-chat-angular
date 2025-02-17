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
import { ErrorDialogComponent } from '../../dialog/error-dialog/error-dialog.component';
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

  // traiter l'upload d'images
  handleIngredientFormSubmit(result: {
    ingredientData: any;
    selectedFiles: File[];
    removedExistingImages: string[];
  }): void {
    const { ingredientData, selectedFiles } = result;
    const existingImages = ingredientData.existingImages ?? [];
    const ingredientId = ingredientData._id;

    // Vérifier et supprimer les images existantes marquées pour suppression
    if (result.removedExistingImages?.length) {
      result.removedExistingImages.forEach((imgPath) => {
        const filename = imgPath.replace('/^/?uploads/?/', '');
        this.imageService.deleteImage(filename).subscribe();
      });
    }

    // Fusionner les anciennes et nouvelles images
    const finalImages = [...existingImages];
    delete ingredientData.existingImages;

    if (selectedFiles.length > 0) {
      // 1. Uploader les fichiers
      this.imageService.uploadImages(selectedFiles).subscribe({
        next: (uploadResponse) => {
          const newFilePaths = uploadResponse.imagePath;

          // 2. Concaténer avec les images existantes
          finalImages.push(...newFilePaths); // Ajouter les nouvelles images
          this.submitIngredientForm(ingredientId, ingredientData, finalImages);
        },
        error: (error) => {
          console.error("Erreur lors de l'upload des images :", error);
          this.showErrorDialog(error.message);
        },
      });
    } else {
      this.submitIngredientForm(ingredientId, ingredientData, finalImages);
    }
  }

  // soumettre le formulaire aux methodes création ou mise à jour
  submitIngredientForm(
    ingredientId: string | undefined,
    ingredientData: any,
    finalImages: string[]
  ): void {
    const ingredientPayload = {
      ...ingredientData,
      images: finalImages,
    };

    if (ingredientId) {
      this.updateIngredient(ingredientId, ingredientPayload);
    } else {
      this.addIngredient(ingredientPayload);
    }
  }

  // création d'un nouvel ingrédient
  addIngredient(ingredientPayload: any): void {
    delete ingredientPayload._id;

    this.ingredientService.createIngredient(ingredientPayload).subscribe({
      next: (res) => {
        this.sharedDataService.resultIngredientCreated(res);
      },
      error: (error) => {
        this.showErrorDialog(error.message);
      },
    });
  }

  // mise à jour d'un ingrédient
  updateIngredient(id: string, ingredientPayload: any): void {
    this.ingredientService.updateIngredient(id, ingredientPayload).subscribe({
      next: (res) => {},
      error: (error) => {
        this.showErrorDialog(error.message);
      },
    });
  }

  // // Fonction pour afficher les erreurs dans une fenêtre modale
  private showErrorDialog(message: string): void {
    console.log(message);
    this.dialog.open(ErrorDialogComponent, {
      data: { message },
    });
  }

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

      if (products.length > 0) {
        const dialogRef = this.dialog.open(ConfirmDialogComponent, {
          width: '400px',
          data: {
            message: `L'ingrédient <span class="bold-text">"${ingredient.name}"</span> est utilisé dans <span class="bold-text">${products.length} produit(s)</span>.<br> Voulez-vous quand même le supprimer ?`,
          },
        });

        const result = await firstValueFrom(dialogRef.afterClosed());

        if (result) {
          this.checkIngredientImages(ingredient);
        }
      } else {
        this.checkIngredientImages(ingredient);
      }
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des produits :', error);
      this.dialog.open(ErrorDialogComponent, {
        width: '400px',
        data: {
          message:
            'Erreur lors de la vérification des produits liés à cet ingrédient.',
        },
      });
    }
  }

  // >> Vérifier les images avant suppression
  checkIngredientImages(ingredient: Ingredient): void {
    if (ingredient.images?.length) {
      this.dialog
        .open(ConfirmDialogComponent, {
          width: '400px',
          data: {
            message: `L'ingrédient <span class="bold-text">"${ingredient.name}"</span> a <span class="bold-text">${ingredient.images.length} image(s) associée(s)</span>.<br> Voulez-vous les télécharger avant suppression ?`,
          },
        })
        .afterClosed()
        .subscribe((result) => {
          if (result) {
            this.downloadIngredientImages(ingredient);
            console.log('Images :', ingredient.images);
          }
          // Vérifier et supprimer les images existantes marquées pour suppression
          
            ingredient.images?.forEach((imgPath) => {
              const filename = imgPath.replace('/^/?uploads/?/', '');
              this.imageService.deleteImage(filename).subscribe();
            });
          this.confirmIngredientDeletion(ingredient);
        });
    } else {
      const dialogRef = this.dialog.open(ConfirmDialogComponent, {
        width: '400px',
        data: {
          message: `Êtes-vous sûr de vouloir supprimer cet ingrédient : <br> <span class="bold-text">"${ingredient.name}"</span> ?`,
        },
      });
      dialogRef.afterClosed().subscribe((result) => {
        if (result) {
          this.confirmIngredientDeletion(ingredient);
        }
      });
    }
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
  private async confirmIngredientDeletion(ingredient: Ingredient): Promise<void> {
    try {
      await firstValueFrom(this.ingredientService.deleteIngredient(ingredient._id!));
      this.dialog.open(ConfirmDialogComponent, {
        width: '400px',
        data: {
          message: `L'ingrédient <span class="bold-text">"${ingredient.name}"</span> a bien été supprimé.`,
        },
      });
    } catch (error) {
      this.dialog.open(ErrorDialogComponent, {
        width: '400px',
        data: {
          message:
            'Erreur lors de la suppression de l’ingrédient :<br><span class="bold-text">"${ingredient.name}"</span>.',
        },
      });
    }
  }
}
