import { Component, Inject } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { AdminModule } from '../../admin.module';
import { ErrorDialogComponent } from '../../../dialog/error-dialog/error-dialog.component';
import { Ingredient } from '../../../../models/ingredient';

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
    // console.log('IngredientFormComponent -> constructor : ', data);
    this.ingredientForm = this.fb.group({
      name: [data.ingredient?.name || data.searchedValue || '', Validators.required],
      supplier: [data.ingredient?.supplier || '', Validators.required],
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
  get vegan() {
    return this.ingredientForm.get('vegan');
  }
  get vegeta() {
    return this.ingredientForm.get('vegeta');
  }

  onVeganChange(isVeganChecked: boolean): void {
    if (isVeganChecked) {
      this.vegeta?.setValue(true);
    }
  }

  onFileSelected(event: any): void {
    const input = event.target as HTMLInputElement;
    const maxFileSize = 10 * 1024 * 1024;

    if (input.files) {
      const validFiles: File[] = [];

      Array.from(input.files).forEach((file) => {
        if (!file.type.startsWith('image/')) {
          alert(`${file.name} n'est pas une image valide.`);
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
  }

  save(): void {
    if (this.vegan?.valid) {
      if (this.vegan?.value) {
        this.vegeta?.setValue(true);
      }

      const allergenesSelectionnes = this.allergens?.value
        .map((checked: boolean, index: number) =>
          checked ? this.data.allergenesList[index] : null
        )
        .filter((allergene: string | null) => allergene !== null);

      const ingredientData = {
        _id: this.data.ingredient?._id,
        name: this.name?.value,
        supplier: this.supplier?.value,
        allergens: allergenesSelectionnes,
        vegan: this.vegan?.value,
        vegeta: this.vegeta?.value,
        existingImages: this.existingImages,
      };

      this.dialogRef.close({
        ingredientData,
        selectedFiles: this.selectedFiles,
        removedExistingImages: this.removedExistingImages,
      });
    } else {
      this.ingredientForm.markAllAsTouched();
      this.dialog.open(ErrorDialogComponent, {
        data: {
          message: 'Veuillez remplir tous les champs obligatoires.',
        },
      });
    }
  }

  cancel(): void {
    this.dialogRef.close();
  }
}
