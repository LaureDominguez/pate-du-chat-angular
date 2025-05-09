import { TestBed } from '@angular/core/testing';
import { SupplierService, Supplier } from './supplier.service';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { SharedDataService } from './shared-data.service';
import { MatDialog } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import { InfoDialogComponent } from '../components/dialog/info-dialog/info-dialog.component';
import { provideHttpClient, withJsonpSupport, withInterceptors } from '@angular/common/http';

describe('SupplierService', () => {
  let service: SupplierService;
  let httpMock: HttpTestingController;
  let sharedDataService: jasmine.SpyObj<SharedDataService>;
  let dialogSpy: jasmine.SpyObj<MatDialog>;

  const mockSuppliers: Supplier[] = [
    { _id: '1', name: 'Supplier 1', description: 'Description 1' },
    { _id: '2', name: 'Supplier 2', description: 'Description 2' },
  ];

  beforeEach(() => {
    const sharedDataServiceSpy = jasmine.createSpyObj('SharedDataService', ['notifySupplierUpdate']);
    const dialogSpyObj = jasmine.createSpyObj('MatDialog', ['open']);

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(
          withJsonpSupport(), // Support JSONP si besoin
          withInterceptors([]) // Pas d'intercepteurs dans ce test
        ),
        provideHttpClientTesting(),
        SupplierService,
        { provide: SharedDataService, useValue: sharedDataServiceSpy },
        { provide: MatDialog, useValue: dialogSpyObj }
      ]
    });

    service = TestBed.inject(SupplierService);
    httpMock = TestBed.inject(HttpTestingController);
    sharedDataService = TestBed.inject(SharedDataService) as jasmine.SpyObj<SharedDataService>;
    dialogSpy = TestBed.inject(MatDialog) as jasmine.SpyObj<MatDialog>;
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('devrait être créé', () => {
    expect(service).toBeTruthy();
  });

  it('devrait charger les fournisseurs au démarrage', () => {
    service.getSuppliers().subscribe((suppliers) => {
      expect(suppliers.length).toBe(2);
      expect(suppliers[0].name).toBe('Supplier 1');
    });

    const req = httpMock.expectOne('http://localhost:5000/api/suppliers');
    req.flush(mockSuppliers);
  });

  it('devrait créer un fournisseur et notifier la mise à jour', () => {
    const newSupplier = { name: 'New Supplier' };

    service.createSupplier(newSupplier).subscribe((supplier) => {
      expect(supplier.name).toBe('New Supplier');
      expect(sharedDataService.notifySupplierUpdate).toHaveBeenCalled();
    });

    const req = httpMock.expectOne('http://localhost:5000/api/suppliers');
    req.flush(newSupplier);
  });

  it('devrait mettre à jour un fournisseur et notifier la mise à jour', () => {
    const updatedSupplier = { _id: '1', name: 'Updated Supplier' };

    service.updateSupplier('1', updatedSupplier).subscribe((supplier) => {
      expect(supplier.name).toBe('Updated Supplier');
      expect(sharedDataService.notifySupplierUpdate).toHaveBeenCalled();
    });

    const req = httpMock.expectOne('http://localhost:5000/api/suppliers/1');
    req.flush(updatedSupplier);
  });

  it('devrait supprimer un fournisseur et notifier la mise à jour', () => {
    service.deleteSupplier('1').subscribe((response) => {
      expect(response.message).toBe('Fournisseur supprimé');
      expect(sharedDataService.notifySupplierUpdate).toHaveBeenCalled();
    });

    const req = httpMock.expectOne('http://localhost:5000/api/suppliers/1');
    req.flush({ message: 'Fournisseur supprimé' });
  });

  it('devrait gérer les erreurs et afficher une boîte de dialogue', () => {
    const errorMessage = 'Erreur serveur. Veuillez réessayer plus tard.';
    dialogSpy.open.and.returnValue({ afterClosed: () => of(true) } as any);

    service.createSupplier({ name: 'Invalid Supplier' }).subscribe({
      next: () => fail('La requête aurait dû échouer.'),
      error: (error) => {
        expect(error.message).toBe(errorMessage);
        expect(dialogSpy.open).toHaveBeenCalledWith(InfoDialogComponent, {
          width: '400px',
          data: { message: errorMessage, type: 'error' },
        });
      }
    });

    const req = httpMock.expectOne('http://localhost:5000/api/suppliers');
    req.flush({ message: errorMessage }, { status: 500, statusText: 'Server Error' });
  });
});
