const mongoose = require('mongoose');
const generateUniqueSlug = require('../utils/slug');
const MAX_OLD = 3;

const ProductSchema = new mongoose.Schema({
	slug: {
		type: String,
		required: true,
		unique: true,
		lowercase: true,
		trim: true,
	},
	previousSlugs: { type: [String], default: [] },
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
	forSale: {
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
},
	{ timestamps: true }
);

ProductSchema.pre('save', async function (next) {
	if (this.isNew && !this.slug) {
		this.slug = await generateUniqueSlug(this.name);
		return next();
	}

	if (this.isModified('name')) {
		const newSlug = await generateUniqueSlug(this.name);
		if (newSlug !== this.slug) {
		this.previousSlugs.unshift(this.slug);
		this.previousSlugs = this.previousSlugs.slice(0, MAX_OLD);
		this.slug = newSlug;
		}
	}
	next();
});

/** Virtual pratique pour savoir si le produit est réellement disponible */
ProductSchema.virtual('isAvailable').get(function () {
	return this.forSale && (this.stockQuantity ?? 0) > 0;
});

/** Garder les virtuals dans les réponses JSON / objets */
ProductSchema.set('toJSON', { virtuals: true });
ProductSchema.set('toObject', { virtuals: true });

/** Nettoyage léger des réponses */
ProductSchema.options.toJSON.transform = function (doc, ret) {
	delete ret.__v;
	return ret;
};

module.exports = mongoose.model('Product', ProductSchema);
