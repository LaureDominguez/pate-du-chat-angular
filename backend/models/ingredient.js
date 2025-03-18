const mongoose = require('mongoose');

const IngredientSchema = new mongoose.Schema({
	name: {
		type: String,
		required: true,
		trim: true,
	},
	bio: {
		type: Boolean,
		// required: true,
		default: false,
	},
	supplier: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Supplier',
		trim: true,
	},
	type: {
		type: String,
		enum: ['simple', 'compose'],
		required: true,
		default: 'simple',
	},
	subIngredients: [
		{
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Ingredient',
		},
	],
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
	origin: {
		type: String,
		required: true,
	},
	images: [
		{
			type: String,
			default: false,
		},
	],
});

IngredientSchema.pre('save', async function (next) {
	if (this.type === 'compose' && this.subIngredients.length > 0) {
		const subIngredients = await mongoose.model('Ingredient').find({ _id: { $in: this.subIngredients } });
	
		// Récupérer les allergènes de tous les sous-ingrédients
		this.allergens = [...new Set(subIngredients.flatMap(ing => ing.allergens))];
	
		// Vérifier si TOUS les sous-ingrédients sont vegan et végétariens
		this.bio = subIngredients.length > 0 && subIngredients.every(ing => ing.bio);
		this.vegan = subIngredients.every(ing => ing.vegan);
		this.vegeta = subIngredients.every(ing => ing.vegeta);
		}
		next();
	});


module.exports = mongoose.model('Ingredient', IngredientSchema);
