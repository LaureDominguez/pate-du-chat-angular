const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
	name: {
		type: String,
		required: true,
	},
	category: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Category',
		required: true,
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
		required: true,
		min: 0,
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
