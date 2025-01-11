import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { AdminModule } from '../../admin.module';

export interface Ingredient {
  _id?: string;
  name: string;
  supplier: string;
  allergens: string[];
  vegan: boolean;
  vegeta: boolean;
  images?: string[];
}

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

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<IngredientFormComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: {
      imageUrls: string[];
      ingredient: Ingredient | null;
    }
  ) {
    this.ingredientForm = this.fb.group({
      name: [data.ingredient?.name || '', Validators.required],
      supplier: [data.ingredient?.supplier || '', Validators.required],
      allergens: [data.ingredient?.allergens || []],
      vegan: [data.ingredient?.vegan || false],
      vegeta: [data.ingredient?.vegeta || false],
    });

    // Charger les images existantes si l'ingrédient est fourni
    if (data.ingredient?.images) {
      this.existingImages = [...data.ingredient.images];
      this.existingImageUrls = [...data.imageUrls];
      // console.log('Images existantes :', this.existingImages);
      // console.log('pouet : ', this.existingImageUrls);
    }
  }

  ngOnInit(): void {
    if (this.data.ingredient) {
      this.ingredientForm.patchValue(this.data.ingredient);
    }
  }

  onVeganChange(isVeganChecked: boolean): void {
    if (isVeganChecked) {
      this.ingredientForm.get('vegeta')?.setValue(true);
    }
  }

  onFileSelected(event: any): void {
    const input = event.target as HTMLInputElement;
    const maxFileSize = 10 * 1024 * 1024;

    if (input.files) {
      const validFiles: File[] = [];

      Array.from(input.files).forEach((file) => {
        if (!file.type.startsWith('image/')) {
          alert(`${file.name} n'est pas un fichier image valide.`);
        } else if (file.size > maxFileSize) {
          alert(`${file.name} dépasse la taille maximale autorisée de 10 Mo.`);
        } else {
          validFiles.push(file);

          const reader = new FileReader();
          reader.onload = () => {
            if (reader.result) {
              this.filePreviews.push(reader.result as string);
            }
          };
          reader.readAsDataURL(file);
        }
      });

      if (validFiles.length !== input.files.length) {
        input.value = '';
      }

      this.selectedFiles.push(...validFiles);
    }
  }

  removeFile(index: number): void {
    this.selectedFiles.splice(index, 1);
    this.filePreviews.splice(index, 1);
  }

  removeExistingImage(index: number): void {
    this.existingImageUrls.splice(index, 1);
    const removed = this.existingImages.splice(index, 1)[0];
    this.removedExistingImages.push(removed);
    // console.log('Images supprimées :', this.removedExistingImages);
  }

  save(): void {
    if (this.ingredientForm.valid) {
      if (this.ingredientForm.get('vegan')?.value) {
        this.ingredientForm.get('vegeta')?.setValue(true);
      }
      const ingredientData = {
        _id: this.data.ingredient?._id,
        name: this.ingredientForm.get('name')?.value,
        supplier: this.ingredientForm.get('supplier')?.value,
        allergens: this.ingredientForm.get('allergens')?.value,
        vegan: this.ingredientForm.get('vegan')?.value,
        vegeta: this.ingredientForm.get('vegeta')?.value,
        existingImages: this.existingImages,
      };

      this.dialogRef.close({
        ingredientData,
        selectedFiles: this.selectedFiles,
        removedExistingImages: this.removedExistingImages,
      });
    }
  }

  cancel(): void {
    this.dialogRef.close();
  }
}
