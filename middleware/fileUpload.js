const multer = require('multer');
const path = require('path');
const fs = require('fs');

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
		cb(null, `${Date.now()}-${file.originalname}`);
	},
});

// Filtrage des fichiers (optionnel)
const fileFilter = (req, file, cb) => {
	if (file.mimetype.startsWith('image/')) {
		cb(null, true);
	} else {
		cb(new Error('Seuls les fichiers images sont autorisés'), false);
	}
};

const upload = multer({
	uploadDir,
	storage,
	limits: { fileSize: 10 * 1024 * 1024 }, // Limite de taille : 10 Mo
	fileFilter,
});

module.exports = upload;
