import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminComponent } from './admin.component';
import { CategoryAdminComponent } from './category-admin/category-admin.component';
import { IngredientAdminComponent } from './ingredient-admin/ingredient-admin.component';
import { ProductAdminComponent } from './product-admin/product-admin.component';
import { SupplierAdminComponent } from './supplier-admin/supplier-admin.component';
import { of } from 'rxjs';
import { CategoryService } from '../../services/category.service';
import { IngredientService } from '../../services/ingredient.service';
import { ProductService } from '../../services/product.service';
import { SupplierService } from '../../services/supplier.service';

describe('AdminComponent', () => {
  let component: AdminComponent;
  let fixture: ComponentFixture<AdminComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        AdminComponent,
        CategoryAdminComponent,
        SupplierAdminComponent,
        IngredientAdminComponent,
        ProductAdminComponent
      ],
      providers: [
        {
          provide: CategoryService,
          useValue: {
            getCategories$: () => of([]),
          }
        },
        {
          provide: SupplierService,
          useValue: {
            getSuppliers$: () => of([]),
          }
        },
        {
          provide: IngredientService,
          useValue: {
            getIngredients$: () => of([]),
          }
        },
        {
          provide: ProductService,
          useValue: {
            getProducts$: () => of([]),
          }
        }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('devrait être créé', () => {
    expect(component).toBeTruthy();
  });
});
