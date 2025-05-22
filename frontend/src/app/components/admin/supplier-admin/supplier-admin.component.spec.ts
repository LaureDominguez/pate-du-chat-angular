// supplier-admin.component.spec.ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SupplierAdminComponent } from './supplier-admin.component';
import { SupplierService } from '../../../services/supplier.service';
import { SharedDataService } from '../../../services/shared-data.service';
import { DialogService } from '../../../services/dialog.service';
import { MatDialog } from '@angular/material/dialog';
import { of, Subject } from 'rxjs';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { DEFAULT_SUPPLIER, Supplier } from '../../../models/supplier';
import { ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

describe('SupplierAdminComponent', () => {
  let component: SupplierAdminComponent;
  let fixture: ComponentFixture<SupplierAdminComponent>;
  let supplierServiceSpy: jasmine.SpyObj<SupplierService>;
  let sharedDataServiceSpy: jasmine.SpyObj<SharedDataService>;
  let dialogServiceSpy: jasmine.SpyObj<DialogService>;
  let matDialogSpy: jasmine.SpyObj<MatDialog>;

  beforeEach(async () => {
    supplierServiceSpy = jasmine.createSpyObj('SupplierService', ['getSuppliers', 'createSupplier', 'updateSupplier', 'deleteSupplier']);
    sharedDataServiceSpy = jasmine.createSpyObj('SharedDataService', [
      'sendSupplierToIngredientForm',
      'notifySupplierUpdate',
      'emitReplaceSupplierInIngredients',
    ], {
      requestNewSupplier$: of({ name: 'Test Nouveau', description: 'Créé via ingredient' }),
      replaceSupplierInIngredientsComplete$: new Subject<boolean>()
    });
    dialogServiceSpy = jasmine.createSpyObj('DialogService', ['showInfo', 'showHttpError']);
    matDialogSpy = jasmine.createSpyObj('MatDialog', ['open']);

    await TestBed.configureTestingModule({
      imports: [SupplierAdminComponent, ReactiveFormsModule, BrowserAnimationsModule],
      providers: [
        { provide: SupplierService, useValue: supplierServiceSpy },
        { provide: SharedDataService, useValue: sharedDataServiceSpy },
        { provide: DialogService, useValue: dialogServiceSpy },
        { provide: MatDialog, useValue: matDialogSpy },
      ],
      schemas: [NO_ERRORS_SCHEMA],
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
    supplierServiceSpy.createSupplier.calls.reset(); // pour remettre à zéro l’état d’appel si besoin
    component.startEditingSupplier();
    component.saveSupplier({ _id: null, name: '', description: '' });
    expect(supplierServiceSpy.createSupplier).not.toHaveBeenCalled();
  });

  it('devrait appeler deleteSupplier sur confirmation et pas d’ingrédients', () => {
    const mockSupplier = { _id: 'abc123', name: 'Test', description: '', ingredientCount: 0 };

    const mockDialogRef = {
      afterClosed: () => of('confirm'),
      // 💡 permet d’éviter les erreurs internes de MatDialog
      componentInstance: { _animationStateChanged: of() }
    };

    matDialogSpy.open.and.returnValue(mockDialogRef as any);
    supplierServiceSpy.deleteSupplier.and.returnValue(of({ message: 'ok' }));

    component.deleteSupplier(mockSupplier);

    expect(matDialogSpy.open).toHaveBeenCalled();
    expect(supplierServiceSpy.deleteSupplier).toHaveBeenCalledWith('abc123');
  });


  it('devrait déclencher le remplacement si des ingrédients sont liés', () => {
  const mockSupplier = {
    _id: 'sup1',
    name: 'Test',
    description: '',
    ingredientCount: 2,
    ingredients: [{ _id: 'i1' }, { _id: 'i2' }]
  };

  matDialogSpy.open.and.returnValue({
    afterClosed: () => of('confirm'),
    componentInstance: { _animationStateChanged: of() } // 💡
  } as any);


    supplierServiceSpy.deleteSupplier.and.returnValue(of({ message: 'ok' }));

    component.deleteSupplier(mockSupplier);
    (sharedDataServiceSpy.replaceSupplierInIngredientsComplete$ as Subject<boolean>).next(true);

    expect(sharedDataServiceSpy.emitReplaceSupplierInIngredients).toHaveBeenCalledWith('sup1', DEFAULT_SUPPLIER._id!, ['i1', 'i2']);
    expect(supplierServiceSpy.deleteSupplier).toHaveBeenCalledWith('sup1');
  });

  it('devrait afficher une erreur si le remplacement échoue', () => {
    const mockSupplier = {
      _id: 'sup1',
      name: 'Test',
      description: '',
      ingredientCount: 1,
      ingredients: [{ _id: 'i1' }]
    };

    matDialogSpy.open.and.returnValue({
      afterClosed: () => of('confirm'),
      componentInstance: { _animationStateChanged: of() } // 💡
    } as any);

    component.deleteSupplier(mockSupplier);
    (sharedDataServiceSpy.replaceSupplierInIngredientsComplete$ as Subject<boolean>).next(false);

    expect(dialogServiceSpy.showInfo).toHaveBeenCalledWith(
      'Échec lors du remplacement des fournisseurs liés. Suppression annulée.',
      'error'
    );
    expect(supplierServiceSpy.deleteSupplier).not.toHaveBeenCalled();
  });
});
