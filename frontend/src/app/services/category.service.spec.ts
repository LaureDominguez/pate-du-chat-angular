import { TestBed } from '@angular/core/testing';
import { CategoryService, Category } from './category.service';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { SharedDataService } from './shared-data.service';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';
import { InfoDialogComponent } from '../components/dialog/info-dialog/info-dialog.component';
import { provideHttpClient } from '@angular/common/http';

describe('CategoryService', () => {
  let service: CategoryService;
  let httpMock: HttpTestingController;
  let sharedDataService: jasmine.SpyObj<SharedDataService>;
  let dialogSpy: jasmine.SpyObj<MatDialog>;

  const mockCategories: Category[] = [
    { _id: '1', name: 'Category 1', description: 'Description 1' },
    { _id: '2', name: 'Category 2', description: 'Description 2' },
  ];

  beforeEach(() => {
    const sharedDataServiceSpy = jasmine.createSpyObj('SharedDataService', [
      'notifyCategoryUpdate'
    ], {
      categoryListUpdate$: of(), // mock observables
      productListUpdate$: of()
    });

    const dialogSpyObj = jasmine.createSpyObj('MatDialog', ['open']);

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        CategoryService,
        { provide: SharedDataService, useValue: sharedDataServiceSpy },
        { provide: MatDialog, useValue: dialogSpyObj }
      ]
    });

    service = TestBed.inject(CategoryService);
    httpMock = TestBed.inject(HttpTestingController);
    sharedDataService = TestBed.inject(SharedDataService) as jasmine.SpyObj<SharedDataService>;
    dialogSpy = TestBed.inject(MatDialog) as jasmine.SpyObj<MatDialog>;

    // Intercepter le GET automatique au démarrage
    httpMock.expectOne('http://localhost:5000/api/categories').flush([]);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('devrait être créé', () => {
    console.log('CategoryService créé');
    expect(service).toBeTruthy();
  });

  it('devrait charger les catégories au démarrage', (done) => {
    console.log('Chargement des catégories au démarrage');
    // const req = httpMock.expectOne('http://localhost:5000/api/categories');
    // req.flush(mockCategories);
    const mockCategories: Category[] = [
      { _id: '1', name: 'Category 1', description: 'Description 1' },
      { _id: '2', name: 'Category 2', description: 'Description 2' },
    ];
    console.log('Mock categories:', mockCategories);

    service['loadCategories'](); // force une nouvelle requête
    httpMock.expectOne('http://localhost:5000/api/categories').flush(mockCategories);

    service.getCategories().subscribe(categories => {
      expect(categories.length).toBe(2);
      expect(categories[0].name).toBe('Category 1');
      done();
    });
  });

  it('devrait ajouter la catégorie par défaut si aucune n’est trouvée', () => {
    console.log('Aucune catégorie trouvée, ajout de la catégorie par défaut');
    service.getCategories().subscribe(categories => {
      expect(categories.length).toBe(1);
      expect(categories[0].name).toBe('Sans catégorie');
    });

    service['loadCategories'](); // appel manuel
    httpMock.expectOne('http://localhost:5000/api/categories').flush([]);
  });

  it('devrait créer une catégorie et notifier la mise à jour', () => {
    const newCategory = { name: 'New Category' };

    service.createCategory(newCategory).subscribe(category => {
      expect(category.name).toBe('New Category');
      expect(sharedDataService.notifyCategoryUpdate).toHaveBeenCalled();
    });

    httpMock.expectOne('http://localhost:5000/api/categories').flush(newCategory);
  });

  it('devrait mettre à jour une catégorie et notifier la mise à jour', () => {
    const updatedCategory = { _id: '1', name: 'Updated Category' };

    service.updateCategory('1', updatedCategory).subscribe(category => {
      expect(category.name).toBe('Updated Category');
      expect(sharedDataService.notifyCategoryUpdate).toHaveBeenCalled();
    });

    httpMock.expectOne('http://localhost:5000/api/categories/1').flush(updatedCategory);
  });

  it('devrait supprimer une catégorie et notifier la mise à jour', () => {
    service.deleteCategory('1').subscribe(response => {
      expect(response.message).toBe('Catégorie supprimée');
      expect(sharedDataService.notifyCategoryUpdate).toHaveBeenCalled();
    });

    httpMock.expectOne('http://localhost:5000/api/categories/1').flush({ message: 'Catégorie supprimée' });
  });

  it('devrait gérer les erreurs et afficher une boîte de dialogue', () => {
    const errorMessage = 'Erreur serveur. Veuillez réessayer plus tard.';
    dialogSpy.open.and.returnValue({ afterClosed: () => of(true) } as any);

    service.createCategory({ name: 'Invalid Category' }).subscribe({
      next: () => fail('La requête aurait dû échouer.'),
      error: (error) => {
        expect(error.message).toBe(errorMessage);
        expect(dialogSpy.open).toHaveBeenCalledWith(InfoDialogComponent, {
          width: '400px',
          data: { message: errorMessage, type: 'error' },
        });
      }
    });

    httpMock.expectOne('http://localhost:5000/api/categories').flush(
      { message: errorMessage },
      { status: 500, statusText: 'Server Error' }
    );
  });
});
