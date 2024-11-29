const mongoose = require('mongoose');

const IngredientSchema = new mongoose.Schema({
	// id: {
	// 	type: String,
	// 	required: true,
	// },
	name: {
		type: String,
		required: true,
	},
	description: {
		type: String,
		required: true,
	},
	allergens: [
		{
			type: String,
			required: true,
		},
	],
	vegan: {
		type: Boolean,
		required: true,
	},
	vegeta: {
		type: Boolean,
		required: true,
	},
	imageUrl: {
		type: String,
		required: true,
	},
});

module.exports = mongoose.model('Ingredient', IngredientSchema);
