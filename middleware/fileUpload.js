const multer = require('multer');
const path = require('path');
const fs = require('fs');

const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];


const uploadDir = path.resolve(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
	fs.mkdirSync(uploadDir);
}

// Configuration du stockage
const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, path.resolve(__dirname, '../uploads')); 
	},

	filename: (req, file, cb) => {
		// cb(null, `${Date.now()}-${file.originalname}`);
		const fileExt = path.extname(file.originalname).toLowerCase();
		cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${fileExt}`);
	},
});

// Filtrage des fichiers (optionnel)
const fileFilter = (req, file, cb) => {
	const fileExt = path.extname(file.originalname).toLowerCase();

		if (
			!allowedExtensions.includes(fileExt) ||
			!allowedMimeTypes.includes(file.mimetype)
		) {
			return cb(
				new Error(
					'Seuls les fichiers images (.jpg, .jpeg, .png, .webp) sont autorisés'
				),
				false
			);
		}

		cb(null, true);
    // const fileExt = path.extname(file.originalname).toLowerCase();

    // if (!allowedExtensions.includes(fileExt) || !allowedMimeTypes.includes(file.mimetype)) {
    //     return cb(new Error('Seuls les fichiers images (.jpg, .jpeg, .png, .webp) sont autorisés'), false);
    // }

    // cb(null, true);
};

const upload = multer({
	uploadDir,
	storage,
	limits: { fileSize: 10 * 1024 * 1024 }, // Limite de taille : 10 Mo
	fileFilter,
});

module.exports = upload;
