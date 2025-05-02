import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CategoryAdminComponent } from './category-admin.component';
import { ReactiveFormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { of } from 'rxjs';
import { CategoryService } from '../../../services/category.service';
import { SharedDataService } from '../../../services/shared-data.service';

describe('CategoryAdminComponent', () => {
  let component: CategoryAdminComponent;
  let fixture: ComponentFixture<CategoryAdminComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        CategoryAdminComponent,
        ReactiveFormsModule,
        MatDialogModule,
        MatPaginatorModule,
        MatSortModule,
        MatTableModule
      ],
      declarations: [CategoryAdminComponent],
      providers: [
        {
          provide: CategoryService,
          useValue: {
            getCategories$: () => of([]),
            updateCategory: () => of(null),
            deleteCategory: () => of(null),
            createCategory: () => of(null)
          }
        },
        {
          provide: SharedDataService,
          useValue: {
            requestCategoryCreation$: () => of(null)
          }
        },
        {
          provide: MatDialog,
          useValue: {
            open: () => ({ afterClosed: () => of(true) })
          }
        }
      ],
    })
    .compileComponents();

    fixture = TestBed.createComponent(CategoryAdminComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('devrait être créé', () => {
    expect(component).toBeTruthy();
  });
});
