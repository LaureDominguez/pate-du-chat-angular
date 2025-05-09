import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductFormComponent } from './product-form.component';
import { ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { of } from 'rxjs';
import { ImageService } from '../../../../services/image.service';
import { SharedDataService } from '../../../../services/shared-data.service';

describe('ProductFormComponent', () => {
  let component: ProductFormComponent;
  let fixture: ComponentFixture<ProductFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ReactiveFormsModule,
        MatDialogModule,
        ProductFormComponent
      ],
      providers: [
        {
          provide: SharedDataService,
          useValue: {
            requestCategoryCreation$: () => of(null),
            requestIngredientCreation$: () => of(null)
          }
        },
        {
          provide: ImageService,
          useValue: {
            getImageUrl: (path: string) => `http://localhost:4200/api/images/${path}`,
            uploadImage: () => of(null),
            deleteImage: () => of(null)
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
            product: null,
            categories: [],
            ingredients: [],
            imageUrls: [],
            imagePaths: [],
            dlcs: []
          }
        }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProductFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('devrait être créé', () => {
    expect(component).toBeTruthy();
  });
});
