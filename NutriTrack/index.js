/*
📦 Fonctionnalités backend (Node.js / Express + JSON DB ou MongoDB) :

- Authentification simple (token ou localstorage)
- Gestion des repas (`POST /meals`, `GET /meals`)
- Objectifs nutritionnels (`POST /goals`, `GET /goals`)
- Calcul automatique des totaux journaliers (avec `reduce`)
- Génération de recommandations (filtrage + composition fonctionnelle)
- API REST bien organisée (routes RESTful, séparation des responsabilités)

- DB 
- plats : IDplat, nom, calories, proteines, glucides, lipides
- repas : IDrepas, IDplat, caloriestotal
- objectif : calorie, proteines, glucides, lipides
*/

const express = require("express");
const mongoose = require("mongoose");
const dotenv = require('dotenv');
dotenv.config();

const Schema = mongoose.Schema;

const app = express();
const port = process.env.PORT;
const mongoDB = process.env.MONGODB_URI;

const PlatSchema = new Schema({
    nom: String,
    calories: Number,
    proteines: Number,
    glucides: Number,
    lipides: Number,
});

const RepaSchema = new Schema({
    plats: [PlatSchema],
    caloriestotal: {
        type: Number,
        default: function () {
            return this.plats.reduce((total, plat) => total + plat.calories, 0);
        }
    }
});

const Meals = mongoose.model("repas", RepaSchema);

// GET : recupere tout les repas
app.get("/meals", async (req, res) => {
    try {
        const meals = await Meals.find();
        res.status(200).json(meals);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


// post : ajoute des plats dans une table et calcule le total de calories automatiquement
app.post("/meals", async (req, res) => {
    const { plats } = req.body;
    const newMeal = new Meals({ plats });
    try {
        await newMeal.save();
        res.status(201).json(newMeal);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.listen(port, () => {
    console.log(`Connecter sur PORT : ${port}`);
});

mongoose.connect(mongoDB)
    .then(() => console.log('MongoDB est connecte'))
    .catch((err) => console.log(err));