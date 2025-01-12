const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
	name: {
		type: String,
		required: true,
	},
	category: {
		type: String,
		default: null,
	},
	description: {
		type: String,
	},
	composition: [
		{
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Ingredient',
		},
	],
	price: {
		type: Number,
	},
	stock: {
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

module.exports = mongoose.model('Product', ProductSchema);
