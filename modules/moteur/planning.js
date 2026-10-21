// modules/moteur/planning.js

/**
 * Valide qu'un planning est réalisable
 * @param {Array} elements - Éléments du jour (activités, trajets, pauses)
 * @param {Object} destination - Fenêtre horaire de la journée
 * @returns {Object} Résultat de validation
 */
function validerPlanning(elements, destination) {
  const erreurs = [];
  const fenetreDebut = destination.fenetre_debut || '08:00:00';
  const fenetreFin = destination.fenetre_fin || '19:00:00';

  let heureCourante = timeToMinutes(fenetreDebut);
  const heureFinMax = timeToMinutes(fenetreFin);

  for (const element of elements) {
    // Ajouter le temps de trajet si nécessaire
    if (element.type === 'trajet' && element.duree_min) {
      heureCourante += element.duree_min;
    }

    // Ajouter la marge de 10 minutes (RP-03)
    heureCourante += 10;

    // Ajouter la durée de l'activité
    if (element.type === 'activite' && element.duree_min) {
      heureCourante += element.duree_min;
    }

    // Vérifier la fenêtre de journée (RP-01)
    if (heureCourante > heureFinMax) {
      erreurs.push({
        element: element.libelle || element.type,
        message: `Dépassement de la fenêtre de journée (${fenetreFin})`
      });
    }
  }

  return {
    valide: erreurs.length === 0,
    erreurs,
    heureDebut: minutesToTime(timeToMinutes(fenetreDebut)),
    heureFin: minutesToTime(heureCourante)
  };
}

// Utilitaires
function timeToMinutes(time) {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function minutesToTime(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

module.exports = { validerPlanning, timeToMinutes, minutesToTime };