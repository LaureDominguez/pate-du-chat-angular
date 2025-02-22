import { Component, Inject, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { map, Observable, startWith, take } from 'rxjs';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialog,
} from '@angular/material/dialog';
import { AdminModule } from '../../admin.module';
import { SharedDataService } from '../../../../services/shared-data.service';
import { InfoDialogComponent } from '../../../dialog/info-dialog/info-dialog.component';
import { Category } from '../../../../models/category';
import { Ingredient } from '../../../../models/ingredient';
import { Product } from '../../../../models/product';

@Component({
  selector: 'app-product-form',
  imports: [AdminModule],
  templateUrl: './product-form.component.html',
  styleUrls: ['./product-form.component.scss'],
})
export class ProductFormComponent implements OnInit {
  productForm: FormGroup;

  //Categories
  categories: Category[] = [];
  categoryCtrl = new FormControl();
  filteredCategories!: Observable<Category[]>;
  creatingCategory = false;
  searchedCategory: string = '';
  categoryNotFound = false;

  //Ingredients
  ingredients: Ingredient[] = [];
  ingredientCtrl = new FormControl();
  filteredIngredients!: Observable<Ingredient[]>;
  searchedIngredient: string = '';
  ingredientNotFound = false;

  //Images
  selectedFiles: File[] = [];
  filePreviews: string[] = [];
  existingImages: string[] = [];
  existingImageUrls: string[] = [];
  removedExistingImages: string[] = [];

