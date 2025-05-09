import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductAdminComponent } from './product-admin.component';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { of } from 'rxjs';
import { CategoryService } from '../../../services/category.service';
import { DeviceService } from '../../../services/device.service';
import { ImageService } from '../../../services/image.service';
import { IngredientService } from '../../../services/ingredient.service';
import { ProductService } from '../../../services/product.service';

describe('ProductAdminComponent', () => {
  let component: ProductAdminComponent;
  let fixture: ComponentFixture<ProductAdminComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        MatDialogModule,
        MatPaginatorModule,
        MatSortModule,
        MatTableModule,
        ProductAdminComponent
      ],
      providers: [
        {
          provide: ProductService,
          useValue: {
            getProducts$: () => of([]),
            updateProduct: () => of(null),
            deleteProduct: () => of(null),
            createProduct: () => of(null)
          }
        },
        {
          provide: IngredientService,
          useValue: {
            getIngredients$: () => of([])
          }
        },
        {
          provide: CategoryService,
          useValue: {
            getCategories$: () => of([])
          }
        },
        {
          provide: ImageService,
          useValue: {
            getImageUrl: (path: string) => `http://localhost:4200/api/images/${path}`
          }
        },
        {
          provide: DeviceService,
          useValue: {
            isMobile: () => false // Mock isMobile pour test
          }
        },
        {
          provide: MatDialog,
          useValue: {
            open: () => ({ afterClosed: () => of(true) })
          }
        }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProductAdminComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('devrait être créé', () => {
    expect(component).toBeTruthy();
  });
});
