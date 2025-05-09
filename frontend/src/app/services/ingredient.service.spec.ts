import { TestBed } from '@angular/core/testing';
import { IngredientService, Ingredient } from './ingredient.service';
import { provideHttpClient, withInterceptors, withJsonpSupport } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { SharedDataService } from './shared-data.service';
import { of } from 'rxjs';

describe('IngredientService', () => {
  let service: IngredientService;
  let httpMock: HttpTestingController;
  let sharedDataService: jasmine.SpyObj<SharedDataService>;

  const mockIngredients: Ingredient[] = [
    {
      _id: '1', name: 'Ingredient 1', origin: 'France',
      bio: false,
      supplier: '',
      type: 'simple',
      allergens: [],
      vegan: false,
      vegeta: false
    },
    {
      _id: '2', name: 'Ingredient 2', origin: 'Italie',
      bio: false,
      supplier: '',
      type: 'simple',
      allergens: [],
      vegan: false,
      vegeta: false
    },
  ];

  beforeEach(() => {
    const sharedDataServiceSpy = jasmine.createSpyObj('SharedDataService', [
      'notifyIngredientUpdate',
    ]);
    sharedDataServiceSpy.ingredientListUpdate$ = of(); // Simule un observable pour le test

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(
          withJsonpSupport(), // Support JSONP si besoin
          withInterceptors([]) // Pas d'intercepteurs dans ce test
        ),
        provideHttpClientTesting(),
        IngredientService,
        { 
          provide: SharedDataService, 
          useValue: sharedDataServiceSpy 
        }
      ]
    });

    service = TestBed.inject(IngredientService);
    httpMock = TestBed.inject(HttpTestingController);
    sharedDataService = TestBed.inject(SharedDataService) as jasmine.SpyObj<SharedDataService>;
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('devrait être créé', () => {
    expect(service).toBeTruthy();
  });

  it('devrait charger les ingrédients au démarrage', () => {
    service.getIngredients().subscribe((ingredients) => {
      expect(ingredients.length).toBe(2);
      expect(ingredients[0].name).toBe('Ingredient 1');
    });

    const req = httpMock.expectOne('http://localhost:5000/api/ingredients');
    expect(req.request.method).toBe('GET');
    req.flush(mockIngredients);
  });

  it('devrait charger les allergènes', () => {
    const mockAllergenes = { allergenes: ['Gluten', 'Lait'] };

    service.getAllergenes().subscribe((allergenes) => {
      expect(allergenes.length).toBe(2);
      expect(allergenes[0]).toBe('Gluten');
    });

    const req = httpMock.expectOne('../assets/data/allergenes.json');
    expect(req.request.method).toBe('GET');
    req.flush(mockAllergenes);
  });

  it('devrait charger les origines', () => {
    const mockOrigines = { origines: ['France', 'Italie'] };

    service.getOrigines().subscribe((origines) => {
      expect(origines.origines.length).toBe(2);
      expect(origines.origines[0]).toBe('France');
    });

    const req = httpMock.expectOne('../assets/data/origines.json');
    expect(req.request.method).toBe('GET');
    req.flush(mockOrigines);
  });

  it('devrait créer un ingrédient et recharger la liste', () => {
    const newIngredient = { name: 'New Ingredient' };

    service.createIngredient(newIngredient).subscribe((ingredient) => {
      expect(ingredient.name).toBe('New Ingredient');
    });

    const req = httpMock.expectOne('http://localhost:5000/api/ingredients');
    expect(req.request.method).toBe('POST');
    req.flush(newIngredient);
  });

  it('devrait gérer les erreurs et afficher un message d\'erreur', () => {
    service.getOrigines().subscribe({
      next: () => fail('La requête aurait dû échouer.'),
      error: (error) => {
        expect(error.message).toBe('Impossible de charger les origines.');
      }
    });

    const req = httpMock.expectOne('../assets/data/origines.json');
    req.flush({ message: 'Erreur serveur' }, { status: 500, statusText: 'Server Error' });
  });
});
