// utils/slug.js
const slugify = require('slugify');
const { default: mongoose } = require('mongoose');

async function generateUniqueSlug(name, suffix = '') {
    const base = slugify(name, { lower: true, strict: true });
    const candidate = suffix ? `${base}-${suffix}` : base;

    const Product = mongoose.models.Product;
    const exists = await Product.exists({ slug: candidate });
    return exists ? generateUniqueSlug(name, (suffix || 0) + 1) : candidate;
}

module.exports = generateUniqueSlug;
