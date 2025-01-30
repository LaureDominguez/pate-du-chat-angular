const express = require('express');
const router = express.Router();
const Product = require('../models/product');

// Ajouter un produit
router.post('/', async (req, res) => {
	const { name, category, description, composition, price, stock, images } = req.body;

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
			stock,
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
		console.log(
			'route products -> req.query.view:',
			req.query.view
		);
	try {
		let products = await Product.find()
			.populate('category')
			.populate('composition');
		console.log('route products -> products:', products);

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
        console.log('Produits avant envoi :', products);
		res.json(products);
	} catch (error) {
		console.error('Erreur serveur:', error);
		res
			.status(500)
			.json({
				message: 'Erreur serveur lors de la récupération des produits.',
			});
	}
});

// Modifier un produit
router.put('/:id', async (req, res) => {
	const { name, category, description, composition, price, stock, images } = req.body;

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
		product.stock = stock;
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
