import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IngredientAdminComponent } from './ingredient-admin.component';
import { ReactiveFormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { SharedDataService } from '../../../services/shared-data.service';
import { of } from 'rxjs';

describe('IngredientAdminComponent', () => {
  let component: IngredientAdminComponent;
  let fixture: ComponentFixture<IngredientAdminComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        IngredientAdminComponent,
        ReactiveFormsModule,
        MatDialogModule,
        MatPaginatorModule,
        MatSortModule,
        MatTableModule
      ],
      providers: [
        {
          provide: SharedDataService,
          useValue: {
            requestIngredientCreation$: () => of(null),
          }
        },
        {
          provide: 'IngredientService',
          useValue: {
            getIngredients: () => of([]),
            createIngredient: () => of(null),
            updateIngredient: () => of(null),
            deleteIngredient: () => of(null),
          }
        },
        {
          provide: 'ImageService',
          useValue: {
            getImageUrl: (path: string) => `http://localhost:4200/api/images/${path}`,
            uploadImage: () => of(null),
            deleteImage: () => of(null),
          }
        },
        {
          provide: 'ProductService',
          useValue: {
            getProducts: () => of([]),
          }
        },
        {
          provide: 'SupplierService',
          useValue: {
            getSuppliers: () => of([]),
          }
        },
        {
          provide: MatDialog,
          useValue: {
            open: () => ({
              afterClosed: () => of(null),
            }),
          },
        }
      ],
    })
    .compileComponents();

    fixture = TestBed.createComponent(IngredientAdminComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('devrait être créé', () => {
    expect(component).toBeTruthy();
  });
});
