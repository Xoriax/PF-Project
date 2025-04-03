// Importation des modules
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fp = require("lodash/fp");

// Partie configuration de l'application
dotenv.config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT;
const mongoDB = process.env.MONGODB_URI;

// Schémas de la structure dans ma DB
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
    total_proteines: Number,
    total_glucides: Number,
    total_lipides: Number,
    jours: String
});

const objectifsSchema = new mongoose.Schema({
    objectif_calorique: Number,
    objectif_proteine: Number,
    objectif_glucide: Number,
    objectif_lipide: Number,
    jours: String
});

const Repas = mongoose.model('repas', repasSchema);
const Objectifs = mongoose.model('objectif', objectifsSchema);

// Fonctions utilitaires
const formatDate = () => {
    const date = new Date();
    return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
};

const calculerTotal = (repas, champ) => fp.flow(fp.map(champ), fp.sum)(repas.plats);

const verifierObjectifAtteint = (repas, objectif) => ({
    objectif_calorique_atteint: repas.total_calorique >= objectif.objectif_calorique,
    objectif_proteine_atteint: repas.total_proteines >= objectif.objectif_proteine,
    objectif_glucide_atteint: repas.total_glucides >= objectif.objectif_glucide,
    objectif_lipide_atteint: repas.total_lipides >= objectif.objectif_lipide
});

const ajouterOuMettreAJourPlat = async (repas, plat) => {
    const platExistant = repas.plats.find(p => p.nom === plat.nom);

    if (platExistant) {
        ['calories', 'proteines', 'glucides', 'lipides'].forEach(nutriment => {
            platExistant[nutriment] += plat[nutriment];
        });
    } else {
        repas.plats.push(plat);
    }

    repas.total_calorique = calculerTotal(repas, 'calories');
    repas.total_proteines = calculerTotal(repas, 'proteines');
    repas.total_glucides = calculerTotal(repas, 'glucides');
    repas.total_lipides = calculerTotal(repas, 'lipides');

    await repas.save();
    return repas;
};

const creerRepasAvecPlat = async (plat) => {
    const repas = new Repas({
        plats: [plat],
        total_calorique: plat.calories,
        total_proteines: plat.proteines,
        total_glucides: plat.glucides,
        total_lipides: plat.lipides,
        jours: formatDate()
    });

    await repas.save();
    return repas;
};

// Routes
app.get('/meals', async (req, res) => {
    try {
        const dateDuJour = formatDate();
        const repas = await Repas.find();
        const objectif = await Objectifs.findOne({ jours: dateDuJour });

        const repasAvecObjectif = fp.map(r => ({
            ...r.toObject(),
            objectif_atteint: objectif ? verifierObjectifAtteint(r, objectif) : null
        }), repas);

        res.json(repasAvecObjectif);
    } catch (err) {
        console.error(err);
        res.status(500).send('Erreur Serveur');
    }
});

app.get('/goals', async (req, res) => {
    try {
        const objectif = await Objectifs.find();
        res.json(objectif);
    } catch (err) {
        console.error(err);
        res.status(500).send('Erreur Serveur');
    }
});

app.post('/meals', async (req, res) => {
    try {
        const plats = req.body;

        if (!Array.isArray(plats) || plats.length === 0) {
            return res.status(400).json({ message: "Le corps de la requête doit contenir un tableau de plats." });
        }

        const dateDuJour = formatDate();
        let repas = await Repas.findOne({ jours: dateDuJour });

        repas = await fp.reduce(async (accPromise, plat) => {
            const acc = await accPromise;
            return acc ? ajouterOuMettreAJourPlat(acc, plat) : creerRepasAvecPlat(plat);
        }, Promise.resolve(repas), plats);

        res.status(201).json(repas);
    } catch (err) {
        console.error(err);
        res.status(500).send("Erreur Serveur");
    }
});

app.post('/goals', async (req, res) => {
    try {
        const objectifData = req.body;

        if (!objectifData) {
            return res.status(400).json({ message: "Le corps de la requête doit contenir un objectif." });
        }

        const dateDuJour = formatDate();
        let objectif = await Objectifs.findOne({ jours: dateDuJour });

        if (objectif) {
            objectif = await Objectifs.findOneAndUpdate({ jours: dateDuJour }, objectifData, { new: true });
        } else {
            objectif = new Objectifs({ ...objectifData, jours: dateDuJour });
            await objectif.save();
        }

        res.status(201).json(objectif);
    } catch (err) {
        console.error(err);
        res.status(500).send("Erreur Serveur");
    }
});

app.listen(PORT, () => {
    console.log(`Serveur démarré sur le port ${PORT}`);
});

mongoose.connect(mongoDB)
    .then(() => console.log('Connexion à MongoDB réussie !'))
    .catch((err) => console.log(err));