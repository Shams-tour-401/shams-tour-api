// modules/moteur/selecteur.js
const { pool } = require('../../config/db');
const { calculerPrix } = require('./prix');

async function selectionnerCircuits(criteres) {
  const {
    nombre_jours,
    adultes = 2,
    enfants = 0,
    ages_enfants = [],
    envies = [],
    rythme,
    profil,
    budget,
    budget_type
  } = criteres;

  const [tousLesCircuits] = await pool.query(`SELECT * FROM circuit WHERE statut = 'publie'`);
  const resultats = [];
  const rejets = [];

  for (const circuit of tousLesCircuits) {
    // --- FILTRE 1 : Durée (Obligatoire) ---
    if (nombre_jours && circuit.duree_jours !== nombre_jours) {
      continue; // Pas de message de rejet pour ne pas polluer
    }

    // --- FILTRE 2 : Âge des enfants (Si enfants renseignés) ---
    if (ages_enfants && ages_enfants.length > 0) {
      const [elements] = await pool.query(`
        SELECT a.age_min 
        FROM element_jour ej
        JOIN jour_circuit jc ON ej.jour_circuit_id = jc.id
        JOIN activite a ON ej.activite_id = a.id
        WHERE jc.circuit_id = ?
      `, [circuit.id]);

      let compatibleAge = true;
      for (const el of elements) {
        if (el.age_min && ages_enfants.some(age => age < el.age_min)) {
          compatibleAge = false;
          break;
        }
      }
      if (!compatibleAge) continue;
    }

    // --- CALCUL DU PRIX ESTIMÉ ---
    const [elementsPrix] = await pool.query(`
      SELECT a.nom AS activite_nom, t.prix_vente, t.unite
      FROM element_jour ej
      JOIN jour_circuit jc ON ej.jour_circuit_id = jc.id
      LEFT JOIN activite a ON ej.activite_id = a.id
      LEFT JOIN tarif t ON a.id = t.activite_id AND t.statut = 'confirme' AND t.unite = 'par_adulte'
      WHERE jc.circuit_id = ? AND ej.type = 'activite'
    `, [circuit.id]);

    const activitesPourPrix = elementsPrix
      .filter(e => e.prix_vente)
      .map(e => ({
        nom: e.activite_nom,
        unite: e.unite,
        prix_vente: e.prix_vente,
        prix_enfant: Math.round(e.prix_vente / 2)
      }));

    const calcul = calculerPrix({
      activites: activitesPourPrix,
      adultes: adultes,
      enfants: enfants,
      agesEnfants: ages_enfants,
      vehicule: { prix_vente: 200000, capacite: 4 },
      fraisDossier: 20000
    });

    const prixEstime = calcul.total;

    // --- FILTRE 3 : BUDGET (Si budget renseigné) ---
    if (criteres.budget_min !== null && criteres.budget_max !== null) {
      if (prixEstime < criteres.budget_min || prixEstime > criteres.budget_max) {
        continue; // On élimine le circuit s'il est hors de la tranche
      }
    }

    // --- SCORING (Uniquement sur les critères choisis) ---
    let score = 0;
    const etiquettes = (circuit.etiquettes || '').split(',');
    const profils = (circuit.profils_adaptes || '').split(',');

    // On ne score que si l'utilisateur a choisi des envies
    if (envies && envies.length > 0) {
      for (const envie of envies) {
        if (etiquettes.includes(envie)) score += 3;
      }
    }

    // On ne score que si l'utilisateur a choisi un rythme
    if (rythme && circuit.rythme === rythme) {
      score += 2;
    }

    // On ne score que si l'utilisateur a choisi un profil
    if (profil && profils.includes(profil)) {
      score += 1;
    }

    resultats.push({ 
      circuit, 
      score, 
      prix_estime: prixEstime,
      // 👇 ON GARDE EN MÉMOIRE LES CRITÈRES QUI ONT MATCHÉ
      criteres_matches: {
        envies: envies.filter(e => etiquettes.includes(e)),
        rythme: (rythme && circuit.rythme === rythme) ? rythme : null,
        profil: (profil && profils.includes(profil)) ? profil : null
      }
    });
  }

  // Trier par score
  resultats.sort((a, b) => b.score - a.score);
  
  return {
    circuits: resultats.slice(0, 5), // On affiche jusqu'à 5 circuits
    rejets: rejets
  };
}

module.exports = { selectionnerCircuits };