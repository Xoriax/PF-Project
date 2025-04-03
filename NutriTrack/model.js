// model.js
const mongoose = require('mongoose');

// Chaque plat aura un nom et des informations nutritionnelles (calories, protéines, glucides et lipides)
const platSchema = new mongoose.Schema({
    nom: String,
    calories: Number,
    proteines: Number,
    glucides: Number,
    lipides: Number
});

// Un repas contient plusieurs plats et des informations pour ce repas
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

// Création des modèles Mongoose pour les schémas définis précédemment
const Repas = mongoose.model('repas', repasSchema);
const Objectifs = mongoose.model('objectif', objectifsSchema);

// Exportation des modèles pour pouvoir les utiliser dans d'autres fichiers
module.exports = { Repas, Objectifs };