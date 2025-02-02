import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { Ingredient } from '../models/ingredient';

@Injectable({
  providedIn: 'root',
})
export class SharedDataService {
  private openIngredientFormSubject = new Subject<void>();
  openIngredientForm$: Observable<void> =
    this.openIngredientFormSubject.asObservable();

  private ingredientCreatedSubject = new Subject<Ingredient>();
  ingredientCreated$: Observable<Ingredient> =
    this.ingredientCreatedSubject.asObservable();

  private searchedIngredientSubject = new BehaviorSubject<string>(''); // Stocke le texte
  searchedIngredient$ = this.searchedIngredientSubject.asObservable(); // Observable pour récupérer la valeur

  requestOpenIngredientForm(searchedValue: string) {
    console.log(
      'shared-data.service -> request -> requestOpenIngredientForm -> searchedValue : ',
      searchedValue
    );
    this.searchedIngredientSubject.next(searchedValue); // Stocke la valeur recherchée
    this.openIngredientFormSubject.next();
  }

  resultIngredientCreated(ingredient: Ingredient) {
    console.log(
      'shared-data.service -> result -> resultIngredientCreated : ',
      ingredient
    );
    this.ingredientCreatedSubject.next(ingredient);
  }
}
