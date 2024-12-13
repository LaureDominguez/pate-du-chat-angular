const express = require('express');
const router = express.Router();
const Product = require('../models/product');

// Ajouter un produit
router.post('/', async (req, res) => {
	const { id, name, description, composition, price, imageUrl } = req.body;
	try {
		const newProduct = new Product({
			id,
			name,
			description,
			composition,
			price,
			imageUrl,
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
		const products = await Product.find();
		res.json(products);
	} catch (error) {
		console.error(error.message);
		res.status(500).send('Server error');
	}
});

module.exports = router;
