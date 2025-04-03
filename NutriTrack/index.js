// Importation des modules
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fp = require("lodash/fp");

// Partie configuration de l'application
dotenv.config(); // charge les variables dans le .env

const app = express(); // créer une new app express
app.use(express.json());

// PORT et mongoDB sont récupérer depuis le fichier .env
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
    jours: String
});

const objectifsSchema = new mongoose.Schema({
    objectif_calorique: Number,
    objectif_proteine: Number,
    objectif_glucide: Number,
    objectif_lipide: Number,
    jours: String
})

const Repas = mongoose.model('repas', repasSchema); // Créer un model à partir du schéma et permet d'intéragir avec les données de la DB
const Objectifs = mongoose.model('objectif', objectifsSchema);

// Fonctionnalité
// Permet de calculer le total des calories d'un repas en additionnant les calories de tout les plats
const calculTotalCalorique = repas => fp.flow(fp.map('calories'), fp.sum)(repas.plats);
// Renvoie la date actuelle au format JJ/MM/AAAA, utilise pour associer un repas à une date spécifique
const formatDate = () => {
    const date = new Date();
    return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
};

// Vérifie si un plat existe déjà dans le repas. Si oui met à jour les valeurs, sinon ajoute le plat au repas, puis met à jour le total calorique du repas
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

// Créer le premier repas de la journée, donc créer un new repas avec le plat fourni, init aussi le total calorique
const creerRepasAvecPlat = async (plat) => {
    const repas = new Repas({
        plats: [plat],
        total_calorique: plat.calories,
        jours: formatDate()
    });

    await repas.save();
    return repas;
};

// Route de l'API
//Permet de récupérer tout les repas stockés dans la base de données et renvoie en plus de tout les repas, le total calorique calculé d'un repas ainsi que sa date
app.get('/meals', async (req, res) => {
    try {
        const repas = await Repas.find();
        res.json(repas);
    } catch (err) {
        console.error(err);
        res.status(500).send('Erreur Server');
    }
});

// Permet de récupérer tous les objectifs stockés dans la base de données
app.get('/goals', async (req, res) => {
    try {
        const objectif = await Objectifs.find();
        res.json(objectif);
    } catch (err0) {
        console.error(err);
        res.status(500).send('Erreur Server')
    }
});

// Permet d'ajouter un repas, si un reoas existe déjà pour aujourd'hui, les plats sont ajoutés ou mis à jours. Si aucun repas pour la journée, créer un nouveaux repas
app.post('/meals', async (req, res) => {
    try {
        const plats = req.body;

        if (!Array.isArray(plats) || plats.length === 0) {
            return res.status(400).json({ message: "Le corps de la requête doit contenir un tableau de plats." });
        }

        const dateDuJour = formatDate();
        let repas = await Repas.findOne({ jours: dateDuJour });

        if (repas) {
            repas = await fp.reduce(async (accPromise, plat) => {
                const acc = await accPromise;
                return ajouterOuMettreAJourPlat(acc, plat);
            }, Promise.resolve(repas), plats);
        } else {
            repas = await fp.reduce(async (accPromise, plat) => {
                const acc = await accPromise;
                return acc ? ajouterOuMettreAJourPlat(acc, plat) : creerRepasAvecPlat(plat);
            }, Promise.resolve(null), plats);
        }

        res.status(201).json(repas);
    } catch (err) {
        console.error(err);
        res.status(500).send("Erreur Server");
    }
});

app.post('/goals', async (req, res) => {
    const obj = req.body;

    if (!Array.isArray(plats) || plats.length === 0) {
        return res.status(400).json({ message: "Le corps de la requête doit contenir un tableau de plats." });
    }

    const dateDuJour = formatDate();
    let objt = await Objectifs.findOne({ jours: dateDuJour });

    // logique de verif si obj existe cela le met à jours sinon en créer  
})

app.listen(PORT, () => {
    console.log(`Serveur démarré sur le port ${PORT}`);
});

mongoose.connect(mongoDB)
    .then(() => console.log('Connexion à MongoDB réussie !'))
    .catch((err) => console.log(err));