  constructor(
    private fb: FormBuilder,
    private dialog: MatDialog,
    private dialogRef: MatDialogRef<ProductFormComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: {
      imageUrls: string[];
      product: Product | null;
      categories: Category[];
      ingredients: Ingredient[];
    },
    private sharedDataService: SharedDataService
  ) {
    this.categories = data.categories || [];
    this.ingredients = data.ingredients || [];

    this.productForm = this.fb.group({
      _id: [data.product?._id || ''],
      name: [
        data.product?.name || '',
        [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(50),
          Validators.pattern(/^[a-zA-Z0-9À-ÿ\s-]+$/),
        ],
      ],
      category: [data.product?.category || ''],
      description: [
        data.product?.description || '',
        [
          Validators.maxLength(500),
          Validators.pattern(/^[a-zA-Z0-9À-ÿ\s.,!?()'"-]+$/),
        ],
      ],
      composition: [
        data.product?.composition || [],
        [Validators.required, Validators.minLength(1)],
      ],
      price: [
        data.product?.price || null,
        [
          Validators.required,
          Validators.min(0),
          Validators.pattern(/^\d+(\.\d{1,2})?$/),
        ],
      ],
      stock: [data.product?.stock || false],
      images: [data.product?.images || []],
    });

    if (data.product?.images) {
      this.existingImages = [...data.product.images];
      this.existingImageUrls = [...data.imageUrls];

      console.log('📋 Images existantes :', this.existingImages); // LOG ICI 🔍
      console.log('📋 URLs des images existantes :', this.existingImageUrls); // LOG ICI 🔍
      console.log('data : ', data); // LOG ICI 🔍
    }

    console.log('📋 Formulaire initialisé :', this.productForm.value); // LOG ICI 🔍

    this.categoryCtrl.setValue(this.productForm.value.category?.name || '');
    // console.log('📋 Catégorie :', this.categoryCtrl.value); // LOG ICI 🔍
  }

  ngOnInit(): void {
    this.setupAutoComplete();
    this.subscribeToDataUpdates();
  }

  get name() {
    return this.productForm.get('name');
  }

  get category() {
    return this.productForm.get('category');
  }

  get description() {
    return this.productForm.get('description');
  }

  get composition(): Ingredient[] {
    return this.productForm.get('composition')?.value || [];
  }

  get price() {
    return this.productForm.get('price');
  }

  /////////////////////////////////////////////////////////////////////////////////
  ////////////////// Innit du formulaire

  //// AutoComplete
  private setupAutoComplete(): void {
    // Categories
    this.filteredCategories = this.categoryCtrl.valueChanges.pipe(
      startWith(''),
      map((value) => {
        if (typeof value === 'string' && value !== 'categoryNotFound') {
          this.searchedCategory = value.trim();
          this.categoryNotFound =
            this.filterItems(value, this.categories).length === 0;
        }
        return this.filterItems(value, this.categories);
      })
    );

    // Ingredients
    this.filteredIngredients = this.ingredientCtrl.valueChanges.pipe(
      startWith(''),
      map((value) => {
        if (typeof value === 'string' && value !== 'ingredientNotFound') {
          this.searchedIngredient = value.trim();
          this.ingredientNotFound =
            this.filterItems(value, this.ingredients).length === 0;
        }
        return this.filterItems(value, this.ingredients);
      })
    );
  }

  //// Tri alphabetique des données recherchées
  private filterItems(value: string, list: any[]): any[] {
    const filterValue = (typeof value === 'string' ? value : '')
      .toLowerCase()
      .trim();
    return list
      .filter((item) => item.name.toLowerCase().includes(filterValue))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  //// Ecoute de shared-data
  private subscribeToDataUpdates(): void {
    this.sharedDataService.categoryCreated$.subscribe((newCategory) =>
      this.updateList(newCategory, this.categories, 'category')
    );
    this.sharedDataService.ingredientCreated$.subscribe((newIngredient) =>
      this.updateList(newIngredient, this.ingredients, 'ingredient')
    );
  }

  private updateList(
    newItem: any,
    list: any[],
    type: 'category' | 'ingredient'
  ): void {
    if (!list.some((item) => item._id === newItem._id)) {
      list.push(newItem);
      list.sort((a, b) => a.name.localeCompare(b.name));
    }
    this.productForm.patchValue({ [type]: newItem });
    if (type === 'category') {
      this.categoryCtrl.setValue(newItem.name);
    }
  }

  /////////////////////////////////////////////////////////////////////////////////
  ///////////Gestion des categories
  addCategory(category: Category | 'categoryNotFound' | null): void {
    console.log('📋 category :', category);
    if (category === 'categoryNotFound') {
      this.createCategory(this.searchedCategory);
    } else {
      this.productForm.patchValue({ category: category });
      this.categoryCtrl.setValue(category ? category.name : 'Sans catégorie');
    }
    console.log('📋 CatégorieCtrl :', this.categoryCtrl.value); // LOG ICI 🔍
  }

  private createCategory(searchedValue: string): void {
    this.sharedDataService.requestCategoryCreation(searchedValue);
  }

  /////////////////////////////////////////////////////////////////////////////////
  ////////// Gestion des ingrédients
  private updateComposition(ingredient: Ingredient, add: boolean): void {
    const currentComposition = this.composition;
    this.setComposition(
      add
        ? [...currentComposition, ingredient]
        : currentComposition.filter((comp) => comp._id !== ingredient._id)
    );

    this.ingredientCtrl.setValue('');
  }

  private setComposition(composition: Ingredient[]): void {
    this.productForm.get('composition')?.setValue(composition);
    console.log('📋 Composition :', this.composition); // LOG ICI 🔍
  }

  // Vérifie si un ingrédient fait partie de la composition
  isIngredientSelected(ingredient: Ingredient): boolean {
    return this.composition.some((comp) => comp._id === ingredient._id);
  }

  // Ajout d'un ingrédient à la composition + gestion des coches
  addIngredient(ingredient: Ingredient | 'ingredientNotFound'): void {
    if (ingredient === 'ingredientNotFound') {
      this.createIngredient(this.searchedIngredient);
      this.ingredientCtrl.setValue('');
      return;
    }
    if (!this.composition.some((comp) => comp._id === ingredient._id)) {
      this.updateComposition(ingredient, true);
    }
  }

  // Création d'un nouvel ingrédient
  private createIngredient(searchedValue: string): void {
    this.openIngredientForm(searchedValue)
      .then((newIngredient) => {
        if (!this.composition.some((comp) => comp._id === newIngredient._id)) {
          this.updateComposition(newIngredient, true);
        }
      })
      .catch((error) => {
        console.error('Erreur lors de la création de l’ingrédient :', error);
      });
  }

  private openIngredientForm(searchedValue: string): Promise<Ingredient> {
    this.sharedDataService.requestOpenIngredientForm(searchedValue);

    return new Promise((resolve, reject) => {
      this.sharedDataService.ingredientCreated$.pipe(take(1)).subscribe({
        next: (ingredient) => resolve(ingredient),
        error: (err) => reject(err),
      });
    });
  }

  // Suppression d'un ingrédient de la composition
  removeIngredient(ingredient: Ingredient): void {
    this.updateComposition(ingredient, false);
  }

  getIngredientTooltip(ingredient: Ingredient): string {
    return `Allergènes : ${ingredient.allergens?.join(', ') || 'Aucun'}\n
    Végétarien : ${ingredient.vegeta ? 'Oui' : 'Non'}\n
    Vegan : ${ingredient.vegan ? 'Oui' : 'Non'}`;
  }

  /////////////////////////////////////////////////////////////////////////////////
  ///////////////////////// Gestion des images
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const maxFileSize = 10 * 1024 * 1024;

    if (input.files) {
      const validFiles = Array.from(input.files).filter((file) => {
        if (!file.type.startsWith('image/')) {
          alert(`${file.name} n'est pas une image valide.`);
          return false;
        }
        if (file.size > maxFileSize) {
          alert(`${file.name} dépasse la taille maximale autorisée de 10 Mo.`);
          return false;
        }
        return true;
      });

      validFiles.forEach((file) => this.handleImagePreview(file));

      if (validFiles.length > 0) {
        input.value = '';
        this.selectedFiles.push(...validFiles);
      }
    }
  }

  // Gérer la preview
  private handleImagePreview(file: File): void {
    console.log('📋 Fichier sélectionné :', file); // LOG ICI 🔍
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result) {
        this.filePreviews.push(reader.result as string);
      }
    };
    reader.readAsDataURL(file);
  }

