import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CategoryAdminComponent } from './category-admin.component';
import { CategoryService } from '../../../services/category.service';
import { SharedDataService } from '../../../services/shared-data.service';
import { DialogService } from '../../../services/dialog.service';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';
import { DEFAULT_CATEGORY, Category } from '../../../models/category';
import { ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ConfirmDialogComponent } from '../../dialog/confirm-dialog/confirm-dialog.component';

describe('CategoryAdminComponent', () => {
  let component: CategoryAdminComponent;
  let fixture: ComponentFixture<CategoryAdminComponent>;
  let categoryServiceSpy: jasmine.SpyObj<CategoryService>;
  let sharedDataServiceSpy: jasmine.SpyObj<SharedDataService>;
  let dialogServiceSpy: jasmine.SpyObj<DialogService>;
  let matDialogSpy: jasmine.SpyObj<MatDialog>;

  beforeEach(async () => {
    categoryServiceSpy = jasmine.createSpyObj('CategoryService', [
      'getCategories', 'createCategory', 'updateCategory', 'deleteCategory'
    ]);

    sharedDataServiceSpy = jasmine.createSpyObj('SharedDataService', [
      'sendCategoryToProductForm', 'notifyCategoryUpdate'
    ]);
    Object.defineProperty(sharedDataServiceSpy, 'requestNewCategory$', { value: of() });

    dialogServiceSpy = jasmine.createSpyObj('DialogService', ['showInfo', 'showHttpError']);

    matDialogSpy = jasmine.createSpyObj('MatDialog', ['open']);
    matDialogSpy.open.and.returnValue({
      afterClosed: () => of('confirm'),
      componentInstance: {}
    } as any);

    await TestBed.configureTestingModule({
      imports: [
        CategoryAdminComponent,
        ReactiveFormsModule,
        BrowserAnimationsModule,
        ConfirmDialogComponent // 👈 standalone component
      ],
      providers: [
        { provide: CategoryService, useValue: categoryServiceSpy },
        { provide: SharedDataService, useValue: sharedDataServiceSpy },
        { provide: DialogService, useValue: dialogServiceSpy }
        // ⚠️ MatDialog est injecté via overrideComponent juste après
      ]
    }).compileComponents();

    // 💡 Correction pour standalone component avec dépendance à MatDialog
    TestBed.overrideComponent(CategoryAdminComponent, {
      set: {
        providers: [
          { provide: MatDialog, useValue: matDialogSpy }
        ]
      }
    });

    fixture = TestBed.createComponent(CategoryAdminComponent);
    component = fixture.componentInstance;
    categoryServiceSpy.getCategories.and.returnValue(of([]));
    fixture.detectChanges();
  });

  it('devrait être créé', () => {
    expect(component).toBeTruthy();
  });

  it('devrait refuser de supprimer la catégorie par défaut', () => {
    component.deleteCategory(DEFAULT_CATEGORY);
    expect(dialogServiceSpy.showInfo).toHaveBeenCalledWith(
      'Vous ne pouvez pas supprimer la catégorie "Sans catégorie".',
      'info'
    );
    expect(categoryServiceSpy.deleteCategory).not.toHaveBeenCalled();
  });

  it('devrait supprimer une catégorie vide après confirmation', () => {
    const category: Category = {
      _id: 'cat123',
      name: 'Test Catégorie',
      description: '',
      productCount: 0
    };

    categoryServiceSpy.deleteCategory.and.returnValue(of({message: 'Catégorie supprimée avec succès.'}));

    component.deleteCategory(category);

    expect(matDialogSpy.open).toHaveBeenCalled();
    expect(categoryServiceSpy.deleteCategory).toHaveBeenCalledWith('cat123');
  });

  it('ne devrait rien faire si l’utilisateur annule la suppression', () => {
    matDialogSpy.open.and.returnValue({
      afterClosed: () => of('cancel'),
      componentInstance: {}
    } as any);

    const category: Category = {
      _id: 'cat123',
      name: 'Test Catégorie',
      description: '',
      productCount: 0
    };

    component.deleteCategory(category);

    expect(categoryServiceSpy.deleteCategory).not.toHaveBeenCalled();
  });

  it('devrait initialiser un formulaire en édition avec une catégorie vide', () => {
    component.startEditingCategory();
    expect(component.categoryForm).toBeDefined();
    expect(component.categoryForm.valid).toBeFalse();
  });

  it('ne devrait pas enregistrer si le formulaire est invalide', () => {
    categoryServiceSpy.createCategory.calls.reset();
    component.startEditingCategory();
    component.saveCategory({ _id: null, name: '', description: '' });
    expect(categoryServiceSpy.createCategory).not.toHaveBeenCalled();
  });

});
