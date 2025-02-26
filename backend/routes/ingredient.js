const express = require('express');
const { check, validationResult } = require('express-validator');
const router = express.Router();
const Ingredient = require('../models/ingredient');
const upload = require('../../middleware/fileUpload');
const sanitize = require('mongo-sanitize');

const validateRequest = (req, res, next) => {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return res.status(400).json({ errors: errors.array() });
	}
	next();
};

// Récupérer tous les ingredients
router.get('/', async (req, res) => {
	try {
		const ingredients = await Ingredient.find();
		res.status(200).json(ingredients);
	} catch (error) {
		console.error(error.message);
		res.status(500).send('Erreur serveur lors de la récupération des ingrédients');
	}
});

// Obtenir un seul ingredient par son id
router.get('/:id', async (req, res) => {
	try {
		const ingredient = await Ingredient.findById(req.params.id);
		if (!ingredient) {
			return res.status(404).json({ msg: 'Ingrédient non trouvé' });
		}
		res.status(200).json(ingredient);
	} catch (error) {
		console.error(error.message);

		// Vérifie si l'id est valide mais ne correspond à aucun document
		if (error.kind === 'ObjectId') {
			return res.status(404).json({ msg: 'ID invalide' });
		}
		res.status(500).send('Erreur serveur');
	}
});

