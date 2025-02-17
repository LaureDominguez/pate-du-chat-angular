const cors = require('cors');
const express = require('express');
const path = require('path');

module.exports = (app) => {
	// Activer CORS
	app.use(
		cors({
			origin: 'http://localhost:4200',
			methods: ['GET', 'POST', 'PUT', 'DELETE'],
			allowedHeaders: ['Content-Type', 'Authorization'],
		})
	);

	// Logger toutes les requêtes entrantes
	app.use((req, res, next) => {
		console.log(`🔍 [Request] ${req.method} ${req.url}`);
		console.log('Headers:', req.headers);
		next();
	});

	// Middleware pour JSON et URL-encoded
	app.use(express.json());
	app.use(express.urlencoded({ extended: true }));

	// Servir les fichiers statiques (uploads)
	app.use('/uploads', (req, res, next) => {
		console.log('📂 [Static] Serving file:', req.url);
		next();
	});

	app.use(
		'/uploads',
		express.static(path.join(__dirname, '../uploads'), {
			setHeaders: (res, filePath) => {
				res.setHeader('Content-Type', 'image/jpeg'); // Forcer le bon type MIME
			},
		})
	);
};
