import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, ReplaySubject, Subject } from 'rxjs';
import { Ingredient } from '../models/ingredient';
import { Category } from '../models/category';
import { Supplier } from './supplier.service';

interface DownloadImageData {
  imagePath: string;
  objectName: string;
}

export interface QuickCreateData {
  name: string;
  description?: string;
}


@Injectable({
  providedIn: 'root',
})
export class SharedDataService {
  ///////////////////////////////////////////
  /////////////// Categories  ///////////////
  private categoryListUpdateSubject = new Subject<void>();
  categoryListUpdate$ = this.categoryListUpdateSubject.asObservable();

  private requestNewCategorySubject = new ReplaySubject<QuickCreateData>(1);
  requestNewCategory$ = this.requestNewCategorySubject.asObservable();
  // private requestNewCategorySubject = new Subject<QuickCreateData>();
  // requestNewCategory$ = this.requestNewCategorySubject.asObservable();

  private categoryCreatedSubject = new Subject<Category>();
  categoryCreated$ = this.categoryCreatedSubject.asObservable();

  // Demande de création par product-form
  requestCategoryCreation(data: QuickCreateData) {
    console.log('📋 Shared-service -> Demande de création de catégorie :', data);
    this.requestNewCategorySubject.next(data);
  }

  // Réponse de category-admin
  sendCategoryToProductForm(category: Category) {
    console.log('📋 Shared-service -> Envoie de la catégorie créée :', category);
    this.categoryCreatedSubject.next(category);
  }

  // Notifier les abonnés de la mise à jour
  notifyCategoryUpdate() {
    this.categoryListUpdateSubject.next();
  }

  ///////////////////////////////////////////
  /////////////// Suppliers  ////////////////
  private supplierListUpdateSubject = new Subject<void>();
  supplierListUpdate$ = this.supplierListUpdateSubject.asObservable();

  private requestNewSupplierSubject = new ReplaySubject<QuickCreateData>(1);
  requestNewSupplier$ = this.requestNewSupplierSubject.asObservable();
  // private requestNewSupplierSubject = new Subject<string>();
  // requestNewSupplier$ = this.requestNewSupplierSubject.asObservable();

  private supplierCreatedSubject = new Subject<Supplier>();
  supplierCreated$ = this.supplierCreatedSubject.asObservable();

  // Demande de création par ingredient-form
  requestSupplierCreation(data : QuickCreateData) {
    this.requestNewSupplierSubject.next(data);
  }

  // Réponse de supplier-admin
  sendSupplierToIngredientForm(supplier: Supplier) {
    this.supplierCreatedSubject.next(supplier);
  }

  // Notifier les abonnés de la mise à jour
  notifySupplierUpdate() {
    this.supplierListUpdateSubject.next();
  }


  ///////////////////////////////////////////
  /////////////// Ingredients ///////////////
  private ingredientListUpdateSubject = new Subject<void>();
  ingredientListUpdate$ = this.ingredientListUpdateSubject.asObservable();

  // Notifier que les ingrédients doivent être rechargés après une mise à jour
  private ingredientCompositionUpdateSubject = new Subject<void>();
  ingredientCompositionUpdate$ = this.ingredientCompositionUpdateSubject.asObservable();

  // Méthode pour déclencher la mise à jour
  notifyIngredientCompositionUpdate() {
    this.ingredientCompositionUpdateSubject.next();
  }


  private requestNewIngredientSubject = new ReplaySubject<void>(1);
  requestNewIngredient$: Observable<void> = this.requestNewIngredientSubject.asObservable();
  // private openIngredientFormSubject = new Subject<void>();
  // openIngredientForm$: Observable<void> =
  //   this.openIngredientFormSubject.asObservable();

  private ingredientCreatedSubject = new Subject<Ingredient>();
  ingredientCreated$: Observable<Ingredient> =
    this.ingredientCreatedSubject.asObservable();

  // Observable pour récupérer la valeur recherchée et préreplire le formulaire
  private searchedIngredientSubject = new BehaviorSubject<string>('');
  searchedIngredient$ = this.searchedIngredientSubject.asObservable();

  // Demande de création par product-form
  requestOpenIngredientForm(searchedValue: string) {
    this.searchedIngredientSubject.next(searchedValue); // Stocke la valeur recherchée
    this.requestNewIngredientSubject.next();
    // this.openIngredientFormSubject.next();
  }

  // Récupérer la valeur recherchée
  getSearchedIngredient(): string {
    const value = this.searchedIngredientSubject.getValue();
    return value;
  }

  // Réponse de ingredient-admin
  resultIngredientCreated(ingredient: Ingredient) {
    this.ingredientCreatedSubject.next(ingredient);
  }

  // Notifier les abonnés de la mise à jour
  notifyIngredientUpdate() {
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
