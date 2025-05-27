import { TestBed } from '@angular/core/testing';
import { SharedDataService, QuickCreateData } from './shared-data.service';
import { Category } from '../models/category';
// import { Ingredient } from '../models/ingredient';
import { Supplier } from '../models/supplier';
import { firstValueFrom } from 'rxjs';

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
  it('devrait émettre une demande de création de catégorie', async () => {
    const testData: QuickCreateData = { name: 'Test Category' };

    firstValueFrom(service.requestNewCategory$).then((data) => {
      expect(data).toEqual(testData);
    });

    service.requestCategoryCreation(testData);
  });

  it('devrait envoyer une catégorie créée au product-form', async () => {
    const testCategory: Category = { _id: '1', name: 'Test Category' };

    firstValueFrom(service.categoryCreated$).then((category) => {
      expect(category).toEqual(testCategory);
    });

    service.sendCategoryToProductForm(testCategory);
  });

  it('devrait notifier une mise à jour des catégories', async () => {
    firstValueFrom(service.categoryListUpdate$).then(() => {
      expect(true).toBeTrue();
    });

    service.notifyCategoryUpdate();
  });

  ///////////////////////////////////////////
  /////////////// Suppliers  ////////////////
  it('devrait émettre une demande de création de fournisseur', async () => {
    const testData: QuickCreateData = { name: 'Test Supplier' };

    firstValueFrom(service.requestNewSupplier$).then((data) => {
      expect(data).toEqual(testData);
    });

    service.requestSupplierCreation(testData);
  });

  it('devrait envoyer un fournisseur créé à ingredient-form', async () => {
    const testSupplier: Supplier = { _id: '1', name: 'Test Supplier' };

    firstValueFrom(service.supplierCreated$).then((supplier) => {
      expect(supplier).toEqual(testSupplier);
    });

    service.sendSupplierToIngredientForm(testSupplier);
  });

  it('devrait notifier une mise à jour des fournisseurs', async () => {
    firstValueFrom(service.supplierListUpdate$).then(() => {
      expect(true).toBeTrue();
    });

    service.notifySupplierUpdate();
  });

  //   it('devrait émettre une demande de remplacement de supplier dans les ingrédients', async () => {
  //   const payload = {
  //     oldSupplierId: 'supplier-1',
  //     newSupplierId: 'default-supplier',
  //     ingredientIds: ['ing1', 'ing2']
  //   };

  //   firstValueFrom(service.replaceSupplierInIngredients$).then((data) => {
  //     expect(data).toEqual(payload);
  //   });

  //   service.emitReplaceSupplierInIngredients(payload.oldSupplierId, payload.newSupplierId, payload.ingredientIds);
  // });

  //   it('devrait émettre la confirmation du remplacement des suppliers dans les ingrédients', async () => {
  //   firstValueFrom(service.replaceSupplierInIngredientsComplete$).then((success) => {
  //     expect(success).toBeTrue();
  //   });

  //   service.emitReplaceSupplierInIngredientsComplete(true);
  // });

  // it('devrait émettre un échec de remplacement des suppliers dans les ingrédients', async () => {
  //   firstValueFrom(service.replaceSupplierInIngredientsComplete$).then((success) => {
  //     expect(success).toBeFalse();
  //   });

  //   service.emitReplaceSupplierInIngredientsComplete(false);
  // });

  it('devrait notifier une demande de création d\'ingrédient', async () => {
    firstValueFrom(service.requestNewIngredient$).then(() => {
      expect(true).toBeTrue();
    });

    service.requestOpenIngredientForm('TestValue');
  });

  it('devrait récupérer la valeur recherchée pour un ingrédient', () => {
    service.requestOpenIngredientForm('pomme');
    const value = service.getSearchedIngredient();
    expect(value).toBe('pomme');
  });



  ///////////////////////////////////////////
  /////////////// Ingredients ///////////////
  it('devrait notifier une mise à jour de la composition des ingrédients', async () => {
    firstValueFrom(service.ingredientCompositionUpdate$).then(() => {
      expect(true).toBeTrue();
    });

    service.notifyIngredientCompositionUpdate();
  });

  it('devrait notifier une mise à jour des produits', async () => {
    firstValueFrom(service.productListUpdate$).then(() => {
      expect(true).toBeTrue();
    });

    service.notifyProductUpdate();
  });

  ///////////////////////////////////////////
  // //////////////// Images ///////////////////
  it('devrait émettre une demande de téléchargement d\'image', async () => {
    const imagePath = '/uploads/test.jpg';
    const objectName = 'Test Image';

    // On déclenche l'émission de l'image
    service.emitDownloadImage(imagePath, objectName);

    // On récupère la valeur émise avec firstValueFrom
    const receivedData = await firstValueFrom(service.downloadImage$);

    // On vérifie la valeur reçue
    expect(receivedData).toEqual({ imagePath, objectName });
  });

});
