const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
	name: {
		type: String,
		required: true,
	},
	description: {
		type: String,
		required: true,
	},
	composition: [
		{
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Ingredient',
			required: true,
		},
	],
	price: {
		type: Number,
		required: true,
	},
	stock: {
		type: Boolean,
		required: true,
	},
	images: [
		{
			type: String,
			default: false,
		},
	],
});

module.exports = mongoose.model('Product', ProductSchema);
