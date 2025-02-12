const mongoose = require('mongoose');

const CategorySchema = new mongoose.Schema({
	name: {
		type: String,
		required: true,
	},
}); 

CategorySchema.virtual('productCount', {
	ref: 'Product',
	localField: '_id',
	foreignField: 'category',
	count: true
})

CategorySchema.set('toJSON', { virtuals: true });
CategorySchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Category', CategorySchema);
