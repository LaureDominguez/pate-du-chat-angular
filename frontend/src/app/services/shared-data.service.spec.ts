import { TestBed } from '@angular/core/testing';
import { SharedDataService, QuickCreateData } from './shared-data.service';
import { Category } from '../models/category';
import { Ingredient } from '../models/ingredient';
import { Supplier } from '../models/supplier'; // Corrigé

describe('SharedDataService', () => {
  let service: SharedDataService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SharedDataService]
    });
    service = TestBed.inject(SharedDataService);
  });

  it('devrait être créé', () => {
    expect(service).toBeTruthy();
  });

  ///////////////////////////////////////////
  /////////////// Categories  ///////////////
  it('devrait émettre une demande de création de catégorie', (done) => {
    const testData: QuickCreateData = { name: 'Test Category' };

    service.requestNewCategory$.subscribe((data) => {
      expect(data).toEqual(testData);
      done();
    });

    service.requestCategoryCreation(testData);
  });

  it('devrait envoyer une catégorie créée au product-form', (done) => {
    const testCategory: Category = { _id: '1', name: 'Test Category' };

    service.categoryCreated$.subscribe((category) => {
      expect(category).toEqual(testCategory);
      done();
    });

    service.sendCategoryToProductForm(testCategory);
  });

  it('devrait notifier une mise à jour des catégories', (done) => {
    service.categoryListUpdate$.subscribe(() => {
      expect(true).toBeTrue();
      done();
    });

    service.notifyCategoryUpdate();
  });

  ///////////////////////////////////////////
  /////////////// Suppliers  ////////////////
  it('devrait émettre une demande de création de fournisseur', (done) => {
    const testData: QuickCreateData = { name: 'Test Supplier' };

    service.requestNewSupplier$.subscribe((data) => {
      expect(data).toEqual(testData);
      done();
    });

    service.requestSupplierCreation(testData);
  });

  it('devrait envoyer un fournisseur créé à ingredient-form', (done) => {
    const testSupplier: Supplier = { _id: '1', name: 'Test Supplier' };

    service.supplierCreated$.subscribe((supplier) => {
      expect(supplier).toEqual(testSupplier);
      done();
    });

    service.sendSupplierToIngredientForm(testSupplier);
  });

  it('devrait notifier une mise à jour des fournisseurs', (done) => {
    service.supplierListUpdate$.subscribe(() => {
      expect(true).toBeTrue();
      done();
    });

    service.notifySupplierUpdate();
  });

  ///////////////////////////////////////////
  /////////////// Ingredients ///////////////
  it('devrait notifier une mise à jour de la composition des ingrédients', (done) => {
    service.ingredientCompositionUpdate$.subscribe(() => {
      expect(true).toBeTrue();
      done();
    });

    service.notifyIngredientCompositionUpdate();
  });

  it('devrait notifier une mise à jour des produits', (done) => {
    service.productListUpdate$.subscribe(() => {
      expect(true).toBeTrue();
      done();
    });

    service.notifyProductUpdate();
  });

  ///////////////////////////////////////////
  //////////////// Images ///////////////////
  it('devrait émettre une demande de téléchargement d\'image', (done) => {
    const imagePath = '/uploads/test.jpg';
    const objectName = 'Test Image';

    service.downloadImage$.subscribe((data) => {
      expect(data).toEqual({ imagePath, objectName });
      done();
    });

    service.emitDownloadImage(imagePath, objectName);
  });
});
