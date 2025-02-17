const express = require('express');
const { check, validationResult } = require('express-validator');
const router = express.Router();
const Category = require('../models/category');
const sanitize = require('mongo-sanitize');

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
    	console.log('🔍 API /categories appelée');
		const categories = await Category.find().populate('productCount');

		console.log('📌 Catégories trouvées :', categories);
		if (!categories || categories.length === 0) {
				console.warn('⚠️ Aucune catégorie trouvée en base !');
		}
		
		res.status(200).json(categories);
	} catch (err) {
		console.error(err.message);
		res
			.status(500)
			.json({ error: 'Erreur youpi lors de la récupération des catégories.' });
	}
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
			.json({ error: 'Erreur bidule lors de la récupération de la catégorie.' });
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
			.matches(/^[a-zA-Z0-9À-ÿ\s-]+$/)
			.withMessage(
				'Le champ "nom" ne doit pas contenir de caractères spéciaux.'
			),
	],
	validateRequest,
	async (req, res) => {
	try {
		let { name } = req.body;
		
		// Nettoyage des entrées utilisateur
		name = sanitize(name);

		const existingCategory = await Category.findOne({ name });
		if (existingCategory) {
			return res.status(400).json({ msg: 'Cette catégorie existe déjà.' });
		}

		const newCategory = new Category({ name });

		const category = await newCategory.save();
		res.status(201).json(category);
	} catch (err) {
		console.error('Erreur lors de l’ajout de la catégorie.');
		res.status(500).json({ error: 'Erreur serveur' });
	}
});

// Mettre à jour une catégorie existante
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
	],
	validateRequest,
	async (req, res) => {
	try {
		let { name } = req.body;

		const category = await Category.findById(req.params.id);
		if (!category) {
			return res.status(404).json({ msg: 'Catégorie non trouvée.' });
		}

		// Nettoyage des entrées utilisateur
		category.name = sanitize(name) || category.name;

		const updatedCategory = await category.save();

		// const updatedCategory = await Category.findByIdAndUpdate(
		// 	req.params.id,
		// 	{ name, description },
		// 	{ new: true } // Retourne la catégorie mise à jour
		// );
		res.status(200).json(updatedCategory);
	} catch (err) {
			console.error(
				'Erreur lors de la mise à jour de la catégorie:',
				err.message
			);
		res.status(500).send('Erreur serveur');
	}
});

// Supprimer une catégorie
router.delete('/:id', async (req, res) => {
	try {
		const category = await Category.findByIdAndDelete(req.params.id);
		if (!category) {
			return res.status(404).json({ msg: 'Catégorie non trouvée.' });
		}
		res.status(200).json({ message: 'Catégorie supprimée avec succès.' });
	} catch (err) {
		console.error(err.message);
		if (err.kind === 'ObjectId') {
			return res.status(404).json({ msg: 'ID invalide' });
		}
		res.status(500).send('Erreur serveur');
	}
});

module.exports = router;
