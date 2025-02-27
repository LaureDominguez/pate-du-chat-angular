const mongoose = require('mongoose');

const IngredientSchema = new mongoose.Schema({
	name: {
		type: String,
		required: true,
		trim: true,
	},
	bio: {
		type: Boolean,
		required: true,
		default: false,
	},
	supplier: {
		type: String,
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
	images: [
		{
			type: String,
			default: false,
		},
	],
});

// // 🔹 Index pour empêcher un doublon (même nom + même état bio)
// IngredientSchema.index({ name: 1, bio: 1 }, { unique: true });

// // 🔹 Auto-calcul des allergènes et des statuts vegan/végétarien pour un ingrédient composé
// IngredientSchema.pre('save', async function (next) {
// 	console.log('🟡 [Ingredient] → pre-save déclenché pour :', this.name);

// 	if (this.type === 'compose' && this.subIngredients.length > 0) {
// 		console.log('🔄 Mise à jour des sous-ingrédients pour', this.name);

// 		const subIngredients = await mongoose.model('Ingredient').find({ _id: { $in: this.subIngredients } });

// 		// Récupération des allergènes, vegan, végétarien
// 		this.allergens = [...new Set(subIngredients.flatMap(ing => ing.allergens))];
// 		this.vegan = subIngredients.every(ing => ing.vegan);
// 		this.vegeta = subIngredients.every(ing => ing.vegeta);
// 	}
// 	console.log('✅ [Ingredient] → Pré-save terminé pour :', this.name);
// 	next();
// });

module.exports = mongoose.model('Ingredient', IngredientSchema);
