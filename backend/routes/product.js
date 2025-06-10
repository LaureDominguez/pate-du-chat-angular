const express = require('express');
const { check, validationResult } = require('express-validator');
const router = express.Router();
const mongoose = require('mongoose');
const Product = require('../models/product');
const { DEFAULT_CATEGORY } = require('../models/category');
const sanitize = require('mongo-sanitize');

const validateRequest = (req, res, next) => {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return res.status(400).json({ errors: errors.array() });
	}
	next();
};

// Vérifier si un ObjectId est valide
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// Obtenir tous les produits
router.get('/', async (req, res) => {
	try {
		let products = await Product
			.find()
			.populate('category')
			.populate({
				path: 'composition',
				populate: { path: 'subIngredients' }
			});

		if (req.query.view === 'full') {
			try {
				products = products.map((product) => {
					const allergensSet = new Set();
					let isVegan = true;
					let isVegeta = true;

					if (product.composition) {
						product.composition.forEach((ingredient) => {
							if (ingredient.allergens) {
								ingredient.allergens.forEach((allergen) => {
									allergensSet.add(allergen);
								});
							}
							if (!ingredient.vegan) {
								isVegan = false;
							}
							if (!ingredient.vegeta) {
								isVegeta = false;
							}
						});
					} else {
						isVegan = false;
						isVegeta = false;
					}

					return {
						...product.toObject(),
						allergens: Array.from(allergensSet),
						vegan: isVegan,
						vegeta: isVegeta,
					};
				});
			} catch (error) {
				console.error('Erreur lors du mapping des produits:', error);
				return res
					.status(500)
					.json({ message: 'Erreur lors du traitement des produits.' });
			}
		}
		res.status(200).json(products);
	} catch (error) {
		console.error('Erreur serveur:', error);
		res
			.status(500)
			.json({
				message: 'Erreur serveur lors de la récupération des produits.',
			});
	}
});

// Obtenir les produits par ingrédient
router.get('/by-ingredient/:id', async (req, res) => {
	if (!isValidObjectId(req.params.id)) {
		return res.status(400).json({ message: 'ID ingrédient invalide' });
	}

	try {
		let products = await Product
			.find({ composition: req.params.id })
			.populate('category')
			.populate('composition');

		res.status(200).json(products);
	} catch (error) {
		console.error(error.message);
		res.status(500).send('Erreur serveur');
	}
});

// Obtenir les produits par catégorie
router.get('/by-category/:id', async (req, res) => {
	if (!isValidObjectId(req.params.id)) {
		return res.status(400).json({ message: 'ID catégorie invalide' });
	}

	try {
		let products = await Product
			.find({ category: req.params.id })
			.populate('category')
			.populate('composition');

		res.status(200).json(products);
	} catch (error) {
		console.error(error.message);
		res.status(500).send('Erreur serveur');
	}
});

// Obtenir un produit par ID
router.get('/:id', async (req, res) => {
	if (!isValidObjectId(req.params.id)) {
		return res.status(400).json({ message: 'ID produit invalide' });
	}

	try {
		let product = await Product
			.findById(req.params.id)
			.populate('category')
			.populate('composition');

		if (!product) {
			return res.status(404).json({ message: 'Produit non trouvé' });
		}

		// Si "view=full", calculer les allergènes et régimes alimentaires
		if (req.query.view === 'full') {
			const allergensSet = new Set();
			let isVegan = true;
			let isVegeta = true;

			product.composition.forEach((ingredient) => {
				ingredient.allergens?.forEach((allergen) => allergensSet.add(allergen));
				if (!ingredient.vegan) isVegan = false;
				if (!ingredient.vegeta) isVegeta = false;
			});

			product = {
				...product,
				allergens: Array.from(allergensSet),
				vegan: isVegan,
				vegeta: isVegeta,
			};
		}

		res.json(product);
	} catch (error) {
		console.error(error.message);
		res.status(500).send('Erreur serveur');
	}
});

