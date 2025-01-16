import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { Ingredient } from '../models/ingredient';

@Injectable({
  providedIn: 'root',
})
export class SharedDataService {
  private openIngredientFormSubject = new Subject<void>();
  openIngredientForm$ = this.openIngredientFormSubject.asObservable();

  // Sujet pour transmettre l'ingrédient créé
  private ingredientCreatedSubject = new Subject<Ingredient>();
  ingredientCreated$ = this.ingredientCreatedSubject.asObservable();

  triggerOpenIngredientForm() {
    this.openIngredientFormSubject.next();
  }

  sendCreatedIngredient(ingredient: Ingredient): void {
    this.ingredientCreatedSubject.next(ingredient);
  }
}
