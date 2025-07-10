import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  flush,
  tick,
} from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { HttpErrorResponse } from '@angular/common/http';
import {
  MatDialog,
  MatDialogRef,
  MatDialogConfig,
} from '@angular/material/dialog';
import { Subject, of, throwError } from 'rxjs';

import { ProductAdminComponent } from './product-admin.component';
import {
  ProductService,
  Product,
} from '../../../services/product.service';
import {
  IngredientService,
  Ingredient,
} from '../../../services/ingredient.service';
import {
  CategoryService,
  Category,
} from '../../../services/category.service';
import { ImageService } from '../../../services/image.service';
import { DeviceService } from '../../../services/device.service';
import { DialogService } from '../../../services/dialog.service';
import { DEFAULT_CATEGORY } from '../../../models/category';
import { ProductFormComponent } from './product-form/product-form.component';

interface UploadResponse {
  message: string;
  imagePath: string[];
}

function buildProduct(partial: Partial<Product> = {}): Product {
  return {
    _id: 'pid',
    name: 'Produit',
    category: null as any,
    price: 0,
    stockQuantity: 0,
    unite: 'kg',
    stock: true,
    allergens: [],
    vegan: false,
    vegeta: false,
    composition: [],
    images: [],
    ...partial,
  } as Product;
}

function buildCategory(partial: Partial<Category> = {}): Category {
  return {
    _id: 'cid',
    name: 'Cat',
    description: '',
    ...partial,
  } as Category;
}

