import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { Ingredient } from '../models/ingredient';
import { Category } from '../models/category';

@Injectable({
  providedIn: 'root',
})
export class SharedDataService {
  /////////////// Categories  ///////////////
  private requestNewCategorySubject = new Subject<string>(); // Étape 1 : Envoi du nom
  requestNewCategory$ = this.requestNewCategorySubject.asObservable();

  private categoryCreatedSubject = new Subject<Category>(); // Étape 2 : Envoi de l'objet complet
  categoryCreated$ = this.categoryCreatedSubject.asObservable();

  // Quand le product-form demande la création d'une catégorie
  requestCategoryCreation(categoryName: string) {
  // console.log('shared-data.service -> Demande de création :', categoryName);
    this.requestNewCategorySubject.next(categoryName);
  }

  // Quand category-admin renvoie la catégorie créée en DB
  sendCategoryToProductForm(category: Category) {
    // console.log(
    //   'shared-data.service -> Catégorie créée et renvoyée :',
    //   category
    // );
    this.categoryCreatedSubject.next(category);
  }

  /////////////// Ingredients ///////////////
  private openIngredientFormSubject = new Subject<void>();
  openIngredientForm$: Observable<void> =
    this.openIngredientFormSubject.asObservable();

  private ingredientCreatedSubject = new Subject<Ingredient>();
  ingredientCreated$: Observable<Ingredient> =
    this.ingredientCreatedSubject.asObservable();

  private searchedIngredientSubject = new BehaviorSubject<string>(''); // Stocke le texte
  searchedIngredient$ = this.searchedIngredientSubject.asObservable(); // Observable pour récupérer la valeur

  requestOpenIngredientForm(searchedValue: string) {
    // console.log(
    //   'shared-data.service -> request -> requestOpenIngredientForm -> searchedValue : ',
    //   searchedValue
    // );
    this.searchedIngredientSubject.next(searchedValue); // Stocke la valeur recherchée
    this.openIngredientFormSubject.next();
  }

  resultIngredientCreated(ingredient: Ingredient) {
    // console.log(
    //   'shared-data.service -> result -> resultIngredientCreated : ',
    //   ingredient
    // );
    this.ingredientCreatedSubject.next(ingredient);
  }
}
