const mongoose = require('mongoose');
const generateUniqueSlug = require('../utils/slug');
const MAX_OLD = 3;

const CategorySchema = new mongoose.Schema({
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
		unique: true,
	},
    description: { type: String }
},
	{ timestamps: true }
); 

CategorySchema.pre('save', async function (next) {
	if (this.isNew && !this.slug) {
		this.slug = await generateUniqueSlug(this.name);
		return next();
	}
	if (this.isModified('name') && this.name) {
		const newSlug = await generateUniqueSlug(this.name);
		if (newSlug !== this.slug) {
			this.previousSlugs.unshift(this.slug);
			this.previousSlugs = this.previousSlugs.slice(0, MAX_OLD);
			this.slug = newSlug;
		}
	}
	next();
});

// Compter le nombre de produits dans une catégorie
CategorySchema.virtual('productCount', {
	ref: 'Product',
	localField: '_id',
	foreignField: 'category',
	count: true
});

CategorySchema.set('toJSON', { virtuals: true });
CategorySchema.set('toObject', { virtuals: true });

CategorySchema.options.toJSON.transform = function (doc, ret) {
	delete ret.id;
	delete ret.__v;
	return ret;
};

module.exports = mongoose.model('Category', CategorySchema);

