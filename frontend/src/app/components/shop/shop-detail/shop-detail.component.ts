import { Component, EventEmitter, Input, Output, SimpleChanges } from '@angular/core';
import { Product } from '../../../models/product';
import { Ingredient } from '../../../models/ingredient';
import { MATERIAL_IMPORTS } from '../../../app-material';

@Component({
  selector: 'app-shop-detail',
  imports: [MATERIAL_IMPORTS],
  templateUrl: './shop-detail.component.html',
  styleUrls: ['./shop-detail.component.scss']
})
export class ShopDetailComponent {
  @Input() product!: Product;
  @Output() close = new EventEmitter<void>();
  ingredientsList: Ingredient[] = [];
  ingredientsFormatted: string = '';
  allergensList: string[] = [];
  allergensFormatted: string | null = null;
  isBio: boolean = false;

  ngOnChanges(): void {
    console.log("detail du produit : ", this.product);  

    if (this.product?.composition) {
      this.ingredientsList = this.product.composition
        .filter((ingredient): ingredient is Ingredient => this.isObject(ingredient))
        .map(ingredient => ({
          ...ingredient,
          subIngredients: ingredient.subIngredients?.filter((sub): sub is Ingredient => this.isObject(sub)) || []
        }));
    }
    console.log("📋 Liste des ingrédients :", this.ingredientsList);

    if (this.product?.allergens) {
      this.allergensList = this.product.allergens;
    }

    this.isBio = this.ingredientsList.some((ingredient) => ingredient.bio);
    console.log('bio :', this.isBio);

    this.formatIngredientsList();
    this.formatAllergensList();

    console.log('🚫 Liste des allergènes formatée :', this.allergensFormatted);
  }

  private formatIngredientsList(): void {
    this.ingredientsFormatted = this.ingredientsList.map((ingredient, index) => {
      let formattedName = index === 0 
        ? ingredient.name.charAt(0).toUpperCase() + ingredient.name.slice(1) 
        : ingredient.name.toLowerCase(); // 1er en majuscule, les autres en minuscule

      let bioLabel = ingredient.bio ? ' BIO' : ''; // Ajoute BIO si nécessaire

      let subIngredients = '';
      // if (ingredient.type === 'compose' && ingredient.subIngredients?.length) {
      //   subIngredients = `: (${ingredient.subIngredients.map(sub => sub.name.toLowerCase()).join(', ')})`;
      // }

      return `${formattedName}${bioLabel}${subIngredients}`;
    }).join(', ') + '.'; // Ajoute un point final
  }

  private formatAllergensList(): void {
    if (this.allergensList.length === 0) {
      this.allergensFormatted = null; // Affichera l'icône Material si null
    } else {
      this.allergensFormatted = this.allergensList
        .map((allergen, index) => 
          index === 0 
            ? allergen.charAt(0).toUpperCase() + allergen.slice(1) // 1er élément avec majuscule
            : allergen.toLowerCase() // Suivants en minuscule
        )
        .join(', ') + '.'; // Ajoute un point final
    }
  }

  private isObject(value: any): value is Ingredient {
    return value && typeof value === 'object' && 'name' in value;
  }

  onClose(): void {
    this.close.emit();
  }
}
