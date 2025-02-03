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
import { AdminModule } from '../../admin.module';
import { SharedDataService } from '../../../../services/shared-data.service';
import { ErrorDialogComponent } from '../../../dialog/error-dialog/error-dialog.component';
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
    this.productForm = this.fb.group({
      _id: [data.product?._id || ''],
      name: [data.product?.name || '', Validators.required],
      category: [null, Validators.required],
      description: [data.product?.description || ''],
      composition: [data.product?.composition || [], Validators.required],
      price: [
        data.product?.price || null,
        [Validators.required, Validators.min(0)],
      ],
      stock: [data.product?.stock || false],
      images: [data.product?.images || []],
    });

    if (data.product?.images) {
      this.existingImages = [...data.product.images];
      this.existingImageUrls = [...data.imageUrls];
    }
  }
  ngOnInit(): void {
    this.setupIngredientAutoComplete();
    this.subscribeToIngredientCreation();

    this.setupCategoryAutoComplete();
    this.subscribeToCategoryCreation();
    this.categories = this.data.categories || [];

    // Vérification et correction de product.category
    const productCategory = this.data.product?.category;

    let categoryObj: Category | null = null;

    if (typeof productCategory === 'string') {
      // Si productCategory est un ID (string), on cherche l'objet complet
      categoryObj =
        this.categories.find((cat) => cat._id === productCategory) || null;
    } else if (
      productCategory &&
      typeof productCategory === 'object' &&
      '_id' in productCategory
    ) {
      // Si productCategory est déjà un objet, on vérifie s’il est dans la liste
      categoryObj =
        this.categories.find((cat) => cat._id === productCategory._id) ||
        productCategory;
    }

    if (categoryObj) {
      this.productForm.patchValue({ category: categoryObj });
      this.categoryCtrl.setValue(categoryObj?.name || '');
    } else {
      console.warn('⚠️ Catégorie non trouvée dans la liste :', productCategory);
    }

    console.log('Liste des catégories disponibles :', this.categories);
    console.log('Produit à modifier :', this.data.product);
    console.log('Catégorie trouvée pour le produit :', categoryObj);

  }


  ///////////Gestion des categories
  private setupCategoryAutoComplete(): void {
    this.filteredCategories = this.categoryCtrl.valueChanges.pipe(
      startWith(''),
      map((value) => {
        if (typeof value === 'string' && value !== 'categoryNotFound')
          this.searchedCategory = value.trim();
        return this.filterCategories(value);
      })
    );
  }

  private filterCategories(value: string): Category[] {
    const filterValue = (typeof value === 'string' ? value: '').toLowerCase().trim();

    const results = this.categories
      .filter((category) => category.name.toLowerCase().includes(filterValue))
      .sort((a, b) => a.name.localeCompare(b.name));

    this.categoryNotFound = results.length === 0;
    return results;
  }

  addCategory(category: Category | 'categoryNotFound'): void {
    if (category === 'categoryNotFound') {
      console.log('categoryName : ', this.searchedCategory);
      this.createCategory(this.searchedCategory);
    }
  }

  private createCategory(searchedValue: string): void {
    this.sharedDataService.requestCategoryCreation(searchedValue);
  }

  private subscribeToCategoryCreation(): void {
    this.sharedDataService.categoryCreated$.subscribe(
      (newCategory: Category) => {
        console.log('product-form -> Nouvelle catégorie reçue :', newCategory);
        this.addNewCategoryToList(newCategory);
      }
    );
  }

  private addNewCategoryToList(newCategory: Category): void {
    // Ajoute la catégorie seulement si elle n'existe pas déjà
    if (!this.categories.some((cat) => cat._id === newCategory._id)) {
      this.categories.push(newCategory);
    }

    // Trie les catégories alphabétiquement (optionnel)
    this.categories.sort((a, b) => a.name.localeCompare(b.name));

    // Sélectionne la nouvelle catégorie dans le formulaire
    this.productForm.patchValue({ category: newCategory });
    this.categoryCtrl.setValue(newCategory);

    console.log(
      'product-form -> Nouvelle catégorie ajoutée et sélectionnée :',
      newCategory
    );
  }

  ///////////////////////// Gestion des Ingrédients
  ////////// Gestion de l'autocomplétion des ingrédients
  private setupIngredientAutoComplete(): void {
    const ingredients = this.data.ingredients || [];
    this.filteredIngredients = this.ingredientCtrl.valueChanges.pipe(
      startWith(''),
      map((value) => {
        if (typeof value === 'string' && value !== 'ingredientNotFound')
          this.searchedIngredient = value.trim();
        return this.filterIngredients(value, ingredients);
      })
    );
  }

  // Filtrage de la recherche + tri alphabetique
  private filterIngredients(
    value: string,
    ingredients: Ingredient[]
  ): Ingredient[] {
    const filterValue = (typeof value === 'string' ? value: '').toLowerCase().trim();

    const results = ingredients
      .filter((ingredient) =>
        ingredient.name.toLowerCase().includes(filterValue)
      )
      .sort((a, b) => a.name.localeCompare(b.name));

    this.ingredientNotFound = results.length === 0;
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
  addIngredient(ingredient: Ingredient | 'ingredientNotFound'): void {
    if (ingredient === 'ingredientNotFound') {
      this.createIngredient(this.searchedIngredient);
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
  private createIngredient(searchedValue: string): void {
    this.openIngredientForm(searchedValue)
      .then((newIngredient) => {
        const currentComposition = this.composition;
        if (
          !currentComposition.some((comp) => comp._id === newIngredient._id)
        ) {
          this.setComposition([...currentComposition, newIngredient]);
        }
        this.ingredientCtrl.setValue('');
      })
      .catch((error) => {
        console.error('Erreur lors de la création de l’ingrédient :', error);
      });
  }

  private openIngredientForm(searchedValue: string): Promise<Ingredient> {
    this.sharedDataService.requestOpenIngredientForm(searchedValue);
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

  ///////////////////////// Gestion des images
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const maxFileSize = 10 * 1024 * 1024;

    if (input.files) {
      const validFiles: File[] = [];

      Array.from(input.files).forEach((file) => {
        if (!file.type.startsWith('image/')) {
          alert(`${file.name} n'est pas une image valide.`);
        } else if (file.size > maxFileSize) {
          alert(`${file.name} depasse la taille maximale autorisee de 10 Mo.`);
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

      if (validFiles.length > 0) {
        input.value = '';
        this.selectedFiles.push(...validFiles);
      }
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

  ////////////////// Validation du formulaire
  save(): void {
    if (this.productForm.valid) {
      const productData = {
        ...this.productForm.value,
        existingImages: [...this.existingImages],
      };
      this.dialogRef.close({
        productData,
        selectedFiles: this.selectedFiles,
        removedExistingImages: this.removedExistingImages,
      });
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
