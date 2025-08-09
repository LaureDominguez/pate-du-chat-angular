use('les_pates_du_chat');   // ⇦ sélectionne la DB

/************ 1) Nettoyage ************/
db.products.deleteMany({});
db.ingredients.deleteMany({});
db.categories.deleteMany({});
db.suppliers.deleteMany({});

const now = new Date();

/************ 2) Catégories ************/
db.categories.insertMany([
  { _id: ObjectId('66a000000000000000000001'), name: 'Pâtes fraîches', slug: 'pates-fraiches', description: 'Pâtes artisanales maison.', createdAt: now, updatedAt: now },
  { _id: ObjectId('66a000000000000000000002'), name: 'Gnocchis',       slug: 'gnocchis',       description: 'Gnocchis frais.', createdAt: now, updatedAt: now },
  { _id: ObjectId('66a000000000000000000003'), name: 'Arancini (produit naturellement sans gluten)', slug: 'arancini-sans-gluten', description: 'Arancini panure sans gluten.', createdAt: now, updatedAt: now },
  { _id: ObjectId('66a000000000000000000004'), name: 'Raviolis',       slug: 'raviolis',       description: 'Raviolis maison.', createdAt: now, updatedAt: now },
]);

/************ 3) Fournisseurs (fictifs) ************/
db.suppliers.insertMany([
  { _id: ObjectId('66b000000000000000000001'), name: 'Moulin des Allobroges', slug: 'moulin-des-allobroges', description: 'Semoules et farines bio (Savoie, FR).', createdAt: now, updatedAt: now },
  { _id: ObjectId('66b000000000000000000002'), name: 'Ferme des Collines', slug: 'ferme-des-collines', description: 'Œufs plein-air (Ain, FR).', createdAt: now, updatedAt: now },
  { _id: ObjectId('66b000000000000000000003'), name: 'Casa Parma', slug: 'casa-parma', description: 'Parmesan AOP (Parme, IT).', createdAt: now, updatedAt: now },
  { _id: ObjectId('66b000000000000000000004'), name: 'Olea Verde', slug: 'olea-verde', description: 'Huiles d’olive (Ligurie, IT).', createdAt: now, updatedAt: now },
  { _id: ObjectId('66b000000000000000000005'), name: 'Vignobles du Dauphiné', slug: 'vignobles-du-dauphine', description: 'Vins blancs (Isère, FR).', createdAt: now, updatedAt: now },
  { _id: ObjectId('66b000000000000000000006'), name: 'Primeurs de Saumur', slug: 'primeurs-de-saumur', description: 'Champignons et aromatiques (Saumur, FR).', createdAt: now, updatedAt: now },
  { _id: ObjectId('66b000000000000000000007'), name: 'Épices Basques', slug: 'epices-basques', description: 'Piment d’Espelette & épices (FR).', createdAt: now, updatedAt: now },
  { _id: ObjectId('66b000000000000000000008'), name: 'Ibérico Tradición', slug: 'iberico-tradicion', description: 'Charcuteries & tomates séchées (ES).', createdAt: now, updatedAt: now },
  { _id: ObjectId('66b000000000000000000009'), name: 'Fromagerie de Sassenage', slug: 'fromagerie-de-sassenage', description: 'Bleu de Sassenage (Isère, FR).', createdAt: now, updatedAt: now },
  { _id: ObjectId('66b000000000000000000010'), name: 'Fumaison des Alpes', slug: 'fumaison-des-alpes', description: 'Poitrine fumée (Savoie, FR).', createdAt: now, updatedAt: now },
  { _id: ObjectId('66b000000000000000000011'), name: 'Fromagerie Savoyarde', slug: 'fromagerie-savoyarde', description: 'Raclette, Dent du Chat, ricotta (Savoie, FR).', createdAt: now, updatedAt: now },
  { _id: ObjectId('66b000000000000000000012'), name: 'Rizières du Piémont', slug: 'rizieres-du-piemont', description: 'Riz à risotto (Piémont, IT).', createdAt: now, updatedAt: now },
  { _id: ObjectId('66b000000000000000000013'), name: 'Céréales de Beauce', slug: 'cereales-de-beauce', description: 'Maïs, blé & flocons (FR).', createdAt: now, updatedAt: now },
  { _id: ObjectId('66b000000000000000000014'), name: 'Huilerie du Rhône', slug: 'huilerie-du-rhone', description: 'Protéines de colza (FR).', createdAt: now, updatedAt: now },
  { _id: ObjectId('66b000000000000000000015'), name: 'Féverole France', slug: 'feverole-france', description: 'Protéines de féverole (FR).', createdAt: now, updatedAt: now },
  { _id: ObjectId('66b000000000000000000016'), name: 'Coop du Sel Atlantique', slug: 'coop-du-sel-atlantique', description: 'Sel marin (FR).', createdAt: now, updatedAt: now },
  { _id: ObjectId('66b000000000000000000017'), name: 'Eau de Source des Alpes', slug: 'eau-de-source-des-alpes', description: 'Eau de source (FR).', createdAt: now, updatedAt: now },
  { _id: ObjectId('66b000000000000000000018'), name: 'Rucher Savoyard',    slug: 'rucher-savoyard',    description: 'Miels de montagne (Savoie, FR).', createdAt: now, updatedAt: now },
  { _id: ObjectId('66b000000000000000000019'), name: 'Basse-cour Alpine',   slug: 'basse-cour-alpine',  description: 'Volailles fermières (Savoie, FR).', createdAt: now, updatedAt: now },
  { _id: ObjectId('66b000000000000000000020'), name: 'Agrumes de Sicile',   slug: 'agrumes-de-sicile',  description: 'Citrons & agrumes (IT).', createdAt: now, updatedAt: now },
]);

