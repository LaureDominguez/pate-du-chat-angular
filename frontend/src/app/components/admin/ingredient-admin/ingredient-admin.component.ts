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
import { Subscription } from 'rxjs';
import { ErrorDialogComponent } from '../../dialog/error-dialog/error-dialog.component';

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
      console.error(
        'Erreur lors du chargement des ingrédients :',
        error
      );
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
  // private showErrorDialog(messages: string[]): void {
  //   this.dialog.open(ErrorDialogComponent, {
  //     data: { message: messages.join('<br>') },
  //   });
  // }
  private showErrorDialog(message: string): void {
    console.log(message);
    this.dialog.open(ErrorDialogComponent, {
      data: { message },
    });
  }

  // suppression d'un ingrédient
  deleteIngredient(ingredient: Ingredient): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        message: `Êtes-vous sûr de vouloir supprimer cet ingrédient : <br> <span class="bold-text">"${ingredient.name}"</span> ?`,
      },
    });

    // ajouter une alerte sur la relation avec les img liées
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        if (ingredient.images?.length) {
          for (const image of ingredient.images) {
            this.imageService.deleteImage(image).subscribe();
          }
        }

        // ajouter une alerte sur la relation avec les produits liés
        this.ingredientService
          .deleteIngredient(ingredient._id!)
          .subscribe(() => {
            // this.fetchIngredients();
          });
      }
    });
  }
}
