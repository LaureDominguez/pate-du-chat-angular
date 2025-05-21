import { TestBed } from '@angular/core/testing';
import { IngredientService, Ingredient } from './ingredient.service';
import { provideHttpClient, HttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { SharedDataService } from './shared-data.service';
import { of } from 'rxjs';

describe('IngredientService', () => {
  let service: IngredientService;
  let httpMock: HttpTestingController;
  let sharedDataService: jasmine.SpyObj<SharedDataService>;

  const mockIngredients: Ingredient[] = [
    {
      _id: '1',
      name: 'Tomate',
      bio: true,
      supplier: 'Fournisseur 1',
      type: 'simple',
      allergens: [],
      vegan: true,
      vegeta: true,
      origin: 'France',
      images: [],
    },
    {
      _id: '2',
      name: 'Mozzarella',
      bio: false,
      supplier: 'Fournisseur 2',
      type: 'simple',
      allergens: ['lait'],
      vegan: false,
      vegeta: true,
      origin: 'Italie',
    },
  ];

  beforeEach(() => {
    const sharedDataServiceSpy = jasmine.createSpyObj('SharedDataService', ['notifyIngredientUpdate'], {
      ingredientListUpdate$: of(),
    });

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        IngredientService,
        { provide: SharedDataService, useValue: sharedDataServiceSpy },
      ],
    });

    service = TestBed.inject(IngredientService);
    httpMock = TestBed.inject(HttpTestingController);
    sharedDataService = TestBed.inject(SharedDataService) as jasmine.SpyObj<SharedDataService>;

    // GET déclenché au démarrage
    httpMock.expectOne('http://localhost:5000/api/ingredients').flush([]);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('devrait être créé', () => {
    expect(service).toBeTruthy();
  });

  it('devrait charger les ingrédients au démarrage', (done) => {
    service['loadIngredients']();
    httpMock.expectOne('http://localhost:5000/api/ingredients').flush(mockIngredients);

    service.getIngredients().subscribe((ingredients) => {
      expect(ingredients.length).toBe(2);
      expect(ingredients[0].name).toBe('Tomate');
      done();
    });
  });

  it('devrait créer un ingrédient et recharger la liste', () => {
    const newIngredient = { name: 'Basilic', bio: true, supplier: '1', type: 'simple', allergens: [], vegan: true, vegeta: true, origin: 'France' };

    service.createIngredient(newIngredient).subscribe((ingredient) => {
      expect(ingredient.name).toBe('Basilic');
    });

    httpMock.expectOne('http://localhost:5000/api/ingredients').flush(newIngredient);
    httpMock.expectOne('http://localhost:5000/api/ingredients').flush([]); // Reload après création
  });

  it('devrait mettre à jour un ingrédient et recharger la liste', () => {
    const updated = { _id: '1', name: 'Tomate Bio', bio: true, supplier: '1', type: 'simple', allergens: [], vegan: true, vegeta: true, origin: 'France' };

    service.updateIngredient('1', updated).subscribe((ingredient) => {
      expect(ingredient.name).toBe('Tomate Bio');
    });

    httpMock.expectOne('http://localhost:5000/api/ingredients/1').flush(updated);
    httpMock.expectOne('http://localhost:5000/api/ingredients').flush([]); // Reload après update
  });

  it('devrait supprimer un ingrédient et recharger la liste', () => {
    service.deleteIngredient('1').subscribe((res) => {
      expect(res.message).toBe('Ingrédient supprimé');
    });

    httpMock.expectOne('http://localhost:5000/api/ingredients/1').flush({ message: 'Ingrédient supprimé' });
    httpMock.expectOne('http://localhost:5000/api/ingredients').flush([]); // Reload après delete
  });

  it('devrait retourner une icône pour une origine connue', () => {
    const icon = service.getOriginIcon('France');
    expect(icon).toContain('fr'); // dépend de originFlag['France']
  });

  it('devrait retourner une icône ❓ pour une origine inconnue', () => {
    const icon = service.getOriginIcon('Atlantide');
    expect(icon).toBe('❓');
  });

  it('devrait charger les allergènes depuis le JSON', (done) => {
    const mockAllergenes = { allergenes: ['gluten', 'lait'] };

    service.getAllergenes().subscribe((allergenes) => {
      expect(allergenes).toEqual(['gluten', 'lait']);
      done();
    });

    httpMock.expectOne('../assets/data/allergenes.json').flush(mockAllergenes);
  });

  it('devrait charger les origines depuis le JSON', (done) => {
    const mockOrigines = ['France', 'Italie'];

    service.getOrigines().subscribe((origines) => {
      expect(origines).toEqual(['France', 'Italie']);
      done();
    });

    httpMock.expectOne('../assets/data/origines.json').flush(mockOrigines);
  });

  it('devrait gérer une erreur 500', (done) => {
    service.getOrigines().subscribe({
      next: () => fail('Erreur attendue'),
      error: (err) => {
        expect(err.message).toContain('Impossible de charger');
        done();
      },
    });

    httpMock.expectOne('../assets/data/origines.json').flush({}, { status: 500, statusText: 'Erreur serveur' });
  });
});
