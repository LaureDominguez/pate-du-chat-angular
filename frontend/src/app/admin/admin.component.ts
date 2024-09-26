import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Product, ProductService } from '../services/product.service';
import { Ingredient, IngredientService } from '../services/ingredient.service';

// interface ProductWithComposition extends Product {
//   compositionNames: string;
// }

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.sass'],
})
export class AdminComponent implements OnInit {
  products: Product[] = [];
  productCompo: string[] = [];
  ingredients: Ingredient[] = [];

  constructor(
    private productService: ProductService,
    private ingredientService: IngredientService
  ) {}

  ngOnInit(): void {
    this.fecthProducts();
    // this.fetchIngredients();
  }

  fecthProducts(): void {
    //fetch products
    this.productService.getProducts().subscribe((products) => {
      this.products = products;
      this.productCompo = [];

      //fetch ingredients
      products.forEach((product) => {
        const compositionNames: string[] = [];

        product.composition?.forEach((ingredientId: string) => {
          //recup id de l'ingrédient
          this.ingredientService
            .getIngredientById(ingredientId)
            .subscribe((ingredient: Ingredient) => {
              //recup nom de l'ingrédient
              compositionNames.push(ingredient.name);
            });
        });
        
        console.log('pouet', product.name, compositionNames);
        this.productCompo = compositionNames
      });
        console.log('pouet2',this.productCompo);
    });
  }

  fetchIngredients(): void {
    this.ingredientService.getIngredients().subscribe((ingredients) => {
      this.ingredients = ingredients;
    });
  }
}
