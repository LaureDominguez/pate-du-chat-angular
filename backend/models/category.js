const mongoose = require('mongoose');

const CategorySchema = new mongoose.Schema({
	name: {
		type: String,
		required: true,
		unique: true,
	},
}); 

// Compter le nombre de produits dans une catégorie
CategorySchema.virtual('productCount', {
	ref: 'Product',
	localField: '_id',
	foreignField: 'category',
	count: true
})

CategorySchema.set('toJSON', { virtuals: true });
CategorySchema.set('toObject', { virtuals: true });

CategorySchema.options.toJSON.transform = function (doc, ret) {
	delete ret.id;
	delete ret.__v;
	return ret;
};

module.exports = mongoose.model('Category', CategorySchema);

