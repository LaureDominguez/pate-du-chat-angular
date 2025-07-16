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
	dlc: {
		type: String,
		required: true,
	},
	cookInstructions: {
		type: String
	},
	stock: {
		type: Boolean,
		default: false,
	},
	stockQuantity: {
		type: Number,
		min: 0
	},
	quantityType: {
		type: String,
		enum: ['piece', 'kg'],
		required: true,
		default: 'piece',
	},
	price: {
		type: Number,
		required: true,
		min: 0,
	},
	images: [
		{
			type: String,
			default: false,
		},
	],
});

module.exports = mongoose.model('Product', ProductSchema);
