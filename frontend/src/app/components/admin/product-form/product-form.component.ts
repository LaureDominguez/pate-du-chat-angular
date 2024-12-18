import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { IngredientService } from '../../../services/ingredient.service';
import { ProductService } from '../../../services/product.service';
import { CommonModule } from '@angular/common';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatInputModule } from '@angular/material/input';
import { MatOptionModule } from '@angular/material/core';
import { MatListModule } from '@angular/material/list';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatAutocompleteModule } from '@angular/material/autocomplete';

@Component({
  selector: 'app-product-form',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatCheckboxModule,
    MatInputModule,
    MatOptionModule,
    MatListModule,
    MatChipsModule,
    MatAutocompleteModule,
    MatIconModule,
    MatFormFieldModule,
  ],
  templateUrl: './product-form.component.html',
  styleUrls: ['./product-form.component.scss'],
})
export class ProductFormComponent implements OnInit {
  productForm: FormGroup;
  categories: string[] = [];
  ingredients: any[] = [];
  filteredIngredients: any[] = [];
  ingredientCtrl = new FormControl();

  constructor(
    private fb: FormBuilder,
    private productService: ProductService,
    private ingredientService: IngredientService,
    private dialogRef: MatDialogRef<ProductFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.productForm = this.fb.group({
      name: [''],
      category: [''],
      description: [''],
      composition: [[]],
      price: [0],
      imageUrl: [''],
      stock: [false],
    });
  }

  ngOnInit(): void {
    this.productForm = this.fb.group({
      name: [this.data.product?.name || '', Validators.required],
      category: [this.data.product?.category || ''],
      description: [this.data.product?.description || ''],
      composition: [this.data.product?.composition || []],
      price: [this.data.product?.price || 0, Validators.required],
      imageUrl: [this.data.product?.imageUrl || ''],
      stock: [this.data.product?.stock || false],
    });

    this.loadCategories();
    this.loadIngredients();

    this.ingredientCtrl.valueChanges.subscribe((value) => {
      this.filteredIngredients = this.filterIngredients(value);
    });
  }

  loadCategories() {
    this.categories = ['Pâtes Fraiches', 'Gnocchis', 'Arandicis', 'Raviolis'];
  }

  loadIngredients() {
    this.ingredientService.getIngredients().subscribe((ingredients) => {
      this.ingredients = ingredients;
      this.filteredIngredients = ingredients;
    });
  }

  filterIngredients(value: string) {
    const filterValue = value.toLowerCase();
    return this.ingredients.filter((ingredient) => {
      ingredient.name.toLowerCase().includes(filterValue);
    });
  }

  addIngredient(event: any) {
    const value = event.value.trim();
    if (value) {
      const ingredient = this.ingredients.find((ing) => ing.name === value);
      if (ingredient) {
        this.selectIngredient({ option: { value: ingredient } });
      } else {
        this.openNewIngredientForm(value);
      }
    }
    event.input.value = '';
  }

  selectIngredient(event: any) {
    const ingredient = event.option.value;
    const compositionControl = this.productForm.get('composition');

    if (compositionControl) {
      const composition = compositionControl.value || [];
      if (!composition.find((ing: any) => ing._id === ingredient._id)) {
        composition.push(ingredient);
        compositionControl.setValue(composition);
      }
    }
  }

  removeIngredient(ingredient: any) {
    const compositionControl = this.productForm.get('composition');

    if (compositionControl) {
      const composition =
        compositionControl.value?.filter(
          (ing: any) => ing._id !== ingredient._id
        ) || [];
      compositionControl.setValue(composition);
    }
  }

  openNewIngredientForm(name: string) {
    console.log("Ajout de l'ingrédient :", name);
  }

  save() {
    if (this.productForm.valid) {
      this.dialogRef.close(this.productForm.value);
    }
  }

  cancel() {
    this.dialogRef.close();
  }
}