/************ 4) Ingrédients ************/
// Alias pour plus de lisibilité
const S = {
  moulin:   ObjectId('66b000000000000000000001'),
  ferme:    ObjectId('66b000000000000000000002'),
  parma:    ObjectId('66b000000000000000000003'),
  olea:     ObjectId('66b000000000000000000004'),
  vin:      ObjectId('66b000000000000000000005'),
  primeurs: ObjectId('66b000000000000000000006'),
  epices:   ObjectId('66b000000000000000000007'),
  iberico:  ObjectId('66b000000000000000000008'),
  sassen:   ObjectId('66b000000000000000000009'),
  fumaison: ObjectId('66b000000000000000000010'),
  savoi:    ObjectId('66b000000000000000000011'),
  riz:      ObjectId('66b000000000000000000012'),
  cereales: ObjectId('66b000000000000000000013'),
  colza:    ObjectId('66b000000000000000000014'),
  feverole: ObjectId('66b000000000000000000015'),
  sel:      ObjectId('66b000000000000000000016'),
  eau:      ObjectId('66b000000000000000000017'),
};

const S2 = {
  rucher:   ObjectId('66b000000000000000000018'),
  volaille: ObjectId('66b000000000000000000019'),
  agrumes:  ObjectId('66b000000000000000000020'),
};

// IDs ingrédients
const I = {
  semouleBio: ObjectId('66c000000000000000000001'),
  farineT55:  ObjectId('66c000000000000000000002'),
  farineBle:  ObjectId('66c000000000000000000003'),
  oeuf:       ObjectId('66c000000000000000000004'),
  eau:        ObjectId('66c000000000000000000005'),
  pimentBio:  ObjectId('66c000000000000000000006'),
  floconsPT:  ObjectId('66c000000000000000000007'),
  sel:        ObjectId('66c000000000000000000008'),
  rizotto:    ObjectId('66c000000000000000000009'),
  shitake:    ObjectId('66c000000000000000000010'),
  parmesan:   ObjectId('66c000000000000000000011'),
  oignon:     ObjectId('66c000000000000000000012'),
  vinBlanc:   ObjectId('66c000000000000000000013'),
  echalote:   ObjectId('66c000000000000000000014'),
  beurre:     ObjectId('66c000000000000000000015'),
  bouillonLeg:ObjectId('66c000000000000000000016'),
  huileOlive: ObjectId('66c000000000000000000017'),
  fMais:      ObjectId('66c000000000000000000018'),
  fRiz:       ObjectId('66c000000000000000000019'),
  pColza:     ObjectId('66c000000000000000000020'),
  pFeverole:  ObjectId('66c000000000000000000021'),
  petalesMais:ObjectId('66c000000000000000000022'),
  chorizo:    ObjectId('66c000000000000000000023'),
  tomatesSec: ObjectId('66c000000000000000000024'),
  noix:       ObjectId('66c000000000000000000025'),
  bleuSass:   ObjectId('66c000000000000000000026'),
  poitrine:   ObjectId('66c000000000000000000027'),
  raclette:   ObjectId('66c000000000000000000028'),
  dentChat:   ObjectId('66c000000000000000000029'),
  ricotta:    ObjectId('66c000000000000000000030'),
  persil:     ObjectId('66c000000000000000000031'),
  poivre:     ObjectId('66c000000000000000000032'),
  champSaum:  ObjectId('66c000000000000000000033'),
  ail:        ObjectId('66c000000000000000000034'),
  panureSG:   ObjectId('66c000000000000000000040'),
  baseRiso:   ObjectId('66c000000000000000000041'),
};

