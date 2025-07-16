import { TestBed } from '@angular/core/testing';
import { SharedDataService, QuickCreateData } from './shared-data.service';
import { Category } from '../models/category';
import { Supplier } from '../models/supplier';
import { firstValueFrom, take } from 'rxjs';
import { Ingredient } from '../models/ingredient';

describe('SharedDataService', () => {
  let service: SharedDataService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SharedDataService]
    });
    service = TestBed.inject(SharedDataService);
  });

  it('doit être créé', () => {
    expect(service).toBeTruthy();
  });

  ///////////////////////////////////////////
  /////////////// Categories  ///////////////
  it('doit émettre une demande de création de catégorie', async () => {
    const data: QuickCreateData = { name: 'Catégorie A', description: 'desc' };

    const emitted = firstValueFrom(service.requestNewCategory$);
    service.requestCategoryCreation(data);

    await expectAsync(emitted).toBeResolvedTo(data);
  });

  it('doit émettre Category lorsque sendCategoryToProductForm est appelé', async () => {
    const category: Category = { _id: '1', name: 'Catégorie A' } as Category;

    const emitted = firstValueFrom(service.categoryCreated$);
    service.sendCategoryToProductForm(category);

    await expectAsync(emitted).toBeResolvedTo(category);
  });

  it('doit notifier les abonnés lors d’une mise à jour de catégorie', async () => {
    const notified = firstValueFrom(service.categoryListUpdate$.pipe(take(1)));
    service.notifyCategoryUpdate();
    await expectAsync(notified).toBeResolved();
  });

  ///////////////////////////////////////////
  /////////////// Suppliers  ////////////////
  it('doit émettre une demande de création de fournisseur', async () => {
    const data: QuickCreateData = { name: 'Fournisseur X' };

    const emitted = firstValueFrom(service.requestNewSupplier$);
    service.requestSupplierCreation(data);

    await expectAsync(emitted).toBeResolvedTo(data);
  });

  it('doit envoyer un fournisseur créé à ingredient-form', async () => {
    const supplier: Supplier = { _id: 'sup1', name: 'Fournisseur X' } as Supplier;

    const emitted = firstValueFrom(service.supplierCreated$);
    service.sendSupplierToIngredientForm(supplier);

    await expectAsync(emitted).toBeResolvedTo(supplier);
  });

  it('doit notifier une mise à jour des fournisseurs', async () => {
    const notified = firstValueFrom(service.supplierListUpdate$.pipe(take(1)));
    service.notifySupplierUpdate();
    await expectAsync(notified).toBeResolved();
  });


  ///////////////////////////////////////////
  /////////////// Ingredients ///////////////

  it("doit émettre un événement et stocker la valeur recherchée lorsqu'on appelle requestOpenIngredientForm", async () => {
    const search = 'Tomate';

    const emitted = firstValueFrom(service.requestNewIngredient$.pipe(take(1)));
    service.requestOpenIngredientForm(search);

    await expectAsync(emitted).toBeResolved();
    expect(service.getSearchedIngredient()).toBe(search);
  });

  it('doit retourner une chaîne vide par défaut pour getSearchedIngredient', () => {
    expect(service.getSearchedIngredient()).toBe('');
  });

  it('doit émettre Ingredient lorsque resultIngredientCreated est appelé', async () => {
    const ingredient: Ingredient = {
      _id: 'ing1',
      name: 'Sel',
      bio: false,
      supplier: 'sup1',
      type: 'simple',
      allergens: [],
      vegan: true,
      vegeta: true,
      origin: 'FR',
    } as Ingredient;

    const emitted = firstValueFrom(service.ingredientCreated$);
    service.resultIngredientCreated(ingredient);

    await expectAsync(emitted).toBeResolvedTo(ingredient);
  });

  it('doit notifier les abonnés lors d’une mise à jour d’ingrédient', async () => {
    const notified = firstValueFrom(service.ingredientListUpdate$.pipe(take(1)));
    service.notifyIngredientUpdate();
    await expectAsync(notified).toBeResolved();
  });

  // ---------------------------------------------------------------
  //  Produits (notificateur simple)
  // ---------------------------------------------------------------
  it('doit notifier les abonnés lors d’une mise à jour de produit', async () => {
    const notified = firstValueFrom(service.productListUpdate$.pipe(take(1)));
    service.notifyProductUpdate();
    await expectAsync(notified).toBeResolved();
  });

});
