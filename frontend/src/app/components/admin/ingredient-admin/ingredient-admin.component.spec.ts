import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IngredientAdminComponent } from './ingredient-admin.component';

describe('IngredientAdminComponent', () => {
  let component: IngredientAdminComponent;
  let fixture: ComponentFixture<IngredientAdminComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IngredientAdminComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(IngredientAdminComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
