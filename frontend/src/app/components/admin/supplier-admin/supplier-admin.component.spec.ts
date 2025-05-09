import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SupplierAdminComponent } from './supplier-admin.component';
import { ReactiveFormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { of } from 'rxjs';
import { SharedDataService } from '../../../services/shared-data.service';
import { SupplierService } from '../../../services/supplier.service';

describe('SupplierAdminComponent', () => {
  let component: SupplierAdminComponent;
  let fixture: ComponentFixture<SupplierAdminComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ReactiveFormsModule,
        MatDialogModule,
        MatPaginatorModule,
        MatSortModule,
        MatTableModule,
        SupplierAdminComponent
      ],
      providers: [
        {
          provide: SupplierService,
          useValue: {
            getSuppliers$: () => of([]),
            createSupplier: () => of(null),
            updateSupplier: () => of(null),
            deleteSupplier: () => of(null)
          }
        },
        {
          provide: SharedDataService,
          useValue: {
            requestSupplierCreation$: () => of(null)
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

    fixture = TestBed.createComponent(SupplierAdminComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('devrait être créé', () => {
    expect(component).toBeTruthy();
  });
});
