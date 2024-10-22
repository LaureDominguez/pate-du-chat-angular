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
			type: String,
			required: true,
		}
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