// Nouveaux IDs ingrédients “sans allergènes” (suite de I.* existants)
const J = {
  baseRizNature: ObjectId('66c000000000000000000042'),
  tomate:        ObjectId('66c000000000000000000043'),
  basilic:       ObjectId('66c000000000000000000044'),
  poulet:        ObjectId('66c000000000000000000045'),
  jambon:        ObjectId('66c000000000000000000046'),
  miel:          ObjectId('66c000000000000000000047'),
  courgette:     ObjectId('66c000000000000000000048'),
  poivron:       ObjectId('66c000000000000000000049'),
  jusCitron:     ObjectId('66c000000000000000000050'),
};

db.ingredients.insertMany([
  { _id: I.semouleBio, name: 'Semoule de blé dur BIO', slug: 'semoule-ble-dur-bio', bio: true,  supplier: S.moulin,  type: 'simple', subIngredients: [], allergens: ['gluten'], vegan: true,  vegeta: true,  origin: 'France', createdAt: now, updatedAt: now, images: [] },
  { _id: I.farineT55,  name: 'Farine T55 BIO',         slug: 'farine-t55-bio',     bio: true,  supplier: S.moulin,  type: 'simple', subIngredients: [], allergens: ['gluten'], vegan: true,  vegeta: true,  origin: 'France', createdAt: now, updatedAt: now, images: [] },
  { _id: I.farineBle,  name: 'Farine de blé',          slug: 'farine-de-ble',      bio: false, supplier: S.cereales,type: 'simple', subIngredients: [], allergens: ['gluten'], vegan: true,  vegeta: true,  origin: 'France', createdAt: now, updatedAt: now, images: [] },
  { _id: I.oeuf,       name: 'Œuf',                    slug: 'oeuf',               bio: false, supplier: S.ferme,   type: 'simple', subIngredients: [], allergens: ['oeufs'], vegan: false, vegeta: true,  origin: 'France', createdAt: now, updatedAt: now, images: [] },
  { _id: I.eau,        name: 'Eau',                    slug: 'eau',                bio: false, supplier: S.eau,     type: 'simple', subIngredients: [], allergens: [],         vegan: true,  vegeta: true,  origin: 'France', createdAt: now, updatedAt: now, images: [] },
  { _id: I.pimentBio,  name: 'Piment d’Espelette BIO', slug: 'piment-espelette-bio',bio: true, supplier: S.epices,  type: 'simple', subIngredients: [], allergens: [],         vegan: true,  vegeta: true,  origin: 'France', createdAt: now, updatedAt: now, images: [] },
  { _id: I.floconsPT,  name: 'Flocons de pomme de terre', slug: 'flocons-pomme-de-terre', bio: false, supplier: S.cereales, type: 'simple', subIngredients: [], allergens: [], vegan: true, vegeta: true, origin: 'France', createdAt: now, updatedAt: now, images: [] },
  { _id: I.sel,        name: 'Sel',                    slug: 'sel',                bio: false, supplier: S.sel,     type: 'simple', subIngredients: [], allergens: [],         vegan: true,  vegeta: true,  origin: 'France', createdAt: now, updatedAt: now, images: [] },
  { _id: I.rizotto,    name: 'Riz à risotto',          slug: 'riz-a-risotto',      bio: false, supplier: S.riz,     type: 'simple', subIngredients: [], allergens: [],         vegan: true,  vegeta: true,  origin: 'Italie', createdAt: now, updatedAt: now, images: [] },
  { _id: I.shitake,    name: 'Shiitaké',               slug: 'shiitake',           bio: false, supplier: S.primeurs,type: 'simple', subIngredients: [], allergens: [],         vegan: true,  vegeta: true,  origin: 'France', createdAt: now, updatedAt: now, images: [] },
  { _id: I.parmesan,   name: 'Parmesan',               slug: 'parmesan',           bio: false, supplier: S.parma,   type: 'simple', subIngredients: [], allergens: ['lait'],   vegan: false, vegeta: true,  origin: 'Italie', createdAt: now, updatedAt: now, images: [] },
  { _id: I.oignon,     name: 'Oignon',                 slug: 'oignon',             bio: false, supplier: S.primeurs,type: 'simple', subIngredients: [], allergens: [],         vegan: true,  vegeta: true,  origin: 'France', createdAt: now, updatedAt: now, images: [] },
  { _id: I.vinBlanc,   name: 'Vin blanc',              slug: 'vin-blanc',          bio: false, supplier: S.vin,     type: 'simple', subIngredients: [], allergens: [],         vegan: true,  vegeta: true,  origin: 'France', createdAt: now, updatedAt: now, images: [] },
  { _id: I.echalote,   name: 'Échalote',               slug: 'echalote',           bio: false, supplier: S.primeurs,type: 'simple', subIngredients: [], allergens: [],         vegan: true,  vegeta: true,  origin: 'France', createdAt: now, updatedAt: now, images: [] },
  { _id: I.beurre,     name: 'Beurre',                 slug: 'beurre',             bio: false, supplier: S.savoi,   type: 'simple', subIngredients: [], allergens: ['lait'],   vegan: false, vegeta: true,  origin: 'France', createdAt: now, updatedAt: now, images: [] },
  { _id: I.bouillonLeg,name: 'Bouillon de légumes',    slug: 'bouillon-de-legumes',bio: false, supplier: S.primeurs,type: 'simple', subIngredients: [], allergens: [],         vegan: true,  vegeta: true,  origin: 'France', createdAt: now, updatedAt: now, images: [] },
  { _id: I.huileOlive, name: 'Huile d’olive',          slug: 'huile-d-olive',      bio: false, supplier: S.olea,    type: 'simple', subIngredients: [], allergens: [],         vegan: true,  vegeta: true,  origin: 'Italie', createdAt: now, updatedAt: now, images: [] },
  { _id: I.fMais,      name: 'Farine de maïs',         slug: 'farine-de-mais',     bio: false, supplier: S.cereales,type: 'simple', subIngredients: [], allergens: [],         vegan: true,  vegeta: true,  origin: 'France', createdAt: now, updatedAt: now, images: [] },
  { _id: I.fRiz,       name: 'Farine de riz',          slug: 'farine-de-riz',      bio: false, supplier: S.riz,     type: 'simple', subIngredients: [], allergens: [],         vegan: true,  vegeta: true,  origin: 'Italie', createdAt: now, updatedAt: now, images: [] },
  { _id: I.pColza,     name: 'Protéine de colza',      slug: 'proteine-de-colza',  bio: false, supplier: S.colza,   type: 'simple', subIngredients: [], allergens: [],         vegan: true,  vegeta: true,  origin: 'France', createdAt: now, updatedAt: now, images: [] },
  { _id: I.pFeverole,  name: 'Protéine de féverole',   slug: 'proteine-de-feverole', bio:false, supplier: S.feverole,type: 'simple', subIngredients: [], allergens: [],         vegan: true,  vegeta: true,  origin: 'France', createdAt: now, updatedAt: now, images: [] },
  { _id: I.petalesMais,name: 'Pétales de maïs',        slug: 'petales-de-mais',    bio: false, supplier: S.cereales,type: 'simple', subIngredients: [], allergens: [],         vegan: true,  vegeta: true,  origin: 'France', createdAt: now, updatedAt: now, images: [] },
  { _id: I.chorizo,    name: 'Chorizo',                slug: 'chorizo',            bio: false, supplier: S.iberico, type: 'simple', subIngredients: [], allergens: [],         vegan: false, vegeta: false, origin: 'Espagne', createdAt: now, updatedAt: now, images: [] },
  { _id: I.tomatesSec, name: 'Tomates séchées',        slug: 'tomates-sechees',    bio: false, supplier: S.iberico, type: 'simple', subIngredients: [], allergens: [],         vegan: true,  vegeta: true,  origin: 'Espagne', createdAt: now, updatedAt: now, images: [] },
  { _id: I.noix,       name: 'Noix',                   slug: 'noix',               bio: false, supplier: S.cereales,type: 'simple', subIngredients: [], allergens: ['fruits-a-coque'], vegan: true, vegeta: true, origin: 'France', createdAt: now, updatedAt: now, images: [] },
  { _id: I.bleuSass,   name: 'Bleu de Sassenage',      slug: 'bleu-de-sassenage',  bio: false, supplier: S.sassen,  type: 'simple', subIngredients: [], allergens: ['lait'],   vegan: false, vegeta: true,  origin: 'France', createdAt: now, updatedAt: now, images: [] },
  { _id: I.poitrine,   name: 'Poitrine fumée',         slug: 'poitrine-fumee',     bio: false, supplier: S.fumaison,type: 'simple', subIngredients: [], allergens: [],         vegan: false, vegeta: false, origin: 'France', createdAt: now, updatedAt: now, images: [] },
  { _id: I.raclette,   name: 'Fromage à raclette',     slug: 'fromage-a-raclette', bio: false, supplier: S.savoi,   type: 'simple', subIngredients: [], allergens: ['lait'],   vegan: false, vegeta: true,  origin: 'France', createdAt: now, updatedAt: now, images: [] },
  { _id: I.dentChat,   name: 'Dent du Chat (fromage)', slug: 'dent-du-chat',       bio: false, supplier: S.savoi,   type: 'simple', subIngredients: [], allergens: ['lait'],   vegan: false, vegeta: true,  origin: 'France', createdAt: now, updatedAt: now, images: [] },
  { _id: I.ricotta,    name: 'Ricotta',                slug: 'ricotta',            bio: false, supplier: S.savoi,   type: 'simple', subIngredients: [], allergens: ['lait'],   vegan: false, vegeta: true,  origin: 'France', createdAt: now, updatedAt: now, images: [] },
  { _id: I.persil,     name: 'Persil',                 slug: 'persil',             bio: false, supplier: S.primeurs,type: 'simple', subIngredients: [], allergens: [],         vegan: true,  vegeta: true,  origin: 'France', createdAt: now, updatedAt: now, images: [] },
  { _id: I.poivre,     name: 'Poivre',                 slug: 'poivre',             bio: false, supplier: S.epices,  type: 'simple', subIngredients: [], allergens: [],         vegan: true,  vegeta: true,  origin: 'Madagascar', createdAt: now, updatedAt: now, images: [] },
  { _id: I.champSaum,  name: 'Champignons de Saumur',  slug: 'champignons-de-saumur', bio:false, supplier: S.primeurs, type: 'simple', subIngredients: [], allergens: [],      vegan: true,  vegeta: true,  origin: 'France', createdAt: now, updatedAt: now, images: [] },
  { _id: I.ail,        name: 'Ail',                    slug: 'ail',                bio: false, supplier: S.primeurs,type: 'simple', subIngredients: [], allergens: [],         vegan: true,  vegeta: true,  origin: 'France', createdAt: now, updatedAt: now, images: [] },

  { _id: J.tomate,    name: 'Tomate',    slug: 'tomate',    bio: false, supplier: S.primeurs, type: 'simple', subIngredients: [], allergens: [], vegan: true, vegeta: true, origin: 'France', createdAt: now, updatedAt: now, images: [] },
  { _id: J.basilic,   name: 'Basilic',   slug: 'basilic',   bio: false, supplier: S.primeurs, type: 'simple', subIngredients: [], allergens: [], vegan: true, vegeta: true, origin: 'France', createdAt: now, updatedAt: now, images: [] },
  { _id: J.courgette, name: 'Courgette', slug: 'courgette', bio: false, supplier: S.primeurs, type: 'simple', subIngredients: [], allergens: [], vegan: true, vegeta: true, origin: 'France', createdAt: now, updatedAt: now, images: [] },
  { _id: J.poivron,   name: 'Poivron',   slug: 'poivron',   bio: false, supplier: S.primeurs, type: 'simple', subIngredients: [], allergens: [], vegan: true, vegeta: true, origin: 'France', createdAt: now, updatedAt: now, images: [] },
  { _id: J.miel,      name: 'Miel de montagne', slug: 'miel-de-montagne', bio: false, supplier: S2.rucher, type: 'simple', subIngredients: [], allergens: [], vegan: false, vegeta: true, origin: 'France', createdAt: now, updatedAt: now, images: [] },
  { _id: J.poulet,    name: 'Poulet rôti', slug: 'poulet-roti', bio: false, supplier: S2.volaille, type: 'simple', subIngredients: [], allergens: [], vegan: false, vegeta: false, origin: 'France', createdAt: now, updatedAt: now, images: [] },
  { _id: J.jambon,    name: 'Jambon blanc', slug: 'jambon-blanc', bio: false, supplier: S.fumaison, type: 'simple', subIngredients: [], allergens: [], vegan: false, vegeta: false, origin: 'France', createdAt: now, updatedAt: now, images: [] },
  { _id: J.jusCitron, name: 'Jus de citron', slug: 'jus-de-citron', bio: false, supplier: S2.agrumes, type: 'simple', subIngredients: [], allergens: [], vegan: true, vegeta: true, origin: 'Italie', createdAt: now, updatedAt: now, images: [] },


  // Composés utiles
  { _id: I.panureSG, name: 'Panure sans gluten', slug: 'panure-sans-gluten', bio: false, supplier: S.cereales, type: 'compose',
    subIngredients: [I.fMais, I.fRiz, I.pColza, I.pFeverole, I.petalesMais],
    allergens: [], vegan: true, vegeta: true, origin: 'UE', createdAt: now, updatedAt: now, images: [] },

  { _id: I.baseRiso, name: 'Base risotto', slug: 'base-risotto', bio: false, supplier: S.riz, type: 'compose',
    subIngredients: [I.rizotto, I.eau, I.oignon, I.vinBlanc, I.echalote, I.beurre, I.bouillonLeg, I.huileOlive],
    allergens: ['lait'], vegan: false, vegeta: true, origin: 'UE', createdAt: now, updatedAt: now, images: [] },

  { _id: J.baseRizNature, name: 'Base riz nature', slug: 'base-riz-nature', bio: false, supplier: S.riz, type: 'compose',
  subIngredients: [I.rizotto, I.eau, I.huileOlive, I.sel],
  allergens: [], vegan: true, vegeta: true, origin: 'UE', createdAt: now, updatedAt: now, images: [] },

]);