  downloadImage(imageUrl: string): void {
    console.log('📢 Événement envoyé pour télécharger :', imageUrl);
    const productName = this.data.product?.name || 'Produit';
    this.sharedDataService.emitDownloadImage(imageUrl, productName);
  }

  // Retirer une image de la prévieuw
  removeFile(index: number): void {
    this.selectedFiles.splice(index, 1);
    this.filePreviews.splice(index, 1);
  }

  // Retirer une image existante
  removeExistingImage(index: number): void {
    this.existingImageUrls.splice(index, 1);
    const removed = this.existingImages.splice(index, 1)[0];
    this.removedExistingImages.push(removed);
  }

  /////////////////////////////////////////////////////////////////////////////////
  ////////////////// Validation du formulaire
  save(): void {
    console.log('📋 Formulaire soumis :', this.productForm.value); // LOG ICI 🔍
    let formErrors: string[] = [];

    Object.keys(this.productForm.controls).forEach((field) => {
      const errorMsg = this.getErrorMessage(field);
      if (errorMsg) {
        formErrors.push(errorMsg);
      }
    });

    if (this.composition.length === 0) {
      formErrors.push('Ajoutez au moins un ingrédient.');
    }

    if (formErrors.length > 0) {
      this.dialog.open(InfoDialogComponent, {
        data: { message: formErrors.join('<br>'), type: 'error' },
      });
      return;
    }

    const productData = {
      ...this.productForm.value,
      existingImages: [...this.existingImages],
    };

    console.log('📤 Données envoyées :', productData); // LOG ICI 🔍
    this.dialogRef.close({
      productData,
      selectedFiles: this.selectedFiles,
      removedExistingImages: this.removedExistingImages,
    });
  }

  private fieldLabels: { [key: string]: string } = {
    name: 'Nom',
    category: 'Catégorie',
    description: 'Description',
    composition: 'Composition',
    price: 'Prix',
    stock: 'Stock',
  };

  private getErrorMessage(controlName: string): string | null {
    const control = this.productForm.get(controlName);
    if (!control || control.valid || !control.errors) return null;

  const label = this.fieldLabels[controlName] || controlName;

  if (control.hasError('required'))
    return `Le champ "${label}" est obligatoire.`;
  if (control.hasError('minlength'))
    return `Le champ "${label}" doit contenir au moins ${control.errors['minlength'].requiredLength} caractères.`;
  if (control.hasError('maxlength'))
    return `Le champ "${label}" ne peut pas dépasser ${control.errors['maxlength'].requiredLength} caractères.`;
  if (control.hasError('pattern'))
    return `Le champ "${label}" contient des caractères non autorisés.`;
  if (control.hasError('min'))
    return `Le champ "${label}" doit être un nombre positif.`;

    return null;
  }

  cancel(): void {
    this.dialogRef.close();
  }
}
