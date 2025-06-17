import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { CategoryAdminComponent } from './category-admin.component';
import { CategoryService } from '../../../services/category.service';
import { SharedDataService } from '../../../services/shared-data.service';
import { DialogService } from '../../../services/dialog.service';
import { of, throwError } from 'rxjs';
import { DEFAULT_CATEGORY, Category } from '../../../models/category';
import { ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ConfirmDialogComponent } from '../../dialog/confirm-dialog/confirm-dialog.component';
import { HttpErrorResponse } from '@angular/common/http';
import { Product, ProductService } from '../../../services/product.service';

describe('CategoryAdminComponent', () => {
  let component: CategoryAdminComponent;
  let fixture: ComponentFixture<CategoryAdminComponent>;
  let categoryServiceSpy: jasmine.SpyObj<CategoryService>;
  let productServiceSpy: jasmine.SpyObj<ProductService>;
  let sharedDataServiceSpy: jasmine.SpyObj<SharedDataService>;
  let dialogServiceSpy: jasmine.SpyObj<DialogService>;

  beforeEach(async () => {
    categoryServiceSpy = jasmine.createSpyObj('CategoryService', [
      'getCategories', 'createCategory', 'updateCategory', 'deleteCategory'
    ]);
    productServiceSpy = jasmine.createSpyObj('ProductService', ['getProductsByCategory']);

    sharedDataServiceSpy = {
      ...jasmine.createSpyObj('SharedDataService', [
        'sendCategoryToProductForm', 'notifyCategoryUpdate'
      ]),
      requestNewCategory$: of()
    } as jasmine.SpyObj<SharedDataService>;

    dialogServiceSpy = jasmine.createSpyObj('DialogService', ['info', 'showHttpError', 'confirm', 'error']);
    dialogServiceSpy.confirm.and.returnValue(of('confirm'));

    await TestBed.configureTestingModule({
      imports: [
        CategoryAdminComponent,
        ReactiveFormsModule,
        BrowserAnimationsModule,
        ConfirmDialogComponent
      ],
      providers: [
        { provide: CategoryService, useValue: categoryServiceSpy },
        { provide: ProductService, useValue: productServiceSpy }, // Mock ProductService si nécessaire
        { provide: SharedDataService, useValue: sharedDataServiceSpy },
        { provide: DialogService, useValue: dialogServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CategoryAdminComponent);
    component = fixture.componentInstance;
    categoryServiceSpy.getCategories.and.returnValue(of([]));
    fixture.detectChanges();
  });

  it('devrait être créé', () => {
    expect(component).toBeTruthy();
  });
    
  it('devrait initialiser un formulaire en édition avec une catégorie vide', () => {
    component.startEditingCategory();
    expect(component.categoryForm).toBeDefined();
    expect(component.categoryForm.valid).toBeFalse();
  });

  it('devrait créer une catégorie valide', () => {
    component.startEditingCategory();
    component.categoryForm.setValue({
      name: 'Nouvelle catégorie',
      description: 'Description test'
    });

    categoryServiceSpy.createCategory.and.returnValue(of({
      _id: 'newId',
      name: 'Nouvelle catégorie',
      description: 'Description test',
    }));

    component.saveCategory({ _id: null, name: '', description: '' });

    expect(categoryServiceSpy.createCategory).toHaveBeenCalledWith(jasmine.objectContaining({
      name: 'Nouvelle catégorie'
    }));
    expect(dialogServiceSpy.info).toHaveBeenCalledWith('Catégorie créée avec succès.');
  });

  it('devrait créer une catégorie via sharedDataService.requestNewCategory$', () => {
    const spyCreate = spyOn<any>(component, 'createNewCategory');
    (component as any).ngOnDestroy(); // Nettoie d'abord les anciennes souscriptions

    sharedDataServiceSpy.requestNewCategory$ = of({ name: 'Cat via shared', description: 'Desc' });

    component.ngOnInit(); // relance pour écouter la nouvelle observable

    expect(spyCreate).toHaveBeenCalledWith(jasmine.objectContaining({ name: 'Cat via shared' }));
  });


  it('devrait mettre à jour une catégorie existante', () => {
    const existingCategory: Category = {
      _id: 'cat999',
      name: 'Ancien nom',
      description: 'Ancienne desc'
    };

    component.startEditingCategory(existingCategory);
    component.categoryForm.setValue({
      name: 'Nom mis à jour',
      description: 'Desc mise à jour'
    });

    categoryServiceSpy.updateCategory.and.returnValue(of({
      _id: 'cat999',
      name: 'Nom mis à jour',
      description: 'Desc mise à jour'
    }));

    component.saveCategory(existingCategory);

    expect(categoryServiceSpy.updateCategory).toHaveBeenCalledWith('cat999', jasmine.objectContaining({
      name: 'Nom mis à jour'
    }));
    expect(dialogServiceSpy.info).toHaveBeenCalledWith('Catégorie mise à jour avec succès.');
  });

  it('ne devrait pas enregistrer si le formulaire est invalide', () => {
    categoryServiceSpy.createCategory.calls.reset();
    component.startEditingCategory();
    component.saveCategory({ _id: null, name: '', description: '' });
    expect(categoryServiceSpy.createCategory).not.toHaveBeenCalled();
  });

  it('devrait relancer le tri alphabétique après sauvegarde', () => {
    component.startEditingCategory();
    component.categoryForm.setValue({ name: 'Tri Test', description: 'Desc' });

    const spySortChange = spyOn(component.categories.sort!.sortChange, 'emit');

    categoryServiceSpy.createCategory.and.returnValue(of({
      _id: 'tri123',
      name: 'Tri Test',
      description: 'Desc'
    }));

    component.saveCategory({ _id: null, name: '', description: '' });

    expect(component.categories.sort!.active).toBe('name');
    expect(component.categories.sort!.direction).toBe('asc');
    expect(spySortChange).toHaveBeenCalled();
  });
  
  it('devrait retourner \\u0000 pour la catégorie highlightée (hors édition)', () => {
    const cat: Category = { _id: '2', name: 'Nom', description: '' };

    component.highlightedCategoryId = '2';
    component.editingCategoryId = null;

    const result = component.categories.sortingDataAccessor(cat, 'name');
    expect(result).toBe('\u0000');
  });

  it('ne devrait pas retourner \\u0000 si la catégorie est en cours d’édition', () => {
    const cat: Category = { _id: '2', name: 'Nom', description: '' };

    component.highlightedCategoryId = '2';
    component.editingCategoryId = '2'; // même ID que highlightée

    const result = component.categories.sortingDataAccessor(cat, 'name');
    expect(result).toBe('Nom');
  });


  it('devrait refuser de supprimer la catégorie par défaut', () => {
    component.deleteCategory(DEFAULT_CATEGORY);
    expect(dialogServiceSpy.info).toHaveBeenCalledWith(
      'Vous ne pouvez pas supprimer la catégorie "Sans catégorie".'
    );
    expect(categoryServiceSpy.deleteCategory).not.toHaveBeenCalled();
  });

  it('devrait afficher les produits liés si l’utilisateur clique sur "Voir les produits" pendant la suppression', fakeAsync(() => {
  const category: Category = {
    _id: 'catWithProducts',
    name: 'Catégorie liée',
    description: '',
    productCount: 2
  };

  let confirmCallCount = 0;
  dialogServiceSpy.confirm.and.callFake(() => {
    confirmCallCount++;
    return of(confirmCallCount === 1 ? 'extra' : 'confirm');
  });

  const fakeProducts: Product[] = [
    {
      _id: 'p1',
      name: 'Produit A',
      category: 'catWithProducts',
      description: 'Un produit lié',
      composition: [],
      dlc: '2025-12-31',
      cookInstructions: 'Cuire 10 minutes',
      stock: true,
      stockQuantity: 5,
      quantityType: 'g',
      price: 4.99,
      images: []
    },
    {
      _id: 'p2',
      name: 'Produit B',
      category: 'catWithProducts',
      description: 'Deuxième produit',
      composition: [],
      dlc: '2025-12-31',
      cookInstructions: 'Cuire 5 minutes',
      stock: true,
      stockQuantity: 2,
      quantityType: 'g',
      price: 3.50,
      images: []
    }
  ];

  productServiceSpy.getProductsByCategory.and.returnValue(of(fakeProducts));
  categoryServiceSpy.deleteCategory.and.returnValue(of({ message: 'OK' }));

  component.deleteCategory(category);
  tick(); // ⏱ appel à showRelatedProducts()
  tick(); // ⏱ retour dans checkProductsInCategory() après afficher les produits
  tick(); // ⏱ suppression effective

  // Vérifications
  expect(productServiceSpy.getProductsByCategory).toHaveBeenCalledWith('catWithProducts');
  expect(dialogServiceSpy.info).toHaveBeenCalledWith(
    jasmine.stringMatching(/Produits associés à la catégorie/),
    'Produits associés'
  );
  expect(categoryServiceSpy.deleteCategory).toHaveBeenCalledWith('catWithProducts');
}));


  it('devrait supprimer une catégorie vide après confirmation',  fakeAsync(() => {
    const category: Category = {
      _id: 'cat123',
      name: 'Test Catégorie',
      description: '',
      productCount: 0
    };

    categoryServiceSpy.deleteCategory.and.returnValue(of({message: 'Catégorie supprimée avec succès.'}));

    component.deleteCategory(category);
    tick();

    expect(categoryServiceSpy.deleteCategory).toHaveBeenCalledWith('cat123');
    expect(dialogServiceSpy.info).toHaveBeenCalledWith('Catégorie supprimée avec succès.');
  }));

  it('ne devrait rien faire si l’utilisateur annule la suppression', () => {
    dialogServiceSpy.confirm.and.returnValue(of('cancel'));

    const category: Category = {
      _id: 'cat123',
      name: 'Test Catégorie',
      description: '',
      productCount: 0
    };

    component.deleteCategory(category);
    expect(categoryServiceSpy.deleteCategory).not.toHaveBeenCalled();
  });
    
  it('devrait afficher une erreur si la suppression échoue', fakeAsync(() => {
    dialogServiceSpy.confirm.and.returnValue(of('confirm'));

    const category: Category = {
      _id: 'catErr',
      name: 'Erreur Catégorie',
      description: '',
      productCount: 0
    };

    const fakeHttpError = new HttpErrorResponse({
      error: 'Erreur suppression',
      status: 500,
      statusText: 'Internal Server Error',
      url: '/api/categories/catErr'
    });

    categoryServiceSpy.deleteCategory.and.returnValue(throwError(() => fakeHttpError));

    component.deleteCategory(category);
    tick();

    expect(dialogServiceSpy.showHttpError).toHaveBeenCalledWith(fakeHttpError);
  }));




});
