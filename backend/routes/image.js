const express = require('express');
const router = express.Router();
const upload = require('../../middleware/fileUpload');
const fs = require('fs');
const path = require('path');

// Recupérer une image
// router.get('/:filename', (req, res) => {
// 	const filename = req.params.filename;
// 	const filePath = path.join(__dirname, '../../uploads', filename);
// 	fs.readFile(filePath, (err, data) => {
// 		if (err) {
// 			console.error(`Image introuvable : ${filename}`);
// 			return res.status(404).json({ error: 'Image introuvable' });
// 		}
// 		res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
// 		res.setHeader('Content-Type', 'image/jpeg');
// 		res.send(data);
// 	});
// });
// Recupérer une image (Affichage dans le navigateur)
router.get('/:filename', (req, res) => {
	const filename = req.params.filename;
	const filePath = path.join(__dirname, '../../uploads', filename);

	// Vérifier si l'image existe
	if (!fs.existsSync(filePath)) {
		console.error(`Image introuvable : ${filename}`);
		return res.status(404).json({ error: 'Image introuvable' });
	}

	// Détecter le type MIME correct de l’image
	const ext = path.extname(filename).toLowerCase();
	let contentType = 'image/jpeg'; // Valeur par défaut

	if (ext === '.png') contentType = 'image/png';
	else if (ext === '.gif') contentType = 'image/gif';
	else if (ext === '.webp') contentType = 'image/webp';

	// Définir le bon type MIME et envoyer l’image 
	res.setHeader('Content-Type', contentType);
	res.sendFile(filePath);
});


// Ajouter une image
router.post('/', upload.array('images', 10), (req, res) => {
    // console.log('route images -> req.files:', req.files);
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
    
    // console.log('route images -> delete -> req.files:', req.files);

	// Vérifier si le fichier existe avant de le supprimer
	fs.access(filePath, fs.constants.F_OK, (err) => {
		if (err) {
			console.error(`Image introuvable : ${filename}`);
			return res.status(404).json({ error: 'Image introuvable' });
		}

		// Supprimer le fichier
		fs.unlink(filePath, (err) => {
			if (err) {
				console.error(`Erreur lors de la suppression : ${err.message}`);
				return res
					.status(500)
					.json({ error: "Erreur lors de la suppression de l'image" });
			}

			// console.log(`Image supprimée : ${filename}`);
			return res.status(200).json({ message: 'Image supprimée avec succès' });
		});
	});
});


module.exports = router;