import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ProductAdminComponent } from './product-admin.component';
import { ProductService } from '../../../services/product.service';
import { IngredientService } from '../../../services/ingredient.service';
import { CategoryService } from '../../../services/category.service';
import { ImageService } from '../../../services/image.service';
import { DeviceService } from '../../../services/device.service';
import { DialogService } from '../../../services/dialog.service';
import { MatDialog } from '@angular/material/dialog';
import { AdminModule } from '../admin.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { of, BehaviorSubject } from 'rxjs';
import { ProductFormComponent } from './product-form/product-form.component';
import { Product } from '../../../models/product';

describe('ProductAdminComponent', () => {
  let component: ProductAdminComponent;
  let fixture: ComponentFixture<ProductAdminComponent>;
  let productServiceSpy: jasmine.SpyObj<ProductService>;
  let ingredientServiceSpy: jasmine.SpyObj<IngredientService>;
  let categoryServiceSpy: jasmine.SpyObj<CategoryService>;
  let imageServiceSpy: jasmine.SpyObj<ImageService>;
  let deviceServiceStub: Partial<DeviceService>;
  let dialogServiceSpy: jasmine.SpyObj<DialogService>;

  const matDialogSpy = jasmine.createSpyObj('MatDialog', ['open']);

  const mockProduct: Product = {
    _id: '1',
    name: 'Produit A',
    category: {
      _id: 'cat1',
      name: 'Entrées',
      description: 'Catégorie de test'
    },
    description: 'Un délicieux produit de test',
    composition: [],
    dlc: '2025-12-31',
    cookInstructions: 'Réchauffer 10 min à 180°C',
    stock: true,
    stockQuantity: 42,
    quantityType: 'g',
    price: 4.99,
    images: ['/uploads/image1.jpg'],
    allergens: ['gluten'],
    vegan: false,
    vegeta: true
  };


  beforeEach(async () => {
    productServiceSpy = jasmine.createSpyObj('ProductService', [
      'loadProducts', 'getDlcs', 'createProduct', 'updateProduct', 'deleteProduct', 'checkExistingProducName'
    ], {
      Products$: new BehaviorSubject<Product[]>([]),
    });
    productServiceSpy.getDlcs.and.returnValue(of([]));

    ingredientServiceSpy = jasmine.createSpyObj('IngredientService', [], {
      ingredients$: new BehaviorSubject([]),
    });

    categoryServiceSpy = jasmine.createSpyObj('CategoryService', [], {
      categories$: new BehaviorSubject([]),
    });

    imageServiceSpy = jasmine.createSpyObj('ImageService', [
      'uploadImages', 'deleteImage', 'downloadImage', 'getImageUrl'
    ]);

    deviceServiceStub = {
      isMobile$: of(false)
    };

    dialogServiceSpy = jasmine.createSpyObj('DialogService', ['error', 'success', 'confirm']);

    const fakeDialogRef = jasmine.createSpyObj('MatDialogRef', ['close', 'afterClosed'], {
      componentInstance: {
        checkNameExists: of('Produit test'),
        validateStockAndPrice: jasmine.createSpy(),
        formValidated: of()
      }
    });
    fakeDialogRef.afterClosed.and.returnValue(of(null));
    matDialogSpy.open.and.returnValue(fakeDialogRef);


    await TestBed.configureTestingModule({
      imports: [
        AdminModule,
        // BrowserAnimationsModule,
        ProductAdminComponent,
        ProductFormComponent
      ],
      providers: [
        { provide: ProductService, useValue: productServiceSpy },
        { provide: IngredientService, useValue: ingredientServiceSpy },
        { provide: CategoryService, useValue: categoryServiceSpy },
        { provide: ImageService, useValue: imageServiceSpy },
        { provide: DeviceService, useValue: deviceServiceStub },
        { provide: DialogService, useValue: dialogServiceSpy },
        { provide: MatDialog, useValue: matDialogSpy }
      ]
    }).compileComponents();

    TestBed.overrideComponent(ProductAdminComponent, {
      set: {
        providers: [
          { provide: MatDialog, useValue: matDialogSpy }
        ]
      }
    });

    productServiceSpy.getDlcs.and.returnValue(of([]));
    // (productServiceSpy.Products$ as BehaviorSubject<Product[]>).next([mockProduct]);

    fixture = TestBed.createComponent(ProductAdminComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('devrait créer le composant', () => {
    expect(component).toBeTruthy();
  });

  it('devrait charger les produits depuis le service à l\'initialisation', () => {
    component.loadData();
    expect(component.products.data.length).toBe(1);
    expect(component.products.data[0].name).toBe('Produit A');
    expect(component.products.data[0].category).toEqual(mockProduct.category);
  });


  it('devrait appeler le formulaire avec les données du produit', () => {
    const produit = {
      _id: '1',
      name: 'Test',
      images: ['/uploads/test.jpg']
    } as any;

    imageServiceSpy.getImageUrl.and.returnValue('http://localhost/uploads/test.jpg');
    // productServiceSpy.checkExistingProducName.and.returnValue(of(false));

    component.openProductForm(produit);

    expect(matDialogSpy.open).toHaveBeenCalled();
    expect(imageServiceSpy.getImageUrl).toHaveBeenCalledWith('/uploads/test.jpg');
  });

  it('devrait charger les DLC depuis le service', () => {
    productServiceSpy.getDlcs.and.returnValue(of(['2025-12-31', '2026-01-15']));
    component.fetchDlcs();
    expect(component.dlcsList).toEqual(['2025-12-31', '2026-01-15']);
  });


  it('devrait afficher une erreur si le nom existe déjà', fakeAsync(() => {
    // productServiceSpy.checkExistingProducName.and.returnValue(of(true));
    component.openProductForm({ name: 'Produit test' } as any);
    tick();
    expect(dialogServiceSpy.error).toHaveBeenCalledWith('Le nom "Produit test" existe déjà.');
  }));

  it('devrait gérer handleProductFormSubmit avec upload d\'images', fakeAsync(() => {
    const resultMock = {
      productData: { name: 'Nouveau produit', images: [], existingImages: ['/uploads/image1.jpg'] },
      selectedFiles: [new File(['dummy content'], 'test.jpg')],
      removedExistingImages: ['/uploads/image1.jpg'],
      imageOrder: ['test.jpg']
    };

    imageServiceSpy.uploadImages.and.returnValue(of({
      imagePath: ['/uploads/image1.jpg'],
      message: 'Upload réussi'
    }));
    imageServiceSpy.deleteImage.and.returnValue(of({ message: 'Suppression simulée' }));
    productServiceSpy.createProduct.and.returnValue(of(mockProduct));

    const fakeDialogRef = { close: jasmine.createSpy('close') } as any;
    component.handleProductFormSubmit(resultMock, fakeDialogRef);
    tick();

    expect(imageServiceSpy.uploadImages).toHaveBeenCalled();
    expect(productServiceSpy.createProduct).toHaveBeenCalled();
    expect(fakeDialogRef.close).toHaveBeenCalled();
  }));

  it('devrait gérer handleProductFormSubmit sans upload d\'images', fakeAsync(() => {
    const resultMock = {
      productData: { name: 'Produit sans upload' },
      selectedFiles: [],
      removedExistingImages: [],
      imageOrder: ['/uploads/existante.jpg']
    };

    productServiceSpy.createProduct.and.returnValue(of(mockProduct));

    const fakeDialogRef = { close: jasmine.createSpy('close') } as any;

    component.handleProductFormSubmit(resultMock, fakeDialogRef);
    tick();

    expect(productServiceSpy.createProduct).toHaveBeenCalledWith(jasmine.objectContaining({
      images: ['/uploads/existante.jpg']
    }));
    expect(fakeDialogRef.close).toHaveBeenCalled();
  }));

  it('devrait appeler updateProduct et afficher un succès', fakeAsync(() => {
    productServiceSpy.updateProduct.and.returnValue(of(mockProduct));

    component.submitProductForm('123', { name: 'Produit modifié' }, () => {
      dialogServiceSpy.success('ok');
    });
    tick();

    expect(productServiceSpy.updateProduct).toHaveBeenCalled();
    expect(dialogServiceSpy.success).toHaveBeenCalledWith(jasmine.stringMatching(/Produit modifié/));
  }));

  it('devrait supprimer directement un produit sans image', fakeAsync(() => {
    const produitSansImage = { _id: '1', name: 'Produit simple', images: [] } as any;
    spyOn<any>(component, 'confirmDeleteProduct').and.returnValue(Promise.resolve());

    component.deleteProduct(produitSansImage);
    tick();

    expect(component['confirmDeleteProduct']).toHaveBeenCalledWith(produitSansImage);
  }));

  it('devrait télécharger les images si l\'utilisateur choisit "Télécharger"', fakeAsync(() => {
    const produitAvecImages = {
      _id: '2',
      name: 'Produit avec image',
      images: ['/uploads/image1.jpg', '/uploads/image2.jpg']
    } as any;

    dialogServiceSpy.confirm.and.returnValue(of('extra'));
    imageServiceSpy.downloadImage.and.returnValue(Promise.resolve());
    
    spyOn<any>(component, 'confirmDeleteProduct').and.returnValue(Promise.resolve());

    component.deleteProduct(produitAvecImages);
    tick();

    expect(imageServiceSpy.downloadImage).toHaveBeenCalledTimes(2);
    expect(imageServiceSpy.downloadImage).toHaveBeenCalledWith('/uploads/image1.jpg', 'Produit avec image');
    expect(imageServiceSpy.downloadImage).toHaveBeenCalledWith('/uploads/image2.jpg', 'Produit avec image');

  }));

  
  it('devrait supprimer les images puis le produit si l\'utilisateur choisit "Ignorer"', fakeAsync(() => {
    const produitAvecImages = {
      _id: '3',
      name: 'Produit  à supprimer',
      images: ['/uploads/image1.jpg']
    } as any;

    dialogServiceSpy.confirm.and.returnValue(of('confirm'));
    imageServiceSpy.deleteImage.and.returnValue(of({ message: 'suppression ok' }));
    spyOn<any>(component, 'confirmDeleteProduct').and.returnValue(Promise.resolve());

    component.deleteProduct(produitAvecImages);
    tick();

    expect(imageServiceSpy.deleteImage).toHaveBeenCalledWith('image1.jpg');
  expect(component['confirmDeleteProduct']).toHaveBeenCalledWith(produitAvecImages);
  }));

  it('ne devrait rien faire si l\'utilisateur clique sur "Annuler"', fakeAsync(() => {
    const produit = {
      _id: '4',
      name: 'Produit annulé',
      images: ['/uploads/image.jpg']
    } as any;

    dialogServiceSpy.confirm.and.returnValue(of('cancel'));

    imageServiceSpy.downloadImage.calls.reset();
    imageServiceSpy.deleteImage.calls.reset();
    productServiceSpy.deleteProduct.calls.reset();

    component.deleteProduct(produit);
    tick();

    expect(imageServiceSpy.downloadImage).not.toHaveBeenCalled();
    expect(imageServiceSpy.deleteImage).not.toHaveBeenCalled();
    expect(productServiceSpy.deleteProduct).not.toHaveBeenCalled();
  }));


  it('devrait se désabonner à la destruction', () => {
    const unsubscribeSpy = spyOn(component['unsubscribe$'], 'next');
    const completeSpy = spyOn(component['unsubscribe$'], 'complete');

    component.ngOnDestroy();

    expect(unsubscribeSpy).toHaveBeenCalled();
    expect(completeSpy).toHaveBeenCalled();
  });




});
