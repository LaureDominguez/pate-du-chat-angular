const mongoose = require('mongoose');

const IngredientSchema = new mongoose.Schema({
	name: {
		type: String,
		required: true,
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
	images: [
		{
			type: String,
			required: false,
		}
	],
	supplier: {
		type: String,
		required: false,
	},
});

module.exports = mongoose.model('Ingredient', IngredientSchema);
