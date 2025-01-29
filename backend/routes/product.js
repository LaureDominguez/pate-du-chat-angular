const express = require('express');
const router = express.Router();
const Product = require('../models/product');

// Ajouter un produit
router.post('/', async (req, res) => {
	const { name, category, description, composition, price, images } = req.body;

	if (!name) {
			return res
				.status(400)
				.json({ error: 'Le champ "name" est obligatoire.' });
		}
		if (!Array.isArray(composition)) {
			return res
				.status(400)
				.json({ error: 'Le champ "composition" doit être un tableau.' });
		}
	
	try {
		const newProduct = new Product({
			name,
			category,
			description,
			composition,
			price,
			images,
		});
		const product = await newProduct.save();
		res.json(product);
	} catch (error) {
		console.error(error.message);
		res.status(500).send('Server error');
	}
});

// Obtenir tous les produits
router.get('/', async (req, res) => {
	try {
		const products = await Product.find()
			.populate('category')
			.populate('composition');
		res.json(products);
	} catch (error) {
		console.error(error.message);
		res.status(500).send('Server error');
	}
});

// Modifier un produit
router.put('/:id', async (req, res) => {
	const { name, category, description, composition, price, images } = req.body;

	try {
		const product = await Product.findById(req.params.id);
		if (!product) {
			return res.status(404).json({ msg: 'Produit inconnu' });
		}
		product.name = name;
		product.category = category;
		product.description = description;
		product.composition = composition;
		product.price = price;
		product.images = images;
		const updatedProduct = await product.save();
		res.json(updatedProduct);
	} catch (error) {
		console.error('Erreur lors de la mise à jour d’un produit: ', error.message);
		res.status(500).send('Server error');
	}
});

// Supprimer un produit
router.delete('/:id', async (req, res) => {
	try {
		const product = await Product.findByIdAndDelete(req.params.id);
		if (!product) {
			return res.status(404).json({ msg: 'Produit inconnu' });
		}
		res.json({ msg: 'Produit supprimé' });
	} catch (error) {
		console.error(error.message);
		if (error.kind === 'ObjectId') {
			return res.status(404).json({ msg: 'Produit non rencontré' });
		}
		res.status(500).send('Server error');
	}
});

module.exports = router;
