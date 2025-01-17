import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { Ingredient } from '../models/ingredient';

@Injectable({
  providedIn: 'root',
})
export class SharedDataService {
  private openIngredientFormSubject = new Subject<void>();
  openIngredientForm$ : Observable<void> = this.openIngredientFormSubject.asObservable();

  private ingredientCreatedSubject = new Subject<Ingredient>();
  ingredientCreated$ : Observable<Ingredient> = this.ingredientCreatedSubject.asObservable();

  requestOpenIngredientForm() {
    console.log('shared-data.service -> request -> requestOpenIngredientForm');
    this.openIngredientFormSubject.next();
  }

  resultIngredientCreated(ingredient: Ingredient) {
    console.log('shared-data.service -> result -> resultIngredientCreated : ', ingredient);
    this.ingredientCreatedSubject.next(ingredient);
  }

}
