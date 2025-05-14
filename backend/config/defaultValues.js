// config/defaultValues.js
const mongoose = require('mongoose');
const Category = require('../models/category');
const Supplier = require('../models/supplier');

// Catégorie par défaut
const ensureDefaultCategory = async () => {
    try {
        const DEFAULT_CATEGORY_ID = "65a123456789abcd12345678";
        const defaultCategory = await Category.findById(DEFAULT_CATEGORY_ID);

        if (!defaultCategory) {
            await Category.create({
                _id: new mongoose.Types.ObjectId(DEFAULT_CATEGORY_ID),
                name: "Sans catégorie",
            });
            console.log("✅ Catégorie 'Sans catégorie' créée avec ID fixe.");
        } else {
            console.log("✅ Catégorie 'Sans catégorie' existe déjà.");
        }
    } catch (error) {
        console.error("❌ Erreur lors de la création de la catégorie par défaut :", error);
    }
};

// Fournisseur par défaut
const ensureDefaultSupplier = async () => {
    try {
        const DEFAULT_SUPPLIER_ID = "67d6a38cac36810d223b612e";
        const defaultSupplier = await Supplier.findById(DEFAULT_SUPPLIER_ID);

        if (!defaultSupplier) {
            await Supplier.create({
                _id: new mongoose.Types.ObjectId(DEFAULT_SUPPLIER_ID),
                name: "Sans fournisseur",
            });
            console.log("✅ Fournisseur 'Sans fournisseur' créé avec ID fixe.");
        } else {
            console.log("✅ Fournisseur 'Sans fournisseur' existe déjà.");
        }
    } catch (error) {
        console.error("❌ Erreur lors de la création du fournisseur par défaut :", error);
    }
};

module.exports = { ensureDefaultCategory, ensureDefaultSupplier };
