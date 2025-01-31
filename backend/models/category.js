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
	}
); 

module.exports = mongoose.model('Category', CategorySchema);
