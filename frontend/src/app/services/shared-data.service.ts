import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { Ingredient } from '../models/ingredient';
import { Category } from '../models/category';

interface DownloadImageData {
  imagePath: string;
  objectName: string;
}

@Injectable({
  providedIn: 'root',
})
export class SharedDataService {
  ///////////////////////////////////////////
  /////////////// Categories  ///////////////
  private categoryListUpdateSubject = new Subject<void>();
  categoryListUpdate$ = this.categoryListUpdateSubject.asObservable();

  private requestNewCategorySubject = new Subject<string>();
  requestNewCategory$ = this.requestNewCategorySubject.asObservable();

  private categoryCreatedSubject = new Subject<Category>();
  categoryCreated$ = this.categoryCreatedSubject.asObservable();

  // Demande de création par product-form
  requestCategoryCreation(categoryName: string) {
    this.requestNewCategorySubject.next(categoryName);
  }

  // Réponse de category-admin
  sendCategoryToProductForm(category: Category) {
    this.categoryCreatedSubject.next(category);
  }

  // Notifier les abonnés de la mise à jour
  notifyCategoryUpdate() {
    this.categoryListUpdateSubject.next();
  }

  ///////////////////////////////////////////
  /////////////// Ingredients ///////////////
  private ingredientListUpdateSubject = new Subject<void>();
  ingredientListUpdate$ = this.ingredientListUpdateSubject.asObservable();

  private openIngredientFormSubject = new Subject<void>();
  openIngredientForm$: Observable<void> =
    this.openIngredientFormSubject.asObservable();

  private ingredientCreatedSubject = new Subject<Ingredient>();
  ingredientCreated$: Observable<Ingredient> =
    this.ingredientCreatedSubject.asObservable();

  // Observable pour récupérer la valeur recherchée et préreplire le formulaire
  private searchedIngredientSubject = new BehaviorSubject<string>('');
  searchedIngredient$ = this.searchedIngredientSubject.asObservable();

  // Demande de création par product-form
  requestOpenIngredientForm(searchedValue: string) {
    console.log(
      '%c [SharedDataService] → requestOpenIngredientForm() appelée avec :',
      'color: orange; font-weight: bold;',
      searchedValue
    );

    this.searchedIngredientSubject.next(searchedValue); // Stocke la valeur recherchée
    console.log(
      '%c [SharedDataService] → Avant émission de openIngredientFormSubject',
      'color: red; font-weight: bold;'
    );
    this.openIngredientFormSubject.next();
    console.log(
      '%c [SharedDataService] → Après émission de openIngredientFormSubject',
      'color: pink; font-weight: bold;'
    );
  }

  // Récupérer la valeur recherchée
  getSearchedIngredient(): string {
    const value = this.searchedIngredientSubject.getValue();
    console.log(
      '%c [SharedDataService] → getSearchedIngredient() retourne :',
      'color: blue; font-weight: bold;',
      value
    );
    return value;
  }

  // Réponse de ingredient-admin
  resultIngredientCreated(ingredient: Ingredient) {
    console.log(
      'shared-data.service -> resultIngredientCreated : ',
      ingredient
    );
    this.ingredientCreatedSubject.next(ingredient);
  }

  // Notifier les abonnés de la mise à jour
  notifyIngredientUpdate() {
    console.log(
      '%c [SharedDataService] → notifyIngredientUpdate() appelée',
      'color: purple; font-weight: bold;'
    );
    this.ingredientListUpdateSubject.next();
  }

  ///////////////////////////////////////////
  //////////////// Produits /////////////////
  private productListUpdateSubject = new Subject<void>();
  productListUpdate$ = this.productListUpdateSubject.asObservable();

  // Notifier les abonnés de la mise à jour
  notifyProductUpdate() {
    this.productListUpdateSubject.next();
  }

  ///////////////////////////////////////////
  //////////////// Images ///////////////////
  private downloadImageSubject = new BehaviorSubject<DownloadImageData | null>(
    null
  );
  downloadImage$ = this.downloadImageSubject.asObservable();

  emitDownloadImage(imagePath: string, objectName: string) {
    this.downloadImageSubject.next({ imagePath, objectName });
  }
}
