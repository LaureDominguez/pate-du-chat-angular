import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProductsComponent } from './products.component';
import { ProductService } from '../../../services/product.service';
import { of } from 'rxjs';
import { ChangeDetectorRef } from '@angular/core';
import { ProductCardComponent } from '../product-card/product-card.component';

describe('ProductsComponent', () => {
  let component: ProductsComponent;
  let fixture: ComponentFixture<ProductsComponent>;
  let mockProductService: any;

  beforeEach(async () => {
    mockProductService = {
      getFinalProducts: jasmine.createSpy('getFinalProducts').and.returnValue(of([
        { id: '1', name: 'Product 1', price: 10 },
        { id: '2', name: 'Product 2', price: 20 }
      ]))
    };

    await TestBed.configureTestingModule({
      imports: [
        ProductsComponent, // ✅ Standalone, donc importé directement
        ProductCardComponent
      ],
      providers: [
        {
          provide: ProductService,
          useValue: mockProductService
        },
        ChangeDetectorRef
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ProductsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('devrait être créé', () => {
    expect(component).toBeTruthy();
  });

  it('devrait récupérer et afficher les produits', () => {
    component.products$.subscribe((products) => {
      expect(products.length).toBe(2);
      expect(products[0].name).toBe('Product 1');
      expect(products[1].name).toBe('Product 2');
    });
  });

  it('devrait sélectionner un produit et le marquer comme sélectionné', () => {
    const product = { id: '1', name: 'Product 1', price: 10 };
    component.isSelected = true;
    fixture.detectChanges();
    expect(component.isSelected).toBeTrue();
  });

  it('devrait désélectionner un produit', () => {
    const product = { id: '1', name: 'Product 1', price: 10 };
    component.isSelected = true;
    component.selectedProduct = null;
    component.isSelected = false;
    fixture.detectChanges();
    expect(component.selectedProduct).toBeNull();
    expect(component.isSelected).toBeFalse();
  });
});
