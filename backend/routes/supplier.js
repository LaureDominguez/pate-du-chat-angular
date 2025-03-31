const express = require('express');
const { check, validationResult } = require('express-validator');
const router = express.Router();
const Supplier = require('../models/supplier');
const sanitize = require('mongo-sanitize');

const validateRequest = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log('Erreur de validation :', errors.array());
        return res.status(400).json({ message: errors.array() });
    }
    next();
};


// 🔹 Récupérer tous les fournisseurs
router.get('/', async (req, res) => {
    try {
        const suppliers = await Supplier.find().populate('ingredientCount');

        if (!suppliers || suppliers.length === 0) {
            console.warn('⚠️ Aucun fournisseur trouvé en base !');
        }
        res.status(200).json(suppliers);
    } catch (error) {
		console.error(error.message);
        res
            .status(500)
            .json({ message: 'Erreur lors de la récupération des fournisseurs.' });
    }
});

// 🔹 Récupérer un fournisseur par son I
router.get('/:id', async (req, res) => {
    try {
        const supplier = await Supplier.findById(req.params.id).populate('ingredientCount');
        if (!supplier) {
            return res.status(404).json({ msg: 'Fournisseur non trouvé.' });
        }
        res.status(200).json(supplier);
    } catch (err) {
		console.error(err.message);
        res
            .status(500)
            .json({ error: 'Erreur lors de la récupération du fournisseur.' });
    }
});

// 🔹 Ajouter un nouveau fournisseur
router.post(
    '/',
    [
        check('name')
            .trim()
            .notEmpty()
            .withMessage('Le champ "nom" est obligatoire.')
            .isLength({ min: 2, max: 50 })
            .withMessage(
                'Le champ "nom" doit contenir entre 2 et 50 caractères.'
            )
            .matches(/^[a-zA-Z0-9À-ÿŒœ\s-']+$/)
            .withMessage(
                'Le champ "nom" ne doit pas contenir de caractères spéciaux.'
            ),
        check('description')
            .optional()
            .trim()
            .isLength({ max: 100 })
			.if(check('description').notEmpty())
            .withMessage(
                'Le champ "description" doit contenir entre 2 et 255 caractères.'
            )
            .matches(/^[a-zA-Z0-9À-ÿŒœ\s.,!?()'"-]+$/)
            .withMessage(
                'Le champ "description" ne doit pas contenir de caractères spéciaux.'
            ),
    ],
    validateRequest,
    async (req, res) => {
    // const { name, description } = req.body;
    console.log('🔵 Création d\'un nouveau fournisseur', req.body);
    try {
        let { name, description } = req.body;
        name = sanitize(name);
        description = sanitize(description);

        const existingSupplier = await Supplier.findOne({ name });

        if (existingSupplier) {
            return res.status(400).json({ msg: 'Ce fournisseur existe déjà.' });
        }

        const newSupplier = new Supplier({ name, description });
        
        await newSupplier.save();
        res.status(201).json(newSupplier);
    } catch (err) {
        console.error('Erreur lors de la création du fournisseur :', err.message);
        if (err.code === 11000) {
			return res.status(400).json({ msg: 'Ce fournisseur existe déjà.' });
		}
        res.status(400).json({ error: err.message });
    }
});

// 🔹 Modifier un fournisseur
router.put(
    '/:id', 
    [
        check('name')
            .trim()
            .notEmpty()
            .withMessage('Le champ "nom" est obligatoire.')
            .isLength({ min: 2, max: 50 })
            .withMessage(
                'Le champ "nom" doit contenir entre 2 et 50 caractères.'
            )
            .matches(/^[a-zA-Z0-9À-ÿŒœ\s-']+$/)
            .withMessage(
                'Le champ "nom" ne doit pas contenir de caractères spéciaux.'
            ),
        check('description')
            .optional()
            .trim()
            .isLength({ max: 100 })
			.if(check('description').notEmpty())
            .withMessage(
                'Le champ "description" doit contenir entre 2 et 255 caractères.'
            )
            .matches(/^[a-zA-Z0-9À-ÿŒœ\s.,!?()'"-]+$/)
            .withMessage(
                'Le champ "description" ne doit pas contenir de caractères spéciaux.'
            ),
    ],
    validateRequest,
    async (req, res) => {
    try {
        let { name, description } = req.body;
        name = sanitize(name);
        description = sanitize(description);

        const supplier = await Supplier.findById(req.params.id);
        if (!supplier) {
            return res.status(404).json({ msg: 'Fournisseur non trouvé.' });
        }

        const existingSupplier = await Supplier.findOne({ name });
        if (existingSupplier && existingSupplier._id.toString() !== req.params.id.toString()) {
            return res.status(400).json({ msg: 'Une autre fournisseur porte déjà ce nom.' });
        }

        supplier.name = sanitize(name) || supplier.name;
        supplier.description = sanitize(description) || supplier.description;

        const updatedSupplier = await supplier.save();
        res.status(200).json(updatedSupplier);
    } catch (err) {
        console.error('Erreur lors de la mise à jour du fournisseur :', err.message);
        if (err.code === 11000) {
            return res.status(400).json({ msg: 'Ce fournisseur existe déjà.' });
        }
        res.status(500).json({ error: err.message });
    }
});

// 🔹 Supprimer un fournisseur
router.delete('/:id', async (req, res) => {
    try {
        const supplierId = req.params.id;
        const DEFAULT_SUPPLIER_ID = '67d6a38cac36810d223b612e';

        if (!supplierId) {
            return res.status(404).json({ msg: 'ID du fournisseur inconnu.' });
        }

        if (supplierId === DEFAULT_SUPPLIER_ID) {
            return res
                .status(400)
                .json({ msg: 'Impossible de supprimer ce fournisseur.' });
        }

        const supplier = await Supplier.findById(supplierId).populate('ingredientCount');

        if (!supplier) {
            return res.status(404).json({ msg: 'Fournisseur introuvable.' });
        }

        if (supplier.ingredientCount > 0) {
            await Ingredient.updateMany(
                { supplier: supplier._id },
                { supplier: DEFAULT_SUPPLIER_ID }
            )
        }

        await Supplier.findByIdAndDelete(req.params.id);

        res.status(200).json({ 
            message: 'Fournisseur supprimé avec succès.',
            reasignDone: supplier.ingredientCount > 0,
        });
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'ID invalide.' });
        }
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
