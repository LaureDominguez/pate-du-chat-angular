import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProductCardComponent } from './product-card.component';
import { MatCardModule } from '@angular/material/card';
import { CommonModule } from '@angular/common';
import { By } from '@angular/platform-browser';

describe('ProductCardComponent', () => {
  let component: ProductCardComponent;
  let fixture: ComponentFixture<ProductCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        CommonModule,
        MatCardModule,
        ProductCardComponent
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ProductCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('devrait être créé', () => {
    expect(component).toBeTruthy();
  });

  it('devrait afficher les informations du produit', () => {
    component.product = {
      id: '1',
      name: 'Produit Test',
      price: 10,
      stockQuantity: 5,
      stock: true,
      category: { id: 'cat1', name: 'Catégorie Test' },
      allergens: [],
      vegan: false,
      vegeta: true,
      dlc: '',
      images: []
    } as any;
    fixture.detectChanges();
    
    const productName = fixture.debugElement.query(By.css('.product-name')).nativeElement;
    expect(productName.textContent).toContain('Produit Test');
  });

  it('devrait émettre un événement closeClick lorsque l\'icône de fermeture est cliquée', () => {
    spyOn(component.closeClick, 'emit');
    const closeButton = fixture.debugElement.query(By.css('.close-button'));
    closeButton.triggerEventHandler('click', new Event('click'));
    expect(component.closeClick.emit).toHaveBeenCalled();
  });

  it('devrait changer d\'état lorsque isSelected est modifié', () => {
    component.isSelected = true;
    fixture.detectChanges();
    const card = fixture.debugElement.query(By.css('.selected'));
    expect(card).toBeTruthy();
  });
});
