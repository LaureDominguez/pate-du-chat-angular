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
import { SharedDataService } from '../../../../services/shared-data.service';
import { ErrorDialogComponent } from '../../../dialog/info-dialog/info-dialog.component';
import { Category } from '../../../../models/category';
import { Ingredient } from '../../../../models/ingredient';
import { Product } from '../../../../models/product';

@Component({
  selector: 'app-product-form',
  templateUrl: './product-form.component.html',
  styleUrls: ['./product-form.component.scss'],
})
export class ProductFormComponent implements OnInit {
  productForm: FormGroup;
  categories: Category[] = [];
  categoryCtrl = new FormControl();
  filteredCategories!: Observable<Category[]>;
  categoryNotFound = false;

  ingredients: Ingredient[] = [];
  ingredientCtrl = new FormControl();
  filteredIngredients!: Observable<Ingredient[]>;
  ingredientNotFound = false;

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
      category: [this.initializeCategory(), Validators.required],
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
    this.setupAutoComplete();
    this.subscribeToDataUpdates();
  }

  private initializeCategory(): Category | null {
    return typeof this.data.product?.category === 'string'
      ? this.categories.find(
          (cat) => cat._id === this.data.product?.category
        ) || null
      : this.data.product?.category || null;
  }

  private setupAutoComplete(): void {
    this.filteredCategories = this.categoryCtrl.valueChanges.pipe(
      startWith(''),
      map((value) => this.filterItems(value, this.categories))
    );

    this.filteredIngredients = this.ingredientCtrl.valueChanges.pipe(
      startWith(''),
      map((value) => this.filterItems(value, this.ingredients))
    );
  }

  private filterItems(value: string, list: any[]): any[] {
    const filterValue = (typeof value === 'string' ? value : '')
      .toLowerCase()
      .trim();
    return list
      .filter((item) => item.name.toLowerCase().includes(filterValue))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

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
  }

  addCategory(category: Category | 'categoryNotFound'): void {
    if (category === 'categoryNotFound') {
      this.sharedDataService.requestCategoryCreation(this.categoryCtrl.value);
    }
  }

  addIngredient(ingredient: Ingredient | 'ingredientNotFound'): void {
    if (ingredient === 'ingredientNotFound') {
      this.sharedDataService.requestOpenIngredientForm(
        this.ingredientCtrl.value
      );
    } else if (!this.composition.some((comp) => comp._id === ingredient._id)) {
      this.setComposition([...this.composition, ingredient]);
    }
  }

  get composition(): Ingredient[] {
    return this.productForm.get('composition')?.value || [];
  }

  private setComposition(composition: Ingredient[]): void {
    this.productForm.get('composition')?.setValue(composition);
  }

  save(): void {
    if (this.productForm.valid) {
      this.dialogRef.close({
        productData: {
          ...this.productForm.value,
          existingImages: [...this.existingImages],
        },
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