// Ajouter un ingredient
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
			.matches(/^[a-zA-Z0-9À-ÿŒœ\s-']+$/)
			.withMessage(
				'Le champ "nom" ne doit pas contenir de caractères spéciaux.'
			),
		check('supplier')
			.trim()
			.notEmpty()
			.withMessage('Le champ "fournisseur" est obligatoire.')
			.isLength({ min: 2, max: 50 })
			.withMessage(
				'Le champ "fournisseur" doit avoir une longueur comprise entre 2 et 50 caractères.'
			)
			.matches(/^[a-zA-Z0-9À-ÿŒœ\s-']+$/)
			.withMessage(
				'Le champ "fournisseur" ne doit pas contenir de caractères spéciaux.'
			),
		check('type')
			.isIn(['simple', 'compose'])
			.withMessage(
				'Le champ "type d\'ingrédient" doit être "simple" ou "composé".'
			),
		check('subIngredients')
			.isArray()
			.optional()
			.withMessage('Le champ "sous-ingrédients" doit être une liste.'),
		check('allergens')
			.isArray()
			.withMessage('Le champ "allergènes" doit être un tableau.'),
		check('vegan')
			.isBoolean()
			.withMessage('Le champ "vegan" doit être un booléen.'),
		check('vegeta')
			.isBoolean()
			.withMessage('Le champ "végétarien" doit être un booléen.'),
	],
	validateRequest,
	async (req, res) => {
		try {
			let {
				name,
				bio,
				supplier,
				type,
				subIngredients,
				allergens,
				vegan,
				vegeta,
				images,
			} = req.body;

			// Nettoyage des entrées utilisateur
			name = sanitize(name);
			bio = sanitize(bio);
			supplier = sanitize(supplier);
			type = sanitize(type);
			subIngredients = sanitize(subIngredients);
			allergens = sanitize(allergens);
			vegan = sanitize(vegan);
			vegeta = sanitize(vegeta);
			images = sanitize(images);

			const existingIngredient = await Ingredient.findOne({ name, bio });
			if (existingIngredient) {
				return res.status(400).json({ msg: 'Cet ingrédient existe déjà.' });
			}

			const newIngredient = new Ingredient({
				name,
				bio,
				supplier,
				type,
				subIngredients,
				allergens,
				vegan,
				vegeta,
				images,
			});

			const ingredient = await newIngredient.save();
			res.status(201).json(ingredient);
		} catch (err) {
			console.error('Erreur lors de l’ajout d’un ingrédient:', err);
			if (err.code === 11000) {
				return res.status(400).json({ msg: 'Cet ingrédient existe déjà.' });
			}
			res.status(500).send('Erreur serveur');
		}
	}
);

// Modifier un ingredient
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
			.matches(/^[a-zA-Z0-9À-ÿŒœ\s-']+$/)
			.withMessage(
				'Le champ "nom" ne doit pas contenir de caractères spéciaux.'
			),
		check('bio')
			.optional()
			.isBoolean()
			.withMessage('Le champ "bio" doit être un booléen.'),
		check('supplier')
			.optional()
			.trim()
			.isLength({ min: 2, max: 50 })
			.withMessage(
				'Le champ "fournisseur" doit avoir une longueur comprise entre 2 et 50 caractères.'
			)
			.matches(/^[a-zA-Z0-9À-ÿŒœ\s-']+$/)
			.withMessage(
				'Le champ "fournisseur" ne doit pas contenir de caractères spéciaux.'
			),
		check('type')
			.optional()
			.isIn(['simple', 'compose'])
			.withMessage(
				'Le champ "type d\'ingrédient" doit être "simple" ou "composé".'
			),
		check('subIngredients')
			.isArray()
			.optional()
			.withMessage('Le champ "sous-ingrédients" doit être une liste.'),
		check('allergens')
			.optional()
			.isArray()
			.withMessage('Le champ "allergènes" doit être un tableau.'),
		check('vegan')
			.optional()
			.isBoolean()
			.withMessage('Le champ "vegan" doit être un booléen.'),
		check('vegeta')
			.optional()
			.isBoolean()
			.withMessage('Le champ "végétarien" doit être un booléen.'),
	],
	validateRequest,
	async (req, res) => {
		try {
			let { name, bio, supplier, type, subIngredients, allergens, vegan, vegeta, images } =
				req.body;

			const ingredient = await Ingredient.findById(req.params.id);
			if (!ingredient) {
				return res.status(404).json({ msg: 'Ingrédient inconnu' });
			}

			const existingIngredient = await Ingredient.findOne({ name, bio });
			if (
				existingIngredient &&
				existingIngredient._id.toString() !== req.params.id
			) {
				return res
					.status(400)
					.json({ msg: 'Un autre ingrédient porte déjà ce nom.' });
			}

			// Mise à jour des champs
			ingredient.name = sanitize(name) || ingredient.name;
			ingredient.bio = sanitize(bio) || ingredient.bio;
			ingredient.supplier = sanitize(supplier) || ingredient.supplier;
			ingredient.type = sanitize(type) || ingredient.type;
			ingredient.subIngredients =
				subIngredients !== undefined
					? sanitize(subIngredients)
					: ingredient.subIngredients;
			ingredient.allergens = sanitize(allergens) || ingredient.allergens;
			ingredient.vegan =
				vegan !== undefined ? sanitize(vegan) : ingredient.vegan;
			ingredient.vegeta =
				vegeta !== undefined ? sanitize(vegeta) : ingredient.vegeta;
			ingredient.images = sanitize(images) || ingredient.images;

			const updatedIngredient = await ingredient.save();
			res.status(200).json(updatedIngredient);
		} catch (error) {
			console.error(
				"Erreur lors de la mise à jour de l'ingrédient:",
				error.message
			);
			if (err.code === 11000) {
				return res.status(400).json({ msg: 'Cet ingrédient existe déjà.' });
			}
			res.status(500).send('Erreur serveur');
		}
	}
);

// Supprimer un ingredient
router.delete('/:id', async (req, res) => {
	try {
		const ingredient = await Ingredient.findByIdAndDelete(req.params.id);
		if (!ingredient) {
			return res.status(404).json({ msg: 'Ingrédient inconnu' });
		}
		res.json({ msg: 'Ingrédient supprimé avec succès' });
	} catch (error) {
		console.error(error.message);
		if (error.kind === 'ObjectId') {
			return res.status(404).json({ msg: 'ID invalide' });
		}
		res.status(500).send('Erreur serveur');
	}
});


module.exports = router;
