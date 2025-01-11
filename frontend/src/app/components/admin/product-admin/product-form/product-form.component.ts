import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

import { Ingredient } from '../../ingredient-admin/ingredient-form/ingredient-form.component';
import { AdminModule } from '../../admin.module';

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
  imports: [AdminModule],
  templateUrl: './product-form.component.html',
  styleUrls: ['./product-form.component.scss'],
})
export class ProductFormComponent implements OnInit {
  productForm: FormGroup;
  categories: string[] = [];
  ingredients: Ingredient[] = [];

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<ProductFormComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: {
      product: Product | null;
      categories: string[];
      ingredients: Ingredient[];
      imageUrls: string[];
    }
  ) {
    this.productForm = this.fb.group({
      name: [data.product?.name || '', Validators.required],
      category: [data.product?.category || '', Validators.required],
      description: [data.product?.description || ''],
      // composition: [data.product?.composition || [], Validators.required],
      price: [
        data.product?.price || 0,
        [Validators.required, Validators.min(0)],
      ],
      stock: [data.product?.stock || false],
    });
  }

  ngOnInit(): void {
    console.log('admin.component -> ngOnInit -> data : ', this.data);

    // Initialisation des catégories et ingrédients
    this.categories = this.data.categories || [];
    this.ingredients = this.data.ingredients || [];

    if (this.data.product) {
      this.productForm.patchValue({ ...this.data.product });
    }
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
