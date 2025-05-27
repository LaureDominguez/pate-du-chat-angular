import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { SupplierAdminComponent } from './supplier-admin.component';
import { SupplierService } from '../../../services/supplier.service';
import { SharedDataService } from '../../../services/shared-data.service';
import { DialogService } from '../../../services/dialog.service';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';
import { DEFAULT_SUPPLIER, Supplier } from '../../../models/supplier';
import { ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ConfirmDialogComponent } from '../../dialog/confirm-dialog/confirm-dialog.component';


describe('SupplierAdminComponent', () => {
  let component: SupplierAdminComponent;
  let fixture: ComponentFixture<SupplierAdminComponent>;
  let supplierServiceSpy: jasmine.SpyObj<SupplierService>;
  let sharedDataServiceSpy: jasmine.SpyObj<SharedDataService>;
  let dialogServiceSpy: jasmine.SpyObj<DialogService>;
  let matDialogSpy: jasmine.SpyObj<MatDialog>;

  beforeEach(async () => {
    supplierServiceSpy = jasmine.createSpyObj('SupplierService', [
      'getSuppliers', 'createSupplier', 'updateSupplier', 'deleteSupplier'
    ]);

    sharedDataServiceSpy = jasmine.createSpyObj(
      'SharedDataService',
      ['sendSupplierToIngredientForm', 'notifySupplierUpdate', 'requestNewSupplier$',]
    );
    
    Object.defineProperty(sharedDataServiceSpy, 'requestNewSupplier$', {
      value: of()
    });

    dialogServiceSpy = jasmine.createSpyObj('DialogService', ['showInfo', 'showHttpError']);

    matDialogSpy = jasmine.createSpyObj('MatDialog', ['open']);
    matDialogSpy.open.and.returnValue({
      afterClosed: () => of('confirm'),
      componentInstance: {}
    } as any);

    await TestBed.configureTestingModule({
      imports: [
        SupplierAdminComponent,
        ReactiveFormsModule,
        BrowserAnimationsModule,
        ConfirmDialogComponent
      ],
      providers: [
        { provide: SupplierService, useValue: supplierServiceSpy },
        { provide: SharedDataService, useValue: sharedDataServiceSpy },
        { provide: DialogService, useValue: dialogServiceSpy }
      ]
    }).compileComponents();

    TestBed.overrideComponent(SupplierAdminComponent, {
  set: {
    providers: [
      { provide: MatDialog, useValue: matDialogSpy }
    ]
  }
});

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
    expect(dialogServiceSpy.showInfo).toHaveBeenCalledWith(
      'Le fournisseur par défaut ne peut pas être supprimé.',
      'info'
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

  expect(matDialogSpy.open).toHaveBeenCalled();
  expect(supplierServiceSpy.deleteSupplier).toHaveBeenCalledWith('abc123');
  expect(dialogServiceSpy.showInfo).toHaveBeenCalledWith(
    'Fournisseur supprimé avec succès.',
    'success'
  );
}));

  it('ne devrait rien faire si l’utilisateur annule la suppression', () => {
    matDialogSpy.open.and.returnValue({
      afterClosed: () => of('cancel'),
      componentInstance: {}
    } as any);

    const supplier: Supplier = {
      _id: 'abc123',
      name: 'Test Supplier',
      description: '',
      ingredientCount: 0
    };

    component.deleteSupplier(supplier);

    expect(supplierServiceSpy.deleteSupplier).not.toHaveBeenCalled();
  });
});
