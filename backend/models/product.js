const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
	id: {
		type: String,
		required: true,
	},
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
	imageUrl: {
		type: String,
		required: true,
	},
});

module.exports = mongoose.model('Product', ProductSchema);
