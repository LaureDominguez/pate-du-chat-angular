import { TestBed } from '@angular/core/testing';
import { SupplierService, Supplier } from './supplier.service';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { SharedDataService } from './shared-data.service';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';
import { InfoDialogComponent } from '../components/dialog/info-dialog/info-dialog.component';
import { provideHttpClient } from '@angular/common/http';

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
    const sharedDataServiceSpy = jasmine.createSpyObj('SharedDataService', [
      'notifySupplierUpdate'
    ], {
      supplierListUpdate$: of(), // ✅ mock Observable vide
      ingredientListUpdate$: of() // ✅ mock Observable vide
    });

    const dialogSpyObj = jasmine.createSpyObj('MatDialog', ['open']);

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
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

    // Intercepte le GET déclenché automatiquement au démarrage
    httpMock.expectOne('http://localhost:5000/api/suppliers').flush([]);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('devrait être créé', () => {
    console.log('SupplierService créé');
    expect(service).toBeTruthy();
  });

  it('devrait charger les fournisseurs au démarrage', (done) => {
    console.log('Chargement des fournisseurs au démarrage');
    const mockSuppliers: Supplier[] = [
      { _id: '1', name: 'Supplier 1', description: 'Description 1' },
      { _id: '2', name: 'Supplier 2', description: 'Description 2' },
    ];
    console.log('Fournisseurs simulés:', mockSuppliers);

    service['loadSuppliers'](); // 💡 force une nouvelle requête
    httpMock.expectOne('http://localhost:5000/api/suppliers').flush(mockSuppliers);

    service.getSuppliers().subscribe((suppliers) => {
      console.log('🧪 Fournisseurs reçus:', suppliers);
      expect(suppliers.length).toBe(2);
      expect(suppliers[0].name).toBe('Supplier 1');
      done();
    });
  });

  it('devrait ajouter le fournisseur par défaut si aucun fournisseur trouvé', () => {
    console.log('Ajout du fournisseur par défaut si aucun trouvé');
    service.getSuppliers().subscribe((suppliers) => {
      expect(suppliers.length).toBe(1);
      expect(suppliers[0].name).toBe('Sans fournisseur');
      console.log('Fournisseur par défaut ajouté:', suppliers);
    });

    service['loadSuppliers']();
    httpMock.expectOne('http://localhost:5000/api/suppliers').flush([]);
  });

  it('devrait créer un fournisseur et notifier la mise à jour', () => {
    console.log('Création d\'un fournisseur et notification de la mise à jour');
    const newSupplier = { name: 'New Supplier' };

    service.createSupplier(newSupplier).subscribe((supplier) => {
      expect(supplier.name).toBe('New Supplier');
      expect(sharedDataService.notifySupplierUpdate).toHaveBeenCalled();
      console.log('Fournisseur créé:', supplier);
    });

    httpMock.expectOne('http://localhost:5000/api/suppliers').flush(newSupplier);
  });

  it('devrait mettre à jour un fournisseur et notifier la mise à jour', () => {
    console.log('Mise à jour d\'un fournisseur et notification de la mise à jour');
    const updatedSupplier = { _id: '1', name: 'Updated Supplier' };

    service.updateSupplier('1', updatedSupplier).subscribe((supplier) => {
      expect(supplier.name).toBe('Updated Supplier');
      expect(sharedDataService.notifySupplierUpdate).toHaveBeenCalled();
      console.log('Fournisseur mis à jour:', supplier);
    });

    httpMock.expectOne('http://localhost:5000/api/suppliers/1').flush(updatedSupplier);
  });

  it('devrait supprimer un fournisseur et notifier la mise à jour', () => {
    console.log('Suppression d\'un fournisseur et notification de la mise à jour');
    service.deleteSupplier('1').subscribe((response) => {
      expect(response.message).toBe('Fournisseur supprimé');
      expect(sharedDataService.notifySupplierUpdate).toHaveBeenCalled();
      console.log('Fournisseur supprimé:', response);
    });

    httpMock.expectOne('http://localhost:5000/api/suppliers/1').flush({ message: 'Fournisseur supprimé' });
  });

  it('devrait gérer les erreurs et afficher une boîte de dialogue', () => {
    console.log('Gestion des erreurs et affichage d\'une boîte de dialogue');
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
        console.log('Erreur gérée et boîte de dialogue affichée:', error);
      }
    });

    httpMock.expectOne('http://localhost:5000/api/suppliers').flush(
      { message: errorMessage },
      { status: 500, statusText: 'Server Error' }
    );
  });
});
