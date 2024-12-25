const express = require('express');
const router = express.Router();
const upload = require('../../middleware/fileUpload');
const fs = require('fs');
const path = require('path');

// Ajouter une image
router.post('/', upload.array('images', 10), (req, res) => {
    console.log('route images -> req.files:', req.files);
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: 'Aucune image envoyée' });
        }

        // liste des chemins
        const imagePath = req.files.map((file) => `/uploads/${file.filename}`);
        return res.status(201).json({
					message: 'Fichiers uploadés avec succès',
					imagePath,
				});
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Erreur lors de l\'ajout de l\'image' });
    }
});

// Supprimer une image
router.delete('/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, '../../uploads', filename);

    fs.unlink(filePath, (err) => {
        if (err) {
            console.error(err);
            return res
                .status(404)
                .json({ error: 'Image introuvable' });
        }
        return res
            .status(200)
            .json({ message: 'Image supprimée avec succès' });
    });
});

module.exports = router;