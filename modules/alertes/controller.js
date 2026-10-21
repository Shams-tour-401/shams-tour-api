// modules/alertes/controller.js
const { pool } = require('../../config/db');

// GET /api/alertes - Liste toutes les alertes
async function getAllAlertes(req, res) {
  try {
    const alertes = {
      tarifs_anciens: [],
      circuits_a_reviser: [],
      demandes_en_retard: [],
      lignes_a_confirmer: []
    };

    // 1. Tarifs non vérifiés depuis plus de 180 jours
    const [tarifsAnciens] = await pool.query(`
      SELECT t.id, t.prix_vente, t.derniere_verification,
             a.nom AS activite_nom,
             DATEDIFF(NOW(), t.derniere_verification) AS jours_depuis_verif
      FROM tarif t
      LEFT JOIN activite a ON t.activite_id = a.id
      WHERE t.derniere_verification IS NULL
         OR t.derniere_verification < DATE_SUB(NOW(), INTERVAL 180 DAY)
      ORDER BY t.derniere_verification ASC
    `);
    alertes.tarifs_anciens = tarifsAnciens;

    // 2. Circuits "à réviser"
    const [circuitsAReviser] = await pool.query(`
      SELECT c.id, c.nom, c.duree_jours, c.statut
      FROM circuit c
      WHERE c.statut = 'a_reviser'
      ORDER BY c.nom
    `);
    alertes.circuits_a_reviser = circuitsAReviser;

    // 3. Demandes sans action depuis plus d'un jour ouvré
    const [demandesEnRetard] = await pool.query(`
      SELECT d.id, d.reference, d.statut, d.nom_client,
             d.date_creation,
             DATEDIFF(NOW(), d.date_creation) AS jours_depuis_creation
      FROM demande d
      WHERE d.statut IN ('demande_recue', 'a_contacter')
        AND d.date_creation < DATE_SUB(NOW(), INTERVAL 1 DAY)
      ORDER BY d.date_creation ASC
    `);
    alertes.demandes_en_retard = demandesEnRetard;

    // 4. Lignes "à confirmer" dans les propositions
    const [lignesAConfirmer] = await pool.query(`
      SELECT ep.id, ep.libelle, ep.prix,
             p.demande_id, p.numero_version,
             d.reference
      FROM element_proposition ep
      JOIN proposition p ON ep.proposition_id = p.id
      JOIN demande d ON p.demande_id = d.id
      WHERE ep.statut_disponibilite = 'a_verifier'
        AND d.statut IN ('disponibilites_a_verifier', 'proposition_a_valider')
      ORDER BY d.date_creation ASC
    `);
    alertes.lignes_a_confirmer = lignesAConfirmer;

    // Compteurs
    alertes.total = 
      alertes.tarifs_anciens.length +
      alertes.circuits_a_reviser.length +
      alertes.demandes_en_retard.length +
      alertes.lignes_a_confirmer.length;

    res.json(alertes);

  } catch (error) {
    console.error('Erreur getAllAlertes :', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

module.exports = { getAllAlertes };