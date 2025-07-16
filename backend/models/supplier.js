const mongoose = require('mongoose');

const SupplierSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: true, 
        unique: true 
    },
    description: { type: String }
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
