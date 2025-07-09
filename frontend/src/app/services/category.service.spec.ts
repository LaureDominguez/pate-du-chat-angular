import { TestBed } from '@angular/core/testing';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { CategoryService } from './category.service';
import { SharedDataService } from './shared-data.service';
import { DialogService } from './dialog.service';
import { of } from 'rxjs';
import { Category, DEFAULT_CATEGORY } from '../models/category';
import { provideHttpClient } from '@angular/common/http';

// ------------------------------------------------------------------
//  Spécifications du CategoryService
// ------------------------------------------------------------------
//  – Couvre : chargement initial, CRUD, gestion d'erreur, tri + catégorie par défaut
//  – Mocke SharedDataService (spies) & DialogService (spy)
// ------------------------------------------------------------------

describe('CategoryService', () => {
  let service: CategoryService;
  let httpMock: HttpTestingController;
  let sharedDataSpy: jasmine.SpyObj<SharedDataService>;
  let dialogSpy: jasmine.SpyObj<DialogService>;

  const apiUrl = 'http://localhost:5000/api/categories';
  const mockCategories: Category[] = [
    { _id: '1', name: 'Pâtes fraîches', description: 'Desc 1' },
    { _id: '2', name: 'Sauces', description: 'Desc 2' },
  ];

  beforeEach(() => {
    sharedDataSpy = jasmine.createSpyObj('SharedDataService', [
      'notifyCategoryUpdate',
    ], {
      categoryListUpdate$: of(),
      productListUpdate$: of(),
    });

    dialogSpy = jasmine.createSpyObj('DialogService', ['error']);

    TestBed.configureTestingModule({
      
      providers: [        
        provideHttpClient(),
        provideHttpClientTesting(),
        CategoryService,
        { provide: SharedDataService, useValue: sharedDataSpy },
        { provide: DialogService, useValue: dialogSpy },
      ],
    });

    service = TestBed.inject(CategoryService);
    httpMock = TestBed.inject(HttpTestingController);

    // Intercepte le GET auto déclenché dans le constructeur
    httpMock.expectOne(apiUrl).flush([]); // renvoie vide pour tester la catégorie par défaut
  });

  afterEach(() => {
    httpMock.verify();
  });

  // ---------------------------------------------------------------
  //  Construction & chargement initial
  // ---------------------------------------------------------------
  it('doit être créé', () => {
    expect(service).toBeTruthy();
  });

  it('doit ajouter DEFAULT_CATEGORY lorsque aucune catégorie n’est trouvée', (done) => {
    service.getCategories().subscribe((categories) => {
      expect(categories.length).toBe(1);
      expect(categories[0]._id).toBe(DEFAULT_CATEGORY._id);
      done();
    });
  });

  it('doit charger et diffuser les catégories triées', (done) => {
    const serverResponse: Category[] = [...mockCategories, DEFAULT_CATEGORY];

    service['loadCategories'](); // forcer un nouveau chargement

    httpMock.expectOne(apiUrl).flush(serverResponse);

    service.getCategories().subscribe((categories) => {
      expect(categories.length).toBe(3); // DEFAULT_CATEGORY + 2 mocks
      expect(categories[0]._id).toBe(DEFAULT_CATEGORY._id);
      done();
    });
  });

  // ---------------------------------------------------------------
  //  CRUD
  // ---------------------------------------------------------------
  it('doit créer une catégorie et notifier la mise à jour', () => {
    const payload = { name: 'Nouvelle cat' };

    service.createCategory(payload as any).subscribe((created) => {
      expect(created.name).toBe(payload.name);
      expect(sharedDataSpy.notifyCategoryUpdate).toHaveBeenCalled();
    });

    httpMock.expectOne(apiUrl).flush({ _id: '9', name: payload.name });
  });

  it('doit mettre à jour une catégorie et notifier la mise à jour', () => {
    const updated = { _id: '1', name: 'Maj cat' } as Category;

    service.updateCategory('1', updated).subscribe((response) => {
      expect(response.name).toBe(updated.name);
      expect(sharedDataSpy.notifyCategoryUpdate).toHaveBeenCalled();
    });

    httpMock
      .expectOne(`${apiUrl}/1`)
      .flush({ _id: '1', name: updated.name });
  });

  it('doit supprimer une catégorie et notifier la mise à jour', () => {
    service.deleteCategory('1').subscribe((res) => {
      expect(res.message).toBe('deleted');
      expect(sharedDataSpy.notifyCategoryUpdate).toHaveBeenCalled();
    });

    httpMock.expectOne(`${apiUrl}/1`).flush({ message: 'deleted' });
  });

  // ---------------------------------------------------------------
  //  Gestion d’erreurs
  // ---------------------------------------------------------------
  it('doit gérer les erreurs serveur et appeler DialogService.error', () => {
    const payload = { name: 'Cat KO' };
    const errorMessage = 'Erreur serveur. Veuillez réessayer plus tard.';

    service.createCategory(payload as any).subscribe({
      next: () => fail('La requête aurait dû échouer'),
      error: (err) => {
        expect(err.message).toBe(errorMessage);
        expect(dialogSpy.error).toHaveBeenCalledWith(errorMessage);
      },
    });

    httpMock.expectOne(apiUrl).flush(
      { msg: errorMessage },
      { status: 500, statusText: 'Server Error' }
    );
  });
});
