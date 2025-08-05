const express = require('express');
const { check, validationResult } = require('express-validator');
const router = express.Router();
const Category = require('../models/category');
const Product = require('../models/product');
const sanitize = require('mongo-sanitize');
const generateUniqueSlug = require('../utils/slug');


const validateRequest = (req, res, next) => {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return res.status(400).json({ errors: errors.array() });
	}
	next();
};

// Récupérer toutes les catégories
router.get('/', async (req, res) => {
	try {
    	// console.log('🔍 API /categories appelée');
		const categories = await Category.find().populate('productCount');

		// console.log('📌 Catégories trouvées :', categories);
		if (!categories || categories.length === 0) {
				console.warn('⚠️ Aucune catégorie trouvée en base !');
		}
		
		res.status(200).json(categories);
	} catch (err) {
		console.error(err.message);
		res
			.status(500)
			.json({ error: 'Erreur lors de la récupération des catégories.' });
	}
});

// Récupérer une catégorie par son slug
router.get('/:slug', async (req, res) => {
	const slug = req.params.slug;
	let category = await Category.findOne({ slug });
	if (category) return res.json(category);

	category = await Category.findOne({ previousSlugs: slug });
	if (category) {
		return res.redirect(301, `/categories/${category.slug}`);
	}
	res.status(404).json({ message: 'Catégorie non trouvée' });
});

// Récupérer une catégorie par son ID
router.get('/:id', async (req, res) => {
	try {
		const category = await Category.findById(req.params.id).populate('productCount');
		if (!category) {
			return res.status(404).json({ msg: 'Catégorie non trouvée.' });
		}
		res.status(200).json(category);
	} catch (err) {
		console.error(err.message);
		res
			.status(500)
			.json({ error: 'Erreur lors de la récupération de la catégorie.' });
	}
});

// Ajouter une nouvelle catégorie
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
		check('description')
			.optional()
			.trim()
			.isLength({ max: 100 })
			.if(check('description').notEmpty())
			.withMessage(
				'Le champ "description" doit contenir entre 2 et 255 caractères.'
			)
			.matches(/^[a-zA-ZÀ-ŸŒŒ0-9\s.,'"’()\-@%°&+]*$/)
			.withMessage(
				'Le champ "description" ne doit pas contenir de caractères spéciaux.'
			),
	],
	validateRequest,
	async (req, res) => {
	try {
		let { name, description } = req.body;
		name = sanitize(name);
		description = sanitize(description);

		const existingCategory = await Category.findOne({ name });

		if (existingCategory) {
			return res.status(400).json({ msg: 'Cette catégorie existe déjà.' });
		}

		const slug = await generateUniqueSlug(name, Category);

		const newCategory = new Category({ name, slug, description });
		// const category = await newCategory.save();
		await newCategory.save();

		res.status(201).json(newCategory);
	} catch (err) {
		console.error('Erreur lors de l’ajout de la catégorie: ', err.message);
		if (err.code === 11000) {
			return res.status(400).json({ msg: 'Cette catégorie existe déjà.' });
		}
		res.status(500).json({ error: 'Erreur serveur' });
	}
});

// Mettre à jour une catégorie existante
router.put(
	'/:id',
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
		check('description')
			.optional()
			.trim()
			.isLength({ max: 100 })
			.if(check('description').notEmpty())
			.withMessage(
				'Le champ "description" doit contenir entre 2 et 255 caractères.'
			)
			.matches(/^[a-zA-ZÀ-ŸŒŒ0-9\s.,'"’()\-@%°&+]*$/)
			.withMessage(
				'Le champ "description" ne doit pas contenir de caractères spéciaux.'
			),
	],
	validateRequest,
	async (req, res) => {
		try {
			let { name, description } = req.body;
			name = sanitize(name);
			description = sanitize(description);

			const category = await Category.findById(req.params.id);
			if (!category) {
				return res.status(404).json({ msg: 'Catégorie non trouvée.' });
			}

			const existingCategory = await Category.findOne({ name });
			if (existingCategory && existingCategory._id.toString() !== req.params.id) {
				return res.status(400).json({ msg: 'Une autre catégorie porte déjà ce nom.' });
			}


			// Nettoyage des entrées utilisateur
			category.name = sanitize(name) || category.name;
			category.description = sanitize(description) || category.description;

			const updatedCategory = await category.save();
			res.status(200).json(updatedCategory);
		} catch (err) {
			console.error(
				'Erreur lors de la mise à jour de la catégorie:',
				err.message
			);
			if (err.code === 11000) {
				return res.status(400).json({ msg: 'Cette catégorie existe déjà.' });
			}
			res.status(500).json({ error: err.message });
		}
	}
);

// Supprimer une catégorie
router.delete('/:id', async (req, res) => {
	try {
		const categoryId = req.params.id;
		const DEFAULT_CATEGORY_ID = '65a123456789abcd12345678';

		if (!categoryId) {
			return res.status(404).json({ msg: 'ID de la catégorie inconnu.' });
		}

		if (categoryId === DEFAULT_CATEGORY_ID) {
			return res
				.status(400)
				.json({ msg: 'Impossible de supprimer cette catégorie.' });
		}

		const category = await Category.findById(categoryId).populate(
			'productCount'
		);

		if (!category) {
			return res.status(404).json({ msg: 'Catégorie introuvable.' });
		}

		if (category.productCount > 0) {
			await Product.updateMany(
				{ category: category._id },
				{ category: DEFAULT_CATEGORY_ID }
			)
		}

		await Category.findByIdAndDelete(req.params.id);

		res.status(200).json({
			message: 'Catégorie supprimée avec succès.',
			reassignDone: category.productCount > 0,
		});
	} catch (err) {
		console.error(err.message);
		if (err.kind === 'ObjectId') {
			return res.status(404).json({ msg: 'ID invalide.' });
		}
		res.status(500).json({ error: err.message });
	}
});

module.exports = router;
