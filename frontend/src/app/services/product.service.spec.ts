import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  provideHttpClientTesting,
  HttpTestingController,
} from '@angular/common/http/testing';
import { ProductService } from './product.service';
import { SharedDataService } from './shared-data.service';
import { DialogService } from './dialog.service';
import { of } from 'rxjs';
import { Product } from '../models/product';
import { DEFAULT_CATEGORY } from '../models/category';

// ------------------------------------------------------------------
//  Spécifications – ProductService (Angular 19 providers)
// ------------------------------------------------------------------
//  Couvre : chargement + mapping DEFAULT_CATEGORY, getById/Category/Ingredient,
//  CRUD, flags, vérif nom, JSON (DLC), gestion erreurs & handleError
// ------------------------------------------------------------------

describe('ProductService', () => {
  let service: ProductService;
  let httpMock: HttpTestingController;
  let sharedSpy: jasmine.SpyObj<SharedDataService>;
  let dialogSpy: jasmine.SpyObj<DialogService>;

  const apiUrl = 'http://localhost:5000/api/products';

  const mockProducts: Product[] = [
    {
      _id: '1',
      name: 'Ravioli',
      category: undefined as any, // pour mapping DEFAULT_CATEGORY
      dlc: '05/12/2025',
      cookInstructions: '10 min',
      stock: true,
      stockQuantity: 5,
      quantityType: 'piece',
      price: 10,
    } as Product,
    {
      _id: '2',
      name: 'Sauce tomate',
      category: 'cat2',
      dlc: '3 jours',
      cookInstructions: 'chauffer',
      stock: true,
      stockQuantity: 10,
      quantityType: 'kg',
      price: 5,
    } as Product,
  ];

  beforeEach(() => {
    sharedSpy = jasmine.createSpyObj(
      'SharedDataService',
      ['notifyProductUpdate'],
      {
        productListUpdate$: of(),
        categoryListUpdate$: of(),
        ingredientListUpdate$: of(),
      }
    );

    dialogSpy = jasmine.createSpyObj('DialogService', ['error']);

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        ProductService,
        { provide: SharedDataService, useValue: sharedSpy },
        { provide: DialogService, useValue: dialogSpy },
      ],
    });

    service = TestBed.inject(ProductService);
    httpMock = TestBed.inject(HttpTestingController);

    // GET initial (constructor)
    httpMock.expectOne(apiUrl).flush([]);
  });

  afterEach(() => {
    httpMock.verify();
  });

  // ---------------------------------------------------------------
  //  Construction & chargement
  // ---------------------------------------------------------------
  it('doit être créé', () => {
    expect(service).toBeTruthy();
  });

  it('doit charger les produits (mapping DEFAULT_CATEGORY)', (done) => {
    service['loadProducts']();
    httpMock.expectOne(apiUrl).flush(mockProducts);

    service.getProducts().subscribe((prods) => {
      expect(prods.length).toBe(2);
      expect(prods[0].category).toEqual(DEFAULT_CATEGORY);
      done();
    });
  });

  // ---------------------------------------------------------------
  //  getProductById / getProductsByCategory / Ingredient
  // ---------------------------------------------------------------
  it('doit retourner un produit par ID avec catégorie mappée', (done) => {
    service.getProductById('1').subscribe((p) => {
      expect(p._id).toBe('1');
      expect(p.category).toEqual(DEFAULT_CATEGORY);
      done();
    });

    httpMock.expectOne(`${apiUrl}/1`).flush(mockProducts[0]);
  });

  it('doit retourner les produits par catégorie', (done) => {
    const catId = 'cat2';
    service.getProductsByCategory(catId).subscribe((prods) => {
      expect(prods.length).toBe(2);
      done();
    });

    httpMock.expectOne(`${apiUrl}/by-category/${catId}`).flush(mockProducts);
  });

  it('doit retourner les produits par ingrédient', (done) => {
    const ingId = 'ing1';
    service.getProductsByIngredient(ingId).subscribe((prods) => {
      expect(prods.length).toBe(2);
      done();
    });

    httpMock.expectOne(`${apiUrl}/by-ingredient/${ingId}`).flush(mockProducts);
  });

  // ---------------------------------------------------------------
  //  getDlcs
  // ---------------------------------------------------------------
  it('doit charger les DLCs', (done) => {
    const dlcs = ['7 jours', '14 jours'];
    service.getDlcs().subscribe((d) => {
      expect(d).toEqual(dlcs);
      done();
    });

    httpMock.expectOne('../assets/data/dlcs.json').flush(dlcs);
  });

  it('doit gérer erreur 500 sur DLC et propager message', (done) => {
    service.getDlcs().subscribe({
      next: () => fail('Erreur attendue'),
      error: (err) => {
        expect(err.message).toContain('Impossible de charger');
        done();
      },
    });

    httpMock.expectOne('../assets/data/dlcs.json').flush({}, { status: 500, statusText: 'Server Error' });
  });

  // ---------------------------------------------------------------
  //  checkExistingProductName
  // ---------------------------------------------------------------
  it('doit retourner true si nom existe déjà', (done) => {
    const name = 'Ravioli';
    service.checkExistingProductName(name).subscribe((exists) => {
      expect(exists).toBeTrue();
      done();
    });

    httpMock.expectOne(`${apiUrl}/check-name/${encodeURIComponent(name)}`).flush(true);
  });

  it('doit gérer erreur serveur sur checkName (pas de dialogService)', (done) => {
    const name = 'Erreur';
    service.checkExistingProductName(name).subscribe({
      next: () => fail('Erreur attendue'),
      error: (err) => {
        expect(err.message).toContain('Impossible de charger');
        expect(dialogSpy.error).not.toHaveBeenCalled();
        done();
      },
    });

    httpMock.expectOne(`${apiUrl}/check-name/${encodeURIComponent(name)}`).flush({}, { status: 500, statusText: 'Server Error' });
  });

  // ---------------------------------------------------------------
  //  CRUD
  // ---------------------------------------------------------------
  it('doit créer un produit et notifier', () => {
    const payload = { name: 'Nouveau' } as any;

    service.createProduct(payload).subscribe((created) => {
      expect(created.name).toBe('Nouveau');
      expect(sharedSpy.notifyProductUpdate).toHaveBeenCalled();
    });

    httpMock.expectOne(apiUrl).flush({ _id: '9', ...payload });
  });

  it('doit mettre à jour un produit et notifier la mise à jour', () => {
    const payload = { name: 'Maj' } as Product;

    service.updateProduct('1', payload).subscribe((upd) => {
      expect(upd.name).toBe('Maj');
      expect(sharedSpy.notifyProductUpdate).toHaveBeenCalled();
    });

    httpMock.expectOne(`${apiUrl}/1`).flush({ _id: '1', ...payload });
  });

  it('doit supprimer un produit et notifier', () => {
    service.deleteProduct('1').subscribe((res) => {
      expect(res.message).toBe('deleted');
      expect(sharedSpy.notifyProductUpdate).toHaveBeenCalled();
    });

    const req = httpMock.expectOne(`${apiUrl}/1`);
    expect(req.request.method).toBe('DELETE');
    req.flush({ message: 'deleted' });
  });

  // ---------------------------------------------------------------
  //  handleError – erreur 400 avec messages Express-validator
  // ---------------------------------------------------------------
  it('doit concaténer les messages Express-validator et appeler dialogService.error', (done) => {
    const errors = [{ msg: 'Nom requis.' }, { msg: 'Prix invalide.' }];
    const payload = { name: '' } as any;

    service.createProduct(payload).subscribe({
      next: () => fail('Erreur attendue'),
      error: (err) => {
        expect(err.message).toContain('Nom requis.');
        expect(err.message).toContain('Prix invalide.');
        expect(dialogSpy.error).toHaveBeenCalled();
        done();
      },
    });

    httpMock.expectOne(apiUrl).flush({ errors }, { status: 400, statusText: 'Bad Request' });
  });
});
