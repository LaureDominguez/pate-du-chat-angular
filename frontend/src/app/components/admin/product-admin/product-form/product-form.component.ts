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
import { title } from 'process';
import { QuickCreateDialogComponent } from '../../../dialog/quick-create-dialog/quick-create-dialog.component';

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
  creatingCategory: boolean = false;
  searchedCategory: string = '';
  categoryNotFound: boolean = false;

  //Ingredients
  ingredients: Ingredient[] = [];
  ingredientCtrl = new FormControl();
  filteredIngredients!: Observable<Ingredient[]>;
  searchedIngredient: string = '';
  ingredientNotFound: boolean = false;

  //Images
  selectedFiles: File[] = [];
  filePreviews: string[] = [];
  existingImages: string[] = [];
  existingImageUrls: string[] = [];
  removedExistingImages: string[] = [];

  constructor(
    private fb: FormBuilder,
    private sharedDataService: SharedDataService,
    private dialog: MatDialog,
    private dialogRef: MatDialogRef<ProductFormComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: {
      imageUrls: string[];
      product: Product | null;
      categories: Category[];
      ingredients: Ingredient[];
    },
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
          Validators.pattern(/^[a-zA-Z0-9À-ÿŒœ\s-']+$/),
        ],
      ],
      category: [data.product?.category || ''],
      description: [
        data.product?.description || '',
        [
          Validators.maxLength(500),
          Validators.pattern(/^[a-zA-Z0-9À-ÿŒœ\s.,!?()'"-]+$/),
        ],
      ],
      composition: [
        data.product?.composition || [],
        [Validators.required, Validators.minLength(1)],
      ],
      dlc: [
        data.product?.dlc || '',
        [
          Validators.required,
          Validators.maxLength(50),
          Validators.pattern(/^[a-zA-Z0-9À-ÿŒœ\s.,!?()'"-]+$/),
        ],
      ],
      cookInstructions: [
        data.product?.cookInstructions || '',
        [
          Validators.required,
          Validators.maxLength(500),
          Validators.pattern(/^[a-zA-Z0-9À-ÿŒœ\s.,!?()'"-]+$/),
        ],
      ],
      stock: [data.product?.stock || false],
      stockQuantity: [
        data.product?.stockQuantity || 0,
        [Validators.required, Validators.min(0)],
      ],
      quantityType: [
        data.product?.quantityType || '',
        [
          Validators.required,
          Validators.pattern(/^(piece|kg)$/)
        ],
      ],
      price: [
        data.product?.price ?? 0,
        [
          Validators.required,
          Validators.min(0),
          Validators.pattern(/^\d+(\.\d{1,2})?$/),
        ],
      ],
      images: [data.product?.images || []],
    });

    if (data.product?.images) {
      this.existingImages = [...data.product.images];
      this.existingImageUrls = [...data.imageUrls];
    }

    console.log('📋 Formulaire initialisé :', this.productForm.value); // LOG ICI 🔍

    this.categoryCtrl.setValue(this.productForm.value.category?.name || '');
    console.log('📋 Catégorie :', this.categoryCtrl.value); // LOG ICI 🔍
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

  get dlc() {
    return this.productForm.get('dlc');
  }

  get cookInstructions() {
    return this.productForm.get('cookInstructions');
  }

  get stock() {
    return this.productForm.get('stock');
  }

  get stockQuantity() {
    return this.productForm.get('stockQuantity');
  }

  get quantityType() {
    return this.productForm.get('quantityType');
  }

  get price() {
    return this.productForm.get('price');
  }

  /////////////////////////////////////////////////////////////////////////////////
  ////////////////// Innit du formulaire

  ///////// AutoComplete ///////////
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

  //// Tri et filtrage avec tolérance aux accents
  private filterItems(value: string, list: any[]): any[] {
    if (!value) return list;

    // Normaliser la valeur recherchée
    const normalizedValue = this.normalizeString(value);

    return list
      .filter((item) =>
        this.normalizeString(item.name).includes(normalizedValue)
      )
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  //// Fonction de normalisation des accents et ligatures
  private normalizeString(str: string): string {
    if (typeof str !== 'string') return ''; // Vérifie que c'est bien une string, sinon retourne une chaîne vide

    return str
      .normalize('NFD') // Décompose les caractères accentués (ex: Œ → O + E, É → E + ´)
      .replace(/[\u0300-\u036f]/g, '') // Supprime les accents
      .toLowerCase() // Convertit en minuscules
      .trim(); // Supprime les espaces inutiles
  }

  //// Ecoute de shared-data
  private subscribeToDataUpdates(): void {
    this.sharedDataService.categoryCreated$.subscribe((newCategory) =>
      this.updateList(newCategory, this.categories, 'category')
    );
    this.sharedDataService.ingredientCreated$.subscribe((newIngredient) =>
      this.updateList(newIngredient, this.ingredients, 'ingredient')
    );
      console.log(
        'product-form -> subscribeToDataUpdates -> ingredients :',
        this.ingredients
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
      console.log('📋 this.searchedCategory :', this.searchedCategory);
      this.createCategory(this.searchedCategory);
    } else {
      this.productForm.patchValue({ category: category });
      this.categoryCtrl.setValue(category ? category.name : 'Sans catégorie');
    }
    console.log('📋 CatégorieCtrl :', this.categoryCtrl.value); // LOG ICI 🔍
  }

  private createCategory(searchedValue: string): void {
    const dialogRef = this.dialog.open(QuickCreateDialogComponent, {
      data: {
        title: 'Créer une nouvelle catégorie',
        fields: [
          { 
            name: 'name', 
            label: 'Nom de la catégorie', 
            required: true,
            maxLength: 50,
            pattern: /^[a-zA-Z0-9À-ÿŒœ\s-']+$/,
            defaultValue: this.formatNameInput(searchedValue) 
          },
          { 
            name: 'description', 
            label: 'Description de la catégorie', 
            maxLength: 100,
            pattern: /^[a-zA-Z0-9À-ÿŒœ\s.,!?()'"-]+$/
          },
        ]
      }
    });

    dialogRef.afterClosed().subscribe((result) => {
      console.log('product-form -> createCategory -> avant if -> result :', result);
      if (result) {
        console.log('📦 product-form -> apres if -> demande de création de catégorie via QuickCreateDialog :', result);
        this.sharedDataService.requestCategoryCreation(result);
      }
    })
    // const filteredValue = this.formatNameInput(searchedValue);
    // console.log('product-form -> createCategory -> filteredValue :', filteredValue);
    // this.sharedDataService.requestCategoryCreation(filteredValue);
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
    // console.log('📋 Composition :', this.composition); // LOG ICI 🔍
  }

  // Vérifie si un ingrédient fait partie de la composition
  isIngredientSelected(ingredient: Ingredient): boolean {
    return this.composition.some((comp) => comp._id === ingredient._id);
  }

  // Ajout d'un ingrédient à la composition + gestion des coches
  addIngredient(ingredient: Ingredient | 'ingredientNotFound'): void {
    // console.log ('product-form -> addIngredient -> ingredient :', ingredient);
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
    const filteredValue = this.formatNameInput(searchedValue);
    // console.log('product-form -> createIngredient -> searchedValue :', searchedValue);
    // console.log('product-form -> createIngredient -> filteredValue :', filteredValue);
    this.openIngredientForm(filteredValue)
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
    console.log('product-form -> openIngredientForm -> searchedValue :', searchedValue);
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
    let errorMsg: string[] = [];

    if (input.files) {
      const validFiles = Array.from(input.files).filter((file) => {
        if (!file.type.startsWith('image/')) {
          errorMsg.push(`${file.name} n'est pas une image valide.`);
          return false;
        }
        if (file.size > maxFileSize) {
          errorMsg.push(`${file.name} dépasse la taille maximale autorisée de 10 Mo.`);
          return false;
        }
        return true;
      });

      if (errorMsg.length > 0) {
        this.dialog.open(InfoDialogComponent, {
          data: { message: errorMsg.join('<br>'), type: 'error' },
        })
      }

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
      name: this.formatNameInput(this.productForm.value.name),
      existingImages: [...this.existingImages],
    };

    console.log('📤 Données envoyées :', productData); // LOG ICI 🔍
    this.dialogRef.close({
      productData,
      selectedFiles: this.selectedFiles,
      removedExistingImages: this.removedExistingImages,
    });
  }

  formatNameInput(name: string): string {
    if (!name) return "";
    let trimmedName = name.replace(/\s+/g, ' ').trim();
    return trimmedName.trim().charAt(0).toUpperCase() + trimmedName.trim().slice(1);
  }

  private fieldLabels: { [key: string]: string } = {
    name: 'Nom',
    category: 'Catégorie',
    description: 'Description',
    composition: 'Composition',
    dlc: 'DLC',
    cookInstructions: 'Instructions de cuisson',
    stock: 'Stock',
    stockQuantity: 'Quantité en stock',
    quantityType: 'Type de quantité',
    price: 'Prix',
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
