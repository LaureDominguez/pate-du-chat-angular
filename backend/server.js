const express = require('express');
const connectDB = require('./config/db');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const app = express();
const multer = require(path.resolve(__dirname, '../middleware/node_modules/multer'));
const upload = multer();

// Connecter à la base de données
connectDB();

// Middleware
app.use(cors({
	origin: 'http://localhost:4200',
	methods: ['GET', 'POST', 'PUT', 'DELETE'],
	allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use((req, res, next) => {
	console.log(`Incoming request: ${req.method} ${req.url}`);
	console.log('Headers:', req.headers);
	next();
});

// Middlewares pour JSON et URL-encoded
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir les fichiers statiques
app.use('/uploads', (req, res, next) => {
	console.log('Serving static file:', req.url); // Log du fichier demandé
	next();
});
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));


// Routes
app.use('/api/images', require('./routes/image'));
app.use('/api/products', require('./routes/product'));
app.use('/api/ingredients', require('./routes/ingredient'));
app.use('/api/categories', require('./routes/category'));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
	console.log(`Server is running on port ${PORT}`);
});
