import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { IngredientFormComponent } from './ingredient-form.component';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { SharedDataService } from '../../../../services/shared-data.service';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, Subject } from 'rxjs';
import { AdminModule } from '../../admin.module';
import { ImageCarouselComponent } from '../../image-carousel/image-carousel.component';
import { Supplier } from '../../../../models/supplier';
import { InfoDialogComponent } from '../../../dialog/info-dialog/info-dialog.component';

describe('IngredientFormComponent', () => {
  let component: IngredientFormComponent;
  let fixture: ComponentFixture<IngredientFormComponent>;
  let sharedDataServiceSpy: jasmine.SpyObj<SharedDataService>;
  let supplierCreatedSubject: Subject<Supplier>;
  let matDialogSpy: jasmine.SpyObj<MatDialog>;

  const mockDialogRef = {
    close: jasmine.createSpy('close'),
  };

  const mockData = {
    ingredient: null,
    allergenesList: ['gluten', 'lait'],
    suppliers: [],
    originesList: [],
    searchedValue: '',
    ingredients: [],
    imageUrls: [],
    imagePaths: [],
  };

  beforeEach(async () => {
    supplierCreatedSubject = new Subject<Supplier>();
    sharedDataServiceSpy = jasmine.createSpyObj('SharedDataService', ['requestSupplierCreation', 'emitDownloadImage'], {
      supplierCreated$: supplierCreatedSubject.asObservable(),
    });

    matDialogSpy = jasmine.createSpyObj('MatDialog', ['open']);

    await TestBed.configureTestingModule({
      imports: [
        ReactiveFormsModule,
        AdminModule,
        NoopAnimationsModule,
        ImageCarouselComponent,
        IngredientFormComponent
      ],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: mockData },
        { provide: SharedDataService, useValue: sharedDataServiceSpy },
        { provide: MatDialog, useValue: matDialogSpy },
      ]
    }).overrideComponent(IngredientFormComponent, {
      set: {
        providers: [
          { provide: MatDialog, useValue: matDialogSpy }
        ]
      }
    }).compileComponents();

    fixture = TestBed.createComponent(IngredientFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // Innitialisation du formulaire
  it('devrait créer le composant', () => {
    expect(component).toBeTruthy();
  });

  it('devrait initialiser le formulaire avec des valeurs par défaut', () => {
    const form = component.ingredientForm;
    expect(form).toBeTruthy();
    expect(form.get('name')?.value).toBe('');
    expect(form.get('supplier')?.value).toBe('');
    expect(form.get('type')?.value).toBe('simple');
  });
  
  it('devrait formater un nom avec la première lettre capitale', () => {
    const result = component.formatNameInput('basilic');
    expect(result).toBe('Basilic');
  });

  // Autocomplete
  it('devrait filtrer les fournisseurs dans l’autocomplétion', fakeAsync(() => {
    component.suppliers = [
      { _id: '1', name: 'Fournisseur A', description: '' },
      { _id: '2', name: 'Fournisseur B', description: '' },
      { _id: '3', name: 'Autre', description: '' },
    ];
    component.ngOnInit();
    let filteredResults: any[] = [];
    component.filteredSuppliers.subscribe(results => {
      filteredResults = results;
    });
    component.supplierCtrl.setValue('Fournisseur');
    tick(200); // laisse le temps à RxJS de réagir
    expect(filteredResults.length).toBe(2);
    expect(filteredResults.every(s => s.name.includes('Fournisseur'))).toBeTrue();
  }));

  it('devrait vider le champ fournisseur avec clearField()', () => {
    component.supplierCtrl.setValue('Test');
    component.ingredientForm.get('supplier')?.setValue({ _id: '1', name: 'Test' });
    component.clearField('supplier');
    expect(component.supplierCtrl.value).toBe('');
    expect(component.ingredientForm.get('supplier')?.value).toBeFalsy();
  });


  // Fournisseur
  it('devrait corriger les valeurs fournisseur quand un nouveau est reçu', () => {
    const newSupplier = { _id: '123', name: 'Nouveau fournisseur', description: '' };

    supplierCreatedSubject.next(newSupplier);
    fixture.detectChanges();

    expect(component.suppliers.length).toBe(1);
    expect(component.ingredientForm.get('supplier')?.value).toEqual(newSupplier);
    expect(component.supplierCtrl.value).toBe('Nouveau fournisseur');
  });

  // Sous-ingredients
  it('devrait rendre subIngredients requis si type === "compose"', () => {
    component.ingredientForm.patchValue({ type: 'compose', subIngredients: [] });
    component.type?.updateValueAndValidity();
    fixture.detectChanges();
    const errors = component.ingredientForm.get('subIngredients')?.errors || {};
    expect(errors['required']).toBeTrue();
  });

  it('devrait ajouter un sous-ingrédient s’il n’est pas encore sélectionné', () => {
    const sub = { _id: 'sub1', name: 'Sel', allergens: [], origin: '', type: 'simple' };
    component.addSubIngredient(sub as any);
    expect(component.subIngredients.length).toBe(1);
    expect(component.subIngredients[0]._id).toBe('sub1');
  });

  it('devrait supprimer un sous-ingrédient s’il est présent', () => {
    const sub = { _id: 'sub1', name: 'Sel', allergens: [], origin: '', type: 'simple' };
    component.addSubIngredient(sub as any);
    expect(component.subIngredients.length).toBe(1);
    component.removeSubIngredient(sub as any);
    expect(component.subIngredients.length).toBe(0);
  });
  
  // BIO
  it('devrait désactiver bio si type === "compose"', () => {
    component.ingredientForm.patchValue({ type: 'compose' });
    fixture.detectChanges();
    expect(component.bio?.disabled).toBeTrue();
  });

  // VEGAN
  it('devrait cocher vegeta si vegan est coché', () => {
    component.ingredientForm.get('vegan')?.setValue(true);
    component.onVeganChange(true);
    expect(component.ingredientForm.get('vegeta')?.value).toBeTrue();
  });

  // Enregistrement
  it('devrait appeler checkNameExists.emit avec le nom si valide', () => {
    spyOn(component.checkNameExists, 'emit');
    component.ingredientForm.get('name')?.setValue('Tomate');
    component.save();
    expect(component.checkNameExists.emit).toHaveBeenCalledWith('Tomate');
  });

  it('devrait émettre les données si le formulaire est valide', () => {
    spyOn(component.formValidated, 'emit');
    component.ingredientForm.patchValue({
      name: 'Tomate',
      supplier: { _id: '1', name: 'Fournisseur 1' },
      origin: 'France'
    });

    component.validateAndSubmit();

    expect(component.formValidated.emit).toHaveBeenCalled();
    const emitted = (component.formValidated.emit as jasmine.Spy).calls.mostRecent().args[0];
    expect(emitted.ingredientData.name).toBe('Tomate');
    expect(emitted.ingredientData.supplier.name).toBe('Fournisseur 1');
  });

  it('ne doit pas émettre si le formulaire est invalide', () => {
    spyOn(component.formValidated, 'emit');
    const dialogSpy = TestBed.inject(MatDialog) as jasmine.SpyObj<MatDialog>;

    component.ingredientForm.patchValue({
      name: '', // champ requis vide → invalide
      origin: ''
    });

    component.validateAndSubmit();

    expect(component.formValidated.emit).not.toHaveBeenCalled();
    expect(dialogSpy.open).toHaveBeenCalled();
  });

  it('devrait afficher un message d’erreur si le formulaire est invalide', () => {
    const dialogSpy = TestBed.inject(MatDialog) as jasmine.SpyObj<MatDialog>;

    component.ingredientForm.patchValue({
      name: '',
      origin: ''
    });

    component.validateAndSubmit();

    expect(dialogSpy.open).toHaveBeenCalled();
    expect(dialogSpy.open.calls.mostRecent().args[0]).toBe(InfoDialogComponent);
  });

  it('devrait inclure les images sélectionnées et supprimées dans l’envoi', () => {
    spyOn(component.formValidated, 'emit');
    const mockFile = new File([''], 'image1.jpg', { type: 'image/jpeg' });

    component.processedImages = [
      { type: 'preview', data: 'base64data', file: mockFile, originalIndex: 0 },
      { type: 'existing', data: '/uploads/existing.jpg', path: '/uploads/existing.jpg', originalIndex: 1 }
    ];
    component.removedExistingImages = ['/uploads/old.jpg'];
    component.ingredientForm.patchValue({
      name: 'Olive',
      supplier: { _id: '1', name: 'Fournisseur' },
      origin: 'Italie'
    });

    component.validateAndSubmit();

    const emitted = (component.formValidated.emit as jasmine.Spy).calls.mostRecent().args[0];
    expect(emitted.selectedFiles.length).toBe(1);
    expect(emitted.imageOrder).toContain('image1.jpg');
    expect(emitted.imageOrder).toContain('/uploads/existing.jpg');
    expect(emitted.removedExistingImages).toContain('/uploads/old.jpg');
  });



});
