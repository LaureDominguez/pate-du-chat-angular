import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { IngredientAdminComponent } from './ingredient-admin.component';
import { IngredientService } from '../../../services/ingredient.service';
import { SupplierService } from '../../../services/supplier.service';
import { ProductService } from '../../../services/product.service';
import { ImageService } from '../../../services/image.service';
import { SharedDataService } from '../../../services/shared-data.service';
import { DialogService } from '../../../services/dialog.service';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { of } from 'rxjs';
import { AdminModule } from '../admin.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { Ingredient } from '../../../models/ingredient';
import { Product } from '../../../models/product';
import { IngredientFormComponent } from './ingredient-form/ingredient-form.component';

describe('IngredientAdminComponent', () => {
  let component: IngredientAdminComponent;
  let fixture: ComponentFixture<IngredientAdminComponent>;
  let ingredientServiceSpy: jasmine.SpyObj<IngredientService>;
  let supplierServiceSpy: jasmine.SpyObj<SupplierService>;
  let productServiceSpy: jasmine.SpyObj<ProductService>;
  let imageServiceSpy: jasmine.SpyObj<ImageService>;
  let sharedDataServiceSpy: jasmine.SpyObj<SharedDataService>;
  let dialogServiceSpy: jasmine.SpyObj<DialogService>;
  let matDialogSpy: jasmine.SpyObj<MatDialog>;

  const matDialogRefSpy = {
    afterClosed: () => of(null),
    close: () => {},
    componentInstance: {},
    updateSize: () => matDialogRefSpy,
    updatePosition: () => matDialogRefSpy,
    addPanelClass: () => matDialogRefSpy,
    removePanelClass: () => matDialogRefSpy,
    backdropClick: () => of(null),
    keydownEvents: () => of(null)
  } as unknown as MatDialogRef<any>;

  beforeEach(async () => {
    ingredientServiceSpy = jasmine.createSpyObj('IngredientService', [
      'checkExistingIngredientName', 
      'updateIngredient', 
      'createIngredient', 
      'deleteIngredient',
      'getOriginIcon', 
      'getAllergenes', 
      'getOrigines'
    ]);

    ingredientServiceSpy.getAllergenes.and.returnValue(of([]));
    ingredientServiceSpy.getOrigines.and.returnValue(of([]));
    ingredientServiceSpy.ingredients$ = of([]);
    supplierServiceSpy = jasmine.createSpyObj('SupplierService', [], { suppliers$: of([]) });
    productServiceSpy = jasmine.createSpyObj('ProductService', ['getProductsByIngredient']);
    imageServiceSpy = jasmine.createSpyObj('ImageService', ['uploadImages', 'deleteImage', 'downloadImage', 'getImageUrl']);
    sharedDataServiceSpy = jasmine.createSpyObj('SharedDataService', [
      'getSearchedIngredient', 'notifyIngredientCompositionUpdate', 'resultIngredientCreated'
    ], {
      requestNewIngredient$: of(),
      downloadImage$: of()
    });
    dialogServiceSpy = jasmine.createSpyObj('DialogService', ['error', 'success', 'info', 'confirm']);

    const matDialogSpy = jasmine.createSpyObj('MatDialog', ['open']);
    const fakeDialogRef = {
      componentInstance: {
        checkNameExists: of('Tomate'),
        validateAndSubmit: jasmine.createSpy('validateAndSubmit'),
        formValidated: of()
      },
      close: jasmine.createSpy('close'),
      afterClosed: () => of(null)
    };

    matDialogSpy.open.and.returnValue(fakeDialogRef);


    await TestBed.configureTestingModule({
      imports: [
        AdminModule,
        // BrowserAnimationsModule,
        IngredientAdminComponent,
        IngredientFormComponent
      ],
      providers: [
        { provide: IngredientService, useValue: ingredientServiceSpy },
        { provide: SupplierService, useValue: supplierServiceSpy },
        { provide: ProductService, useValue: productServiceSpy },
        { provide: ImageService, useValue: imageServiceSpy },
        { provide: SharedDataService, useValue: sharedDataServiceSpy },
        { provide: DialogService, useValue: dialogServiceSpy },
        { provide: MatDialog, useValue: matDialogSpy }
      ]
    }).compileComponents();

    TestBed.overrideComponent(IngredientAdminComponent, {
      set: {
        providers: [
          { provide: MatDialog, useValue: matDialogSpy }
        ]
      }
    });


    fixture = TestBed.createComponent(IngredientAdminComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('devrait créer le composant', () => {
    expect(component).toBeTruthy();
  });

  it('devrait charger les données d’ingrédients à l\'initialisation', () => {
    expect(component.ingredients.data).toEqual([]);
  });

  it('devrait appeler IngredientService.checkExistingIngredientName lors de checkNameExists', fakeAsync(() => {
    ingredientServiceSpy.checkExistingIngredientName.and.returnValue(of(false));

    component.openIngredientForm({ name: 'Tomate' } as Ingredient);
    tick();

    expect(ingredientServiceSpy.checkExistingIngredientName).toHaveBeenCalledWith('Tomate', undefined);
  }));

  it('devrait afficher un message d’erreur si le nom existe déjà', fakeAsync(() => {
    ingredientServiceSpy.checkExistingIngredientName.and.returnValue(of(true));
    component.openIngredientForm({ name: 'Tomate' } as Ingredient);
    tick();
    expect(dialogServiceSpy.error).toHaveBeenCalledWith('Le nom "Tomate" existe déjà.');
  }));

  it('devrait supprimer un ingrédient si non utilisé', fakeAsync(() => {
    const ingr = { _id: 'id1', name: 'Sel' } as Ingredient;

    productServiceSpy.getProductsByIngredient.and.returnValue(of([]));
    dialogServiceSpy.confirm.and.returnValue(of('confirm'));
    imageServiceSpy.deleteImage.and.returnValue(of({ message: 'Image supprimée' }));
    ingredientServiceSpy.deleteIngredient.and.returnValue(of({ message: 'Ingrédient supprimé' }));

    component.deleteIngredient(ingr);
    tick();

    expect(ingredientServiceSpy.deleteIngredient).toHaveBeenCalledWith('id1');
    expect(dialogServiceSpy.success).toHaveBeenCalled();
  }));

  it('devrait annuler la suppression si l’utilisateur clique sur Annuler', fakeAsync(() => {
    const ingr = { _id: 'id1', name: 'Sel' } as Ingredient;

    const mockProduct: Product = {
      _id: 'p1',
      name: 'Produit 1',
      category: 'cat1',
      description: 'Produit test',
      composition: [],
      dlc: '2025-12-31',
      cookInstructions: '',
      stock: true,
      stockQuantity: 5,
      quantityType: 'g',
      price: 2.5,
      images: []
    };

    productServiceSpy.getProductsByIngredient.and.returnValue(of([mockProduct]));
    dialogServiceSpy.confirm.and.returnValue(of('cancel'));

    component.deleteIngredient(ingr);
    tick();

    expect(ingredientServiceSpy.deleteIngredient).not.toHaveBeenCalled();
  }));

  it('devrait afficher la liste des produits liés si demandé', fakeAsync(() => {
    const ingr = { _id: 'id1', name: 'Sel' } as Ingredient;

    const mockProduct: Product = {
      _id: 'p1',
      name: 'Produit 1',
      category: 'cat1',
      description: '',
      composition: [],
      dlc: '2025-12-31',
      cookInstructions: '',
      stock: true,
      stockQuantity: 5,
      quantityType: 'g',
      price: 2.5,
      images: []
    };

    productServiceSpy.getProductsByIngredient.and.returnValue(of([mockProduct]));
    dialogServiceSpy.confirm.and.returnValue(of('extra'));
    dialogServiceSpy.info.and.returnValue(of(null));

    component.deleteIngredient(ingr);
    tick();

    expect(dialogServiceSpy.info).toHaveBeenCalled();
  }));

it('devrait télécharger les images et poursuivre la suppression si l’utilisateur clique sur "Télécharger"', fakeAsync(() => {
  const ingr = {
    _id: 'id1',
    name: 'Tomate',
    images: ['uploads/image1.jpg', 'uploads/image2.jpg']
  } as Ingredient;

  // Aucun produit lié
  productServiceSpy.getProductsByIngredient.and.returnValue(of([]));

  dialogServiceSpy.confirm.and.returnValues(
    of('confirm'), // étape 1 : confirmation de suppression
    of('extra'),   // étape 2 : télécharger les images
    of('confirm')  // étape 3 : confirmer suppression après téléchargement
  );

  // Images : download et delete
  imageServiceSpy.downloadImage.and.returnValue(Promise.resolve());
  imageServiceSpy.deleteImage.and.returnValue(of({ message: 'Image supprimée' }));

  // Suppression finale
  ingredientServiceSpy.deleteIngredient.and.returnValue(of({ message: 'Ingrédient supprimé' }));

  component.deleteIngredient(ingr);
  tick();

  // Téléchargement des images
  expect(imageServiceSpy.downloadImage).toHaveBeenCalledWith('uploads/image1.jpg', 'Tomate');
  expect(imageServiceSpy.downloadImage).toHaveBeenCalledWith('uploads/image2.jpg', 'Tomate');

  // Suppression des images
  expect(imageServiceSpy.deleteImage).toHaveBeenCalledWith('image1.jpg');
  expect(imageServiceSpy.deleteImage).toHaveBeenCalledWith('image2.jpg');

  // Suppression finale
  expect(ingredientServiceSpy.deleteIngredient).toHaveBeenCalledWith('id1');
  expect(dialogServiceSpy.success).toHaveBeenCalled();
}));


  it('devrait ignorer le téléchargement et supprimer si l’utilisateur clique sur "Ignorer"', fakeAsync(() => {
    const ingr = {
      _id: 'id1',
      name: 'Tomate',
      images: ['uploads/image1.jpg']
    } as Ingredient;

    productServiceSpy.getProductsByIngredient.and.returnValue(of([]));
    dialogServiceSpy.confirm.and.returnValues(
      of('confirm'), // première confirmation pour suppression
      of('confirm')  // confirmation d’ignorer le téléchargement
    );
    imageServiceSpy.deleteImage.and.returnValue(of({ message: 'Image supprimée' }));
    ingredientServiceSpy.deleteIngredient.and.returnValue(of({ message: 'Ingrédient supprimé' }));

    component.deleteIngredient(ingr);
    tick();

    expect(imageServiceSpy.deleteImage).toHaveBeenCalledWith('image1.jpg');
    expect(ingredientServiceSpy.deleteIngredient).toHaveBeenCalledWith('id1');
    expect(dialogServiceSpy.success).toHaveBeenCalled();
  }));

  it('ne devrait rien faire si l’utilisateur annule la suppression des images', fakeAsync(() => {
    const ingr = {
      _id: 'id1',
      name: 'Tomate',
      images: ['uploads/image1.jpg']
    } as Ingredient;

    productServiceSpy.getProductsByIngredient.and.returnValue(of([]));
    dialogServiceSpy.confirm.and.returnValues(
      of('confirm'), // première confirmation de suppression
      of('cancel')   // annulation sur la boîte des images
    );

    component.deleteIngredient(ingr);
    tick();

    expect(imageServiceSpy.deleteImage).not.toHaveBeenCalled();
    expect(ingredientServiceSpy.deleteIngredient).not.toHaveBeenCalled();
  }));

});
