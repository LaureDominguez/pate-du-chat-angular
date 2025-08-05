use('les_pates_du_chat');   // ⇦ sélectionne la DB

/************ 1) Nettoyage ************/
db.products.deleteMany({});
db.ingredients.deleteMany({});
db.categories.deleteMany({});
db.suppliers.deleteMany({});

/************ 2) Catégories ************/
db.categories.insertMany([
  {
    _id: ObjectId('66a000000000000000000001'),
    name: 'Pâtes fraîches',
    slug: 'pates-fraiches',
    previousSlugs: [],
    description: 'Pâtes artisanales maison.',
    createdAt: new Date(), updatedAt: new Date()
  },
  {
    _id: ObjectId('66a000000000000000000002'),
    name: 'Sauces',
    slug: 'sauces',
    previousSlugs: [],
    description: 'Sauces naturelles et bio.',
    createdAt: new Date(), updatedAt: new Date()
  },
  {
    _id: ObjectId('66a000000000000000000003'),
    name: 'Plats préparés',
    slug: 'plats-prepares',
    previousSlugs: [],
    description: 'Prêts à consommer.',
    createdAt: new Date(), updatedAt: new Date()
  }
]);

/************ 3) Fournisseurs ************/
db.suppliers.insertMany([
  {
    _id: ObjectId('66b000000000000000000001'),
    name: 'Moulin Bio',
    slug: 'moulin-bio',
    previousSlugs: [],
    description: 'Producteur de farines bio.',
    createdAt: new Date(), updatedAt: new Date()
  },
  {
    _id: ObjectId('66b000000000000000000002'),
    name: 'Ferme du Coin',
    slug: 'ferme-du-coin',
    previousSlugs: [],
    description: 'Œufs fermiers plein-air.',
    createdAt: new Date(), updatedAt: new Date()
  }
]);

/************ 4) Ingrédients ************/
db.ingredients.insertMany([
  {
    _id: ObjectId('66c000000000000000000001'),
    name: 'Farine de blé',
    slug: 'farine-de-ble',
    previousSlugs: [],
    bio: true,
    supplier: ObjectId('66b000000000000000000001'),
    type: 'simple',
    subIngredients: [],
    allergens: ['gluten'],
    vegan: true,  vegeta: true,
    origin: 'France',
    images: [],
    createdAt: new Date(), updatedAt: new Date()
  },
  {
    _id: ObjectId('66c000000000000000000002'),
    name: 'Œufs frais',
    slug: 'oeufs-frais',
    previousSlugs: [],
    bio: false,
    supplier: ObjectId('66b000000000000000000002'),
    type: 'simple',
    subIngredients: [],
    allergens: ['oeufs'],
    vegan: false, vegeta: true,
    origin: 'France',
    images: [],
    createdAt: new Date(), updatedAt: new Date()
  },
  {
    _id: ObjectId('66c000000000000000000003'),
    name: 'Pâtes aux œufs',
    slug: 'pates-aux-oeufs',
    previousSlugs: [],
    bio: false,
    supplier: ObjectId('66b000000000000000000001'),
    type: 'compose',
    subIngredients: [
      ObjectId('66c000000000000000000001'),
      ObjectId('66c000000000000000000002')
    ],
    allergens: ['gluten', 'oeufs'],
    vegan: false, vegeta: true,
    origin: 'France',
    images: [],
    createdAt: new Date(), updatedAt: new Date()
  }
]);

/************ 5) Produits ************/
db.products.insertMany([
  {
    _id: ObjectId('66d000000000000000000001'),
    name: 'Tagliatelles fraîches',
    slug: 'tagliatelles-fraiches',
    previousSlugs: [],
    category: ObjectId('66a000000000000000000001'),
    description: 'Tagliatelles artisanales aux œufs.',
    composition: [ObjectId('66c000000000000000000003')],
    dlc: '2025-05-01',
    cookInstructions: 'Cuire 3 min à l’eau bouillante.',
    forSale: true,
    stockQuantity: 20,
    quantityType: 'kg',
    price: 5.50,
    images: [],
    createdAt: new Date(), updatedAt: new Date()
  },
  {
    _id: ObjectId('66d000000000000000000002'),
    name: 'Sauce tomate maison',
    slug: 'sauce-tomate-maison',
    previousSlugs: [],
    category: ObjectId('66a000000000000000000002'),
    description: 'Tomates 100 % naturelles.',
    composition: [],
    dlc: '2025-06-15',
    cookInstructions: 'Réchauffer doucement.',
    forSale: true,
    stockQuantity: 15,
    quantityType: 'piece',
    price: 3.20,
    images: [],
    createdAt: new Date(), updatedAt: new Date()
  }
]);

print('✅  Jeu de données réinitialisé');
