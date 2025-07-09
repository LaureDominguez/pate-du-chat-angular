import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  provideHttpClientTesting,
  HttpTestingController,
} from '@angular/common/http/testing';
import { IngredientService } from './ingredient.service';
import { SharedDataService } from './shared-data.service';
import { DialogService } from './dialog.service';
import { of } from 'rxjs';
import { Ingredient } from '../models/ingredient';
import { DEFAULT_SUPPLIER } from '../models/supplier';

// ------------------------------------------------------------------
//  Spécifications du IngredientService
// ------------------------------------------------------------------
//  – Utilise provideHttpClient / provideHttpClientTesting (Angular 19)
//  – Teste : chargement, CRUD, vérification nom, JSON, mapping supplier, gestion d'erreurs
// ------------------------------------------------------------------

describe('IngredientService', () => {
  let service: IngredientService;
  let httpMock: HttpTestingController;
  let sharedSpy: jasmine.SpyObj<SharedDataService>;
  let dialogSpy: jasmine.SpyObj<DialogService>;

  const apiUrl = 'http://localhost:5000/api/ingredients';

  const mockIngredients: Ingredient[] = [
    {
      _id: '1',
      name: 'Tomate',
      bio: true,
      supplier: 'sup1',
      type: 'simple',
      allergens: [],
      vegan: true,
      vegeta: true,
      origin: 'France',
    } as Ingredient,
    {
      _id: '2',
      name: 'Mozzarella',
      bio: false,
      supplier: undefined as any, // pour tester mapping DEFAULT_SUPPLIER
      type: 'simple',
      allergens: ['lait'],
      vegan: false,
      vegeta: true,
      origin: 'Italie',
    } as Ingredient,
  ];

  beforeEach(() => {
    sharedSpy = jasmine.createSpyObj(
      'SharedDataService',
      ['notifyIngredientUpdate'],
      {
        ingredientListUpdate$: of(),
        supplierListUpdate$: of(),
      }
    );

    dialogSpy = jasmine.createSpyObj('DialogService', ['error']);

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        IngredientService,
        { provide: SharedDataService, useValue: sharedSpy },
        { provide: DialogService, useValue: dialogSpy },
      ],
    });

    service = TestBed.inject(IngredientService);
    httpMock = TestBed.inject(HttpTestingController);

    // Intercepte la requête GET initiale (constructeur)
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

  it('doit charger les ingrédients au démarrage', (done) => {
    service['loadIngredients']();
    httpMock.expectOne(apiUrl).flush(mockIngredients);

    service.getIngredients().subscribe((ings) => {
      expect(ings.length).toBe(2);
      expect(ings[0].name).toBe('Tomate');
      done();
    });
  });

  // ---------------------------------------------------------------
  //  getIngredientsBySupplier (mapping DEFAULT_SUPPLIER)
  // ---------------------------------------------------------------
  it('doit mapper le supplier manquant à DEFAULT_SUPPLIER', (done) => {
    const supId = 'sup1';
    const url = `${apiUrl}/by-supplier/${supId}`;

    service.getIngredientsBySupplier(supId).subscribe((ings) => {
      const moz = ings.find((i) => i._id === '2')!;
      expect(moz.supplier).toEqual(DEFAULT_SUPPLIER);
      done();
    });

    httpMock.expectOne(url).flush(mockIngredients);
  });

  // ---------------------------------------------------------------
  //  CRUD
  // ---------------------------------------------------------------
  it('doit créer un ingrédient et notifier la mise à jour', () => {
    const payload = {
      name: 'Basilic',
      bio: true,
      supplier: 'sup1',
      type: 'simple',
      allergens: [],
      vegan: true,
      vegeta: true,
      origin: 'France',
    } as any;

    service.createIngredient(payload).subscribe((created) => {
      expect(created.name).toBe('Basilic');
      expect(sharedSpy.notifyIngredientUpdate).toHaveBeenCalled();
    });

    httpMock.expectOne(apiUrl).flush({ _id: '9', ...payload });
  });

  it('doit mettre à jour un ingrédient et notifier la mise à jour', () => {
    const updated = { ...mockIngredients[0], name: 'Tomate Bio' } as Ingredient;

    service.updateIngredient('1', updated).subscribe((res) => {
      expect(res.name).toBe('Tomate Bio');
      expect(sharedSpy.notifyIngredientUpdate).toHaveBeenCalled();
    });

    httpMock.expectOne(`${apiUrl}/1`).flush(updated);
  });

  it('doit supprimer un ingrédient et notifier', () => {
    service.deleteIngredient('1').subscribe((res) => {
      expect(res.message).toBe('deleted');
      expect(sharedSpy.notifyIngredientUpdate).toHaveBeenCalled();
    });

    httpMock.expectOne(`${apiUrl}/1`).flush({ message: 'deleted' });
  });

  // ---------------------------------------------------------------
  //  checkExistingIngredientName
  // ---------------------------------------------------------------
  it('doit retourner true si le nom existe déjà', (done) => {
    const name = 'Tomate';
    service.checkExistingIngredientName(name).subscribe((exists) => {
      expect(exists).toBeTrue();
      done();
    });

    httpMock
      .expectOne(`${apiUrl}/check-name/${encodeURIComponent(name)}`)
      .flush(true);
  });

  it('doit appeler dialogService.error via handleError', (done) => {
    const payload: any = { name: '', bio: true };
    const errorMessage = 'Requête invalide.';

    service.createIngredient(payload).subscribe({
      next: () => fail('Devait échouer'),
      error: (err) => {
        expect(err.message).toBe(errorMessage);
        expect(dialogSpy.error).toHaveBeenCalledWith(errorMessage);
        done();
      },
    });

    httpMock.expectOne(apiUrl).flush(
      { msg: errorMessage },
      { status: 400, statusText: 'Bad Request' }
    );
  });

  // ---------------------------------------------------------------
  //  JSON local
  // ---------------------------------------------------------------
  it('doit charger les allergènes', (done) => {
    const data = { allergenes: ['gluten', 'lait'] };
    service.getAllergenes().subscribe((all) => {
      expect(all).toEqual(data.allergenes);
      done();
    });

    httpMock.expectOne('../assets/data/allergenes.json').flush(data);
  });

  it('doit charger les origines', (done) => {
    const origines = ['France', 'Italie'];
    service.getOrigines().subscribe((o) => {
      expect(o).toEqual(origines);
      done();
    });

    httpMock.expectOne('../assets/data/origines.json').flush(origines);
  });

  it('doit gérer erreur 500 sur origines et propager message', (done) => {
    service.getOrigines().subscribe({
      next: () => fail('Erreur attendue'),
      error: (err) => {
        expect(err.message).toContain('Impossible de charger');
        done();
      },
    });

    httpMock.expectOne('../assets/data/origines.json').flush({}, { status: 500, statusText: 'Server Error' });
  });

  // ---------------------------------------------------------------
  //  getOriginIcon
  // ---------------------------------------------------------------
  it('doit retourner un emoji ou drapeau pour une origine connue', () => {
    const icon = service.getOriginIcon('France');
    expect(icon).not.toBe('❓');
  });

  it('doit retourner ❓ pour origine inconnue', () => {
    expect(service.getOriginIcon('Atlantide')).toBe('❓');
  });
});
