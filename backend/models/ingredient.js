const mongoose = require('mongoose');

const IngredientSchema = new mongoose.Schema({
	name: {
		type: String,
		required: true,
	},
	supplier: {
		type: String,
	},
	allergens: [
		{
			type: String,
			default: [],
		},
	],
	vegan: {
		type: Boolean,
		default: false,
	},
	vegeta: {
		type: Boolean,
		default: false,
	},
	images: [
		{
			type: String,
			default: false,
		},
	],
});

module.exports = mongoose.model('Ingredient', IngredientSchema);
