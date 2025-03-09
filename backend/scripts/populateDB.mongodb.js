use('les_pates_du_chat'); // Sélectionne la base de données

// 🔹 Insertion des catégories
db.categories.insertMany([
  {
    _id: ObjectId('65a123456789abcd12345679'),
    name: 'Pâtes fraîches',
  },
  {
    _id: ObjectId('65a123456789abcd12345680'),
    name: 'Sauces',
  },
]);

// 🔹 Insertion des ingrédients
db.ingredients.insertMany([
  {
    _id: ObjectId('65a987654321abcd98765432'),
    name: 'Farine de blé',
    bio: true,
    supplier: 'Moulin Bio',
    type: 'simple',
    subIngredients: [],
    allergens: ['gluten'],
    vegan: true,
    vegeta: true,
    images: [],
  },
  {
    _id: ObjectId('65a987654321abcd98765433'),
    name: 'Œufs',
    bio: false,
    supplier: 'Ferme du Coin',
    type: 'simple',
    subIngredients: [],
    allergens: ['œufs'],
    vegan: false,
    vegeta: true,
    images: [],
  },
  {
    _id: ObjectId('65a987654321abcd98765434'),
    name: 'Pâtes aux œufs',
    bio: false,
    supplier: 'Fabrication artisanale',
    type: 'compose',
    subIngredients: [
      ObjectId('65a987654321abcd98765432'), // Farine de blé
      ObjectId('65a987654321abcd98765433'), // Œufs
    ],
    allergens: ['gluten', 'œufs'],
    vegan: false,
    vegeta: true,
    images: [],
  },
]);

// 🔹 Insertion des produits
db.products.insertMany([
  {
    _id: ObjectId('65a567890123abcd56789012'),
    name: 'Tagliatelles fraîches',
    category: ObjectId('65a123456789abcd12345679'), // Pâtes fraîches
    description: "Tagliatelles artisanales à base d'œufs frais.",
    composition: [
      ObjectId('65a987654321abcd98765432'), // Farine de blé
      ObjectId('65a987654321abcd98765433'), // Œufs
    ],
    price: 5.5,
    priceType: 'kg',
    stock: true,
    images: [],
  },
  {
    _id: ObjectId('65a567890123abcd56789013'),
    name: 'Sauce tomate maison',
    category: ObjectId('65a123456789abcd12345680'), // Sauces
    description: 'Sauce tomate faite maison, sans conservateurs.',
    composition: [],
    price: 3.2,
    priceType: 'piece',
    stock: true,
    images: [],
  },
]);
