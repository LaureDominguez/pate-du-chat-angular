import { TestBed } from '@angular/core/testing';
import { ProductService, Product } from './product.service';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { SharedDataService } from './shared-data.service';
import { provideHttpClient, withJsonpSupport, withInterceptors } from '@angular/common/http';

describe('ProductService', () => {
  let service: ProductService;
  let httpMock: HttpTestingController;
  let sharedDataService: jasmine.SpyObj<SharedDataService>;

  const mockProducts: Product[] = [
    {
      _id: '1', name: 'Product 1', price: 10, category: { _id: 'cat1', name: 'Catégorie 1' },
      dlc: '',
      cookInstructions: '',
      stock: false,
      stockQuantity: 0,
      quantityType: ''
    },
    {
      _id: '2', name: 'Product 2', price: 20, category: { _id: 'cat2', name: 'Catégorie 2' },
      dlc: '',
      cookInstructions: '',
      stock: false,
      stockQuantity: 0,
      quantityType: ''
    },
  ];

  beforeEach(() => {
    const sharedDataServiceSpy = jasmine.createSpyObj('SharedDataService', ['notifyProductUpdate']);
    
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(
          withJsonpSupport(), // Support JSONP si besoin
          withInterceptors([]) // Pas d'intercepteurs dans ce test
        ),
        provideHttpClientTesting(),
        ProductService,
        { provide: SharedDataService, useValue: sharedDataServiceSpy }
      ]
    });

    service = TestBed.inject(ProductService);
    httpMock = TestBed.inject(HttpTestingController);
    sharedDataService = TestBed.inject(SharedDataService) as jasmine.SpyObj<SharedDataService>;
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('devrait être créé', () => {
    expect(service).toBeTruthy();
  });

  it('devrait charger les produits (admin)', () => {
    service.loadProducts();
    const req = httpMock.expectOne('http://localhost:5000/api/products');
    req.flush(mockProducts);
    
    service.getProducts().subscribe(products => {
      expect(products.length).toBe(2);
      expect(products[0].name).toBe('Product 1');
    });
  });

  it('devrait charger les produits finaux (shop)', () => {
    service.loadFinalProducts();
    const req = httpMock.expectOne('http://localhost:5000/api/products?view=full');
    req.flush(mockProducts);
    
    service.getFinalProducts().subscribe(products => {
      expect(products.length).toBe(2);
      expect(products[0].name).toBe('Product 1');
    });
  });

  it('devrait créer un produit et notifier SharedDataService', () => {
    const newProduct = { name: 'New Product' };
    
    service.createProduct(newProduct).subscribe((product) => {
      expect(product.name).toBe('New Product');
      expect(sharedDataService.notifyProductUpdate).toHaveBeenCalled();
    });

    const req = httpMock.expectOne('http://localhost:5000/api/products');
    req.flush(newProduct);
  });

  it('devrait mettre à jour un produit et notifier SharedDataService', () => {
    const updatedProduct = { _id: '1', name: 'Updated Product' };
    
    service.updateProduct('1', updatedProduct).subscribe((product) => {
      expect(product.name).toBe('Updated Product');
      expect(sharedDataService.notifyProductUpdate).toHaveBeenCalled();
    });

    const req = httpMock.expectOne('http://localhost:5000/api/products/1');
    req.flush(updatedProduct);
  });

  it('devrait supprimer un produit et notifier SharedDataService', () => {
    service.deleteProduct('1').subscribe((response) => {
      expect(response.message).toBe('Product deleted');
      expect(sharedDataService.notifyProductUpdate).toHaveBeenCalled();
    });

    const req = httpMock.expectOne('http://localhost:5000/api/products/1');
    req.flush({ message: 'Product deleted' });
  });

  it('devrait charger les DLCs', () => {
    const mockDlcs = [{ name: 'DLC 1' }];
    
    service.getDlcs().subscribe(dlcs => {
      expect(dlcs.length).toBe(1);
      expect(dlcs[0].name).toBe('DLC 1');
    });

    const req = httpMock.expectOne('../assets/data/dlcs.json');
    req.flush(mockDlcs);
  });

  it('devrait gérer les erreurs et afficher un message d\'erreur', () => {
    service.getDlcs().subscribe({
      next: () => fail('La requête aurait dû échouer.'),
      error: (error) => {
        expect(error.message).toBe('Impossible de charger les DLCs.');
      }
    });
  
    const req = httpMock.expectOne('../assets/data/dlcs.json');
    req.flush({ message: 'Erreur serveur' }, { status: 500, statusText: 'Server Error' });
  });
  

  it('devrait vérifier l\'existence d\'un nom de produit', () => {
    service.checkExistingProducName('Product 1').subscribe((exists) => {
      expect(exists).toBeTrue();
    });

    const req = httpMock.expectOne('http://localhost:5000/api/products/check-name/Product%201');
    req.flush(true);
  });
});
