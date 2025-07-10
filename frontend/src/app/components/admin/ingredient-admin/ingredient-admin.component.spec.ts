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

import { IngredientAdminComponent } from './ingredient-admin.component';
import {
  IngredientService,
  Ingredient,
} from '../../../services/ingredient.service';
import {
  SupplierService,
  Supplier,
} from '../../../services/supplier.service';
import {
  ProductService,
  Product,
} from '../../../services/product.service';
import { ImageService } from '../../../services/image.service';
import { SharedDataService } from '../../../services/shared-data.service';
import { DialogService } from '../../../services/dialog.service';
import { DEFAULT_SUPPLIER } from '../../../models/supplier';
import { IngredientFormComponent } from './ingredient-form/ingredient-form.component';

// -----------------------------------------------------------------------------
//  Types locaux (mocks)
// -----------------------------------------------------------------------------
interface UploadResponse {
  message: string;
  imagePath: string[];
}

// -----------------------------------------------------------------------------
//  Helpers
// -----------------------------------------------------------------------------
function buildIngredient(partial: Partial<Ingredient> = {}): Ingredient {
  return {
    _id: 'id',
    name: 'Nom',
    bio: '',
    type: '',
    vegan: false,
    vegeta: false,
    origin: '',
    supplier: null as any,
    allergens: [],
    images: [],
    ...partial,
  } as Ingredient;
}

// -----------------------------------------------------------------------------
//  Suite de tests
// -----------------------------------------------------------------------------

