import { Component, EventEmitter, Inject, Output } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialog,
} from '@angular/material/dialog';
import { AdminModule } from '../../admin.module';
import { InfoDialogComponent } from '../../../dialog/info-dialog/info-dialog.component';
import { Ingredient } from '../../../../models/ingredient';
import { SharedDataService } from '../../../../services/shared-data.service';

@Component({
  selector: 'app-ingredient-form',
  standalone: true,
  imports: [AdminModule],
  templateUrl: './ingredient-form.component.html',
  styleUrls: ['./ingredient-form.component.scss'],
})
export class IngredientFormComponent {
  ingredientForm: FormGroup;
  selectedFiles: File[] = [];
  filePreviews: string[] = [];
  existingImages: string[] = [];
  existingImageUrls: string[] = [];
  removedExistingImages: string[] = [];

  @Output() downloadImageEvent = new EventEmitter<string>();

  constructor(
    private fb: FormBuilder,
    private sharedDataService: SharedDataService,
    private dialog: MatDialog,
    public dialogRef: MatDialogRef<IngredientFormComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: {
      imageUrls: string[];
      ingredient: Ingredient | null;
      allergenesList: string[];
      searchedValue: string;
    }
  ) {
    this.ingredientForm = this.fb.group({
      name: [
        data.ingredient?.name || data.searchedValue || '',
        [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(50),
          Validators.pattern(/^[a-zA-Z0-9À-ÿ\s-]+$/),
        ],
      ],
      supplier: [
        data.ingredient?.supplier || '',
        [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(50),
          Validators.pattern(/^[a-zA-Z0-9À-ÿ\s-]+$/),
        ],
      ],
      allergens: this.fb.array(
        data.allergenesList.map((allergen) =>
          this.fb.control(
            data.ingredient?.allergens.includes(allergen) || false
          )
        )
      ),
      vegan: [data.ingredient?.vegan || false],
      vegeta: [data.ingredient?.vegeta || false],
    });

    // Charger les images existantes si l'ingrédient est fourni
    if (data.ingredient?.images) {
      this.existingImages = [...data.ingredient.images];
      this.existingImageUrls = [...data.imageUrls];
    }
  }

  get allergens(): FormArray {
    return this.ingredientForm.get('allergens') as FormArray;
  }

  get name() {
    return this.ingredientForm.get('name');
  }

  get supplier() {
    return this.ingredientForm.get('supplier');
  }

  onVeganChange(isVeganChecked: boolean): void {
    if (isVeganChecked) {
      this.ingredientForm.get('vegeta')?.setValue(true);
    }
  }

  /////////////////////////////////////////////////////////////////////////////////
  ///////////////////////// Gestion des images
  onFileSelected(event: any): void {
    const input = event.target as HTMLInputElement;
    const maxFileSize = 10 * 1024 * 1024;

    if (input.files) {
      const validFiles = Array.from(input.files).filter((file) => {
        if (!file.type.startsWith('image/')) {
          alert(`${file.name} n'est pas une image valide.`);
          return false;
        } else if (file.size > maxFileSize) {
          alert(`${file.name} dépasse la taille maximale autorisée de 10 Mo.`);
          return false;
        }
        return true;
      });
      validFiles.forEach((file) => {
        this.handleImagePreview(file);
        if (validFiles.length > 0) {
          input.value = '';
          this.selectedFiles.push(...validFiles);
        }
      });
    }
  }
  // Gérer la preview
  private handleImagePreview(file: File): void {
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result) {
        this.filePreviews.push(reader.result as string);
      }
    };
    reader.readAsDataURL(file);
  }

  downloadImage(imagePath: string): void {
    console.log('📢 Événement envoyé pour télécharger :', imagePath);
    const ingredientName = this.data.ingredient?.name || 'Ingredient';
    this.sharedDataService.emitDownloadImage(imagePath, ingredientName);
  }

  removeFile(index: number): void {
    this.selectedFiles.splice(index, 1);
    this.filePreviews.splice(index, 1);
  }

  removeExistingImage(index: number): void {
    this.existingImageUrls.splice(index, 1);
    const removed = this.existingImages.splice(index, 1)[0];
    this.removedExistingImages.push(removed);
  }

  save(): void {
    let formErrors: string[] = [];

    Object.keys(this.ingredientForm.controls).forEach((field) => {
      const errorMsg = this.getErrorMessage(field);
      if (errorMsg) {
        formErrors.push(errorMsg);
      }
    });

    if (formErrors.length > 0) {
      this.dialog.open(InfoDialogComponent, {
        data: {
          message: formErrors.join('<br>'),
          type: 'error',
        },
      });
      return;
    }

    // si vegan, alors vegetarian aussi
    if (this.ingredientForm.get('vegan')?.value) {
      this.ingredientForm.get('vegeta')?.setValue(true);
    }

    // si pas d'allergene, alors allergens = false
    const allergenesSelectionnes = this.allergens.value
      .map((checked: boolean, index: number) =>
        checked ? this.data.allergenesList[index] : null
      )
      .filter((allergene: string | null) => allergene !== null);

    // update des donnéess à envoyer après close
    const ingredientData = {
      _id: this.data.ingredient?._id,
      ...this.ingredientForm.value,
      allergens: allergenesSelectionnes,
      existingImages: this.existingImages,
    };

    // envoi des données et fermuture du dialog
    this.dialogRef.close({
      ingredientData,
      selectedFiles: this.selectedFiles,
      removedExistingImages: this.removedExistingImages,
    });
  }

  private getErrorMessage(controlName: string): string | null {
    const control = this.ingredientForm.get(controlName);
    if (!control || control.valid || !control.errors) return null;

    if (control.hasError('required'))
      return `Le champ ${controlName} est obligatoire.`;
    if (control.hasError('minlength'))
      return `Le champ ${controlName} doit contenir au moins ${control.errors['minlength'].requiredLength} caractères.`;
    if (control.hasError('maxlength'))
      return `Le champ ${controlName} ne peut pas dépasser ${control.errors['maxlength'].requiredLength} caractères.`;
    if (control.hasError('pattern'))
      return `Le champ ${controlName} contient des caractères non autorisés.`;
    if (control.hasError('min'))
      return `Le champ ${controlName} doit être un nombre positif.`;

    return null;
  }

  cancel(): void {
    this.dialogRef.close();
  }
}
