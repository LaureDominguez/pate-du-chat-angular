const mongoose = require('mongoose');
const { ensureDefaultCategory, ensureDefaultSupplier } = require('./defaultValues');

const connectDB = async () => {
	try {
        console.log('Tentative de connexion à MongoDB...');
		await mongoose.connect(process.env.MONGODB_URI);
		console.log('MongoDB est connecté');

		// S'assurer que la catégorie et le fournisseur par défaut existent
		await ensureDefaultCategory();
		await ensureDefaultSupplier();
	} catch (error) {
		console.error('Erreur lors de la connexion à MongoDB:', error.message);
		process.exit(1);
	}
};

module.exports = connectDB;
