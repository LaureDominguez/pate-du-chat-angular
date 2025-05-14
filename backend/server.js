require('dotenv').config();
const express = require('express');
const connectDB = require('./config/db');
const configMiddleware = require('./config/middleware');
// const bodyParser = require('body-parser');
// const cors = require('cors');
const path = require('path');

const app = express();
// const multer = require(path.resolve(__dirname, '../middleware/node_modules/multer'));
// const upload = multer();


// Connecter à la base de données
connectDB();

// Middleware
configMiddleware(app);

// Routes
app.use('/api/images', require('./routes/image'));
app.use('/api/products', require('./routes/product'));
app.use('/api/ingredients', require('./routes/ingredient'));
app.use('/api/categories', require('./routes/category'));
app.use('/api/suppliers', require('./routes/supplier'));


const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
	console.log(`🚀 Serveur lancé sur http://localhost:${PORT}`);
});
