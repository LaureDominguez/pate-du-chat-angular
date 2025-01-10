import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators 
} from '@angular/forms';

import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogModule
} from '@angular/material/dialog';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatInputModule } from '@angular/material/input';
import { MatOptionModule } from '@angular/material/core';
import { MatListModule } from '@angular/material/list';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatCardModule } from '@angular/material/card';

import { Ingredient } from '../ingredient-form/ingredient-form.component';

export interface Product {
  _id: string;
  name: string;
  category: string;
  description: string;
  composition: string[];
  price: number;
  images?: string[];
  stock: boolean;
}

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatCheckboxModule,
    MatInputModule,
    MatOptionModule,
    MatListModule,
    MatChipsModule,
    MatAutocompleteModule,
    MatIconModule,
    MatFormFieldModule,
    MatGridListModule,
    MatCardModule,
  ],
  templateUrl: './product-form.component.html',
  styleUrls: ['./product-form.component.scss'],
})
export class ProductFormComponent implements OnInit {
  productForm: FormGroup;
  categories: string[] = [];
  ingredients: Ingredient[] = [];
  filteredIngredients: Ingredient[] = [];

  selectedFiles: File[] = [];
  filePreviews: string[] = [];
  existingImages: string[] = [];
  existingImageUrls: string[] = [];
  removedExistingImages: string[] = [];

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<ProductFormComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: {
      product: Product | null;
      categories: string[];
      ingredients: Ingredient | null;
      imageUrls: string[];
    }
  ) {
    this.productForm = this.fb.group({
      name: [data.product?.name || '', Validators.required],
      category: [data.product?.category || '', Validators.required],
      description: [data.product?.description || ''],
      composition: [data.product?.composition || [], Validators.required],
      price: [
        data.product?.price || 0,
        [Validators.required, Validators.min(0)],
      ],
      stock: [data.product?.stock || false],
    });

    if (data.product?.images) {
      this.existingImages = [...data.product.images];
      this.existingImageUrls = [...data.imageUrls];
      console.log('Images existantes :', this.existingImages);
      console.log('pouet : ', this.existingImageUrls);
    }

    // // Initialisation des catégories et ingrédients
    // this.categories = data.categories || [];
    // this.ingredients = data.ingredients || [];
  }

  ngOnInit(): void {
    console.log('admin.component -> ngOnInit -> data : ', this.data);
    if (this.data.product) {
      this.productForm.patchValue(this.data.product);
    }

    // Initialisation des ingrédients filtrés
    this.filteredIngredients = this.ingredients;
  }

  save(): void {
    if (this.productForm.valid) {
      const productData = { ...this.productForm.value };
      productData.images = [
        ...this.existingImages,
        ...this.selectedFiles.map((file) => file.name),
      ];
      this.dialogRef.close(productData);
    }
  }

  cancel() {
    this.dialogRef.close();
  }

  // Gestion des fichiers sélectionnés
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input?.files) {
      for (const file of Array.from(input.files)) {
        this.selectedFiles.push(file);

        const reader = new FileReader();
        reader.onload = (e: any) => {
          this.filePreviews.push(e.target.result);
        };
        reader.readAsDataURL(file);
      }
    }
  }

  removeFile(index: number): void {
    this.selectedFiles.splice(index, 1);
    this.filePreviews.splice(index, 1);
  }

  removeExistingImage(index: number): void {
    const removedImage = this.existingImages.splice(index, 1)[0];
    this.removedExistingImages.push(removedImage);
    this.existingImageUrls.splice(index, 1);
  }
}
