import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

import { Ingredient } from '../../ingredient-admin/ingredient-form/ingredient-form.component';
import { AdminModule } from '../../admin.module';



@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [AdminModule],
  templateUrl: './product-form.component.html',
  styleUrls: ['./product-form.component.scss'],
})
export class ProductFormComponent implements OnInit {
  productForm!: FormGroup;
  categories: any[] = [];
  ingredients: Ingredient[] = [];

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<ProductFormComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: any
  ) {
    // this.productForm = this.fb.group({
    //   name: [data.product?.name || '', Validators.required],
    //   category: [data.product?.category || data.categories, Validators.required],
    //   description: [data.product?.description || ''],
    //   // composition: [data.product?.composition || [], Validators.required],
    //   price: [
    //     data.product?.price || 0,
    //     [Validators.required, Validators.min(0)],
    //   ],
    //   stock: [data.product?.stock || false],
    // });
  }

  ngOnInit(): void {
    console.log('admin.component -> ngOnInit -> data : ', this.data);

    // Initialisation des catégories et ingrédients
    this.categories = this.data.categories || [];
    this.ingredients = this.data.ingredients || [];

    this.initForm();

    if (this.data.product) {
      this.productForm.patchValue({ ...this.data.product });
    }
  }

  initForm(): void {
    this.productForm = this.fb.group({
      name: [ this.data.product?.name || '', Validators.required],
      category: [this.data.product?.category || null, Validators.required],
      description: [this.data.product?.description || ''],
      // composition: ['', Validators.required],
      price: [this.data.product?.price || 0, [Validators.required, Validators.min(0)]],
      stock: [this.data.product?.stock || false],
    });
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
