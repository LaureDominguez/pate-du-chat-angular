const mongoose = require('mongoose');
const generateUniqueSlug = require('../utils/slug');
const MAX_OLD = 3;

const SupplierSchema = new mongoose.Schema({
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
        unique: true 
    },
    description: { type: String }
},
    { timestamps: true }
);

SupplierSchema.pre('save', async function (next) {
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

SupplierSchema.virtual('ingredientCount', {
    ref: 'Ingredient',
    localField: '_id',
    foreignField: 'supplier',
    count: true
});

SupplierSchema.virtual('ingredients', {
    ref: 'Ingredient',
    localField: '_id',
    foreignField: 'supplier',
});


SupplierSchema.set('toJSON', { virtuals: true });
SupplierSchema.set('toObject', { virtuals: true });

SupplierSchema.options.toJSON.transform = function (doc, ret) {
    delete ret.id;
    delete ret.__v;
    return ret;
};

module.exports = mongoose.model('Supplier', SupplierSchema);
