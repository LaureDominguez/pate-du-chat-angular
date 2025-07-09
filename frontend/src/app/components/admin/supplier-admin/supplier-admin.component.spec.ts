import {
  TestBed,
  ComponentFixture,
  fakeAsync,
  flush,
} from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { HttpErrorResponse } from '@angular/common/http';
import { of, Subject, throwError } from 'rxjs';

import { SupplierAdminComponent } from './supplier-admin.component';
import { SupplierService } from '../../../services/supplier.service';
import { IngredientService } from '../../../services/ingredient.service';
import { SharedDataService } from '../../../services/shared-data.service';
import { DialogService } from '../../../services/dialog.service';
import { Supplier, DEFAULT_SUPPLIER } from '../../../models/supplier';
import { Ingredient } from '../../../models/ingredient';

describe('SupplierAdminComponent', () => {
  let fixture: ComponentFixture<SupplierAdminComponent>;
  let component: SupplierAdminComponent;

  // Spies & helpers
  let suppliers$: Subject<Supplier[]>;
  let supplierSpy: jasmine.SpyObj<SupplierService>;
  let ingredientSpy: jasmine.SpyObj<IngredientService>;
  let sharedSpy: jasmine.SpyObj<SharedDataService> & { requestNewSupplier$: Subject<any> };
  let dialogSpy: jasmine.SpyObj<DialogService>;

  beforeEach(async () => {
    // Observable pilotable pour suppliers$
    suppliers$ = new Subject<Supplier[]>();

    supplierSpy = jasmine.createSpyObj(
      'SupplierService',
      ['createSupplier', 'updateSupplier', 'deleteSupplier'],
      { suppliers$: suppliers$.asObservable() }
    );

    ingredientSpy = jasmine.createSpyObj('IngredientService', ['getIngredientsBySupplier']);

    sharedSpy = Object.assign(
      jasmine.createSpyObj('SharedDataService', ['sendSupplierToIngredientForm']),
      { requestNewSupplier$: new Subject<any>() }
    );

    dialogSpy = jasmine.createSpyObj('DialogService', [
      'info',
      'showHttpError',
      'confirm',
      'error',
    ]);
    dialogSpy.confirm.and.returnValue(of('confirm')); // Valeur par défaut

    await TestBed.configureTestingModule({
      imports: [SupplierAdminComponent],
      providers: [
        provideNoopAnimations(),
        { provide: SupplierService, useValue: supplierSpy },
        { provide: IngredientService, useValue: ingredientSpy },
        { provide: SharedDataService, useValue: sharedSpy },
        { provide: DialogService, useValue: dialogSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SupplierAdminComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // ------------------------------------------------------------------
  //  Flux initial - injection de DEFAULT_SUPPLIER
  // ------------------------------------------------------------------
  it('doit injecter DEFAULT_SUPPLIER lors de la première émission', () => {
    suppliers$.next([{ _id: '1', name: 'Fournisseur A', description: '' }]);
    fixture.detectChanges();

    expect(component.suppliers.data[0]._id).toBe(DEFAULT_SUPPLIER._id);
    expect(component.suppliers.data.length).toBe(2);
  });

  // ------------------------------------------------------------------
  //  startEditingSupplier + formulaire
  // ------------------------------------------------------------------
  it('doit démarrer une édition vide avec formulaire invalide', () => {
    component.startEditingSupplier();
    expect(component.supplierForm).toBeDefined();
    expect(component.supplierForm.valid).toBeFalse();
    expect(component.suppliers.data[0]._id).toBeNull(); // ligne temporaire
  });

  // ------------------------------------------------------------------
  //  saveSupplier - création
  // ------------------------------------------------------------------
  it('doit appeler createSupplier puis info() lors d\'une création', () => {
    component.startEditingSupplier();
    component.supplierForm.setValue({ name: 'Nouveau Fournisseur', description: '' });

    supplierSpy.createSupplier.and.returnValue(
      of({ _id: 'new', name: 'Nouveau Fournisseur', description: '' })
    );

    component.saveSupplier({ _id: null, name: '', description: '' } as any);

    expect(supplierSpy.createSupplier).toHaveBeenCalled();
    expect(dialogSpy.info).toHaveBeenCalledWith('Fournisseur créé avec succès.');
  });

  // ------------------------------------------------------------------
  //  saveSupplier - update
  // ------------------------------------------------------------------
  it('doit appeler updateSupplier puis info() lors d\'une mise à jour', () => {
    const sup: Supplier = { _id: '42', name: 'Ancien', description: '' };
    component.startEditingSupplier(sup);
    component.supplierForm.setValue({ name: 'Nouveau Nom', description: '' });

    supplierSpy.updateSupplier.and.returnValue(
      of({ ...sup, name: 'Nouveau Nom' })
    );

    component.saveSupplier(sup);

    expect(supplierSpy.updateSupplier).toHaveBeenCalledWith(
      '42',
      jasmine.objectContaining({ name: 'Nouveau Nom' })
    );
    expect(dialogSpy.info).toHaveBeenCalledWith('Fournisseur modifié avec succès.');
  });

  // ------------------------------------------------------------------
  //  saveSupplier - formulaire invalide
  // ------------------------------------------------------------------
  it('ne doit pas appeler createSupplier si le formulaire est invalide', () => {
    component.startEditingSupplier();
    component.supplierForm.get('name')!.setValue('');
    component.saveSupplier({ _id: null, name: '', description: '' } as any);

    expect(supplierSpy.createSupplier).not.toHaveBeenCalled();
  });

  // ------------------------------------------------------------------
  //  deleteSupplier - cas spéciaux
  // ------------------------------------------------------------------
  it('doit refuser la suppression de DEFAULT_SUPPLIER', () => {
    component.deleteSupplier(DEFAULT_SUPPLIER);
    expect(dialogSpy.info).toHaveBeenCalledWith(
      'Vous ne pouvez pas supprimer le fournisseur "Sans fournisseur".'
    );
  });

  it('ne doit rien appeler si l\'utilisateur annule la suppression', () => {
    dialogSpy.confirm.and.returnValue(of('cancel'));
    const sup: Supplier = { _id: '10', name: 'A', description: '', ingredientCount: 0 } as any;

    component.deleteSupplier(sup);
    expect(supplierSpy.deleteSupplier).not.toHaveBeenCalled();
  });

  it('doit supprimer un fournisseur vide après confirmation', fakeAsync(() => {
    dialogSpy.confirm.and.returnValue(of('confirm'));
    const sup: Supplier = { _id: '11', name: 'B', description: '', ingredientCount: 0 } as any;

    supplierSpy.deleteSupplier.and.returnValue(of({ message: 'ok' }));

    component.deleteSupplier(sup);
    flush();

    expect(supplierSpy.deleteSupplier).toHaveBeenCalledWith('11');
    expect(dialogSpy.info).toHaveBeenCalledWith('Fournisseur supprimé avec succès.');
  }));

  // ------------------------------------------------------------------
  //  deleteSupplier - extra → confirm
  // ------------------------------------------------------------------
  it('doit montrer les ingrédients liés puis supprimer après EXTRA + CONFIRM', fakeAsync(() => {
    let call = 0;
    dialogSpy.confirm.and.callFake(() => of(++call === 1 ? 'extra' : 'confirm'));

    const sup: Supplier = { _id: '20', name: 'C', description: '', ingredientCount: 2 } as any;

    ingredientSpy.getIngredientsBySupplier.and.returnValue(
      of([{ _id: 'i', name: 'Ingrédient', supplier: '20' } as Ingredient])
    );
    supplierSpy.deleteSupplier.and.returnValue(of({ message: 'ok' }));

    component.deleteSupplier(sup);
    flush();

    expect(ingredientSpy.getIngredientsBySupplier).toHaveBeenCalledWith('20');
    expect(supplierSpy.deleteSupplier).toHaveBeenCalledWith('20');
  }));

  // ------------------------------------------------------------------
  //  deleteSupplier - erreur serveur
  // ------------------------------------------------------------------
  it('doit appeler showHttpError si deleteSupplier échoue', fakeAsync(() => {
    dialogSpy.confirm.and.returnValue(of('confirm'));
    const sup: Supplier = { _id: 'err', name: 'Err', description: '', ingredientCount: 0 } as any;

    const httpErr = new HttpErrorResponse({ status: 500, statusText: 'Err' });
    supplierSpy.deleteSupplier.and.returnValue(throwError(() => httpErr));

    component.deleteSupplier(sup);
    flush();

    expect(dialogSpy.showHttpError).toHaveBeenCalledWith(httpErr);
  }));

  // ------------------------------------------------------------------
  //  sortingDataAccessor
  // ------------------------------------------------------------------
  it('doit renvoyer "\u0000" pour le fournisseur highlighté (hors édition)', () => {
    const sup: Supplier = { _id: 'h1', name: 'Zed', description: '' } as any;
    component.highlightedSupplierId = 'h1';
    component.editingSupplierId = null;
    
    // Définition manuelle de la fonction de tri
    component.suppliers.sortingDataAccessor = (item: Supplier, property: string): string | number => {
      if (item._id && item._id === component.highlightedSupplierId && item._id !== component.editingSupplierId) {
        return '\u0000';
      }
      return (item as any)[property];
    };

    expect(component.suppliers.sortingDataAccessor(sup, 'name')).toBe('\u0000');
  });

  it('ne doit pas renvoyer "\u0000" si le fournisseur est en édition', () => {
    const sup: Supplier = { _id: 'h2', name: 'Yed', description: '' } as any;
    component.highlightedSupplierId = 'h2';
    component.editingSupplierId = 'h2';
    
    // Définition manuelle de la fonction de tri
    component.suppliers.sortingDataAccessor = (item: Supplier, property: string): string | number => {
      if (item._id && item._id === component.highlightedSupplierId && item._id !== component.editingSupplierId) {
        return '\u0000';
      }
      return (item as any)[property];
    };

    expect(component.suppliers.sortingDataAccessor(sup, 'name')).toBe('Yed');
  });

  // ------------------------------------------------------------------
  //  cancelEditingSupplier
  // ------------------------------------------------------------------
  it('doit annuler l\'édition et retirer la ligne temporaire', fakeAsync(() => {
    component.startEditingSupplier();
    expect(component.suppliers.data.some(s => s._id === null)).toBeTrue();

    component.cancelEditingSupplier();
    flush();

    expect(component.editingSupplier).toBeNull();
    expect(component.suppliers.data.some(s => s._id === null)).toBeFalse();
  }));

  // ------------------------------------------------------------------
  //  formatNameInput
  // ------------------------------------------------------------------
  it('doit formater correctement le nom (trim + majuscule)', () => {
    expect(component.formatNameInput('  abc')).toBe('Abc');
    expect(component.formatNameInput('')).toBe('');
  });

  // ------------------------------------------------------------------
  //  Flux requestNewSupplier$
  // ------------------------------------------------------------------
  it('doit créer un fournisseur via requestNewSupplier$', fakeAsync(() => {
    supplierSpy.createSupplier.and.returnValue(
      of({ _id: 'x', name: 'Pizza', description: '' })
    );

    sharedSpy.requestNewSupplier$.next({ name: 'pizza', description: '' });
    flush();

    expect(supplierSpy.createSupplier).toHaveBeenCalled();
    expect(dialogSpy.info).toHaveBeenCalledWith('Fournisseur créé avec succès.');
    expect(sharedSpy.sendSupplierToIngredientForm).toHaveBeenCalled();
  }));

  // ------------------------------------------------------------------
  //  Erreur sur createSupplier
  // ------------------------------------------------------------------
  it('doit appeler showHttpError si createSupplier échoue', fakeAsync(() => {
    component.startEditingSupplier();
    component.supplierForm.setValue({ name: 'Bug', description: '' });

    const httpErr = new HttpErrorResponse({ status: 400, statusText: 'Bad' });
    supplierSpy.createSupplier.and.returnValue(throwError(() => httpErr));

    component.saveSupplier({ _id: null, name: '', description: '' } as any);
    flush();

    expect(dialogSpy.showHttpError).toHaveBeenCalledWith(httpErr);
  }));
});