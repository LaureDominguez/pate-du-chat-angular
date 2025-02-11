const express = require('express');
const { check, validationResult } = require('express-validator');
const router = express.Router();
const Product = require('../models/product');
const sanitize = require('mongo-sanitize');

const validateRequest = (req, res, next) => {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return res.status(400).json({ errors: errors.array() });
	}
	next();
};

// Obtenir tous les produits
router.get('/', async (req, res) => {
	try {
		let products = await Product.find()
			.populate('category')
			.populate('composition');

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
                console.error("Erreur lors du mapping des produits:", error);
                return res.status(500).json({ message: "Erreur lors du traitement des produits." });
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

// Obtenir un seul produit par son id
router.get('/:id', async (req, res) => {
	try {
		const product = await Product.findById(req.params.id)
		.populate('category')
			.populate('composition');

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
		
		if (!product) {
		return res.status(404).json({ message: 'Produit non trouvé' });
		}
		res.json(product);
	} catch (error) {
		console.error(error.message);
		if (error.kind === 'ObjectId') {
		return res.status(404).json({ message: 'ID invalide' });
		}
		res.status(500).send('Erreur serveur');
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
			.matches(/^[a-zA-Z0-9À-ÿ\s-]+$/)
			.withMessage(
				'Le champ "nom" ne doit pas contenir de caractères spéciaux.'
			),
		check('category')
			.trim()
			.notEmpty()
			.withMessage('Le champ "catégorie" est obligatoire.'),
		check('description')
			.optional()
			.trim()
			.isLength({ max: 500 })
			.withMessage(
				'Le champ "description" ne doit pas dépasser 500 caractères.'
			)
			.matches(/^[a-zA-Z0-9À-ÿ\s.,!?()'"-]*$/)
			.withMessage(
				'Le champ "description" ne doit pas contenir de caractères spéciaux.'
			),
		check('composition')
			.isArray({ min: 1 })
			.withMessage(
				'Le champ "composition" doit contenir au moins un ingrédient.'
			),
		check('price')
			.isFloat({ min: 0 })
			.withMessage('Le champ "prix" doit être un nombre positif.'),
		check('stock')
			.isBoolean()
			.withMessage('Le champ "stock" doit être un booléen.'),
	],
	validateRequest,
	async (req, res) => {
		console.log('📥 Données reçues par le backend:', req.body); // LOG ICI 🔍
		// const { name, category, description, composition, price, stock, images } =
		// 	req.body;

		// if (!name) {
		// 	return res
		// 		.status(400)
		// 		.json({ error: 'Le champ "name" est obligatoire.' });
		// }
		// if (!Array.isArray(composition)) {
		// 	return res
		// 		.status(400)
		// 		.json({ error: 'Le champ "composition" doit être un tableau.' });
		// }

		try {
			let { name, category, description, composition, price, stock, images } =
				req.body;

			console.log('🔍 Description avant nettoyage :', description); // LOG ICI
			// Nettoyage des entrées utilisateur
			name = sanitize(name);
			category = sanitize(category);
			description = sanitize(description);
			composition = sanitize(composition);
			price = sanitize(price);
			stock = sanitize(stock);
			images = sanitize(images);
			console.log('✅ Description après nettoyage :', description); // LOG ICI

			const existingProduct = await Product.findOne({ name });
			if (existingProduct) {
				return res.status(400).json({ msg: 'Ce produit existe déjà.' });
			}

			const newProduct = new Product({
				name,
				category,
				description,
				composition,
				price,
				stock,
				images,
			});

			const product = await newProduct.save();
			res.status(201).json(product);
		} catch (error) {
			console.error(error.message);
			res.status(500).send('Server error');
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
			.matches(/^[a-zA-Z0-9À-ÿ\s-]+$/)
			.withMessage(
				'Le champ "nom" ne doit pas contenir de caractères spéciaux.'
			),
		check('category')
			.optional()
			.trim()
			.notEmpty()
			.withMessage('Le champ "catégorie" est obligatoire.'),
		check('description')
			.optional()
			.trim()
			.isLength({ max: 500 })
			.withMessage(
				'Le champ "description" ne doit pas dépasser 500 caractères.'
			)
			.matches(/^[a-zA-Z0-9À-ÿ\s.,!?()'"-]*$/)
			.withMessage(
				'Le champ "description" ne doit pas contenir de caractères spéciaux.'
			),
		check('composition')
			.optional()
			.isArray({ min: 1 })
			.withMessage(
				'Le champ "composition" doit contenir au moins un ingrédient.'
			),
		check('price')
			.optional()
			.isFloat({ min: 0 })
			.withMessage('Le champ "prix" doit être un nombre positif.'),
		check('stock')
			.optional()
			.isBoolean()
			.withMessage('Le champ "stock" doit être un booléen.'),
	],
	validateRequest,
	async (req, res) => {
		// const { name, category, description, composition, price, stock, images } =
		// 	req.body;

		try {
			const { name, category, description, composition, price, stock, images } =
				req.body;

			const product = await Product.findById(req.params.id);
			if (!product) {
				return res.status(404).json({ msg: 'Produit inconnu' });
			}

			product.name = sanitize(name) || product.name;
			product.category = sanitize(category) || product.category;
			product.description = sanitize(description) || product.description;
			product.composition = sanitize(composition) || product.composition;
			product.price = sanitize(price) || product.price;
			product.stock = sanitize(stock) || product.stock;
			product.images = sanitize(images) || product.images;

			const updatedProduct = await product.save();
			res.json(updatedProduct);
		} catch (error) {
			console.error(
				'Erreur lors de la mise à jour d’un produit: ',
				error.message
			);
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
