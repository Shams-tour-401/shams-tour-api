// modules/moteur/prix.js
const { pool } = require('../../config/db');

/**
 * Calcule le prix total d'un séjour
 * @param {Object} params - Paramètres du séjour
 * @param {Array} params.activites - Liste des activités avec tarifs
 * @param {number} params.adultes - Nombre d'adultes
 * @param {number} params.enfants - Nombre d'enfants
 * @param {Array} params.agesEnfants - Âges des enfants
 * @param {Object} params.vehicule - Info véhicule (prix, capacité)
 * @param {number} params.fraisDossier - Frais de dossier
 * @returns {Object} Détail du calcul
 */
function calculerPrix(params) {
  const {
    activites = [],
    adultes = 1,
    enfants = 0,
    agesEnfants = [],
    vehicule = null,
    fraisDossier = 0
  } = params;

  const lignes = [];
  let total = 0;

  // 1. Calcul des activités
  for (const act of activites) {
    let montant = 0;

    if (act.unite === 'par_adulte') {
      montant = adultes * act.prix_vente;
      // Ajouter les enfants s'ils ont un tarif
      if (act.prix_enfant) {
        montant += enfants * act.prix_enfant;
      }
    } else if (act.unite === 'par_groupe') {
      montant = act.prix_vente;
    } else if (act.unite === 'par_vehicule') {
      montant = act.prix_vente; // déjà géré dans véhicule
    }

    lignes.push({
      libelle: act.nom,
      unite: act.unite,
      quantite: act.unite === 'par_adulte' ? adultes + enfants : 1,
      prix_unitaire: act.prix_vente,
      montant: montant
    });

    total += montant;
  }

  // 2. Calcul du véhicule
  if (vehicule) {
    const nbVehicules = Math.ceil((adultes + enfants) / vehicule.capacite);
    const montantVehicule = nbVehicules * vehicule.prix_vente;

    lignes.push({
      libelle: `Véhicule (${nbVehicules} × ${vehicule.capacite} places)`,
      unite: 'par_vehicule',
      quantite: nbVehicules,
      prix_unitaire: vehicule.prix_vente,
      montant: montantVehicule
    });

    total += montantVehicule;
  }

  // 3. Frais de dossier
  if (fraisDossier > 0) {
    lignes.push({
      libelle: 'Frais de dossier',
      unite: 'fixe',
      quantite: 1,
      prix_unitaire: fraisDossier,
      montant: fraisDossier
    });
    total += fraisDossier;
  }

  // 4. Prix par personne indicatif (arrondi à la centaine supérieure)
  const nbVoyageurs = adultes + enfants;
  const prixParPersonne = Math.ceil(total / nbVoyageurs / 100) * 100;

  return {
    lignes,
    total,
    nbVoyageurs,
    prixParPersonne,
    mention: 'Prix estimatif, sous réserve de disponibilité et de confirmation par notre équipe.'
  };
}

/**
 * Récupère les tarifs d'une activité à une date donnée
 */
async function getTarifActivite(activiteId, date) {
  const [rows] = await pool.query(`
    SELECT * FROM tarif
    WHERE activite_id = ?
      AND periode_debut <= ?
      AND periode_fin >= ?
      AND statut = 'confirme'
  `, [activiteId, date, date]);

  return rows;
}

module.exports = { calculerPrix, getTarifActivite };