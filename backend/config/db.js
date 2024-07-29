const mongoose = require('mongoose');

const connectDB = async () => {
	try {
        console.log('Tentative de connexion à MongoDB...');
		await mongoose.connect('mongodb://localhost:27017/les_pates_du_chat');
		console.log('MongoDB est connecté');
	} catch (error) {
		console.error('Erreur lors de la connexion à MongoDB:', error.message);
		process.exit(1);
	}
};

module.exports = connectDB;
