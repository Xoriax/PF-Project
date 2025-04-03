// controller.js
const fp = require("lodash/fp");// Importation de la bibliothèque lodash/fp
const { Repas, Objectifs } = require('./model');  // Importation des modèles Repas et Objectifs depuis le fichier model.js

// Fonctions utilitaires
// fonction retourne la date actuelle au format 'DD/MM/YYYY'
const formatDate = () => {
    const date = new Date(); // Crée un nouvel objet Date avec la date et l'heure actuelles
    // Retourne la date formatée avec le jour, le mois et l'année au format 'DD/MM/YYYY'
    return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
};

// Cette fonction calcule le total d'un champ nutritionnel (comme les calories, les protéines, etc.) pour un repas donné
const calculerTotal = (repas, champ) => fp.flow(fp.map(champ), fp.sum)(repas.plats);
// - `fp.map(champ)` : Applique la fonction `champ` sur chaque élément du tableau `plats` (ex. `plat.calories` ou `plat.proteines`).
// - `fp.sum` : Calcule la somme des valeurs obtenues par `map`.

// Cette fonction vérifie si les objectifs nutritionnels sont atteints pour un repas donné
const verifierObjectifAtteint = (repas, objectif) => ({
    // Vérifie si les totaux du repas (calories, protéines, glucides, lipides) sont supérieurs ou égaux aux objectifs correspondants
    objectif_calorique_atteint: repas.total_calorique >= objectif.objectif_calorique,
    objectif_proteine_atteint: repas.total_proteines >= objectif.objectif_proteine,
    objectif_glucide_atteint: repas.total_glucides >= objectif.objectif_glucide,
    objectif_lipide_atteint: repas.total_lipides >= objectif.objectif_lipide
});

// Cette fonction ajoute un plat à un repas existant ou le met à jour si le plat est déjà présent
const ajouterOuMettreAJourPlat = async (repas, plat) => {
    // Cherche un plat existant dans le repas par son nom
    const platExistant = repas.plats.find(p => p.nom === plat.nom);

    if (platExistant) {
        // Si le plat existe déjà, on ajoute les valeurs des nutriments du plat existant avec les nouveaux
        ['calories', 'proteines', 'glucides', 'lipides'].forEach(nutriment => {
            platExistant[nutriment] += plat[nutriment];
        });
    } else {
        // Sinon, on ajoute le plat au repas
        repas.plats.push(plat);
    }

    // Mise à jour des totaux nutritionnels du repas
    repas.total_calorique = calculerTotal(repas, 'calories');
    repas.total_proteines = calculerTotal(repas, 'proteines');
    repas.total_glucides = calculerTotal(repas, 'glucides');
    repas.total_lipides = calculerTotal(repas, 'lipides');

    // Sauvegarde du repas mis à jour dans la base de données
    await repas.save();
    return repas; // Retourne le repas mis à jour
};

// Cette fonction crée un nouveau repas avec un plat et enregistre ce repas dans la base de données
const creerRepasAvecPlat = async (plat) => {
    // Crée un nouveau Repas en ajoutant un plat
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

// Exportation des fonctions pour pouvoir les utiliser dans d'autres fichiers
module.exports = {
    formatDate,
    calculerTotal,
    verifierObjectifAtteint,
    ajouterOuMettreAJourPlat,
    creerRepasAvecPlat
};
