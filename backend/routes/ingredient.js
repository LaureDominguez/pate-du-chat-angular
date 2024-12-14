const express = require('express');
const router = express.Router();
const Ingredient = require('../models/ingredient');

// Ajouter un ingredient
router.post('/', async (req, res) => {
	const { name, supplier, allergens, vegan, vegeta, imageUrl } = req.body;
	try {
		const newIngredient = new Ingredient({
			name,
			supplier,
			allergens,
			vegan,
			vegeta,
			imageUrl,
		});
		const ingredient = await newIngredient.save();
		res.json(ingredient);
	} catch (error) {
		console.error(error.message);
		res.status(500).send('Server error');
	}
});

// Obtenir tous les ingredients
router.get('/', async (req, res) => {
	try {
		const ingredients = await Ingredient.find();
		res.json(ingredients);
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

// Modifier un ingredient
router.put('/:id', async (req, res) => {
	const { name, supplier, allergens, vegan, vegeta, imageUrl } = req.body;
	try {
		const ingredient = await Ingredient.findByIdAndUpdate(
		req.params.id,
		{ name, supplier, allergens, vegan, vegeta, imageUrl },
		{ new: true }
		);
		if (!ingredient) {
		return res.status(404).json({ msg: 'Ingrédient inconnu' });
		}
		res.json(ingredient);
	} catch (error) {
		console.error(error.message);
		if (error.kind === 'ObjectId') {
		return res.status(404).json({ msg: 'Ingrédient non trouvé' });
		}
		res.status(500).send('Server error');
	}
});


module.exports = router;
