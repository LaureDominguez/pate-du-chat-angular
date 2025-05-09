import { TestBed } from '@angular/core/testing';
import { CategoryService, Category } from './category.service';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { SharedDataService } from './shared-data.service';
import { MatDialog } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import { InfoDialogComponent } from '../components/dialog/info-dialog/info-dialog.component';
import { provideHttpClient, withJsonpSupport, withInterceptors } from '@angular/common/http';

describe('CategoryService', () => {
  let service: CategoryService;
  let httpMock: HttpTestingController;
  let sharedDataService: jasmine.SpyObj<SharedDataService>;
  let dialogSpy: any;

  const mockCategories: Category[] = [
    { _id: '1', name: 'Category 1' },
    { _id: '2', name: 'Category 2' },
  ];

  beforeEach(() => {
    const sharedDataServiceSpy = jasmine.createSpyObj('SharedDataService', ['notifyCategoryUpdate']);
    dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(
          withJsonpSupport(), // Support JSONP si besoin
          withInterceptors([]) // Pas d'intercepteurs dans ce test
        ),
        provideHttpClientTesting(),
        CategoryService,
        { provide: SharedDataService, useValue: sharedDataServiceSpy },
        { provide: MatDialog, useValue: dialogSpy },
      ]
    });

    service = TestBed.inject(CategoryService);
    httpMock = TestBed.inject(HttpTestingController);
    sharedDataService = TestBed.inject(SharedDataService) as jasmine.SpyObj<SharedDataService>;
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('devrait être créé', () => {
    expect(service).toBeTruthy();
  });


  it('devrait charger les catégories au démarrage (comportement indirect)', () => {
    const req = httpMock.expectOne('http://localhost:5000/api/categories');
    req.flush(mockCategories);
  
    service.getCategories().subscribe(categories => {
      expect(categories.length).toBe(2);
      expect(categories[0].name).toBe('Category 1');
    });
  });


  it('devrait créer une catégorie et notifier SharedDataService', () => {
    const newCategory = { name: 'New Category' };
    service.createCategory(newCategory).subscribe((category) => {
      expect(category.name).toBe('New Category');
      expect(sharedDataService.notifyCategoryUpdate).toHaveBeenCalled();
    });

    const req = httpMock.expectOne('http://localhost:5000/api/categories');
    req.flush(newCategory);
  });


  it('devrait gérer les erreurs et afficher une boîte de dialogue en cas d\'erreur serveur', () => {
    const errorMessage = 'Erreur serveur. Veuillez réessayer plus tard.';
    dialogSpy.open.and.returnValue({ afterClosed: () => of(true) });
  
    service.createCategory({ name: 'Invalid Category' }).subscribe({
      next: () => fail('La requête aurait dû échouer.'),
      error: (error) => {
        expect(error.message).toBe(errorMessage);
        expect(dialogSpy.open).toHaveBeenCalledWith(InfoDialogComponent, {
          width: '400px',
          data: { message: errorMessage, type: 'error' },
        });
      },
      complete: () => fail('La requête ne devrait pas se terminer correctement.')
    });
  
    const req = httpMock.expectOne('http://localhost:5000/api/categories');
    req.flush({ msg: errorMessage }, { status: 500, statusText: 'Server Error' });
  });
  
});
