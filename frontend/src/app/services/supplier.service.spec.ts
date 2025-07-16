import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  provideHttpClientTesting,
  HttpTestingController,
} from '@angular/common/http/testing';
import { SupplierService } from './supplier.service';
import { SharedDataService } from './shared-data.service';
import { DialogService } from './dialog.service';
import { of } from 'rxjs';
import { Supplier, DEFAULT_SUPPLIER } from '../models/supplier';

// ------------------------------------------------------------------
//  Spécifications du SupplierService (Angular 19 providers)
// ------------------------------------------------------------------
//  – Utilise provideHttpClient / provideHttpClientTesting
//  – Teste : chargement initial, CRUD, gestion d'erreur, tri + fournisseur par défaut
// ------------------------------------------------------------------

describe('SupplierService', () => {
  let service: SupplierService;
  let httpMock: HttpTestingController;
  let sharedDataSpy: jasmine.SpyObj<SharedDataService>;
  let dialogSpy: jasmine.SpyObj<DialogService>;

  const apiUrl = 'http://localhost:5000/api/suppliers';
  const baseSuppliers: Supplier[] = [
    { _id: '1', name: 'Fournisseur A', description: 'Desc 1' } as Supplier,
    { _id: '2', name: 'Fournisseur B', description: 'Desc 2' } as Supplier,
  ];

  beforeEach(() => {
    sharedDataSpy = jasmine.createSpyObj(
      'SharedDataService',
      ['notifySupplierUpdate'],
      {
        supplierListUpdate$: of(),
        ingredientListUpdate$: of(),
      }
    );

    dialogSpy = jasmine.createSpyObj('DialogService', ['error']);

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        SupplierService,
        { provide: SharedDataService, useValue: sharedDataSpy },
        { provide: DialogService, useValue: dialogSpy },
      ],
    });

    service = TestBed.inject(SupplierService);
    httpMock = TestBed.inject(HttpTestingController);

    // Intercepte le GET initial déclenché dans le constructeur (réponse vide)
    httpMock.expectOne(apiUrl).flush([]);
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

  it("doit ajouter DEFAULT_SUPPLIER lorsqu'aucun fournisseur n’est trouvé", (done) => {
    service.getSuppliers().subscribe((suppliers) => {
      expect(suppliers.length).toBe(1);
      expect(suppliers[0]._id).toBe(DEFAULT_SUPPLIER._id);
      done();
    });
  });

  it('doit charger et diffuser les fournisseurs triés', (done) => {
    // Réponse serveur contenant DEFAULT_SUPPLIER en dernier pour tester le tri
    const serverResponse: Supplier[] = [...baseSuppliers, DEFAULT_SUPPLIER];

    service['loadSuppliers'](); // force un nouveau chargement

    httpMock.expectOne(apiUrl).flush(serverResponse);

    service.getSuppliers().subscribe((suppliers) => {
      expect(suppliers.length).toBe(3); // DEFAULT_SUPPLIER + 2 mocks
      expect(suppliers[0]._id).toBe(DEFAULT_SUPPLIER._id); // tri OK
      done();
    });
  });

  // ---------------------------------------------------------------
  //  CRUD
  // ---------------------------------------------------------------
  it('doit créer un fournisseur et notifier la mise à jour', () => {
    const payload = { name: 'Nouveau four' };

    service.createSupplier(payload as any).subscribe((created) => {
      expect(created.name).toBe(payload.name);
      expect(sharedDataSpy.notifySupplierUpdate).toHaveBeenCalled();
    });

    httpMock.expectOne(apiUrl).flush({ _id: '9', name: payload.name });
  });

  it('doit mettre à jour un fournisseur et notifier la mise à jour', () => {
    const updated = { _id: '1', name: 'Maj four' } as Supplier;

    service.updateSupplier('1', updated).subscribe((resp) => {
      expect(resp.name).toBe(updated.name);
      expect(sharedDataSpy.notifySupplierUpdate).toHaveBeenCalled();
    });

    httpMock.expectOne(`${apiUrl}/1`).flush(updated);
  });

  it('doit supprimer un fournisseur et notifier la mise à jour', () => {
    service.deleteSupplier('1').subscribe((res) => {
      expect(res.message).toBe('deleted');
      expect(sharedDataSpy.notifySupplierUpdate).toHaveBeenCalled();
    });

    httpMock.expectOne(`${apiUrl}/1`).flush({ message: 'deleted' });
  });

  // ---------------------------------------------------------------
  //  Gestion d’erreurs
  // ---------------------------------------------------------------
  it('doit gérer les erreurs serveur et appeler DialogService.error', () => {
    const payload = { name: 'Bad four' };
    const errorMessage = 'Erreur serveur. Veuillez réessayer plus tard.';

    service.createSupplier(payload as any).subscribe({
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