/************ 5) Produits ************/
db.products.insertMany([
  // Pâtes fraîches
  { _id: ObjectId('66d000000000000000000001'),
    name: 'Tagliatelles natures',
    slug: 'tagliatelles-natures',
    category: ObjectId('66a000000000000000000001'),
    description: 'Tagliatelles artisanales aux œufs.',
    composition: [I.semouleBio, I.oeuf, I.eau],
    dlc: 'J+3',
    cookInstructions: 'Cuire 3 min dans une eau frémissante salée.',
    forSale: true,
    quantityType: 'kg',
    price: 9.5,
    stockQuantity: 18,
    allergens: ['gluten', 'oeufs'],
    vegan: false, vegeta: true,
    images: [], createdAt: now, updatedAt: now
  },
  { _id: ObjectId('66d000000000000000000002'),
    name: 'Tagliatelles piment d’Espelette',
    slug: 'tagliatelles-piment-espelette',
    category: ObjectId('66a000000000000000000001'),
    description: 'Tagliatelles aux œufs et piment d’Espelette BIO.',
    composition: [I.semouleBio, I.oeuf, I.eau, I.pimentBio],
    dlc: 'J+3',
    cookInstructions: 'Cuire 3 min dans une eau frémissante salée.',
    forSale: true,
    quantityType: 'kg',
    price: 11.0,
    stockQuantity: 12,
    allergens: ['gluten', 'oeufs'],
    vegan: false, vegeta: true,
    images: [], createdAt: now, updatedAt: now
  },

  // Gnocchis
  { _id: ObjectId('66d000000000000000000003'),
    name: 'Gnocchis natures',
    slug: 'gnocchis-natures',
    category: ObjectId('66a000000000000000000002'),
    description: 'Gnocchis maison.',
    composition: [I.floconsPT, I.eau, I.farineBle, I.sel],
    dlc: 'J+5',
    cookInstructions: 'Pocher jusqu’à remontée, puis poêler au beurre.',
    forSale: true,
    quantityType: 'kg',
    price: 9.5,
    stockQuantity: 20,
    allergens: ['gluten'],
    vegan: true, vegeta: true,
    images: [], createdAt: now, updatedAt: now
  },

  // Arancini (SG)
  { _id: ObjectId('66d000000000000000000004'),
    name: 'Arancini champignons parmesan',
    slug: 'arancini-champignons-parmesan',
    category: ObjectId('66a000000000000000000003'),
    description: 'Arancini base risotto, shiitaké, parmesan, panure sans gluten.',
    composition: [I.baseRiso, I.shitake, I.parmesan, I.panureSG],
    dlc: 'J+2',
    cookInstructions: 'Frire à 180°C jusqu’à dorure.',
    forSale: true,
    quantityType: 'piece',
    price: 3.8,
    stockQuantity: 40,
    allergens: ['lait'],
    vegan: false, vegeta: true,
    images: [], createdAt: now, updatedAt: now
  },
  { _id: ObjectId('66d000000000000000000005'),
    name: 'Arancini chorizo tomates séchées',
    slug: 'arancini-chorizo-tomates-sechees',
    category: ObjectId('66a000000000000000000003'),
    description: 'Arancini base risotto, chorizo, tomates séchées, panure sans gluten.',
    composition: [I.baseRiso, I.chorizo, I.tomatesSec, I.panureSG],
    dlc: 'J+2',
    cookInstructions: 'Frire à 180°C jusqu’à dorure.',
    forSale: true,
    quantityType: 'piece',
    price: 3.8,
    stockQuantity: 40,
    allergens: ['lait'], // beurre dans la base risotto
    vegan: false, vegeta: false,
    images: [], createdAt: now, updatedAt: now
  },
  { _id: ObjectId('66d000000000000000000006'),
    name: 'Arancini Noix bleu de Yenne',
    slug: 'arancini-noix-bleu-de-yenne',
    category: ObjectId('66a000000000000000000003'),
    description: 'Arancini base risotto, noix, bleu de Sassenage, panure sans gluten.',
    composition: [I.baseRiso, I.noix, I.bleuSass, I.panureSG],
    dlc: 'J+2',
    cookInstructions: 'Frire à 180°C jusqu’à dorure.',
    forSale: true,
    quantityType: 'piece',
    price: 3.8,
    stockQuantity: 40,
    allergens: ['lait', 'fruits-a-coque'],
    vegan: false, vegeta: true,
    images: [], createdAt: now, updatedAt: now
  },
  { _id: ObjectId('66d000000000000000000007'),
    name: 'Arancini poitrine fumée fromage à raclette',
    slug: 'arancini-poitrine-fumee-raclette',
    category: ObjectId('66a000000000000000000003'),
    description: 'Arancini base risotto, poitrine fumée, raclette, panure sans gluten.',
    composition: [I.baseRiso, I.poitrine, I.raclette, I.panureSG],
    dlc: 'J+2',
    cookInstructions: 'Frire à 180°C jusqu’à dorure.',
    forSale: true,
    quantityType: 'piece',
    price: 3.8,
    stockQuantity: 40,
    allergens: ['lait'],
    vegan: false, vegeta: false,
    images: [], createdAt: now, updatedAt: now
  },

  // Raviolis
  { _id: ObjectId('66d000000000000000000008'),
    name: 'Ravioli à la Dent du Chat et au persil',
    slug: 'ravioli-dent-du-chat-persil',
    category: ObjectId('66a000000000000000000004'),
    description: 'Pâte semoule/farine/œuf + farce Dent du Chat, ricotta, persil.',
    composition: [I.semouleBio, I.farineT55, I.oeuf, I.eau, I.dentChat, I.ricotta, I.persil, I.sel, I.poivre],
    dlc: 'J+3',
    cookInstructions: 'Cuire 3–4 min dans une eau frémissante salée.',
    forSale: true,
    quantityType: 'kg',
    price: 20.0,
    stockQuantity: 15,
    allergens: ['gluten', 'oeufs', 'lait'],
    vegan: false, vegeta: true,
    images: [], createdAt: now, updatedAt: now
  },
  { _id: ObjectId('66d000000000000000000009'),
    name: 'Ravioli champignons de Saumur ail parmesan',
    slug: 'ravioli-champignons-de-saumur-ail-parmesan',
    category: ObjectId('66a000000000000000000004'),
    description: 'Pâte semoule/farine/œuf + farce champignons de Saumur, ail, parmesan.',
    composition: [I.semouleBio, I.farineT55, I.oeuf, I.eau, I.champSaum, I.ail, I.parmesan, I.sel, I.poivre],
    dlc: 'J+3',
    cookInstructions: 'Cuire 3–4 min dans une eau frémissante salée.',
    forSale: true,
    quantityType: 'kg',
    price: 20.0,
    stockQuantity: 15,
    allergens: ['gluten', 'oeufs', 'lait'],
    vegan: false, vegeta: true,
    images: [], createdAt: now, updatedAt: now
  },

  // 2 végans
  {
    _id: ObjectId('66d000000000000000000010'),
    name: 'Penne maïs & riz (sans gluten)',
    slug: 'penne-mais-et-riz-sans-gluten',
    category: ObjectId('66a000000000000000000001'), // Pâtes fraîches
    description: 'Pâtes fraîches sans gluten à base de maïs & riz.',
    composition: [I.fMais, I.fRiz, I.eau, I.sel, I.huileOlive],
    dlc: 'J+3',
    cookInstructions: 'Cuire 3–4 min dans une eau frémissante salée.',
    forSale: true,
    quantityType: 'kg',
    price: 10.5,
    stockQuantity: 16,
    allergens: [],
    vegan: true, vegeta: true,
    images: [], createdAt: now, updatedAt: now
  },
  {
    _id: ObjectId('66d000000000000000000011'),
    name: 'Gnocchis maïs & pomme de terre (sans gluten)',
    slug: 'gnocchis-mais-et-pomme-de-terre-sans-gluten',
    category: ObjectId('66a000000000000000000002'), // Gnocchis
    description: 'Gnocchis maison sans gluten (maïs & pomme de terre).',
    composition: [I.floconsPT, I.fMais, I.eau, I.sel, I.huileOlive],
    dlc: 'J+5',
    cookInstructions: 'Pocher jusqu’à remontée, puis poêler.',
    forSale: true,
    quantityType: 'kg',
    price: 10.0,
    stockQuantity: 18,
    allergens: [],
    vegan: true, vegeta: true,
    images: [], createdAt: now, updatedAt: now
  },

  // 2 végétariens (non végans, avec miel)
  {
    _id: ObjectId('66d000000000000000000012'),
    name: 'Arancini légumes rôtis & miel (sans gluten)',
    slug: 'arancini-legumes-rotis-et-miel-sans-gluten',
    category: ObjectId('66a000000000000000000003'), // Arancini
    description: 'Base riz nature, légumes rôtis, touche de miel, panure sans gluten.',
    composition: [J.baseRizNature, J.tomate, J.courgette, J.poivron, J.basilic, I.panureSG, J.miel],
    dlc: 'J+2',
    cookInstructions: 'Frire à 180°C jusqu’à dorure.',
    forSale: true,
    quantityType: 'piece',
    price: 3.8,
    stockQuantity: 36,
    allergens: [],
    vegan: false, vegeta: true,
    images: [], createdAt: now, updatedAt: now
  },
  {
    _id: ObjectId('66d000000000000000000013'),
    name: 'Pâtes maïs & riz sauce tomate au miel (sans gluten)',
    slug: 'pates-mais-riz-sauce-tomate-miel-sans-gluten',
    category: ObjectId('66a000000000000000000001'), // Pâtes fraîches
    description: 'Pâtes maïs & riz, sauce tomate au miel et basilic.',
    composition: [I.fMais, I.fRiz, I.eau, I.sel, I.huileOlive, J.tomate, J.miel, J.basilic],
    dlc: 'J+3',
    cookInstructions: 'Réchauffer la sauce à feu doux, mélanger aux pâtes al dente.',
    forSale: true,
    quantityType: 'kg',
    price: 11.5,
    stockQuantity: 14,
    allergens: [],
    vegan: false, vegeta: true,
    images: [], createdAt: now, updatedAt: now
  },

  // 2 carnivores (viande, mais sans allergènes)
  {
    _id: ObjectId('66d000000000000000000014'),
    name: 'Arancini poulet aux herbes (sans gluten)',
    slug: 'arancini-poulet-aux-herbes-sans-gluten',
    category: ObjectId('66a000000000000000000003'), // Arancini
    description: 'Base riz nature, poulet rôti, basilic, panure sans gluten.',
    composition: [J.baseRizNature, J.poulet, J.basilic, I.panureSG],
    dlc: 'J+2',
    cookInstructions: 'Frire à 180°C jusqu’à dorure.',
    forSale: true,
    quantityType: 'piece',
    price: 3.9,
    stockQuantity: 38,
    allergens: [],
    vegan: false, vegeta: false,
    images: [], createdAt: now, updatedAt: now
  },
  {
    _id: ObjectId('66d000000000000000000015'),
    name: 'Pâtes maïs & riz au jambon (sans gluten)',
    slug: 'pates-mais-riz-au-jambon-sans-gluten',
    category: ObjectId('66a000000000000000000001'), // Pâtes fraîches
    description: 'Pâtes maïs & riz, jambon blanc, huile d’olive & jus de citron.',
    composition: [I.fMais, I.fRiz, I.eau, I.sel, I.huileOlive, J.jambon, J.jusCitron],
    dlc: 'J+3',
    cookInstructions: 'Mélanger à cru avec un filet d’huile et jus de citron.',
    forSale: true,
    quantityType: 'kg',
    price: 11.5,
    stockQuantity: 12,
    allergens: [],
    vegan: false, vegeta: false,
    images: [], createdAt: now, updatedAt: now
  },
]);

print('✅  Jeu de données “Pâtes du Chat” initialisé.');