router.get('/check-name/:name', async (req, res) => {
	const name = req.params.name;
	const excludeId = req.query.excludedId;

	const query = {
		name: new RegExp(`^${name}$`, 'i')
	};

	if (excludeId && mongoose.Types.ObjectId.isValid(excludeId)) {
		query._id = { $ne: excludeId };
	}
	try {
		const product = await Product.findOne(query);
		res.json(!!product);
	} catch (error) {
		console.error('Erreur dans /check-name:', error.message);
		res.status(500).json({ error: 'Erreur serveur lors de la vérification du nom' });
	}
});


// Ajouter un produit
router.post(
	'/',
	[
		check('name')
			.trim()
			.notEmpty()
			.withMessage('Le champ "nom" est obligatoire.')
			.isLength({ min: 2, max: 50 })
			.withMessage(
				'Le champ "nom" doit avoir une longueur comprise entre 2 et 50 caractères.'
			)
			.matches(/^[a-zA-ZÀ-ŸŒŒ0-9\s.,'"’()\-@%°&+]*$/)
			.withMessage(
				'Le champ "nom" ne doit pas contenir de caractères spéciaux.'
			),
		check('category').custom((value) => {
			if (!value || !value._id) {
				throw new Error('Le champ "catégorie" est obligatoire.');
			}
			if (!mongoose.Types.ObjectId.isValid(value._id)) {
				throw new Error('Le champ "catégorie" doit être un ID MongoDB valide.');
			}
			return true;
		}),
		check('description')
			.optional()
			.trim()
			.isLength({ max: 500 })
			.if(check('description').notEmpty())
			.withMessage(
				'Le champ "description" ne doit pas dépasser 500 caractères.'
			)
			.matches(/^[a-zA-ZÀ-ÿŒœ0-9\s.,;:!?()'"%°€$§@+\-–—\[\]#*/&\\n\r]*$/)
			.withMessage(
				'Le champ "description" ne doit pas contenir de caractères spéciaux.'
			),
		check('composition')
			.isArray({ min: 1 })
			.withMessage(
				'Le champ "composition" doit contenir au moins un ingrédient.'
			),
		check('dlc')
			.trim()
			.notEmpty()
			.withMessage('Le champ "DLC" est obligatoire.')
			.isLength({ min: 2, max: 50 })
			.withMessage(
				'Le champ "DLC" doit avoir une longueur comprise entre 2 et 50 caractères.'
			)
			.matches(/^[0-9]{1,2}(\/[0-9]{1,2}(\/[0-9]{2,4})?)?$|^[a-zA-ZÀ-ÿŒœ0-9\s.,;:'"()\-]+$/)
			.withMessage(
				'Le champ "DLC" ne doit pas contenir de caractères spéciaux.'
			),
		check('cookInstructions')
			.trim()
			.notEmpty()
			.withMessage('Le champ "instructions de cuisson" est obligatoire.')
			.isLength({ min: 2, max: 250 })
			.withMessage(
				'Le champ "instructions de cuisson" doit avoir une longueur comprise entre 2 et 250 caractères.'
			)
			.matches(/^[a-zA-ZÀ-ÿŒœ0-9\s.,;:!?()'"%°€$§@+\-–—\[\]#*/&\\n\r]*$/)
			.withMessage(
				'Le champ "instructions de cuisson" ne doit pas contenir de caractères spéciaux.'
			),
		check('stock')
			.isBoolean()
			.withMessage('Le champ "stock" doit être un booléen.'),
		check('stockQuantity')
			.custom((value, { req }) => {
				const type = req.body.quantityType;

				if (value === undefined || value === null || value === '') {
					throw new Error('La quantité en stock est requise.');
				}

				const num = parseFloat(value);
				if (isNaN(num) || num < 0) {
					throw new Error('La quantité en stock doit être un nombre positif.');
				}

				if (type === 'piece' && !Number.isInteger(num)) {
					throw new Error('La quantité doit être un entier si l\'unité est "pièce".');
				}

				if (type === 'kg' && !/^\d+(\.\d{1,2})?$/.test(value.toString())) {
					throw new Error('La quantité en kg doit être un nombre décimal avec 2 chiffres max après la virgule.');
				}

				return true;
			}),
		check('quantityType')
			.isIn(['piece', 'kg'])
			.withMessage('L\'unité doit être de type "pièce" ou "kg".'),
		check('price')
			.isFloat({ min: 0 })
			.withMessage('Le champ "prix" doit être un nombre positif.'),
	],
	validateRequest,
	async (req, res, next) => {
		try {
			let { name, category, description, composition, dlc, cookInstructions, stock, stockQuantity, quantityType, price, images } =
				req.body;

			// Nettoyage des champs
			stock = sanitize(stock);
			stockQuantity = sanitize(stockQuantity);

			// Logique par défaut
			const numericQuantity = parseFloat(stockQuantity);
			const resolvedStock =
			typeof stock === 'boolean'
				? stock
				: !isNaN(numericQuantity) && numericQuantity > 0;

			// Nettoyage des entrées utilisateur
			name = sanitize(name);
			// category = sanitize(category);
			description = sanitize(description);
			composition = sanitize(composition);
			dlc = sanitize(dlc);
			cookInstructions = sanitize(cookInstructions);
			stock = resolvedStock;
			stockQuantity = numericQuantity;
			quantityType = sanitize(quantityType);
			images = sanitize(images);

			category =
				category && mongoose.Types.ObjectId.isValid(category._id)
					? sanitize(category._id)
					: DEFAULT_CATEGORY._id;

			const existingProduct = await Product.findOne({ name });
			if (existingProduct) {
				return res
					.status(400)
					.json({ msg: 'Un autre produit porte déjà ce nom.' });
			}

			const newProduct = new Product({
				name,
				category,
				description,
				composition,
				dlc,
				cookInstructions,
				stock,
				stockQuantity,
				quantityType,
				price,
				images,
			});

			await newProduct.save();
			res.status(201).json(newProduct);

			// const product = await newProduct.save();
			// res.status(201).json(product);
		} catch (err) {
			console.error('Erreur lors de la mise à jour du produit:', err.message);
			if (err.code === 11000) {
				return res.status(400).json({ msg: 'Ce produit existe déjà.' });
			}
			res.status(500).send('Erreur serveur');
		}
	}
);

// Modifier un produit
router.put(
	'/:id',
	[
		check('name')
			.optional()
			.trim()
			.isLength({ min: 2, max: 50 })
			.withMessage(
				'Le champ "nom" doit avoir une longueur comprise entre 2 et 50 caractères.'
			)
			.matches(/^(?=.*\s)[a-zA-Z0-9À-ÿŒœ\s.,;:'"()\-®™&]+$/)
			.withMessage(
				'Le champ "nom" ne doit pas contenir de caractères spéciaux.'
			),
		check('category')
			.optional()
			.custom((value) => {
				if (!value || !value._id) {
					throw new Error('Le champ "catégorie" est obligatoire.');
				}
				if (!mongoose.Types.ObjectId.isValid(value._id)) {
					throw new Error(
						'Le champ "catégorie" doit être un ID MongoDB valide.'
					);
				}
				return true;
			}),
		check('description')
			.optional()
			.trim()
			.isLength({ max: 500 })
			.withMessage(
				'Le champ "description" ne doit pas dépasser 500 caractères.'
			)
			.if(check('description').notEmpty())
			.matches(/^[a-zA-ZÀ-ÿŒœ0-9\s.,;:!?()'"%°€$§@+\-–—\[\]#*/&\\n\r]*$/)

			.withMessage(
				'Le champ "description" ne doit pas contenir de caractères spéciaux.'
			),
		check('composition')
			.optional()
			.isArray({ min: 1 })
			.withMessage(
				'Le champ "composition" doit contenir au moins un ingrédient.'
			),
		check('dlc')
			.optional()
			.trim()
			.isLength({ max: 50 })
			.withMessage(
				'Le champ "DLC" ne doit pas dépasser 50 caractères.'
			)
			.matches(/^[0-9]{1,2}(\/[0-9]{1,2}(\/[0-9]{2,4})?)?$|^[a-zA-ZÀ-ÿŒœ0-9\s.,;:'"()\-]+$/)
			.withMessage(
				'Le champ "DLC" ne doit pas contenir de caractères spéciaux.'
			),
		check('cookInstructions')
			.optional()
			.trim()
			.isLength({ max: 250 })
			.withMessage(
				'Le champ "instructions de cuisson" ne doit pas dépasser 250 caractères.'
			)
			.matches(/^[a-zA-ZÀ-ÿŒœ0-9\s.,;:!?()'"%°€$§@+\-–—\[\]#*/&\\n\r]*$/)
			.withMessage(
				'Le champ "instructions de cuisson" ne doit pas contenir de caractères spéciaux.'
			),
		check('stock')
			.optional()
			.isBoolean()
			.withMessage('Le champ "stock" doit être un booléen.'),
		check('stockQuantity')
			.optional()
			.custom((value, { req }) => {
				const type = req.body.quantityType;
				if (value === undefined || value === null || value === '') {
					throw new Error('La quantité en stock est requise.');
				}
				const num = parseFloat(value);
				if (isNaN(num) || num < 0) {
					throw new Error('La quantité en stock doit être un nombre positif.');
				}
				if (type === 'piece' && !Number.isInteger(num)) {
					throw new Error('La quantité doit être un entier si l\'unité est "pièce".');
				}
				if (type === 'kg' && !/^\d+(\.\d{1,2})?$/.test(value.toString())) {
					throw new Error('La quantité en kg doit être un nombre décimal avec 2 chiffres max après la virgule.');
				}
				return true;
			}),

		check('quantityType')
			.optional()
			.isIn(['piece', 'kg'])
			.withMessage('L\'unité doit être de type "pièce" ou "kg".'),

		check('price')
			.optional()
			.isFloat({ min: 0 })
			.withMessage('Le champ "prix" doit être un nombre positif.'),
	],
	validateRequest,
	async (req, res) => {
		try {
			let { name, category, description, composition, dlc, cookInstructions, stock, stockQuantity, quantityType, price, images } =
				req.body;

			const product = await Product.findById(req.params.id);
			if (!product) {
				return res.status(404).json({ msg: 'Produit inconnu' });
			}

			const existingProduct = await Product.findOne({ name });
			if (
				existingProduct &&
				existingProduct._id.toString() !== product._id.toString()
			) {
				return res
					.status(400)
					.json({ msg: 'Un autre produit porte déjà ce nom.' });
			}

			const numericQuantity = parseFloat(stockQuantity);

			product.name = sanitize(name) || product.name;
			// product.category = sanitize(category) || product.category;
			product.category =
			category && mongoose.Types.ObjectId.isValid(category._id)
				? sanitize(category._id)
				: DEFAULT_CATEGORY._id;
			product.description = sanitize(description) || product.description;
			product.composition = sanitize(composition) || product.composition;
			product.dlc = sanitize(dlc) || product.dlc;
			product.cookInstructions = sanitize(cookInstructions) || product.cookInstructions;
			if ('stock' in req.body) {
				product.stock = sanitize(stock);
				} else if (!isNaN(numericQuantity)) {
				product.stock = numericQuantity > 0;
				} else {
				product.stock = false;
			}
			product.stockQuantity = !isNaN(numericQuantity) ? numericQuantity : 0;
			product.quantityType = sanitize(quantityType) || product.quantityType;
			product.price = sanitize(price) || product.price;
			product.images = sanitize(images) || product.images;



			const updatedProduct = await product.save();
			res.json(updatedProduct);
		} catch (err) {
			console.error('Erreur lors de la mise à jour du produit:', err.message);
			if (err.code === 11000) {
				return res.status(400).json({ msg: 'Ce produit existe déjà.' });
			}
			res.status(500).send('Erreur serveur');
		}
	}
);

// Supprimer un produit
router.delete('/:id', async (req, res) => {
	try {
		const product = await Product.findByIdAndDelete(req.params.id);
		if (!product) {
			return res.status(404).json({ msg: 'Produit inconnu' });
		}
		res.json({ msg: 'Produit supprimé avec succès' });
	} catch (error) {
		console.error(error.message);
		if (error.kind === 'ObjectId') {
			return res.status(404).json({ msg: 'ID invalide' });
		}
		res.status(500).send('Erreur serveur');
	}
});

module.exports = router;
