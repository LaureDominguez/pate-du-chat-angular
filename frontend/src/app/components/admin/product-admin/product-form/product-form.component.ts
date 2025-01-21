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
    this.loadExistingProduct();
    this.subscribeToIngredientCreation();

    console.log('product-form -> data : ', this.data);
  }

  ///// Initialisation du formulaire
  private initForm(): void {
    const product = this.data.product || {};
    this.productForm = this.fb.group({
      name: [product?.name || '', Validators.required],
      category: [product?.category || null, Validators.required],
      description: [product?.description || ''],
      composition: [product?.composition || [], Validators.required],
      price: [product?.price || 0, [Validators.required, Validators.min(0)]],
      stock: [product?.stock || false],
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
    return results;
  }

  private loadExistingProduct(): void {
    if (this.data.product) {
      this.productForm.patchValue({ ...this.data.product });
    }
  }

  private subscribeToIngredientCreation(): void {
    this.sharedDataService.ingredientCreated$.subscribe((ingredient) => {
      this.ingredients.push(ingredient);
      this.filteredIngredients = this.ingredientCtrl.valueChanges.pipe(
        startWith(''),
        map((value) => this.filterIngredients(value, this.ingredients))
      );
      this.ingredientCtrl.setValue('');
    });
  }

  ////////// Gestion des ingrédients
  /// Ajout d'un ingrédient à la composition du produit
  addIngredient(ingredient: Ingredient | 'noResults'): void {
    console.log('product-form -> addIngredient -> start : ', ingredient);

    if (ingredient === 'noResults') {
      console.log(
        'product-form -> addIngredient -> Cannot add "Aucun résultat".'
      );
      this.createIngredient();
      return;
    }

    const compositionControl = this.productForm.get('composition');
    const composition = this.productForm.get('composition')?.value || [];
    if (!composition.some((comp: Ingredient) => comp._id === ingredient._id)) {
      composition.push(ingredient);
      compositionControl?.setValue(composition);
      console.log('composition : ', composition);
    }

    // if (composition.length === 0) {
    //   compositionControl?.markAllAsTouched();
    //   compositionControl?.setErrors({ required: true });
    // } else {
    //   compositionControl?.setErrors(null);
    // }

    this.ingredientCtrl.setValue('');
    console.log('product-form -> addIngredient -> end : ', composition);
  }

  /// Création d'un nouvel ingrédient
  private createIngredient():void {
    console.log('product-form -> addIngredient -> start');
    this.openIngredientForm().then((newIngredient) => {
      const composition = this.getCompposition();
      if (!composition.some((comp: Ingredient) => comp._id === newIngredient._id)) {
        this.setCompposition([...composition, newIngredient]);
        console.log('composition : ', composition);
      }
    }).catch((error) => {
      console.error('product-form -> addIngredient -> error : ', error);
    });
  }

  private openIngredientForm(): Promise<Ingredient> {
    console.log('product-form -> openIngredientForm');
    this.sharedDataService.requestOpenIngredientForm();
    return new Promise((resolve, reject) => {
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

  /// Suppression d'un ingrédient de la composition
  removeIngredient(ingredient: Ingredient): void {
    const composition = this.productForm.get('composition')?.value || [];
    const updatedComposition = composition.filter(
      (comp: Ingredient) => comp._id !== ingredient._id
    );
    this.productForm.get('composition')?.setValue(updatedComposition);
  }

  ////////// Gestion du formulaire
  save(): void {
    if (this.productForm.valid) {
      const productData = { ...this.productForm.value };
      console.log('product-form -> save -> productData : ', productData);
      this.dialogRef.close(productData);
    } else {
      this.productForm.markAllAsTouched();
      this.dialog.open(ErrorDialogComponent, {
        data: {
          message: 'Veuillez remplir tous les champs obligatoires.',
        },
      });
      console.warn('Formulaire non valide : ', this.productForm);
    }
  }

  cancel() {
    this.dialogRef.close();
  }

  ///////// Methodes private
  private getCompposition(): Ingredient[] {
    return this.productForm.get('composition')?.value || [];
  }

  private setCompposition(composition: Ingredient[]): void {
    this.productForm.get('composition')?.setValue(composition);
  }
}
