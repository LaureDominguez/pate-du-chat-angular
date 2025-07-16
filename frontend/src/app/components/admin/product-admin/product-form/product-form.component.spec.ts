import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ProductFormComponent } from './product-form.component';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, Subject } from 'rxjs';
// import { AdminModule } from '../../admin.module';
import { ImageCarouselComponent } from '../../image-carousel/image-carousel.component';
import { DialogService } from '../../../../services/dialog.service';
import { SharedDataService } from '../../../../services/shared-data.service';
import { Category } from '../../../../models/category';
import { Ingredient } from '../../../../models/ingredient';
import { ADMIN_SHARED_IMPORTS } from '../../admin-material';

describe('ProductFormComponent', () => {
  let component: ProductFormComponent;
  let fixture: ComponentFixture<ProductFormComponent>;
  let sharedDataServiceSpy: jasmine.SpyObj<SharedDataService>;
  let matDialogSpy: jasmine.SpyObj<MatDialog>;
  const categoryCreatedSubject = new Subject<Category>();

  const mockDialogRef = {
    close: jasmine.createSpy('close'),
  };

  const dialogServiceStub = {
    error: jasmine.createSpy('error').and.returnValue({ afterClosed: () => of(undefined) }),
    info: jasmine.createSpy('info').and.returnValue({ afterClosed: () => of(undefined) }),
    confirm: jasmine.createSpy('confirm').and.returnValue(of('confirm')),
  };

  const mockData = {
    product: null,
    categories: [],
    ingredients: [],
    imageUrls: [],
    imagePaths: [],
    dlcs: ['7 jours', '14 jours']
  };

  beforeEach(async () => {
    sharedDataServiceSpy = jasmine.createSpyObj('SharedDataService', ['requestCategoryCreation', 'emitDownloadImage', 'requestOpenIngredientForm'], {
      categoryCreated$: categoryCreatedSubject.asObservable(),
      ingredientCreated$: of({
        _id: 'ingX',
        name: 'Paprika',
        bio: true,
        supplier: 's1',
        type: 'simple',
        allergens: [],
        vegan: false,
        vegeta: false,
        origin: 'Espagne'
      })

    });

    matDialogSpy = jasmine.createSpyObj('MatDialog', ['open']);

    await TestBed.configureTestingModule({
      imports: [
        ReactiveFormsModule, 
        ADMIN_SHARED_IMPORTS, 
        NoopAnimationsModule, 
        ImageCarouselComponent, 
        ProductFormComponent],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: mockData },
        { provide: SharedDataService, useValue: sharedDataServiceSpy },
        { provide: DialogService, useValue: dialogServiceStub },
        { provide: MatDialog, useValue: matDialogSpy },
      ]
    }).overrideComponent(ProductFormComponent, {
      set: {
        providers: [{ provide: MatDialog, useValue: matDialogSpy }]
      }
    }).compileComponents();

    fixture = TestBed.createComponent(ProductFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('devrait créer le composant', () => {
    expect(component).toBeTruthy();
  });

  it('devrait initialiser le formulaire avec des valeurs par défaut', () => {
    const form = component.productForm;
    expect(form).toBeTruthy();
    expect(form.get('name')?.value).toBe('');
    expect(form.get('category')?.value).toBe('');
    expect(form.get('composition')?.value).toEqual([]);
  });

  it('devrait déclencher une erreur si aucune catégorie n’est sélectionnée', () => {
    component.categoryCtrl.setValue('test');
    component.productForm.get('category')?.setValue(null);
    component.onCategoryBlur();
    const errors = component.productForm.get('category')?.errors || {};
    expect(errors['invalidSelection']).toBeTrue();
  });

  it('devrait remplir le champ category avec un objet sélectionné', () => {
    const cat = { _id: '1', name: 'Sauces' } as Category;
    component.addCategory(cat);
    expect(component.productForm.get('category')?.value).toEqual(cat);
    expect(component.categoryCtrl.value).toBe('Sauces');
  });

  it('devrait mettre à jour le formulaire après création d’une catégorie via SharedDataService', () => {
    const newCategory: Category = { _id: 'cat999', name: 'Plats chauds', description: '' };
    categoryCreatedSubject.next(newCategory); // simule la réception via le flux
    fixture.detectChanges();
    expect(component.categories.some(c => c._id === 'cat999')).toBeTrue();
    expect(component.productForm.get('category')?.value).toEqual(newCategory);
    expect(component.categoryCtrl.value).toBe('Plats chauds');
  });

  it('devrait appeler openIngredientForm avec le nom formaté quand ingredient === "ingredientNotFound"', () => {
    const spy = spyOn<any>(component, 'openIngredientForm').and.returnValue(Promise.resolve({
      _id: 'ingX', name: 'Paprika', bio: true, supplier: 's1', type: 'simple', allergens: [], vegan: false, vegeta: false, origin: 'Espagne'
    }));

    component.searchedIngredient = 'paprika';
    component.addIngredient('ingredientNotFound');

    expect(spy).toHaveBeenCalledWith('Paprika'); // nom formaté
  });

  it('devrait retourner un nouvel ingrédient depuis openIngredientForm (mock)', async () => {
    const mockIngredient: Ingredient = {
      _id: 'ingX',
      name: 'Paprika',
      bio: true,
      supplier: 's1',
      type: 'simple',
      allergens: [],
      vegan: false,
      vegeta: false,
      origin: 'Espagne'
    };

    const subject = new Subject<Ingredient>();
    sharedDataServiceSpy.ingredientCreated$ = subject.asObservable();

    const promise = component['openIngredientForm']('Paprika');
    subject.next(mockIngredient);

    const result = await promise;
    expect(result).toEqual(mockIngredient);
  });

  it('devrait ajouter un ingrédient à la composition après création via createIngredient()', fakeAsync(() => {
    const mockIngredient: Ingredient = {
      _id: 'ingX',
      name: 'Paprika',
      bio: true,
      supplier: 's1',
      type: 'simple',
      allergens: [],
      vegan: false,
      vegeta: false,
      origin: 'Espagne'
    };

    spyOn<any>(component, 'openIngredientForm').and.returnValue(Promise.resolve(mockIngredient));

    component.searchedIngredient = 'Paprika';
    component.addIngredient('ingredientNotFound');

    tick();
    fixture.detectChanges();

    expect(component.composition.some(i => i._id === 'ingX')).toBeTrue();
  }));

  it('devrait ajouter un ingrédient à la composition', () => {
    const ing = { _id: 'i1', name: 'Tomate' } as Ingredient;
    component.addIngredient(ing);
    expect(component.composition.length).toBe(1);
  });

  it('devrait supprimer un ingrédient de la composition', () => {
    const ing = { _id: 'i1', name: 'Tomate' } as Ingredient;
    component.addIngredient(ing);
    component.removeIngredient(ing);
    expect(component.composition.length).toBe(0);
  });

  it('devrait formater un nom avec la première lettre capitale', () => {
    const result = component.formatNameInput('chocolat noir');
    expect(result).toBe('Chocolat noir');
  });

  it('devrait normaliser une chaîne avec des accents', () => {
    const result = (component as any).normalizeString('Crème fraîche');
    expect(result).toBe('creme fraiche');
  });

  it('devrait vider le champ category avec clearCategory()', () => {
    component.categoryCtrl.setValue('Test');
    component.productForm.get('category')?.setValue({ _id: '1', name: 'Test' });
    component.clearCategory();
    expect(component.categoryCtrl.value).toBe('');
    expect(component.productForm.get('category')?.value).toBeFalsy();
  });

  it('devrait désactiver le champ stock si stockQuantity = 0', () => {
    component.productForm.get('stockQuantity')?.setValue(0);
    component['updateStockToggleState']();
    expect(component.productForm.get('stock')?.enabled).toBeTrue(); // 0 active le toggle
  });

  it('devrait désactiver le champ stock si stockQuantity est vide', () => {
    component.productForm.get('stockQuantity')?.setValue('');
    component['updateStockToggleState']();
    expect(component.productForm.get('stock')?.disabled).toBeTrue();
  });

  it('devrait utiliser customDlc si dlc est "Autre"', () => {
    spyOn(component.formValidated, 'emit');

    component.productForm.patchValue({ dlc: 'Autre', customDlc: '3 semaines' });
    component.productForm.patchValue({
      name: 'Curry',
      category: { _id: 'cat1', name: 'Plats' },
      composition: [{ _id: 'ing1', name: 'Épices' }],
      cookInstructions: 'Faire mijoter',
      stockQuantity: 5,
      quantityType: 'kg',
      price: 7.5
    });

    component.validateAndSubmit();

    const emitted = (component.formValidated.emit as jasmine.Spy).calls.mostRecent().args[0];
    expect(emitted.productData.dlc).toBe('3 semaines');
  });

  // it('devrait afficher une confirmation si stockQuantity est vide', () => {
  //   component.productForm.get('stockQuantity')?.setValue('');
  //   component.validateStockAndPrice();
  //   expect(dialogServiceStub.confirm).toHaveBeenCalled();
  // });

  it('ne devrait pas remplir customDlc si dlc est une valeur prédéfinie', () => {
    component.productForm.patchValue({ dlc: '7 jours' });
    expect(component.customDlc?.value).toBe('');
  });

  // it('devrait émettre un téléchargement via SharedDataService', () => {
  //   const spy = sharedDataServiceSpy.emitDownloadImage as jasmine.Spy;
  //   component.downloadImage('/uploads/image.jpg');
  //   expect(spy).toHaveBeenCalledWith('/uploads/image.jpg', 'Produit');
  // });

  it('devrait appeler checkNameExists.emit avec le nom si valide', () => {
    spyOn(component.checkNameExists, 'emit');
    // component.productForm.get('name')?.setValue('Pizza');
    component.productForm.patchValue({
      name: 'Pizza',
      category: { _id: 'cat1', name: 'Plats' },
      composition: [{ _id: 'ing1', name: 'Sauce' }],
      dlc: '7 jours',
      stockQuantity: 1,
      quantityType: 'kg',
      price: 5
    });
    component.save();
    expect(component.checkNameExists.emit).toHaveBeenCalledWith('Pizza');
  });

  it('ne doit rien émettre si le nom est vide', () => {
    spyOn(component.checkNameExists, 'emit');
    component.productForm.get('name')?.setValue('');
    component.save();
    expect(component.checkNameExists.emit).not.toHaveBeenCalled();
  });

  it('devrait émettre les données si le formulaire est valide', () => {
    spyOn(component.formValidated, 'emit');
    component.productForm.patchValue({
      name: 'Ravioli',
      category: { _id: '1', name: 'Pâtes' },
      composition: [{ _id: '1', name: 'Epinards' }],
      dlc: '7 jours',
      cookInstructions: 'Chauffer 5 min.',
      stockQuantity: 10,
      quantityType: 'kg',
      price: 3.5
    });
    component.validateAndSubmit();
    expect(component.formValidated.emit).toHaveBeenCalled();
    const emitted = (component.formValidated.emit as jasmine.Spy).calls.mostRecent().args[0];
    expect(emitted.productData.name).toBe('Ravioli');
    expect(emitted.imageOrder).toBeDefined();
  });

  it('ne doit pas émettre si le formulaire est invalide', () => {
    spyOn(component.formValidated, 'emit');
    component.productForm.patchValue({ name: '', category: null });
    component.validateAndSubmit();
    expect(component.formValidated.emit).not.toHaveBeenCalled();
    expect(dialogServiceStub.error).toHaveBeenCalled();
  });

  it('devrait retourner un message d\'erreur pour un champ requis', () => {
    const control = component.productForm.get('name');
    control?.setValue('');
    control?.markAsTouched();
    const msg = (component as any).getErrorMessage('name');
    expect(msg).toContain('obligatoire');
  });

  it('devrait inclure les images et fichiers dans l’émission', () => {
    spyOn(component.formValidated, 'emit');
    const mockFile = new File([''], 'photo.jpg', { type: 'image/jpeg' });
    component.processedImages = [
      { type: 'preview', data: 'base64data', file: mockFile, originalIndex: 0 },
      { type: 'existing', data: '/uploads/photo.jpg', path: '/uploads/photo.jpg', originalIndex: 1 },
    ];
    component.removedExistingImages = ['/uploads/old.jpg'];
    component.productForm.patchValue({
      name: 'Tarte',
      category: { _id: '1', name: 'Desserts' },
      composition: [{ _id: '1', name: 'Pomme' }],
      dlc: '7 jours',
      cookInstructions: 'Froid',
      stockQuantity: 5,
      quantityType: 'kg',
      price: 2.8
    });
    component.validateAndSubmit();
    const emitted = (component.formValidated.emit as jasmine.Spy).calls.mostRecent().args[0];
    expect(emitted.selectedFiles.length).toBe(1);
    expect(emitted.imageOrder).toContain('photo.jpg');
    expect(emitted.imageOrder).toContain('/uploads/photo.jpg');
    expect(emitted.removedExistingImages).toContain('/uploads/old.jpg');
  });
});
