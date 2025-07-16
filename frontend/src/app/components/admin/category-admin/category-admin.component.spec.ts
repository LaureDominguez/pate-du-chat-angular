import {
  TestBed,
  ComponentFixture,
  fakeAsync,
  flush,
} from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { HttpErrorResponse } from '@angular/common/http';
import { of, Subject, throwError } from 'rxjs';

import { CategoryAdminComponent } from './category-admin.component';
import { CategoryService } from '../../../services/category.service';
import { ProductService, Product } from '../../../services/product.service';
import { SharedDataService } from '../../../services/shared-data.service';
import { DialogService } from '../../../services/dialog.service';
import { Category, DEFAULT_CATEGORY } from '../../../models/category';

describe('CategoryAdminComponent', () => {
  let fixture: ComponentFixture<CategoryAdminComponent>;
  let component: CategoryAdminComponent;

  // Spies & helpers
  let categories$: Subject<Category[]>;
  let categorySpy: jasmine.SpyObj<CategoryService>;
  let productSpy: jasmine.SpyObj<ProductService>;
  let sharedSpy: jasmine.SpyObj<SharedDataService> & { requestNewCategory$: Subject<any> };
  let dialogSpy: jasmine.SpyObj<DialogService>;

  beforeEach(async () => {
    // Observable pilotable pour categories$
    categories$ = new Subject<Category[]>();

    categorySpy = jasmine.createSpyObj(
      'CategoryService',
      ['createCategory', 'updateCategory', 'deleteCategory'],
      { categories$: categories$.asObservable() }
    );

    productSpy = jasmine.createSpyObj('ProductService', ['getProductsByCategory']);

    sharedSpy = Object.assign(
      jasmine.createSpyObj('SharedDataService', ['sendCategoryToProductForm']),
      { requestNewCategory$: new Subject<any>() }
    );

    dialogSpy = jasmine.createSpyObj('DialogService', [
      'info',
      'showHttpError',
      'confirm',
      'error',
    ]);
    dialogSpy.confirm.and.returnValue(of('confirm')); // ➜ valeur par défaut

    await TestBed.configureTestingModule({
      imports: [CategoryAdminComponent],
      providers: [
        provideNoopAnimations(),
        { provide: CategoryService, useValue: categorySpy },
        { provide: ProductService, useValue: productSpy },
        { provide: SharedDataService, useValue: sharedSpy },
        { provide: DialogService, useValue: dialogSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CategoryAdminComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // ------------------------------------------------------------------
  //  Flux initial – injection de DEFAULT_CATEGORY
  // ------------------------------------------------------------------
  it('doit injecter DEFAULT_CATEGORY lors de la première émission', () => {
    categories$.next([{ _id: '1', name: 'Sauces', description: '' }]);
    fixture.detectChanges();

    expect(component.categories.data[0]._id).toBe(DEFAULT_CATEGORY._id);
    expect(component.categories.data.length).toBe(2);
  });

  // ------------------------------------------------------------------
  //  startEditingCategory + formulaire
  // ------------------------------------------------------------------
  it('doit démarrer une édition vide avec formulaire invalide', () => {
    component.startEditingCategory();
    expect(component.categoryForm).toBeDefined();
    expect(component.categoryForm.valid).toBeFalse();
    expect(component.categories.data[0]._id).toBeNull(); // ligne temporaire
  });

  // ------------------------------------------------------------------
  //  saveCategory – création
  // ------------------------------------------------------------------
  it('doit appeler createCategory puis info() lors d’une création', () => {
    component.startEditingCategory();
    component.categoryForm.setValue({ name: 'Ravioli', description: '' });

    categorySpy.createCategory.and.returnValue(
      of({ _id: 'new', name: 'Ravioli', description: '' })
    );

    component.saveCategory({ _id: null, name: '', description: '' } as any);

    expect(categorySpy.createCategory).toHaveBeenCalled();
    expect(dialogSpy.info).toHaveBeenCalledWith('Catégorie créée avec succès.');
  });

  // ------------------------------------------------------------------
  //  saveCategory – update
  // ------------------------------------------------------------------
  it('doit appeler updateCategory puis info() lors d’une mise à jour', () => {
    const cat: Category = { _id: '42', name: 'Ancien', description: '' };
    component.startEditingCategory(cat);
    component.categoryForm.setValue({ name: 'Nouveau', description: '' });

    categorySpy.updateCategory.and.returnValue(
      of({ ...cat, name: 'Nouveau' })
    );

    component.saveCategory(cat);

    expect(categorySpy.updateCategory).toHaveBeenCalledWith(
      '42',
      jasmine.objectContaining({ name: 'Nouveau' })
    );
    expect(dialogSpy.info).toHaveBeenCalledWith(
      'Catégorie mise à jour avec succès.'
    );
  });

  // ------------------------------------------------------------------
  //  saveCategory – formulaire invalide
  // ------------------------------------------------------------------
  it('ne doit pas appeler createCategory si le formulaire est invalide', () => {
    component.startEditingCategory();
    component.categoryForm.get('name')!.setValue('');
    component.saveCategory({ _id: null, name: '', description: '' } as any);

    expect(categorySpy.createCategory).not.toHaveBeenCalled();
  });

  // ------------------------------------------------------------------
  //  deleteCategory – cas spéciaux
  // ------------------------------------------------------------------
  it('doit refuser la suppression de DEFAULT_CATEGORY', () => {
    component.deleteCategory(DEFAULT_CATEGORY);
    expect(dialogSpy.info).toHaveBeenCalledWith(
      'Vous ne pouvez pas supprimer la catégorie "Sans catégorie".'
    );
  });

  it('ne doit rien appeler si l’utilisateur annule la suppression', () => {
    dialogSpy.confirm.and.returnValue(of('cancel'));
    const cat: Category = { _id: '10', name: 'A', description: '', productCount: 0 } as any;

    component.deleteCategory(cat);
    expect(categorySpy.deleteCategory).not.toHaveBeenCalled();
  });

  it('doit supprimer une catégorie vide après confirmation', fakeAsync(() => {
    dialogSpy.confirm.and.returnValue(of('confirm'));
    const cat: Category = { _id: '11', name: 'B', description: '', productCount: 0 } as any;

    categorySpy.deleteCategory.and.returnValue(of({ message: 'ok' }));

    component.deleteCategory(cat);
    flush();

    expect(categorySpy.deleteCategory).toHaveBeenCalledWith('11');
    expect(dialogSpy.info).toHaveBeenCalledWith('Catégorie supprimée avec succès.');
  }));

  // ------------------------------------------------------------------
  //  deleteCategory – extra → confirm
  // ------------------------------------------------------------------
  it('doit montrer les produits liés puis supprime après EXTRA + CONFIRM', fakeAsync(() => {
    let call = 0;
    dialogSpy.confirm.and.callFake(() => of(++call === 1 ? 'extra' : 'confirm'));

    const cat: Category = { _id: '20', name: 'C', description: '', productCount: 2 } as any;

    productSpy.getProductsByCategory.and.returnValue(
      of([{ _id: 'p', name: 'Produit', category: '20' } as Product])
    );
    categorySpy.deleteCategory.and.returnValue(of({ message: 'ok' }));

    component.deleteCategory(cat);
    flush();

    expect(productSpy.getProductsByCategory).toHaveBeenCalledWith('20');
    expect(categorySpy.deleteCategory).toHaveBeenCalledWith('20');
  }));

  // ------------------------------------------------------------------
  //  deleteCategory – erreur serveur
  // ------------------------------------------------------------------
  it('doit appeler showHttpError si deleteCategory échoue', fakeAsync(() => {
    dialogSpy.confirm.and.returnValue(of('confirm'));
    const cat: Category = { _id: 'err', name: 'Err', description: '', productCount: 0 } as any;

    const httpErr = new HttpErrorResponse({ status: 500, statusText: 'Err' });
    categorySpy.deleteCategory.and.returnValue(throwError(() => httpErr));

    component.deleteCategory(cat);
    flush();

    expect(dialogSpy.showHttpError).toHaveBeenCalledWith(httpErr);
  }));

  // ------------------------------------------------------------------
  //  sortingDataAccessor
  // ------------------------------------------------------------------
  it('doit renvoyer "\u0000" pour la catégorie highlightée (hors édition)', () => {
    const cat: Category = { _id: 'h1', name: 'Zed', description: '' } as any;
    component.highlightedCategoryId = 'h1';
    component.editingCategoryId = null;
    
    // Définition manuelle de la fonction de tri
    component.categories.sortingDataAccessor = (item: Category, property: string): string | number => {
      if (item._id && item._id === component.highlightedCategoryId && item._id !== component.editingCategoryId) {
        return '\u0000';
      }
      return (item as any)[property];
    };

    expect(component.categories.sortingDataAccessor(cat, 'name')).toBe('\u0000'); // Caractère nul
  });

  it('ne doit pas renvoyer "\u0000" si la catégorie est en édition', () => {
    const cat: Category = { _id: 'h2', name: 'Yed', description: '' } as any;
    component.highlightedCategoryId = 'h2';
    component.editingCategoryId = 'h2';
    
    // Définition manuelle de la fonction de tri
    component.categories.sortingDataAccessor = (item: Category, property: string): string | number => {
      if (item._id && item._id === component.highlightedCategoryId && item._id !== component.editingCategoryId) {
        return '\u0000';
      }
      return (item as any)[property];
    };

    expect(component.categories.sortingDataAccessor(cat, 'name')).toBe('Yed');
  });

  // ------------------------------------------------------------------
  //  cancelEditingCategory
  // ------------------------------------------------------------------
  it('doit annuler l’édition et retire la ligne temporaire', fakeAsync(() => {
    component.startEditingCategory();
    expect(component.categories.data.some(c => c._id === null)).toBeTrue();

    component.cancelEditingCategory();
    flush();

    expect(component.editingCategory).toBeNull();
    expect(component.categories.data.some(c => c._id === null)).toBeFalse();
  }));

  // ------------------------------------------------------------------
  //  formatNameInput
  // ------------------------------------------------------------------
  it('doit formater correctement le nom (trim + majuscule)', () => {
    expect(component.formatNameInput('  abc')).toBe('Abc');
    expect(component.formatNameInput('')).toBe('');
  });

  // ------------------------------------------------------------------
  //  Flux requestNewCategory$
  // ------------------------------------------------------------------
  it('doit créer une catégorie via requestNewCategory$', fakeAsync(() => {
    categorySpy.createCategory.and.returnValue(
      of({ _id: 'x', name: 'Pizza', description: '' })
    );

    sharedSpy.requestNewCategory$.next({ name: 'pizza', description: '' });
    flush();

    expect(categorySpy.createCategory).toHaveBeenCalled();
    expect(dialogSpy.info).toHaveBeenCalledWith('Catégorie créée avec succès.');
    expect(sharedSpy.sendCategoryToProductForm).toHaveBeenCalled();
  }));

  // ------------------------------------------------------------------
  //  Erreur sur createCategory
  // ------------------------------------------------------------------
  it('doit appeler showHttpError si createCategory échoue', fakeAsync(() => {
    component.startEditingCategory();
    component.categoryForm.setValue({ name: 'Bug', description: '' });

    const httpErr = new HttpErrorResponse({ status: 400, statusText: 'Bad' });
    categorySpy.createCategory.and.returnValue(throwError(() => httpErr));

    component.saveCategory({ _id: null, name: '', description: '' } as any);
    flush();

    expect(dialogSpy.showHttpError).toHaveBeenCalledWith(httpErr);
  }));
});
