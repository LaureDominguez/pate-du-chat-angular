import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SupplierAdminComponent } from './supplier-admin.component';

describe('SupplierAdminComponent', () => {
  let component: SupplierAdminComponent;
  let fixture: ComponentFixture<SupplierAdminComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SupplierAdminComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SupplierAdminComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
