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
import { Product } from '../../../../models/product';

@Component({
  selector: 'app-product-form',
  imports: [AdminModule],
  templateUrl: './product-form.component.html',
  styleUrls: ['./product-form.component.scss'],
})
export class ProductFormComponent implements OnInit {
  productForm: FormGroup;
  ingredientCtrl = new FormControl();
  categories: Category[] = [];
  ingredients: Ingredient[] = [];
  filteredIngredients!: Observable<Ingredient[]>;
  noResults = false;

  //img services
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
  ){
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
    });

    console.log('admin.component -> productForm init : ', this.productForm);

    if (data.product?.images) {
      this.existingImages = [...data.product.images];
      this.existingImageUrls = [...data.imageUrls];
    }
  }
  ngOnInit(): void {
    this.setupIngredientAutoComplete();
    this.subscribeToIngredientCreation();

    this.categories = this.data.categories || [];

    // Vérification et correction de product.category
    const productCategory = this.data.product?.category;

    if (productCategory) {
      const categoryObj =
        typeof productCategory === 'string'
          ? this.categories.find((cat) => cat._id === productCategory) || null
          : productCategory;

      this.productForm.patchValue({ category: categoryObj });
    }

    console.log(
      '✅ Valeur corrigée de productForm.category :',
      this.productForm.get('category')?.value
    );
  }

  compareCategories(category1: Category, category2: Category): boolean {
    return category1 && category2 ? category1._id === category2._id : false;
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
        this.ingredientCtrl.setValue('');
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

  /////////// Gestion des images
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

  ////////// Validation du formulaire
  save(): void {
    if (this.productForm.valid) {
      const productData = { ...this.productForm.value };
      console.log('product-form -> save -> productData : ', productData);
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
