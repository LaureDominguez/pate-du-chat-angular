const mongoose = require('mongoose');

const CategorySchema = new mongoose.Schema(
	{
		name: {
			type: String,
			required: true,
			unique: true, // Pour éviter les doublons
			trim: true,
		},
		description: {
			type: String,
			trim: true,
		},
	},
	{ timestamps: true }
); // Ajoute les champs createdAt et updatedAt automatiquement

module.exports = mongoose.model('Category', CategorySchema);
