const express = require('express');
const router = express.Router();
const Ingredient = require('../models/ingredient');
const upload = require('../../middleware/fileUpload');

// Ajouter un ingredient
router.post('/', upload.array('images', 10), async (req, res) => {
	try {
		// console.log('req.body:', req.body);
		// console.log('req.files:', req.files);

		if (!req.body.name || !req.files) {
			return res.status(400).json({ error: 'Les données sont incomplètes' });
		}

		const { name, supplier, allergens, vegan, vegeta } = req.body;
		const images = req.files.map((file) => `/uploads/${file.filename}`);

		const newIngredient = new Ingredient({
			name,
			supplier,
			allergens: allergens ? JSON.parse(allergens) : [],
			vegan: JSON.parse(vegan),
			vegeta: JSON.parse(vegeta),
			images: images,
		});

		const ingredient = await newIngredient.save();
		res.json(ingredient);
	} catch (error) {
		console.error(error.message);
		res.status(500).send('Erreur serveur');
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
router.put('/:id', upload.array('images', 10), async (req, res) => {
	const { name, supplier, allergens, vegan, vegeta } = req.body;
	const newImagesFile = req.files.map((file) => `/uploads/${file.filename}`);
	try {
		const ingredient = await Ingredient.findById(req.params.id);
		if (!ingredient) {
			return res.status(404).json({ msg: 'Ingrédient inconnu' });
		}

		ingredient.name = name || ingredient.name;
		ingredient.allergens = allergens ? JSON.parse(allergens) : ingredient.allergens;
		ingredient.vegan = vegan !== undefined ? vegan : ingredient.vegan;
		ingredient.vegeta = vegeta !== undefined ? vegeta : ingredient.vegeta;
		ingredient.images = [...ingredient.images, ...newImagesFile];
		ingredient.supplier = supplier || ingredient.supplier;

		const updatedIngredient = await ingredient.save();
		res.json(updatedIngredient);
	} catch (error) {
		console.error(error.message);
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
