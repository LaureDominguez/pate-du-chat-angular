import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { distinctUntilChanged, map, Observable, startWith } from 'rxjs';

import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

import { Ingredient } from '../../ingredient-admin/ingredient-form/ingredient-form.component';
import { AdminModule } from '../../admin.module';


@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [AdminModule],
  templateUrl: './product-form.component.html',
  styleUrls: ['./product-form.component.scss'],
})
export class ProductFormComponent implements OnInit {
  productForm!: FormGroup;
  ingredientCtrl = new FormControl();

  categories: any[] = [];
  composition: Ingredient[] = [];
  ingredients: Ingredient[] = [];
  filteredIngredients: Observable<Ingredient[]> = new Observable<Ingredient[]>();
  noResults: boolean = false;

  constructor (
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<ProductFormComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: any
  ) {}

  ngOnInit(): void {
    this.categories = this.data.categories || [];
    this.ingredients = this.data.ingredients || [];

    this.initForm();

    if (this.data.product) {
      this.productForm.patchValue({ ...this.data.product });
    }
    
    this.filteredIngredients = this.ingredientCtrl.valueChanges.pipe(
      startWith(''),
      distinctUntilChanged(),
      map((value) => this._filteredIngredients(value))
    );
  }

  initForm(): void {
    this.productForm = this.fb.group({
      name: [this.data.product?.name || '', Validators.required],
      category: [this.data.product?.category || null, Validators.required],
      description: [this.data.product?.description || ''],
      // composition: ['', Validators.required],
      price: [
        this.data.product?.price || 0,
        [Validators.required, Validators.min(0)],
      ],
      stock: [this.data.product?.stock || false],
    });
  }

  private _filteredIngredients(value: string): Ingredient[] {
    if (!value || value.trim() === '') {
      this.noResults = false; // Pas de message si le champ est vide
      return [];
    }
    const filterValue = value.toLowerCase().trim();

    const results = this.ingredients.filter((ingredient) =>
      ingredient.name.toLowerCase().includes(filterValue)
    );
    // console.log('results : ', results);

    this.noResults = results.length === 0;
    // console.log('noResults : ', this.noResults);
    return results;
  }

  addIngredient(ingredient: Ingredient): void {
    if (!this.composition.includes(ingredient)) {
      this.composition.push(ingredient);
    }
    this.ingredientCtrl.setValue('', { emitEvent: false });
  }

  removeIngredient(ingredient: Ingredient): void {
    const index = this.composition.indexOf(ingredient);
    if (index >= 0) {
      this.composition.splice(index, 1);
    }
  }

  openIngredientForm() {
    // Logique pour ouvrir le formulaire ingredient-form
    console.log('Ouverture du formulaire ingredient-form');
  }

  save(): void {
    if (this.productForm.valid) {
      const productData = { ...this.productForm.value };
      this.dialogRef.close(productData);
    }
  }

  cancel() {
    this.dialogRef.close();
  }
}
