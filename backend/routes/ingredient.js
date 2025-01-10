const express = require('express');
const router = express.Router();
const Ingredient = require('../models/ingredient');
const upload = require('../../middleware/fileUpload');

// Récupérer tous les ingredients
router.get('/', async (req, res) => {
	try {
		const ingredients = await Ingredient.find();
		res.status(200).json(ingredients);
	} catch (error) {
		console.error(error.message);
		res.status(500).send('Server error');
	}
});

// Obtenir un seul ingredient par son id
router.get('/:id', async (req, res) => {
	console.log('ID reçu :', req.params.id); // Ajoute cette ligne pour débugger
	try {
		const ingredient = await Ingredient.findById(req.params.id);
		if (!ingredient) {
			return res.status(404).json({ msg: 'Ingrédient inconnu' });
		}
		res.json(ingredient);
	} catch (error) {
		console.error(error.message);

		// Vérifie si l'id est valide mais ne correspond à aucun document
		if (error.kind === 'ObjectId') {
			return res.status(404).json({ msg: 'Ingrédient non trouvé' });
		}
		res.status(500).send('Server error');
	}
});

// Ajouter un ingredient
router.post('/', async (req, res) => {
	console.log('route ingredients -> req.body:', req.body);
	try {
		const { name, supplier, allergens, vegan, vegeta, images } = req.body;

    if (!name) {
			return res
				.status(400)
				.json({ error: 'Le champ "name" est obligatoire.' });
		}
	if (!Array.isArray(allergens)) {
		return res
			.status(400)
			.json({ error: 'Le champ "allergens" doit être un tableau.' });
	}
	if (typeof vegan !== 'boolean' || typeof vegeta !== 'boolean') {
		return res
			.status(400)
			.json({
				error: 'Les champs "vegan" et "vegeta" doivent être des booléens.',
			});
	}

	const newIngredient = new Ingredient({
		name,
		supplier,
		allergens: allergens || [],
		vegan: vegan,
		vegeta: vegeta,
		images: images || [],
	});

	const ingredient = await newIngredient.save();
	res.json(ingredient);
	} catch (error) {
		console.error('Erreur lors de l’ajout d’un ingrédient:', error);
		res.status(500).send('Erreur serveur');
	}
});

// Modifier un ingredient
router.put('/:id', async (req, res) => {
	const { name, supplier, allergens, vegan, vegeta, images } = req.body;

	try {
		const ingredient = await Ingredient.findById(req.params.id);
		if (!ingredient) {
			return res.status(404).json({ msg: 'Ingrédient inconnu' });
		}

		// Validations des champs
		if (name && typeof name !== 'string') {
			return res
				.status(400)
				.json({ error: 'Le champ "name" doit être une chaîne de caractères.' });
		}
		if (allergens && !Array.isArray(allergens)) {
			return res
				.status(400)
				.json({ error: 'Le champ "allergens" doit être un tableau.' });
		}
		if (vegan !== undefined && typeof vegan !== 'boolean') {
			return res
				.status(400)
				.json({ error: 'Le champ "vegan" doit être un booléen.' });
		}
		if (vegeta !== undefined && typeof vegeta !== 'boolean') {
			return res
				.status(400)
				.json({ error: 'Le champ "vegeta" doit être un booléen.' });
		}

		// Mise à jour des champs
		ingredient.name = name || ingredient.name;
		ingredient.supplier = supplier || ingredient.supplier;
		ingredient.allergens = allergens || ingredient.allergens;
		ingredient.vegan = vegan !== undefined ? vegan : ingredient.vegan;
		ingredient.vegeta = vegeta !== undefined ? vegeta : ingredient.vegeta;
		ingredient.images = images || ingredient.images;

		const updatedIngredient = await ingredient.save();
		res.json(updatedIngredient);
	} catch (error) {
		console.error('Erreur lors de la mise à jour d’un ingrédient:', error.message);
		res.status(500).send('Server error');
	}
});

// Supprimer un ingredient
router.delete('/:id', async (req, res) => {
	console.log('ID reçu pour suppression :', req.params.id); // Log de l'ID
	try {
		const ingredient = await Ingredient.findByIdAndDelete(req.params.id);
		if (!ingredient) {
			return res.status(404).json({ msg: 'Ingrédient inconnu' });
		}
		res.json({ msg: 'Ingrédient supprimé' });
	} catch (error) {
		console.error(error.message);
		if (error.kind === 'ObjectId') {
			return res.status(404).json({ msg: 'Ingrédient non trouvé' });
		}
		res.status(500).send('Erreur serveur');
	}
});


module.exports = router;
