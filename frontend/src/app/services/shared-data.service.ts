import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SharedDataService {
  private openIngredientFormSubject = new Subject<void>();
  openIngredientForm$ = this.openIngredientFormSubject.asObservable();

  triggerOpenIngredientForm() {
    this.openIngredientFormSubject.next();
  }
}
