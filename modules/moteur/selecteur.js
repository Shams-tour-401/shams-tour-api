// modules/moteur/selecteur.js
const { pool } = require('../../config/db');

async function selectionnerCircuits(criteres) {
  const {
    destination_id = 1,
    nombre_jours,
    adultes = 2,
    enfants = 0,
    ages_enfants = [],
    envies = [],
    rythme,
    profil
  } = criteres;

  // 1. Récupérer TOUS les circuits publiés pour voir ce qui se passe
  let query = `SELECT * FROM circuit WHERE statut = 'publie'`;
  const params = [];
  
  // Si une durée est demandée, on ne filtre pas tout de suite en SQL pour pouvoir expliquer
  const [tousLesCircuits] = await pool.query(query, params);
  const resultats = [];
  const rejets = [];

  for (const circuit of tousLesCircuits) {
    // --- FILTRE 1 : Durée ---
    if (nombre_jours && circuit.duree_jours !== nombre_jours) {
      rejets.push(`Circuit "${circuit.nom}" éliminé : durée ${circuit.duree_jours}j au lieu de ${nombre_jours}j`);
      continue;
    }

    // --- FILTRE 2 : Âge des enfants ---
    let compatibleAge = true;
    let raisonAge = '';

    if (ages_enfants && ages_enfants.length > 0) {
      const [elements] = await pool.query(`
        SELECT a.nom AS activite_nom, a.age_min 
        FROM element_jour ej
        JOIN jour_circuit jc ON ej.jour_circuit_id = jc.id
        JOIN activite a ON ej.activite_id = a.id
        WHERE jc.circuit_id = ?
      `, [circuit.id]);

      for (const el of elements) {
        if (el.age_min) {
          const ageEnfantTropJeune = ages_enfants.find(age => age < el.age_min);
          if (ageEnfantTropJeune !== undefined) {
            compatibleAge = false;
            raisonAge = `Circuit "${circuit.nom}" éliminé : l'activité "${el.activite_nom}" exige ${el.age_min} ans (enfant de ${ageEnfantTropJeune} ans)`;
            break;
          }
        }
      }
    }

    if (!compatibleAge) {
      rejets.push(raisonAge);
      continue;
    }

    // --- SCORING ---
    let score = 0;
    const etiquettes = (circuit.etiquettes || '').split(',');
    const profils = (circuit.profils_adaptes || '').split(',');

    for (const envie of envies) {
      if (etiquettes.includes(envie)) score += 3;
    }
    
    if (circuit.rythme === rythme) score += 2;
    
    if (profils.includes(profil)) score += 1;

    resultats.push({ circuit, score });
  }

  // Trier par score
  resultats.sort((a, b) => b.score - a.score);
  
  // Retourner le top 3 et les raisons des rejets
  return {
    circuits: resultats.slice(0, 3),
    rejets: rejets
  };
}

module.exports = { selectionnerCircuits };