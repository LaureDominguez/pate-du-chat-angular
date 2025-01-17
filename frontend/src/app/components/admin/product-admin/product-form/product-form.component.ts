import { Component, Inject, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { map, Observable, startWith } from 'rxjs';

import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';

import { Ingredient } from '../../../../models/ingredient';
import { AdminModule } from '../../admin.module';
import { SharedDataService } from '../../../../services/shared-data.service';
import { IngredientAdminComponent } from '../../ingredient-admin/ingredient-admin.component';

@Component({
  selector: 'app-product-form',
  imports: [AdminModule],
  templateUrl: './product-form.component.html',
  styleUrls: ['./product-form.component.scss'],
})
export class ProductFormComponent implements OnInit {
  productForm!: FormGroup;
  ingredientCtrl = new FormControl();

  categories: any[] = [];
  composition: Ingredient[] = [];
  ingredients: any[] = [];
  filteredIngredients!: Observable<Ingredient[]>;
  noResults: boolean = false;

  constructor(
    private fb: FormBuilder,
    private dialog: MatDialog,
    private dialogRef: MatDialogRef<ProductFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private sharedDataService: SharedDataService
  ) {}

  ngOnInit(): void {
    this.categories = this.data.categories || [];
    this.initForm();
    this.setupIngredientAutoComplete();

    if (this.data.product) {
      this.productForm.patchValue({ ...this.data.product });
    }

    this.sharedDataService.ingredientCreated$.subscribe((ingredient) => {
      this.ingredients.push(ingredient);
      this.filteredIngredients = this.ingredientCtrl.valueChanges.pipe(
        startWith(''),
        map((value) => this.filterIngredients(value, this.ingredients))
      );
    });
  }

  private initForm(): void {
    this.productForm = this.fb.group({
      name: [this.data.product?.name || '', Validators.required],
      category: [this.data.product?.category || null, Validators.required],
      description: [this.data.product?.description || ''],
      composition: [this.data.product?.composition || [], Validators.required],
      price: [
        this.data.product?.price || 0,
        [Validators.required, Validators.min(0)],
      ],
      stock: [this.data.product?.stock || false],
    });
  }

  private setupIngredientAutoComplete(): void {
    const ingredients = this.data.ingredients || [];
    this.filteredIngredients = this.ingredientCtrl.valueChanges.pipe(
      startWith(''),
      map((value) => this.filterIngredients(value, ingredients))
    );
  }

  private filterIngredients(
    value: string,
    ingredients: Ingredient[]
  ): Ingredient[] {
    const filterValue =
      typeof value === 'string' ? value.toLowerCase().trim() : '';

    if (!filterValue) {
      this.noResults = false; // Pas de message si le champ est vide
      return [];
    }

    const results = ingredients.filter((ingredient) =>
      ingredient.name.toLowerCase().includes(filterValue)
    );

    this.noResults = results.length === 0;

    console.log(
      'value : ',
      value,
      'results : ',
      results,
      'noResults : ',
      this.noResults
    );

    return results;
  }

  addIngredient(ingredient: Ingredient | 'noResults'): void {
    console.log('product-form -> addIngredient -> start : ', ingredient);

    if (ingredient === 'noResults') {
      console.log(
        'product-form -> addIngredient -> Cannot add "Aucun résultat".'
      );
      this.createIngredient();
      return;
    }

      // if (!ingredient || typeof ingredient !== 'object') {
      //   console.warn('product-form -> addIngredient -> Invalid value.');
      //   return;
      // }

    const composition = this.productForm.get('composition')?.value || [];
    if (!composition.some((comp: Ingredient) => comp._id === ingredient._id)) {
      composition.push(ingredient);
      this.productForm.get('composition')?.setValue(composition);
      console.log('composition : ', composition);
    }
    this.ingredientCtrl.setValue('');
    console.log('product-form -> addIngredient -> end : ', composition);
  }

  async createIngredient(): Promise<void> {
    console.log('product-form -> addIngredient -> start');

    try {
      const newIngredient = await this.openIngredientForm();

      const composition = this.productForm.get('composition')?.value || [];
      if (
        !composition.some((comp: Ingredient) => comp._id === newIngredient._id)
      ) {
        composition.push(newIngredient);
        this.productForm.get('composition')?.setValue(composition);
        console.log('composition : ', composition);
      }
      this.ingredientCtrl.setValue('');
      console.log('product-form -> addIngredient -> end : ', composition);
    } catch (error) {
      console.error('product-form -> addIngredient -> error : ', error);
    }
  }

  openIngredientForm(): Promise<Ingredient> {
    console.log('product-form -> openIngredientForm');
    return new Promise((resolve, reject) => {
      this.sharedDataService.requestOpenIngredientForm();

      // Écoute l'événement ingredientCreated$ pour récupérer l'ingrédient
      const subscription = this.sharedDataService.ingredientCreated$.subscribe({
        next: (ingredient) => {
          subscription.unsubscribe(); // Arrête l'écoute après réception
          resolve(ingredient);
        },
        error: (err) => reject(err),
      });
    });
  }

  removeIngredient(ingredient: Ingredient): void {
    const composition = this.productForm.get('composition')?.value || [];
    const updatedComposition = composition.filter(
      (comp: Ingredient) => comp._id !== ingredient._id
    );
    this.productForm.get('composition')?.setValue(updatedComposition);
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
