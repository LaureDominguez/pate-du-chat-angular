import { TestBed } from '@angular/core/testing';
import { ProductService, Product, FinalProduct } from './product.service';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { SharedDataService } from './shared-data.service';
import { of } from 'rxjs';

describe('ProductService', () => {
  let service: ProductService;
  let httpMock: HttpTestingController;
  let sharedDataService: jasmine.SpyObj<SharedDataService>;

  const mockProducts: Product[] = [
    { 
      _id: '1', 
      name: 'Product 1', 
      category: 'cat1', 
      dlc: '05/12/2025', 
      cookInstructions: '10 min dans l\'eau bouillante', 
      stock: true, 
      stockQuantity: 5, 
      quantityType: 'piece', 
      price: 1 
    },
    { _id: '2', 
      name: 'Product 2', 
      category: 'cat2', 
      dlc: '3 jours', 
      cookInstructions: '15 min au four', 
      stock: true, 
      stockQuantity: 10, 
      quantityType: 'kg', 
      price: 2 
    },
  ];

  const mockFinalProducts: FinalProduct[] = [
    { ...mockProducts[0], allergens: [], vegan: false, vegeta: true },
    { ...mockProducts[1], allergens: [], vegan: true, vegeta: true },
  ];

  beforeEach(() => {
    const sharedDataServiceSpy = jasmine.createSpyObj('SharedDataService', [
      'notifyProductUpdate'
    ], {
      productListUpdate$: of(),
      categoryListUpdate$: of(),
      ingredientListUpdate$: of()
    });

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        ProductService,
        { provide: SharedDataService, useValue: sharedDataServiceSpy }
      ]
    });

    service = TestBed.inject(ProductService);
    httpMock = TestBed.inject(HttpTestingController);
    sharedDataService = TestBed.inject(SharedDataService) as jasmine.SpyObj<SharedDataService>;

    httpMock.expectOne('http://localhost:5000/api/products').flush([]);
    httpMock.expectOne('http://localhost:5000/api/products?view=full').flush([]);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('devrait être créé', () => {
    expect(service).toBeTruthy();
  });

  it('devrait charger les produits admin', (done) => {
    service['loadProducts']();
    httpMock.expectOne('http://localhost:5000/api/products').flush(mockProducts);

    service.getProducts().subscribe(products => {
      expect(products.length).toBe(2);
      expect(products[0].name).toBe('Product 1');
      done();
    });
  });

  it('devrait charger les produits finaux (public)', (done) => {
    service['loadFinalProducts']();
    httpMock.expectOne('http://localhost:5000/api/products?view=full').flush(mockFinalProducts);

    service.getFinalProducts().subscribe(products => {
      expect(products.length).toBe(2);
      expect(products[1].vegan).toBeTrue();
      done();
    });
  });

  it('devrait retourner un produit par ID', (done) => {
    service.getProductById('1').subscribe(product => {
      expect(product.name).toBe('Product 1');
      done();
    });

    httpMock.expectOne('http://localhost:5000/api/products/1').flush(mockProducts[0]);
  });

  it('devrait retourner un produit final par ID', (done) => {
    service.getFinalProductById('1').subscribe(product => {
      expect(product.name).toBe('Product 1');
      done();
    });

    httpMock.expectOne('http://localhost:5000/api/products/1?view=full').flush(mockFinalProducts[0]);
  });

  it('devrait retourner les produits contenant un ingrédient', (done) => {
    service.getProductsByIngredient('abc123').subscribe(products => {
      expect(products.length).toBe(2);
      done();
    });

    httpMock.expectOne('http://localhost:5000/api/products/by-ingredient/abc123').flush(mockProducts);
  });

  it('devrait charger les DLC', (done) => {
    const mockDlcs = ['7 jours', '14 jours'];
    service.getDlcs().subscribe(dlcs => {
      expect(dlcs).toEqual(mockDlcs);
      done();
    });

    httpMock.expectOne('../assets/data/dlcs.json').flush(mockDlcs);
  });

  it('devrait gérer les erreurs lors du chargement des DLC', (done) => {
    service.getDlcs().subscribe({
      next: () => fail('Erreur attendue'),
      error: (error) => {
        expect(error.message).toContain('Impossible de charger les DLCs');
        done();
      }
    });

    httpMock.expectOne('../assets/data/dlcs.json').flush({}, { status: 500, statusText: 'Erreur serveur' });
  });

  it('devrait vérifier l’existence d’un nom de produit', (done) => {
    service.checkExistingProducName('Produit A').subscribe((exists) => {
      expect(exists).toBeTrue();
      done();
    });

    httpMock.expectOne('http://localhost:5000/api/products/check-name/Produit%20A').flush(true);
  });

  it('devrait créer un produit et notifier la mise à jour', () => {
    const payload = { name: 'New Product' };
    service.createProduct(payload).subscribe((product) => {
      expect(product.name).toBe('New Product');
      expect(sharedDataService.notifyProductUpdate).toHaveBeenCalled();
    });

    httpMock.expectOne('http://localhost:5000/api/products').flush(payload);
    httpMock.expectOne('http://localhost:5000/api/products?view=full').flush([]);

  });

  it('devrait mettre à jour un produit et notifier la mise à jour', () => {
    const payload = { name: 'Updated Product' };
    service.updateProduct('1', payload).subscribe((product) => {
      expect(product.name).toBe('Updated Product');
      expect(sharedDataService.notifyProductUpdate).toHaveBeenCalled();
    });

    httpMock.expectOne('http://localhost:5000/api/products/1').flush(payload);
    httpMock.expectOne('http://localhost:5000/api/products?view=full').flush([]);

  });

  it('devrait supprimer un produit et notifier la mise à jour', () => {
    service.deleteProduct('1').subscribe((res) => {
      expect(res.message).toBe('Produit supprimé');
      expect(sharedDataService.notifyProductUpdate).toHaveBeenCalled();
    });

    httpMock.expectOne('http://localhost:5000/api/products/1').flush({ message: 'Produit supprimé' });
    httpMock.expectOne('http://localhost:5000/api/products?view=full').flush([]);

  });

  it('devrait gérer les erreurs Express Validator', (done) => {
    const payload = { name: '' };
    service.createProduct(payload).subscribe({
      next: () => fail('Erreur attendue'),
      error: (error) => {
        expect(error.message).toContain('Nom requis.');
        expect(error.message).toContain('Prix invalide.');
        done();
      }
    });

    httpMock.expectOne('http://localhost:5000/api/products').flush({
      errors: [{ msg: 'Nom requis.' }, { msg: 'Prix invalide.' }]
    }, { status: 400, statusText: 'Bad Request' });
  });
});
