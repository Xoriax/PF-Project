// index.js
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const { connectRoutes } = require('./route');

dotenv.config();

const app = express();
const PORT = process.env.PORT;
const mongoDB = process.env.MONGODB_URI;

app.use(cors());
app.use(express.json());

// Connexion à MongoDB
mongoose.connect(mongoDB)
    .then(() => console.log('Connexion à MongoDB réussie !'))
    .catch((err) => console.log(err));

// Définir les routes
connectRoutes(app);

app.listen(PORT, () => {
    console.log(`Serveur démarré sur le port ${PORT}`);
});