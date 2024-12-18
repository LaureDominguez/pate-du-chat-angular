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

@Component({
  selector: 'app-ingredient-form',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatInputModule,
    MatCheckboxModule,
  ],
  templateUrl: './ingredient-form.component.html',
  styleUrls: ['./ingredient-form.component.scss'],
})
export class IngredientFormComponent {
  ingredientForm: FormGroup;

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
      imageUrl: [data.ingredient?.imageUrl || ''],
    });
  }

  save(): void {
    if (this.ingredientForm.valid) {
      this.dialogRef.close(this.ingredientForm.value);
    }
  }

  cancel(): void {
    this.dialogRef.close();
  }
}
