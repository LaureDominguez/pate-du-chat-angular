import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { SupplierAdminComponent } from './supplier-admin.component';
import { SupplierService } from '../../../services/supplier.service';
import { SharedDataService } from '../../../services/shared-data.service';
import { DialogService } from '../../../services/dialog.service';
import { of } from 'rxjs';
import { DEFAULT_SUPPLIER, Supplier } from '../../../models/supplier';
import { ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ConfirmDialogComponent } from '../../dialog/confirm-dialog/confirm-dialog.component';
import { Ingredient, IngredientService } from '../../../services/ingredient.service';

describe('SupplierAdminComponent', () => {
  let component: SupplierAdminComponent;
  let fixture: ComponentFixture<SupplierAdminComponent>;
  let supplierServiceSpy: jasmine.SpyObj<SupplierService>;
  let ingredientServiceSpy: jasmine.SpyObj<IngredientService>;
  let sharedDataServiceSpy: jasmine.SpyObj<SharedDataService>;
  let dialogServiceSpy: jasmine.SpyObj<DialogService>;

  beforeEach(async () => {
    supplierServiceSpy = jasmine.createSpyObj('SupplierService', [
      'getSuppliers', 'createSupplier', 'updateSupplier', 'deleteSupplier'
    ]);
    ingredientServiceSpy = jasmine.createSpyObj('IngredientService', ['getIngredients', 'getIngredientsBySupplier']);

    sharedDataServiceSpy = jasmine.createSpyObj(
      'SharedDataService',
      ['sendSupplierToIngredientForm', 'notifySupplierUpdate'],
      { requestNewSupplier$: of() }
    );

    dialogServiceSpy = jasmine.createSpyObj('DialogService', ['info', 'showHttpError', 'confirm', 'error']);
    dialogServiceSpy.confirm.and.returnValue(of('confirm'));
    dialogServiceSpy.info.and.returnValue(of(null));

    await TestBed.configureTestingModule({
      imports: [
        SupplierAdminComponent,
        ReactiveFormsModule,
        BrowserAnimationsModule,
        ConfirmDialogComponent
      ],
      providers: [
        { provide: SupplierService, useValue: supplierServiceSpy },
        {provide: IngredientService, useValue: ingredientServiceSpy },
        { provide: SharedDataService, useValue: sharedDataServiceSpy },
        { provide: DialogService, useValue: dialogServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SupplierAdminComponent);
    component = fixture.componentInstance;
    supplierServiceSpy.getSuppliers.and.returnValue(of([]));
    fixture.detectChanges();
  });

  it('devrait être créé', () => {
    expect(component).toBeTruthy();
  });

  it('devrait ajouter le fournisseur par défaut si absent', () => {
    const data = component.suppliers.data;
    expect(data.some(s => s._id === DEFAULT_SUPPLIER._id)).toBeTrue();
  });

  it('devrait initialiser un formulaire en édition avec un fournisseur vide', () => {
    component.startEditingSupplier();
    expect(component.supplierForm).toBeDefined();
    expect(component.supplierForm.valid).toBeFalse();
  });

  it('devrait formater un nom', () => {
    const formatted = component.formatNameInput('pâtes du chat');
    expect(formatted).toBe('Pâtes du chat');
  });

  it('ne devrait pas enregistrer si le formulaire est invalide', () => {
    supplierServiceSpy.createSupplier.calls.reset();
    component.startEditingSupplier();
    component.saveSupplier({ _id: null, name: '', description: '' });
    expect(supplierServiceSpy.createSupplier).not.toHaveBeenCalled();
  });

  it('devrait refuser de supprimer le fournisseur par défaut', () => {
    component.deleteSupplier(DEFAULT_SUPPLIER);
    expect(dialogServiceSpy.info).toHaveBeenCalledWith(
      'Vous ne pouvez pas supprimer le fournisseur "Sans fournisseur".'
    );
    expect(supplierServiceSpy.deleteSupplier).not.toHaveBeenCalled();
  });

  it('devrait supprimer un fournisseur après confirmation', fakeAsync(() => {
    const supplier: Supplier = {
      _id: 'abc123',
      name: 'Test Supplier',
      description: '',
      ingredientCount: 0
    };

    supplierServiceSpy.deleteSupplier.and.returnValue(of({ message: 'Fournisseur supprimé avec succès.' }));

    component.deleteSupplier(supplier);
    tick();

    expect(supplierServiceSpy.deleteSupplier).toHaveBeenCalledWith('abc123');
    expect(dialogServiceSpy.info).toHaveBeenCalledWith('Fournisseur supprimé avec succès.');
  }));

  it('ne devrait rien faire si l’utilisateur annule la suppression', fakeAsync(() => {
    dialogServiceSpy.confirm.and.returnValue(of('cancel'));

    const supplier: Supplier = {
      _id: 'abc123',
      name: 'Test Supplier',
      description: '',
      ingredientCount: 0
    };

    component.deleteSupplier(supplier);
    tick();

    expect(supplierServiceSpy.deleteSupplier).not.toHaveBeenCalled();
  }));

  it('devrait afficher les ingrédients liés si l’utilisateur clique sur "Voir les ingrédients" pendant la suppression', fakeAsync(() => {
    const supplier: Supplier = {
      _id: 'sup123',
      name: 'Fournisseur associé',
      description: '',
      ingredientCount: 2
    };

    // Simule le clic initial sur "Voir les ingrédients", puis "Confirmer" après
    let confirmCallCount = 0;
    dialogServiceSpy.confirm.and.callFake(() => {
      confirmCallCount++;
      return of(confirmCallCount === 1 ? 'extra' : 'confirm');
    });

    // Simule deux ingrédients liés
    const fakeIngredients = [
      {
        _id: 'i1',
        name: 'Ingrédient A',
        bio: true,
        supplier: 'sup123',
        type: 'simple',
        allergens: [],
        vegan: true,
        vegeta: true,
        origin: 'FR',
        images: []
      },
      {
        _id: 'i2',
        name: 'Ingrédient B',
        bio: false,
        supplier: 'sup123',
        type: 'simple',
        allergens: [],
        vegan: false,
        vegeta: false,
        origin: 'IT',
        images: []
      }
    ];

    // Fournit les ingrédients simulés
    ingredientServiceSpy.getIngredientsBySupplier.and.returnValue(of(fakeIngredients as Ingredient[]));
    supplierServiceSpy.deleteSupplier.and.returnValue(of({ message: 'OK' }));

    component.deleteSupplier(supplier);
    tick(); // 1. confirm() → 'extra'
  }));


  it('devrait retourner \\u0000 pour le fournisseur highlighté (hors édition)', () => {
    const supplier: Supplier = { _id: '2', name: 'Nom', description: '', ingredientCount: 0 };

    component.highlightedSupplierId = '2';
    component.editingSupplierId = null;

    const result = component.suppliers.sortingDataAccessor(supplier, 'name');
    expect(result).toBe('\u0000');
  });

  it('ne devrait pas retourner \\u0000 si le fournisseur est en cours d’édition', () => {
    const supplier: Supplier = { _id: '2', name: 'Nom', description: '', ingredientCount: 0 };

    component.highlightedSupplierId = '2';
    component.editingSupplierId = '2';

    const result = component.suppliers.sortingDataAccessor(supplier, 'name');
    expect(result).toBe('Nom');
  });

});
