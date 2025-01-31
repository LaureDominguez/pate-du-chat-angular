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
    this.fetchIngredients();
    this.fetchAllergenes();
    this.sharedDataService.openIngredientForm$.subscribe(() => {
      // console.log('ingredient-admin -> onInit -> openIngredientForm');
      this.openIngredientForm(null);
    });
    // console.log('ingredient-admin -> onInit : ', this.allergenesList);
  }

  ngAfterViewInit(): void {
    this.ingredients.paginator = this.ingredientsPaginator;
    this.ingredients.sort = this.ingredientsSort;
  }

  fetchIngredients(): void {
    this.ingredientService.getIngredients().subscribe((ingredients) => {
      this.ingredients.data = ingredients;
    });
    // console.log('ingredient-admin -> fetchIngredients : ', this.ingredients.data);
  }

  fetchAllergenes(): void {
    this.ingredientService.getAllergenes().subscribe((allergenes) => {
      this.allergenesList = allergenes;
    });
    // console.log('ingredient-admin -> fetchAllergenes : ', this.allergenesList);
  }

  // ouvrir le formulaire d'ingrédient
  openIngredientForm(ingredient: Ingredient | null): void {
    // console.log('ingredient-admin -> openIngredientForm : ', ingredient, this.allergenesList);
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
    );
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
        this.imageService.deleteImage(filename).subscribe(() => {
        });
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
          console.error(
            'admin.component -> echec de submitIngredientForm : ',
            error
          );
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
      // console.log('id trouvé');
      this.updateIngredient(ingredientId, ingredientPayload);
    } else {
      // console.log('id non trouvé');
      this.addIngredient(ingredientPayload);
    }
  }

  // création d'un nouvel ingrédient
  addIngredient(ingredientPayload: any): void {
    delete ingredientPayload._id;

    this.ingredientService.createIngredient(ingredientPayload).subscribe({
      next: (res) => {
        // console.log('admin.component -> addIngredient -> res : ', res);
        this.fetchIngredients();
        this.sharedDataService.resultIngredientCreated(res);
      },
      error: (error) => {
        console.error('admin.component -> addIngredient -> error : ', error);
      },
    });
  }

  // mise à jour d'un ingrédient
  updateIngredient(id: string, ingredientPayload: any): void {
    this.ingredientService.updateIngredient(id, ingredientPayload).subscribe({
      next: (res) => {
        this.fetchIngredients();
      },
      error: (error) => {
        console.error('admin.component -> updateIngredient -> error : ', error);
      },
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
            this.fetchIngredients();
          });
      }
    });
  }
}
