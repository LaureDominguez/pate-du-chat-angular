use('les_pates_du_chat'); // Sélectionne la base de données

// 🔹 Suppression des collections existantes (optionnel)
db.categories.deleteMany({});
db.suppliers.deleteMany({});
db.ingredients.deleteMany({});
db.products.deleteMany({});

// 🔹 Insertion des catégories
db.categories.insertMany([
  { _id: ObjectId('65a123456789abcd12345601'), name: 'Pâtes fraîches', description: 'Pâtes artisanales maison.' },
  { _id: ObjectId('65a123456789abcd12345602'), name: 'Sauces', description: 'Sauces naturelles et bio.' },
  { _id: ObjectId('65a123456789abcd12345603'), name: 'Plats préparés', description: 'Plats prêts à consommer.' },
  { _id: ObjectId('65a123456789abcd12345604'), name: 'Épicerie', description: 'Produits d’épicerie fine.' },
  { _id: ObjectId('65a123456789abcd12345605'), name: 'Sans gluten', description: 'Produits adaptés aux régimes sans gluten.' }
]);

// 🔹 Insertion des fournisseurs
db.suppliers.insertMany([
  { _id: ObjectId('65b111111111abcd12345601'), name: 'Moulin Bio', description: 'Producteur de farines bio.' },
  { _id: ObjectId('65b111111111abcd12345602'), name: 'Ferme du Coin', description: 'Producteur d’œufs fermiers.' },
  { _id: ObjectId('65b111111111abcd12345603'), name: 'Maison des Tomates', description: 'Production locale de tomates.' },
  { _id: ObjectId('65b111111111abcd12345604'), name: 'Épices du Monde', description: 'Importateur d’épices naturelles.' },
  { _id: ObjectId('65b111111111abcd12345605'), name: 'Huiles & Co', description: 'Producteur d’huiles d’olive artisanales.' }
]);

// 🔹 Insertion des ingrédients
db.ingredients.insertMany([
  { _id: ObjectId('65c222222222abcd12345601'), name: 'Farine de blé', bio: true, supplier: ObjectId('65b111111111abcd12345601'), type: 'simple', subIngredients: [], allergens: ['gluten'], vegan: true, vegeta: true, origin: 'France', images: [] },
  { _id: ObjectId('65c222222222abcd12345602'), name: 'Œufs', bio: false, supplier: ObjectId('65b111111111abcd12345602'), type: 'simple', subIngredients: [], allergens: ['œufs'], vegan: false, vegeta: true, origin: 'France', images: [] },
  { _id: ObjectId('65c222222222abcd12345603'), name: 'Tomates', bio: true, supplier: ObjectId('65b111111111abcd12345603'), type: 'simple', subIngredients: [], allergens: [], vegan: true, vegeta: true, origin: 'Espagne', images: [] },
  { _id: ObjectId('65c222222222abcd12345604'), name: 'Basilic', bio: true, supplier: ObjectId('65b111111111abcd12345604'), type: 'simple', subIngredients: [], allergens: [], vegan: true, vegeta: true, origin: 'Italie', images: [] },
  { _id: ObjectId('65c222222222abcd12345605'), name: 'Huile d’olive', bio: true, supplier: ObjectId('65b111111111abcd12345605'), type: 'simple', subIngredients: [], allergens: [], vegan: true, vegeta: true, origin: 'Grèce', images: [] },
  { _id: ObjectId('65c222222222abcd12345606'), name: 'Pâtes aux œufs', bio: false, supplier: ObjectId('65b111111111abcd12345601'), type: 'compose', subIngredients: [ObjectId('65c222222222abcd12345601'), ObjectId('65c222222222abcd12345602')], allergens: ['gluten', 'œufs'], vegan: false, vegeta: true, origin: 'France', images: [] }
]);

// 🔹 Insertion des produits
db.products.insertMany([
  { _id: ObjectId('65d333333333abcd12345601'), name: 'Tagliatelles fraîches', category: ObjectId('65a123456789abcd12345601'), description: "Tagliatelles artisanales aux œufs.", composition: [ObjectId('65c222222222abcd12345606')], dlc: '2025-05-01', cookInstructions: 'Faire cuire 3 minutes à l’eau bouillante.', stock: true, stockQuantity: 20, quantityType: 'kg', price: 5.5, images: [] },
  { _id: ObjectId('65d333333333abcd12345602'), name: 'Sauce tomate maison', category: ObjectId('65a123456789abcd12345602'), description: 'Sauce tomate 100% naturelle.', composition: [ObjectId('65c222222222abcd12345603'), ObjectId('65c222222222abcd12345604'), ObjectId('65c222222222abcd12345605')], dlc: '2025-06-15', cookInstructions: 'Réchauffer doucement.', stock: true, stockQuantity: 15, quantityType: 'piece', price: 3.2, images: [] },
  { _id: ObjectId('65d333333333abcd12345603'), name: 'Lasagnes fraîches', category: ObjectId('65a123456789abcd12345603'), description: 'Lasagnes préparées avec sauce maison.', composition: [ObjectId('65c222222222abcd12345606'), ObjectId('65c222222222abcd12345603')], dlc: '2025-04-20', cookInstructions: 'Cuire 20 minutes au four.', stock: true, stockQuantity: 10, quantityType: 'piece', price: 7.8, images: [] }
]);
