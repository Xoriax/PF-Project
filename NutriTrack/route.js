// route.js
const { Repas, Objectifs } = require('./model'); // Importation des modèles Repas et Objectifs depuis model.js
// Importation depuis controller.js
const {
    formatDate,
    verifierObjectifAtteint,
    ajouterOuMettreAJourPlat,
    creerRepasAvecPlat
} = require('./controller');

// Fonction qui connecte toutes les routes à l'application Express
const connectRoutes = (app) => {
    // Route GET pour obtenir tous les repas
    app.get('/meals', async (req, res) => {
        try {
            const dateDuJour = formatDate(); // Obtenir la date actuelle
            const repas = await Repas.find(); // Chercher tous les repas dans la base de données
            const objectif = await Objectifs.findOne({ jours: dateDuJour }); // Chercher l'objectif nutritionnel pour la date du jour

            // Ajouter un champ `objectif_atteint` à chaque repas pour indiquer si les objectifs ont été atteints
            const repasAvecObjectif = repas.map(r => ({
                ...r.toObject(), // Convertir chaque repas en objet JavaScript
                objectif_atteint: objectif ? verifierObjectifAtteint(r, objectif) : null // Vérifier si l'objectif est atteint
            }));

            // Retourner la réponse sous forme de JSON
            res.json(repasAvecObjectif);
        } catch (err) {
            console.error(err);
            res.status(500).send('Erreur Serveur');
        }
    });

    // Route GET pour obtenir tous les objectifs
    app.get('/goals', async (req, res) => {
        try {
            const objectif = await Objectifs.find(); // Chercher tous les objectifs dans la base de données
            res.json(objectif); // Retourner les objectifs sous forme de JSON
        } catch (err) {
            console.error(err);
            res.status(500).send('Erreur Serveur');
        }
    });

    // Route POST pour ajouter ou mettre à jour les repas
    app.post('/meals', async (req, res) => {
        try {
            const plats = req.body; // Extraire les plats envoyés dans le corps de la requête

            // Vérifier que le corps de la requête contient un tableau de plats
            if (!Array.isArray(plats) || plats.length === 0) {
                return res.status(400).json({ message: "Le corps de la requête doit contenir un tableau de plats." });
            }

            const dateDuJour = formatDate(); // Obtenir la date actuelle
            let repas = await Repas.findOne({ jours: dateDuJour }); // Chercher le repas pour la date du jour

            // Utiliser la méthode `reduce` pour itérer sur tous les plats et soit mettre à jour un repas existant, soit créer un nouveau repas
            repas = await plats.reduce(async (RepasPromise, plat) => {
                const repasEnCours = await RepasPromise; // Attendre que le précédent repas soit traité
                return repasEnCours ? ajouterOuMettreAJourPlat(repasEnCours, plat) : creerRepasAvecPlat(plat); // Mettre à jour ou créer un nouveau repas
            }, Promise.resolve(repas)); // Initialiser avec un repas existant ou `null`

            res.status(201).json(repas);
        } catch (err) {
            console.error(err);
            res.status(500).send("Erreur Serveur");
        }
    });

    // Route POST pour ajouter ou mettre à jour un objectif
    app.post('/goals', async (req, res) => {
        try {
            const objectifData = req.body; // Extraire les données de l'objectif envoyées dans le corps de la requête

            // Vérifier que le corps de la requête contient un objectif
            if (!objectifData) {
                return res.status(400).json({ message: "Le corps de la requête doit contenir un objectif." });
            }

            const dateDuJour = formatDate(); // Obtenir la date actuelle
            let objectif = await Objectifs.findOne({ jours: dateDuJour }); // Chercher l'objectif pour la date du jour

            // Si un objectif existe déjà pour ce jour, on le met à jour, sinon on en crée un nouveau
            if (objectif) {
                objectif = await Objectifs.findOneAndUpdate({ jours: dateDuJour }, objectifData, { new: true });
            } else {
                // Création d'un nouvel objectif
                objectif = new Objectifs({ ...objectifData, jours: dateDuJour });
                await objectif.save(); // Sauvegarde du nouvel objectif
            }

            res.status(201).json(objectif);
        } catch (err) {
            console.error(err);
            res.status(500).send("Erreur Serveur");
        }
    });
};

// Exporter la fonction `connectRoutes` qui permet de connecter toutes les routes à l'application Express
module.exports = { connectRoutes };
