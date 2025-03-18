const mongoose = require('mongoose');
const Category = require('../models/category');
const Supplier = require('../models/supplier');

const connectDB = async () => {
	try {
        console.log('Tentative de connexion à MongoDB...');
		await mongoose.connect('mongodb://localhost:27017/les_pates_du_chat');
		console.log('MongoDB est connecté');

		// S'assurer que la catégorie et le fournisseur par défaut existent
		await ensureDefaultCategory();
		await ensureDefaultSupplier();
	} catch (error) {
		console.error('Erreur lors de la connexion à MongoDB:', error.message);
		process.exit(1);
	}
};

// Fonction pour s'assurer que "Sans catégorie" existe toujours
const ensureDefaultCategory = async () => {
	try {
		const DEFAULT_CATEGORY_ID = "65a123456789abcd12345678";

		const defaultCategory = await Category.findById(DEFAULT_CATEGORY_ID);
		if (!defaultCategory) {
			await Category.create({
				_id: new mongoose.Types.ObjectId(DEFAULT_CATEGORY_ID),
				name: "Sans catégorie",
			});
			console.log("✅ Catégorie 'Sans catégorie' créée avec ID fixe.");
		} else {
			console.log("✅ Catégorie 'Sans catégorie' existe déjà.");
		}
	} catch (error) {
		console.error("❌ Erreur lors de la création de la catégorie par défaut :", error);
	}
};

const ensureDefaultSupplier = async () => {
	try {
		const DEFAULT_SUPPLIER_ID = "67d6a38cac36810d223b612e";

		const defaultSupplier = await Supplier.findById(DEFAULT_SUPPLIER_ID);
		if (!defaultSupplier) {
			await Supplier.create({
				_id: new mongoose.Types.ObjectId(DEFAULT_SUPPLIER_ID),
				name: "Sans fournisseur",
			});
			console.log("✅ Fournisseur 'Sans fournisseur' cree avec ID fixe.");
		} else {
			console.log("✅ Fournisseur 'Sans fournisseur' existe deja.");
		}
	} catch (error) {
		console.error("❌ Erreur lors de la creation du fournisseur par defaut :", error);
	}
};

module.exports = connectDB;
