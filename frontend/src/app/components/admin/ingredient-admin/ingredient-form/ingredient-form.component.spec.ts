import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IngredientFormComponent } from './ingredient-form.component';
import { ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { of } from 'rxjs';
import { SharedDataService } from '../../../../services/shared-data.service';

describe('IngredientFormComponent', () => {
  let component: IngredientFormComponent;
  let fixture: ComponentFixture<IngredientFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        IngredientFormComponent,
        ReactiveFormsModule,
        MatDialogModule,
      ],
      providers: [
        {
          provide: SharedDataService,
          useValue: {
            requestSupplierCreation$: () => of(null),
          }
        },
        {
          provide: MatDialog,
          useValue: {
            open: () => ({
              afterClosed: () => of(true)
            })
          }
        },
        {
          provide: MatDialogRef,
          useValue: {
            close: () => {}
          }
        },
        {
          provide: MAT_DIALOG_DATA,
          useValue: {
            imageUrls: [],
            ingredient: null,
            allergenesList: [],
            suppliers: [],
            originesList: [],
            searchedValue: '',
            ingredients: []
          }
        }
      ],
    })
    .compileComponents();

    fixture = TestBed.createComponent(IngredientFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('devrait être créé', () => {
    expect(component).toBeTruthy();
  });
});
