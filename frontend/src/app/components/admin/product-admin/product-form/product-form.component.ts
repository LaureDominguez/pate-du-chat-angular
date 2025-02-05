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
    this.categories = data.categories || [];
    this.ingredients = data.ingredients || [];

    this.productForm = this.fb.group({
      _id: [data.product?._id || ''],
      name: [data.product?.name || '', Validators.required],
      category: [data.product?.category || null, Validators.required],
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

    this.categoryCtrl.setValue(
      data.product?.category ? (data.product.category as Category).name : ''
    );
    
    console.log(
      'ProductFormComponent -> ngOnInit -> categoryCtrl : ',
      this.categoryCtrl.value
    );

    
    console.log('ProductFormComponent -> data : ', data);
    console.log('ProductFormComponent -> productForm : ', this.productForm);
  }
  ngOnInit(): void {
    this.setupAutoComplete();
    this.subscribeToDataUpdates();

    // console.log(
    //   'ProductFormComponent -> ngOnInit -> ingredientCtrl : ',
    //   this.ingredientCtrl
    // );
  }

  /////////////////////////////////////////////////////////////////////////////////
  ////////////////// Innit du formulaire

  //// AutoComplete
  private setupAutoComplete(): void {
    // Categories
    this.filteredCategories = this.categoryCtrl.valueChanges.pipe(
      startWith(''),
      map((value) => {
        console.log('value : ', value);

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
      console.log('updateList -> categoryCtrl : ', this.categoryCtrl.value);
    }
  }

  /////////////////////////////////////////////////////////////////////////////////
  ///////////Gestion des categories
  addCategory(category: Category | 'categoryNotFound'): void {
    console.log('category : ', category);
    if (category === 'categoryNotFound') {
      this.createCategory(this.searchedCategory);
    } else {
      this.productForm.patchValue({ category });
    }
    this.categoryCtrl.setValue(
      category ? (category as Category).name : ''
    );
    console.log('addCategory -> categoryCtrl : ', this.categoryCtrl.value);
  }

  private createCategory(searchedValue: string): void {
    this.sharedDataService.requestCategoryCreation(searchedValue);
  }

  /////////////////////////////////////////////////////////////////////////////////
  ////////// Gestion des ingrédients
  get composition(): Ingredient[] {
    return this.productForm.get('composition')?.value || [];
  }

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
  }

  // Vérifie si un ingrédient fait partie de la composition
  isIngredientSelected(ingredient: Ingredient): boolean {
    return this.composition.some((comp) => comp._id === ingredient._id);
  }

  // Ajout d'un ingrédient à la composition + gestion des coches
  addIngredient(ingredient: Ingredient | 'ingredientNotFound'): void {
    if (ingredient === 'ingredientNotFound') {
      this.createIngredient(this.searchedIngredient);
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
      const subscription = this.sharedDataService.ingredientCreated$.subscribe({
        next: (ingredient) => {
          subscription.unsubscribe();
          resolve(ingredient);
        },
        error: (err) => reject(err),
      });
    });
  }

  // Suppression d'un ingrédient de la composition
  removeIngredient(ingredient: Ingredient): void {
    this.updateComposition(ingredient, false);
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
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result) {
        this.filePreviews.push(reader.result as string);
      }
    };
    reader.readAsDataURL(file);
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
