const mongoose = require('mongoose');

const IngredientSchema = new mongoose.Schema({
	name: {
		type: String,
		required: true,
	},
	supplier: {
		type: String,
		required: false,
	},
	allergens: [
		{
			type: String,
			required: false,
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
		required: false,
	},
});

module.exports = mongoose.model('Ingredient', IngredientSchema);
