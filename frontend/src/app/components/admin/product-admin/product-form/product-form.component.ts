import { Component, Inject, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { map, Observable, startWith } from 'rxjs';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialog,
} from '@angular/material/dialog';
import { Ingredient } from '../../../../models/ingredient';
import { AdminModule } from '../../admin.module';
import { SharedDataService } from '../../../../services/shared-data.service';
import { ErrorDialogComponent } from '../../../dialog/error-dialog/error-dialog.component';
import { Category } from '../../../../models/category';

@Component({
  selector: 'app-product-form',
  imports: [AdminModule],
  templateUrl: './product-form.component.html',
  styleUrls: ['./product-form.component.scss'],
})
export class ProductFormComponent implements OnInit {
  productForm!: FormGroup;
  ingredientCtrl = new FormControl();
  categories: Category[] = [];
  ingredients: Ingredient[] = [];
  filteredIngredients!: Observable<Ingredient[]>;
  noResults = false;

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
    this.subscribeToIngredientCreation();

    // console.log('product-form -> categories : ', this.categories);
  }

  ////////// Initialisation du formulaire
  private initForm(): void {
    const product = this.data.product || {};

    console.log(
      'product-form -> initForm -> product : ',
      product.category.name
    );

    this.productForm = this.fb.group({
      name: [product.name || '', Validators.required],
      category: [product.category || null, Validators.required],
      description: [product.description || ''],
      composition: [product.composition || [], Validators.required],
      price: [product.price || null, [Validators.required, Validators.min(0)]],
      stock: [product.stock || false],
    });

    console.log(
      'product-form -> initialized Form -> productForm : ',
      this.productForm
    );
  }


  compareCategories(category1: Category, category2: Category): boolean {
    return category1 && category2
      ? category1._id === category2._id
      : category1 === category2;
  }

  ////////// Gestion de l'autocomplétion
  private setupIngredientAutoComplete(): void {
    const ingredients = this.data.ingredients || [];
    this.filteredIngredients = this.ingredientCtrl.valueChanges.pipe(
      startWith(''),
      map((value) => this.filterIngredients(value, ingredients))
    );
  }

  // Filtrage de la recherche + tri alphabetique
  private filterIngredients(
    value: string,
    ingredients: Ingredient[]
  ): Ingredient[] {
    const filterValue =
      typeof value === 'string' ? value.toLowerCase().trim() : '';

    const results = ingredients
      .filter((ingredient) =>
        ingredient.name.toLowerCase().includes(filterValue)
      )
      .sort((a, b) => a.name.localeCompare(b.name));

    this.noResults = results.length === 0;
    return results;
  }

  private subscribeToIngredientCreation(): void {
    this.sharedDataService.ingredientCreated$.subscribe((ingredient) => {
      this.ingredients.push(ingredient);
      this.refreshFilteredIngredients();
    });
  }

  // Vérifie si un ingrédient fait partie de la composition
  isIngredientSelected(ingredient: Ingredient): boolean {
    return this.composition.some((comp) => comp._id === ingredient._id);
  }

  private refreshFilteredIngredients(): void {
    this.filteredIngredients = this.ingredientCtrl.valueChanges.pipe(
      startWith(''),
      map((value) => this.filterIngredients(value, this.ingredients))
    );
    this.ingredientCtrl.setValue('');
  }

  ////////// Gestion des ingrédients
  get composition(): Ingredient[] {
    return this.productForm.get('composition')?.value || [];
  }

  private setComposition(composition: Ingredient[]): void {
    this.productForm.get('composition')?.setValue(composition);
  }

  // Ajout d'un ingrédient à la composition + gestion des coches
  addIngredient(ingredient: Ingredient | 'noResults'): void {
    if (ingredient === 'noResults') {
      this.createIngredient();
      return;
    }

    const currentComposition = this.composition;
    if (!currentComposition.some((comp) => comp._id === ingredient._id)) {
      this.setComposition([...currentComposition, ingredient]);
    }
    this.ingredientCtrl.setValue('');
  }

  // Suppression d'un ingrédient de la composition
  removeIngredient(ingredient: Ingredient): void {
    const updatedComposition = this.composition.filter(
      (comp) => comp._id !== ingredient._id
    );
    this.setComposition(updatedComposition);
    this.ingredientCtrl.setValue('');
  }

  // Création d'un nouvel ingrédient
  private createIngredient(): void {
    this.openIngredientForm()
      .then((newIngredient) => {
        const currentComposition = this.composition;
        if (
          !currentComposition.some((comp) => comp._id === newIngredient._id)
        ) {
          this.setComposition([...currentComposition, newIngredient]);
        }
      })
      .catch((error) => {
        console.error('Erreur lors de la création de l’ingrédient :', error);
      });
  }

  private openIngredientForm(): Promise<Ingredient> {
    this.sharedDataService.requestOpenIngredientForm();
    return new Promise((resolve, reject) => {
      const subscription = this.sharedDataService.ingredientCreated$.subscribe({
        next: (ingredient) => {
          subscription.unsubscribe();
          resolve(ingredient);
        },
        error: (err) => reject(err),
      });
    });
  }

  ////////// Validation du formulaire
  save(): void {
    if (this.productForm.valid) {
      const productData = { ...this.productForm.value };
      //console.log('product-form -> save -> productData : ', productData);
      this.dialogRef.close(productData);
    } else {
      this.productForm.markAllAsTouched();
      this.dialog.open(ErrorDialogComponent, {
        data: { message: 'Veuillez remplir tous les champs obligatoires.' },
      });
    }
  }

  cancel(): void {
    this.dialogRef.close();
  }
}
