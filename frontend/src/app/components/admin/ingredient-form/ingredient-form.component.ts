import { Component, Inject } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogModule,
} from '@angular/material/dialog';
import { Ingredient } from '../../../services/ingredient.service';
import { CommonModule } from '@angular/common';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatInputModule } from '@angular/material/input';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-ingredient-form',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatInputModule,
    MatCheckboxModule,
    MatGridListModule,
    MatCardModule,
    MatIconModule,
  ],
  templateUrl: './ingredient-form.component.html',
  styleUrls: ['./ingredient-form.component.scss'],
})
export class IngredientFormComponent {
  ingredientForm: FormGroup;
  selectedFiles: File[] = [];
  filePreviews: string[] = [];

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<IngredientFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { ingredient: Ingredient | null }
  ) {
    this.ingredientForm = this.fb.group({
      name: [data.ingredient?.name || '', Validators.required],
      supplier: [data.ingredient?.supplier || '', Validators.required],
      allergens: [data.ingredient?.allergens || []],
      vegan: [data.ingredient?.vegan || false],
      vegeta: [data.ingredient?.vegeta || false],
    });
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

  save(): void {
    console.log(
      'ingredient-form.component -> submited : ',
      this.ingredientForm
    );

    // Vérification que le formulaire est valide
    if (this.ingredientForm.valid) {
      const formData = new FormData();
      console.log(
        'formulaire valide : ', this.ingredientForm.value
      )
      
      // Récupération des valeurs du formulaire et ajout dans formData
      formData.append('name', this.ingredientForm.get('name')?.value);
      formData.append('supplier', this.ingredientForm.get('supplier')?.value);
      formData.append('allergens', this.ingredientForm.get('allergens')?.value);
      formData.append('vegan', this.ingredientForm.get('vegan')?.value);
      formData.append('vegeta', this.ingredientForm.get('vegeta')?.value);

      console.log('FormData Keys:', Array.from((formData as any).keys()));
      console.log('FormData Values:', Array.from((formData as any).values()));


      // Ajouter les fichiers sélectionnés (images)
      if (this.selectedFiles.length > 0) {
        console.log(
          'image detecté : ',
          this.selectedFiles
        );

        this.selectedFiles.forEach((image: File) => {
          formData.append('images', image);
        });
      }

      if (this.data.ingredient?._id) {
        formData.append('id', this.data.ingredient._id);
      }

      // Vérifier le contenu de formData avant de fermer la boîte de dialogue
      console.log('ingredient-form.component -> formData : ', formData);
      console.log(
        'ingredient-form.component -> FormData Keys:',
        Array.from((formData as any).keys())
      );
      console.log(
        'ingredient-form.component -> FormData Values:',
        Array.from((formData as any).values())
      );

      // Fermer la boîte de dialogue et renvoyer le formData à l'appelant
      this.dialogRef.close(formData);
    }
  }

  cancel(): void {
    this.dialogRef.close();
  }
}