describe('ProductAdminComponent', () => {
  let fixture: ComponentFixture<ProductAdminComponent>;
  let component: ProductAdminComponent;

  // Subjects pilotant les observables
  let products$: Subject<Product[]>;
  let categories$: Subject<Category[]>;
  let ingredients$: Subject<Ingredient[]>;
  let isMobile$: Subject<boolean>;

  // Spies / stubs
  let productSpy: jasmine.SpyObj<ProductService> & { products$: any };
  let categorySpy: jasmine.SpyObj<CategoryService>;
  let ingredientSpy: jasmine.SpyObj<IngredientService>;
  let imageSpy: jasmine.SpyObj<ImageService>;
  let deviceSpy: jasmine.SpyObj<DeviceService>;
  let dialogSvcSpy: jasmine.SpyObj<DialogService>;
  let matDialogSpy: jasmine.SpyObj<MatDialog>;

  beforeEach(async () => {
    products$ = new Subject<Product[]>();
    categories$ = new Subject<Category[]>();
    ingredients$ = new Subject<Ingredient[]>();
    isMobile$ = new Subject<boolean>();

    productSpy = jasmine.createSpyObj(
      'ProductService',
      [
        'getDlcs',
        'checkExistingProductName',
        'createProduct',
        'updateProduct',
        'deleteProduct',
      ],
      { products$: products$.asObservable() }
    );
    productSpy.getDlcs.and.returnValue(of(['DLC1', 'DLC2']));
    productSpy.updateProduct.and.returnValue(of(buildProduct({ _id: 'stub' })));

    categorySpy = jasmine.createSpyObj('CategoryService', [], {
      categories$: categories$.asObservable(),
    });

    ingredientSpy = jasmine.createSpyObj('IngredientService', [], {
      ingredients$: ingredients$.asObservable(),
    });

    imageSpy = jasmine.createSpyObj<ImageService>('ImageService', [
      'uploadImages',
      'deleteImage',
      'downloadImage',
      'getImageUrl',
    ]);
    imageSpy.getImageUrl.and.callFake((p: string) => `url://${p}`);
    imageSpy.uploadImages.and.returnValue(
      of({ imagePath: ['/uploads/p.jpg'], message: 'ok' } as UploadResponse)
    );
    imageSpy.deleteImage.and.returnValue(of({ message: 'ok' }));

    deviceSpy = jasmine.createSpyObj('DeviceService', [], {
      isMobile$: isMobile$.asObservable(),
    });

    dialogSvcSpy = jasmine.createSpyObj('DialogService', [
      'info',
      'success',
      'error',
      'confirm',
    ]);
    dialogSvcSpy.confirm.and.returnValue(of('confirm'));
    dialogSvcSpy.info.and.returnValue(of(''));

    // MatDialog stub
    const afterAllClosed$ = new Subject<void>();
    matDialogSpy = jasmine.createSpyObj('MatDialog', ['open'], {
      openDialogs: [],
    }) as any;
    Object.defineProperty(matDialogSpy, 'afterAllClosed', {
      get: () => afterAllClosed$,
    });
    matDialogSpy.open.and.callFake((_: any, _c?: MatDialogConfig<any>) => {
      return {
        componentInstance: {
          downloadImage: new Subject<any>(),
          checkNameExists: new Subject<any>(),
          formValidated: new Subject<any>(),
          validateAndSubmit: jasmine.createSpy('validateAndSubmit'),
        },
        close: jasmine.createSpy('close'),
      } as unknown as MatDialogRef<any>;
    });

    await TestBed.configureTestingModule({
      imports: [ProductAdminComponent],
      providers: [
        provideNoopAnimations(),
        { provide: ProductService, useValue: productSpy },
        { provide: CategoryService, useValue: categorySpy },
        { provide: IngredientService, useValue: ingredientSpy },
        { provide: ImageService, useValue: imageSpy },
        { provide: DeviceService, useValue: deviceSpy },
        { provide: DialogService, useValue: dialogSvcSpy },
      ],
    })
      .overrideProvider(MatDialog, { useValue: matDialogSpy })
      .compileComponents();

    fixture = TestBed.createComponent(ProductAdminComponent);
    component = fixture.componentInstance;
    spyOn(component.countChanged, 'emit');
    fixture.detectChanges();
  });

  // ------------------------------------------------------------------
  // Flux initial + DEFAULT_CATEGORY + count + dlcsList
  // ------------------------------------------------------------------
  it('devrait charger les DLCs et injecter DEFAULT_CATEGORY', () => {
    const prod = buildProduct({ _id: 'p1', name: 'Salade' });
    products$.next([prod]);
    fixture.detectChanges();

    expect(component.dlcsList).toEqual(['DLC1', 'DLC2']);
    expect(component.products.data[0].category).toEqual(DEFAULT_CATEGORY);
    expect(component.countChanged.emit).toHaveBeenCalledWith(1);
  });

  // ------------------------------------------------------------------
  // isMobile$
  // ------------------------------------------------------------------
  it('devrait mettre à jour isMobile quand DeviceService émet', () => {
    isMobile$.next(true);
    expect(component.isMobile).toBeTrue();
    isMobile$.next(false);
    expect(component.isMobile).toBeFalse();
  });

  // ------------------------------------------------------------------
  // onRowClick – ignore bouton / ouvre ligne
  // ------------------------------------------------------------------
  it("ne doit pas ouvrir le formulaire si clic sur un bouton", () => {
    const prod = buildProduct({ _id: 'btn' });
    const btn = document.createElement('button');
    const evt = new MouseEvent('click');
    Object.defineProperty(evt, 'target', { value: btn });
    component.onRowClick(evt, prod);
    expect(matDialogSpy.open).not.toHaveBeenCalled();
  });

  it('doit ouvrir le formulaire sur clic ligne', () => {
    const prod = buildProduct({ _id: 'row' });
    const div = document.createElement('div');
    const evt = new MouseEvent('click');
    Object.defineProperty(evt, 'target', { value: div });
    component.onRowClick(evt, prod);
    expect(matDialogSpy.open).toHaveBeenCalled();
  });

  // ------------------------------------------------------------------
  // sortingDataAccessor – highlight numérique et string
  // ------------------------------------------------------------------
  it('doit renvoyer "\\u0000" pour name et -Infinity pour price si highlight', fakeAsync(() => {
    component.ngAfterViewInit();
    tick();
    const prod = buildProduct({ _id: 'h1', name: 'Àbricot', price: 3.5 });
    component.highlightedProductId = 'h1';
    const strVal = component.products.sortingDataAccessor!(prod, 'name');
    const numVal = component.products.sortingDataAccessor!(prod, 'price');
    expect(strVal).toBe('\u0000');
    expect(numVal).toBe(-Infinity);
  }));

  // ------------------------------------------------------------------
  // openProductForm – données
  // ------------------------------------------------------------------
  it('doit passer les bonnes données au MatDialog', () => {
    const cat = buildCategory({ _id: 'c1', name: 'Snacks' });
    categories$.next([cat]);
    const prod = buildProduct({
      _id: 'p2',
      name: 'Chips',
      category: cat,
      images: ['/uploads/x.jpg'],
    });
    component.openProductForm(prod);
    const [comp, config] = matDialogSpy.open.calls.mostRecent()
      .args as [any, MatDialogConfig<any>];
    expect(comp).toBe(ProductFormComponent);
    const data = config.data as any;
    expect(data.product).toEqual(prod);
    expect(data.imageUrls).toEqual(['url:///uploads/x.jpg']);
    expect(data.categories).toEqual(component.categories);
  });

  // ------------------------------------------------------------------
  // submitProductForm – create (highlightedProductId)
  // ------------------------------------------------------------------
  it('doit créer un produit, mettre highlightedProductId et success()', () => {
    const created = buildProduct({ _id: 'new', name: 'Burger' });
    productSpy.createProduct.and.returnValue(of(created));
    component.submitProductForm(undefined, { name: 'Burger' });
    expect(productSpy.createProduct).toHaveBeenCalled();
    expect(component.highlightedProductId).toBe('new');
    expect(dialogSvcSpy.success).toHaveBeenCalled();
  });

  // ------------------------------------------------------------------
  // submitProductForm – update
  // ------------------------------------------------------------------
  it('doit mettre à jour un produit puis success()', () => {
    productSpy.updateProduct.and.returnValue(of(buildProduct()));
    component.submitProductForm('42', { _id: '42', name: 'Pizza' } as any);
    expect(productSpy.updateProduct).toHaveBeenCalledWith(
      '42',
      jasmine.objectContaining({ name: 'Pizza' })
    );
    expect(dialogSvcSpy.success).toHaveBeenCalled();
  });

  // ------------------------------------------------------------------
  // handleProductFormSubmit – upload d’images
  // ------------------------------------------------------------------
  it('doit uploader des images puis appeler submitProductForm', () => {
    spyOn(component, 'submitProductForm');
    const file = new File(['X'], 'a.jpg', { type: 'image/jpeg' });
    const result = {
      productData: { _id: 'pid', name: 'X' },
      selectedFiles: [file],
      removedExistingImages: [],
      imageOrder: ['a.jpg'],
    };
    component.handleProductFormSubmit(result, {} as any);
    expect(imageSpy.uploadImages).toHaveBeenCalled();
    expect(component.submitProductForm).toHaveBeenCalled();
  });

  // ------------------------------------------------------------------
  // processInStockProducts (produits avec stock mais composition vide)
  // ------------------------------------------------------------------
  it('doit désactiver le stock et afficher info si composition vide', fakeAsync(() => {
    const prod = buildProduct({ _id: 's1', name: 'Vide', stock: true });
    productSpy.updateProduct.calls.reset();
    products$.next([prod]);
    flush();
    expect(productSpy.updateProduct).toHaveBeenCalledWith(
      's1',
      jasmine.objectContaining({ stock: false })
    );
    expect(dialogSvcSpy.info).toHaveBeenCalled();
  }));

  // ------------------------------------------------------------------
  // showNoCompositionWarning (hors stock, composition vide)
  // ------------------------------------------------------------------
  it('doit afficher un warning pour produits sans composition hors stock', () => {
    const prod = buildProduct({ _id: 'w1', name: 'Sec', stock: false });
    dialogSvcSpy.error.calls.reset();
    products$.next([prod]);
    expect(dialogSvcSpy.error).toHaveBeenCalled();
  });

  // ------------------------------------------------------------------
  // deleteProduct – sans images
  // ------------------------------------------------------------------
  it('doit supprimer un produit sans images', fakeAsync(() => {
    productSpy.deleteProduct.and.returnValue(of({ message: 'ok' }));
    const prod = buildProduct({ _id: 'd1', name: 'Soda', images: [] });
    component.deleteProduct(prod);
    flush();
    expect(productSpy.deleteProduct).toHaveBeenCalledWith('d1');
    expect(dialogSvcSpy.success).toHaveBeenCalled();
  }));

  // ------------------------------------------------------------------
  // deleteProduct – images + EXTRA + confirm
  // ------------------------------------------------------------------
  it('doit télécharger, supprimer images puis produit', fakeAsync(() => {
    let step = 0;
    dialogSvcSpy.confirm.and.callFake(() =>
      of(++step === 1 ? 'extra' : 'confirm')
    );
    productSpy.deleteProduct.and.returnValue(of({ message: 'ok' }));
    const prod = buildProduct({
      _id: 'img',
      name: 'Gateau',
      images: ['/uploads/a.jpg', '/uploads/b.jpg'],
    });
    component.deleteProduct(prod);
    flush();

    expect(imageSpy.downloadImage).toHaveBeenCalledTimes(2);
    expect(imageSpy.deleteImage).toHaveBeenCalledTimes(2);
    expect(productSpy.deleteProduct).toHaveBeenCalledWith('img');
  }));

  // ------------------------------------------------------------------
  // deleteProduct – cancel
  // ------------------------------------------------------------------
  it("ne doit pas supprimer si l'utilisateur annule", fakeAsync(() => {
    dialogSvcSpy.confirm.and.returnValue(of('cancel'));
    const prod = buildProduct({
      _id: 'c2',
      name: 'Caramel',
      images: ['/uploads/c.jpg'],
    });
    component.deleteProduct(prod);
    flush();
    expect(productSpy.deleteProduct).not.toHaveBeenCalled();
    expect(imageSpy.deleteImage).not.toHaveBeenCalled();
  }));

  // ------------------------------------------------------------------
  // Erreur deleteProduct
  // ------------------------------------------------------------------
  it('doit appeler error() si deleteProduct échoue', fakeAsync(() => {
    const err = new HttpErrorResponse({ status: 500, statusText: 'KO' });
    productSpy.deleteProduct.and.returnValue(throwError(() => err));
    const prod = buildProduct({ _id: 'e1', name: 'Bug' });
    component.deleteProduct(prod);
    flush();
    expect(dialogSvcSpy.error).toHaveBeenCalled();
  }));
});
