const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fp = require("lodash/fp");

dotenv.config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT;
const mongoDB = process.env.MONGODB_URI;

const platSchema = new mongoose.Schema({
    nom: String,
    calories: Number,
    proteines: Number,
    glucides: Number,
    lipides: Number
});

const repasSchema = new mongoose.Schema({
    plats: [platSchema],
    total_calorique: Number,
    jours: String
});

const Repas = mongoose.model('repas', repasSchema);

const calculTotalCalorique = repas => fp.flow(fp.map('calories'), fp.sum)(repas.plats);
const formatDate = () => {
    const date = new Date();
    return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
};

const ajouterOuMettreAJourPlat = async (repas, plat) => {
    const platExistant = repas.plats.find(p => p.nom === plat.nom);

    if (platExistant) {
        platExistant.calories += plat.calories;
        platExistant.proteines += plat.proteines;
        platExistant.glucides += plat.glucides;
        platExistant.lipides += plat.lipides;
    } else {
        repas.plats.push(plat);
    }

    repas.total_calorique = calculTotalCalorique(repas);
    await repas.save();
    return repas;
};

const creerRepasAvecPlat = async (plat) => {
    const repas = new Repas({
        plats: [plat],
        total_calorique: plat.calories,
        jours: formatDate()
    });

    await repas.save();
    return repas;
};

app.get('/meals', async (req, res) => {
    try {
        const repas = await Repas.find();
        const repasAvecTotalCalorique = fp.map(repas => ({
            ...repas.toObject(),
            total_calorique: calculTotalCalorique(repas),
            jours: formatDate()
        }), repas);

        res.json(repasAvecTotalCalorique);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Erreur lors de la récupération des repas' });
    }
});

app.post('/meals', async (req, res) => {
    try {
        const plats = req.body;
        const dateDuJour = formatDate();
        
        let repas = await Repas.findOne({ jours: dateDuJour });

        if (repas) {
            repas = await fp.reduce(async (acc, plat) => {
                return await ajouterOuMettreAJourPlat(acc, plat);
            }, repas, plats);
        } else {
            repas = await fp.reduce(async (acc, plat) => {
                return await creerRepasAvecPlat(plat);
            }, null, plats);
        }

        res.status(201).json(repas);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Erreur lors de l\'ajout du repas' });
    }
});

app.listen(PORT, () => {
    console.log(`Serveur démarré sur le port ${PORT}`);
});

mongoose.connect(mongoDB)
    .then(() => console.log('Connexion à MongoDB réussie !'))
    .catch((err) => console.log(err));