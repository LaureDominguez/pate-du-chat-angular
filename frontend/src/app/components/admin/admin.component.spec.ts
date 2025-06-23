import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminComponent } from './admin.component';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { DialogService } from '../../services/dialog.service';
import { SharedDataService } from '../../services/shared-data.service';
import { DeviceService } from '../../services/device.service';
import { CategoryService } from '../../services/category.service';
import { ProductService } from '../../services/product.service';
import { IngredientService } from '../../services/ingredient.service';
import { SupplierService } from '../../services/supplier.service';
import { of, Subject } from 'rxjs';
import { provideHttpClient } from '@angular/common/http';

describe('AdminComponent', () => {
  let component: AdminComponent;
  let fixture: ComponentFixture<AdminComponent>;

  const dialogSpy = jasmine.createSpyObj('DialogService', ['error', 'info', 'confirm']);

  const sharedDataServiceStub = {
    // observables simulés
    replaceSupplierInIngredients$: new Subject<any>(),
    ingredientListUpdate$: new Subject<any>(),
    categoryListUpdate$: new Subject<any>(),
    productListUpdate$: new Subject<any>(),

    // méthodes simulées
    notifyIngredientUpdate: jasmine.createSpy('notifyIngredientUpdate'),
    notifyCategoryUpdate: jasmine.createSpy('notifyCategoryUpdate'),
    notifyProductUpdate: jasmine.createSpy('notifyProductUpdate'),
  };

  const deviceServiceStub = {
    isMobile$: of(false),
  };

  const categoryServiceStub = {
    getCategories: jasmine.createSpy().and.returnValue(of([
      { _id: 'cat1', name: 'Catégorie A', description: 'desc' },
      { _id: 'cat2', name: 'Catégorie B', description: 'desc' }
    ]))
  };

  const supplierServiceStub = {
    getSuppliers: jasmine.createSpy().and.returnValue(of([
      { _id: 's1', name: 'Fournisseur A', description: 'desc' }
    ]))
  };

  const ingredientServiceStub = {
    getIngredients: jasmine.createSpy().and.returnValue(of([
      { _id: 'i1', name: 'Ingrédient A', supplier: 's1', bio: true, type: 'simple', allergens: [], vegan: true, vegeta: true, origin: 'fr' },
      { _id: 'i2', name: 'Ingrédient B', supplier: 's1', bio: false, type: 'simple', allergens: [], vegan: true, vegeta: false, origin: 'fr' },
      { _id: 'i3', name: 'Ingrédient C', supplier: 's1', bio: true, type: 'simple', allergens: [], vegan: false, vegeta: false, origin: 'fr' },
    ]))
  };

  const productServiceStub = {
    getProducts: jasmine.createSpy().and.returnValue(of([
      {
        _id: 'p1',
        name: 'Produit A',
        category: 'cat1',
        description: 'desc',
        composition: [],
        dlc: '2025-12-31',
        cookInstructions: 'Chauffer',
        stock: true,
        stockQuantity: 10,
        quantityType: 'pièce',
        price: 4.99,
      }
    ]))
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        AdminComponent,
        provideHttpClient(),
        provideHttpClientTesting()
      ],
      providers: [
        { provide: DialogService, useValue: dialogSpy },
        { provide: SharedDataService, useValue: sharedDataServiceStub },
        { provide: DeviceService, useValue: deviceServiceStub },
        { provide: CategoryService, useValue: categoryServiceStub },
        { provide: SupplierService, useValue: supplierServiceStub },
        { provide: IngredientService, useValue: ingredientServiceStub },
        { provide: ProductService, useValue: productServiceStub },
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AdminComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('devrait créer le composant', () => {
    expect(component).toBeTruthy();
  });

  // it('devrait charger les compteurs au ngOnInit', () => {
  //   expect(component.categoryCount).toBe(2);
  //   expect(component.ingredientCount).toBe(3);
  //   expect(component.productCount).toBe(1);
  //   expect(component.supplierCount).toBe(1);
  // });

  // it('devrait détecter l’affichage solo d’un panel', () => {
  //   component.ngOnInit();
  //   expect(component.isOnlyOnePanelVisible()).toBeFalse();
  //   component.activePanel = 'product';
  //   expect(component.isOnlyOnePanelVisible()).toBeTrue();
  // });

  // it('devrait retourner le bon template pour un panel', () => {
  //   component.activePanel = 'product';
  //   expect(component.getTemplateToShow('product')).toBeTrue();
  //   expect(component.getTemplateToShow('ingredient')).toBeFalse();
  // });

  // it('devrait activer un panel', () => {
  //   component.setActivePanel('ingredient');
  //   expect(component.activePanel).toBe('ingredient');
  // });

  // it('devrait désactiver le panel au clic sur fermeture', () => {
  //   component.setActivePanel('ingredient');
  //   component.closePanel();
  //   expect(component.activePanel).toBe('');
  // });
});
