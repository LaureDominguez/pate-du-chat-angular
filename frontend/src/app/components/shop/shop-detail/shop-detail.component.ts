import { Component, EventEmitter, Input, Output, SimpleChanges } from '@angular/core';
import { FinalProduct } from '../../../models/product';
import { AppModule } from '../../../app.module';
import { Ingredient } from '../../../models/ingredient';

@Component({
  selector: 'app-shop-detail',
  imports: [AppModule],
  templateUrl: './shop-detail.component.html',
  styleUrls: ['./shop-detail.component.scss']
})
export class ShopDetailComponent {
  @Input() product!: FinalProduct;
  @Output() close = new EventEmitter<void>();
  ingredientsList: Ingredient[] = [];
  allergensList: string[] = [];

  ngOnChanges(): void {
    console.log("detail du produit : ", this.product);  

    if (this.product?.composition) {
      this.ingredientsList = this.product.composition
        .filter((ingredient): ingredient is Ingredient => this.isObject(ingredient));
    }
    // console.log("📋 Ingrédients nettoyés :", this.ingredientsList);

    if (this.product?.allergens) {
      this.allergensList = this.product.allergens;
    }

    // console.log("🚫 Allergènes :", this.allergensList);
  }

  private isObject(value: any): value is Ingredient {
    return value && typeof value === 'object' && 'name' in value;
  }

  onClose(): void {
    this.close.emit();
  }
}
