const cors = require('cors');
const express = require('express');
const path = require('path');
const morgan = require('morgan');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');

module.exports = (app) => {
	// 🔒 Sécuriser les en-têtes HTTP avec Helmet
	app.use(helmet({
		crossOriginResourcePolicy: { policy: "cross-origin" }
	}));
	
	// 🌐 Activer CORS avec une configuration stricte
	app.use(
		cors({
			origin: 'http://localhost:4200',
			methods: ['GET', 'POST', 'PUT', 'DELETE'],
			allowedHeaders: ['Content-Type', 'Authorization'],
      		credentials: true, // Permet les cookies sécurisés si nécessaire
		})
	);

	// 📦 Middleware pour JSON et URL-encoded
	app.use(express.json());
	app.use(express.urlencoded({ extended: true }));
	app.use(cookieParser());

	// 📝 Logger toutes les requêtes entrantes (avec Morgan)
	app.use(morgan('dev'));

	// 📂 Gestion des fichiers statiques (images, uploads)
	app.use('/uploads', express.static(path.join(__dirname, '../uploads'), {
		setHeaders: (res, filePath) => {
			const extension = path.extname(filePath).toLowerCase();
			switch (extension) {
				case '.jpg':
				case '.jpeg':
				res.setHeader('Content-Type', 'image/jpeg');
				break;
				case '.png':
				res.setHeader('Content-Type', 'image/png');
				break;
				case '.gif':
				res.setHeader('Content-Type', 'image/gif');
				break;
				case '.webp':
				res.setHeader('Content-Type', 'image/webp');
				break;
				default:
				res.setHeader('Content-Type', 'application/octet-stream');
			}
			res.setHeader('Access-Control-Allow-Origin', 'http://localhost:4200');
			res.setHeader('Access-Control-Allow-Credentials', 'true');
		},
	}));

	// // Servir les fichiers statiques (uploads)
	// app.use('/uploads', (req, res, next) => {
	// 	// console.log('📂 [Static] Serving file:', req.url);
	// 	next();
	// });

	// app.use(
	// 	'/uploads',
	// 	express.static(path.join(__dirname, '../uploads'), {
	// 		setHeaders: (res, filePath) => {
	// 			res.setHeader('Content-Type', 'image/jpeg'); // Forcer le bon type MIME
	// 		},
	// 	})
	// );
};