describe('IngredientAdminComponent', () => {
  let fixture: ComponentFixture<IngredientAdminComponent>;
  let component: IngredientAdminComponent;

  // Subjects pilotables
  let ingredients$: Subject<Ingredient[]>;
  let suppliers$: Subject<Supplier[]>;

  // Spies & stubs
  let ingredientSpy: jasmine.SpyObj<IngredientService>;
  let supplierSpy: jasmine.SpyObj<SupplierService>;
  let productSpy: jasmine.SpyObj<ProductService>;
  let imageSpy: jasmine.SpyObj<ImageService>;
  let sharedSpy: jasmine.SpyObj<SharedDataService> & {
    requestNewIngredient$: Subject<void>;
  };
  let dialogSvcSpy: jasmine.SpyObj<DialogService>;
  let matDialogSpy: jasmine.SpyObj<MatDialog>;

  beforeEach(async () => {
    // ------------------------------------------------
    //  Subjects
    // ------------------------------------------------
    ingredients$ = new Subject<Ingredient[]>();
    suppliers$ = new Subject<Supplier[]>();

    // ------------------------------------------------
    //  IngredientService spy
    // ------------------------------------------------
    ingredientSpy = jasmine.createSpyObj(
      'IngredientService',
      [
        'getAllergenes',
        'getOrigines',
        'checkExistingIngredientName',
        'createIngredient',
        'updateIngredient',
        'deleteIngredient',
        'getOriginIcon',
      ],
      { ingredients$: ingredients$.asObservable() }
    );
    ingredientSpy.getAllergenes.and.returnValue(of(['gluten', 'lactose']));
    ingredientSpy.getOrigines.and.returnValue(of(['France', 'Italie']));
    ingredientSpy.getOriginIcon.and.returnValue('🍅');

    // ------------------------------------------------
    //  SupplierService spy
    // ------------------------------------------------
    supplierSpy = jasmine.createSpyObj('SupplierService', [], {
      suppliers$: suppliers$.asObservable(),
    });

    // ------------------------------------------------
    //  ProductService spy
    // ------------------------------------------------
    productSpy = jasmine.createSpyObj('ProductService', [
      'getProductsByIngredient',
    ]);

    // ------------------------------------------------
    //  ImageService spy
    // ------------------------------------------------
    imageSpy = jasmine.createSpyObj<ImageService>('ImageService', [
      'downloadImage',
      'getImageUrl',
      'uploadImages',
      'deleteImage',
    ]);
    imageSpy.getImageUrl.and.callFake((p: string) => `url://${p}`);
    imageSpy.uploadImages.and.returnValue(
      of({ imagePath: ['/uploads/mock.jpg'], message: 'ok' } as UploadResponse)
    );
    imageSpy.deleteImage.and.returnValue(of({ message: 'ok' }));

    // ------------------------------------------------
    //  SharedDataService spy & Subject
    // ------------------------------------------------
    sharedSpy = Object.assign(
      jasmine.createSpyObj('SharedDataService', [
        'getSearchedIngredient',
        'resultIngredientCreated',
      ]),
      { requestNewIngredient$: new Subject<void>() }
    );

    // ------------------------------------------------
    //  DialogService spy
    // ------------------------------------------------
    dialogSvcSpy = jasmine.createSpyObj('DialogService', [
      'info',
      'success',
      'error',
      'confirm',
    ]);
    dialogSvcSpy.confirm.and.returnValue(of('confirm'));
    dialogSvcSpy.info.and.returnValue(of(''));

    // ------------------------------------------------
    //  MatDialog stub
    // ------------------------------------------------
    matDialogSpy = jasmine.createSpyObj('MatDialog', ['open']);
    matDialogSpy.open.and.callFake((_: any, _config?: MatDialogConfig<any>) => {
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

    // ------------------------------------------------
    //  Configuration du module de test
    // ------------------------------------------------
    await TestBed.configureTestingModule({
      imports: [IngredientAdminComponent],
      providers: [
        provideNoopAnimations(),
        { provide: IngredientService, useValue: ingredientSpy },
        { provide: SupplierService, useValue: supplierSpy },
        { provide: ProductService, useValue: productSpy },
        { provide: ImageService, useValue: imageSpy },
        { provide: SharedDataService, useValue: sharedSpy },
        { provide: DialogService, useValue: dialogSvcSpy },
      ],
    })
      // 🔄 Override MatDialog (le composant standalone fournit déjà MatDialog)
      .overrideProvider(MatDialog, { useValue: matDialogSpy })
      .compileComponents();

    fixture = TestBed.createComponent(IngredientAdminComponent);
    component = fixture.componentInstance;

    spyOn(component.countChanged, 'emit');
    fixture.detectChanges();
  });

  // ---------------------------------------------------------------------------
  //  Flux initial
  // ---------------------------------------------------------------------------
  it('doit émettre countChanged avec la bonne valeur', () => {
    ingredients$.next([buildIngredient({ _id: '1', name: 'Tomate' })]);
    fixture.detectChanges();

    expect(component.countChanged.emit).toHaveBeenCalledWith(1);
    expect(component.ingredients.data[0].supplier).toEqual(DEFAULT_SUPPLIER);
  });

  // ---------------------------------------------------------------------------
  //  onRowClick – ignore clic sur bouton
  // ---------------------------------------------------------------------------
  it('ne doit pas ouvrir le formulaire si clic sur un bouton dans la ligne', () => {
    const ing = buildIngredient({ _id: 'btn', name: 'Bouton' });
    const button = document.createElement('button');
    const evt = new MouseEvent('click', { bubbles: true });
    Object.defineProperty(evt, 'target', { value: button, writable: false });

    component.onRowClick(evt, ing);
    expect(matDialogSpy.open).not.toHaveBeenCalled();
  });

  // ---------------------------------------------------------------------------
  //  onRowClick – ouvre formulaire sur clic hors bouton
  // ---------------------------------------------------------------------------
  it('doit ouvrir le formulaire si clic sur la ligne', () => {
    const ing = buildIngredient({ _id: 'row', name: 'Row' });
    const div = document.createElement('div');
    const evt = new MouseEvent('click', { bubbles: true });
    Object.defineProperty(evt, 'target', { value: div, writable: false });

    component.onRowClick(evt, ing);
    expect(matDialogSpy.open).toHaveBeenCalled();
  });

  // ---------------------------------------------------------------------------
  //  sortingDataAccessor – ligne highlightée
  // ---------------------------------------------------------------------------
  it('doit renvoyer "\u0000" pour la ligne highlightée', fakeAsync(() => {
    component.ngAfterViewInit();
    tick(); // laisse exécuter setTimeout()

    const ing = buildIngredient({ _id: 'h1', name: 'Épice' });
    component.highlightedIngredientId = 'h1';

    const accessor = component.ingredients.sortingDataAccessor!;
    const val = accessor(ing, 'name');
    expect(val).toBe('\u0000');
  }));

  // ---------------------------------------------------------------------------
  //  requestNewIngredient$
  // ---------------------------------------------------------------------------
  it('doit ouvrir le formulaire après requestNewIngredient$', fakeAsync(() => {
    sharedSpy.getSearchedIngredient.and.returnValue('Oignon');
    sharedSpy.requestNewIngredient$.next();
    flush();
    expect(matDialogSpy.open).toHaveBeenCalled();
  }));

  // ---------------------------------------------------------------------------
  //  openIngredientForm – données transmises
  // ---------------------------------------------------------------------------
  it('doit ouvrir MatDialog avec les bonnes données', () => {
    const ingredient = buildIngredient({
      _id: 'i1',
      name: 'Poivron',
      images: ['/uploads/a.jpg'],
      origin: 'France',
      supplier: { _id: 's1', name: 'Fourn.', description: '' } as Supplier,
    });

    component.openIngredientForm(ingredient);

    const [comp, config] = matDialogSpy.open.calls.mostRecent()
      .args as [any, MatDialogConfig<any>];

    expect(comp).toBe(IngredientFormComponent);

    const data = config.data as any;
    expect(data.ingredient).toEqual(ingredient);
    expect(data.imageUrls).toEqual(['url:///uploads/a.jpg']);
    expect(data.imagePaths).toEqual(['/uploads/a.jpg']);
    expect(data.allergenesList).toEqual(component.allergenesList);
  });

  // ---------------------------------------------------------------------------
  //  submitIngredientForm – création
  // ---------------------------------------------------------------------------
  it('doit créer un ingrédient puis success()', () => {
    ingredientSpy.createIngredient.and.returnValue(
      of(buildIngredient({ _id: 'new', name: 'Radis' }))
    );

    component.submitIngredientForm(undefined, { name: 'Radis' });

    expect(ingredientSpy.createIngredient).toHaveBeenCalled();
    expect(dialogSvcSpy.success).toHaveBeenCalled();
  });

  // ---------------------------------------------------------------------------
  //  submitIngredientForm – update
  // ---------------------------------------------------------------------------
  it('doit mettre à jour un ingrédient puis success()', () => {
    ingredientSpy.updateIngredient.and.returnValue(of(buildIngredient()));

    component.submitIngredientForm('42', {
      _id: '42',
      name: 'Updated',
    } as any);

    expect(ingredientSpy.updateIngredient).toHaveBeenCalledWith(
      '42',
      jasmine.objectContaining({ name: 'Updated' })
    );
    expect(dialogSvcSpy.success).toHaveBeenCalled();
  });

  // ---------------------------------------------------------------------------
  //  deleteIngredient – non utilisé
  // ---------------------------------------------------------------------------
  it('doit supprimer un ingrédient non utilisé', fakeAsync(() => {
    productSpy.getProductsByIngredient.and.returnValue(of([]));
    ingredientSpy.deleteIngredient.and.returnValue(of({ message: 'ok' }));

    const ing = buildIngredient({ _id: 'd1', name: 'Durian' });

    component.deleteIngredient(ing);
    flush();

    expect(ingredientSpy.deleteIngredient).toHaveBeenCalledWith('d1');
    expect(dialogSvcSpy.success).toHaveBeenCalled();
  }));

  // ---------------------------------------------------------------------------
  //  deleteIngredient – utilisé → extra → confirm
  // ---------------------------------------------------------------------------
  it('doit afficher les produits liés puis supprimer après EXTRA + CONFIRM', fakeAsync(() => {
    productSpy.getProductsByIngredient.and.returnValue(
      of([{ _id: 'p1', name: 'Prod' } as Product])
    );

    let call = 0;
    dialogSvcSpy.confirm.and.callFake(() =>
      of(++call === 1 ? 'extra' : 'confirm')
    );
    ingredientSpy.deleteIngredient.and.returnValue(of({ message: 'ok' }));

    const ing = buildIngredient({ _id: 'x1', name: 'Piment' });
    component.deleteIngredient(ing);
    flush();

    expect(productSpy.getProductsByIngredient).toHaveBeenCalledWith('x1');
    expect(ingredientSpy.deleteIngredient).toHaveBeenCalledWith('x1');
  }));

  // ---------------------------------------------------------------------------
  //  deleteIngredient – cancel
  // ---------------------------------------------------------------------------
  it("ne doit pas supprimer si l'utilisateur annule", fakeAsync(() => {
    productSpy.getProductsByIngredient.and.returnValue(of([]));
    dialogSvcSpy.confirm.and.returnValue(of('cancel'));

    const ing = buildIngredient({ _id: 'c1', name: 'Cresson' });
    component.deleteIngredient(ing);
    flush();

    expect(ingredientSpy.deleteIngredient).not.toHaveBeenCalled();
  }));

  // ---------------------------------------------------------------------------
  //  checkIngredientImages – images + EXTRA + CONFIRM
  // ---------------------------------------------------------------------------
  it('doit télécharger et supprimer les images avant la suppression', fakeAsync(() => {
    // Pas utilisé dans produits
    productSpy.getProductsByIngredient.and.returnValue(of([]));

    // Ingredient avec images
    const ing = buildIngredient({
      _id: 'img',
      name: 'Aubergine',
      images: ['/uploads/i1.jpg', '/uploads/i2.jpg'],
    });

    // Sequence des confirmations :
    // 1) produits -> 'confirm'
    // 2) images -> 'extra'
    // 3) post-download -> 'confirm'
    let step = 0;
    dialogSvcSpy.confirm.and.callFake(() => {
      step++;
      if (step === 1) return of('confirm');
      if (step === 2) return of('extra');
      return of('confirm');
    });
    ingredientSpy.deleteIngredient.and.returnValue(of({ message: 'ok' }));

    component.deleteIngredient(ing);
    flush();

    expect(imageSpy.downloadImage).toHaveBeenCalledTimes(2);
    expect(imageSpy.deleteImage).toHaveBeenCalledTimes(2);
    expect(ingredientSpy.deleteIngredient).toHaveBeenCalledWith('img');
  }));

  // ---------------------------------------------------------------------------
  //  deleteIngredient – erreur serveur
  // ---------------------------------------------------------------------------
  it('doit appeler dialogService.error si deleteIngredient échoue', fakeAsync(() => {
    productSpy.getProductsByIngredient.and.returnValue(of([]));

    const err = new HttpErrorResponse({ status: 500, statusText: 'KO' });
    ingredientSpy.deleteIngredient.and.returnValue(throwError(() => err));

    const ing = buildIngredient({ _id: 'e1', name: 'Bug' });

    component.deleteIngredient(ing);
    flush();

    expect(dialogSvcSpy.error).toHaveBeenCalled();
  }));
});
