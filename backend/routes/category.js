const express = require('express');
const router = express.Router();
const Category = require('../models/category');

// Récupérer toutes les catégories
router.get('/', async (req, res) => {
	try {
		const categories = await Category.find();
		res.status(200).json(categories);
	} catch (err) {
		res
			.status(500)
			.json({ error: 'Erreur lors de la récupération des catégories.' });
	}
});

// Ajouter une nouvelle catégorie
router.post('/', async (req, res) => {
	const { name, description } = req.body;

	try {
		const newCategory = new Category({ name, description });
		const savedCategory = await newCategory.save();
		res.status(201).json(savedCategory);
	} catch (err) {
		res.status(500).json({ error: 'Erreur lors de l’ajout de la catégorie.' });
	}
});

// Mettre à jour une catégorie existante
router.put('/:id', async (req, res) => {
	const { name, description } = req.body;

	try {
		const updatedCategory = await Category.findByIdAndUpdate(
			req.params.id,
			{ name, description },
			{ new: true } // Retourne la catégorie mise à jour
		);
		res.status(200).json(updatedCategory);
	} catch (err) {
		res
			.status(500)
			.json({ error: 'Erreur lors de la mise à jour de la catégorie.' });
	}
});

// Supprimer une catégorie
router.delete('/:id', async (req, res) => {
	try {
		await Category.findByIdAndDelete(req.params.id);
		res.status(200).json({ message: 'Catégorie supprimée avec succès.' });
	} catch (err) {
		res
			.status(500)
			.json({ error: 'Erreur lors de la suppression de la catégorie.' });
	}
});

module.exports = router;
