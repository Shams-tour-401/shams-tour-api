// modules/destinations/controller.js
const { pool } = require('../../config/db');

async function getAllDestinations(req, res) {
  try {
    const [rows] = await pool.query(`
      SELECT d.*,
        (SELECT COUNT(*) FROM circuit c WHERE c.statut = 'publie') AS nb_circuits,
        (SELECT COUNT(*) FROM activite a 
         JOIN lieu l ON a.lieu_id = l.id 
         WHERE l.destination_id = d.id AND a.statut_actif = 1) AS nb_activites
      FROM destination d
      ORDER BY d.nom
    `);
    res.json(rows);
  } catch (error) {
    console.error('Erreur getAllDestinations :', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

async function getDestinationById(req, res) {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(
      'SELECT * FROM destination WHERE id = ?',
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Destination non trouvée' });
    }

    const [activites] = await pool.query(`
      SELECT a.id, a.nom, a.duree_min, a.categorie
      FROM activite a
      JOIN lieu l ON a.lieu_id = l.id
      WHERE l.destination_id = ? AND a.statut_actif = 1
      ORDER BY a.nom
    `, [id]);

    res.json({ ...rows[0], activites });
  } catch (error) {
    console.error('Erreur getDestinationById :', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

async function createDestination(req, res) {
  try {
    const { nom, statut_actif, fenetre_debut, fenetre_fin, texte_accueil } = req.body;

    if (!nom) {
      return res.status(400).json({ error: 'Le nom est obligatoire' });
    }

    const [result] = await pool.query(`
      INSERT INTO destination (nom, statut_actif, fenetre_debut, fenetre_fin, texte_accueil)
      VALUES (?, ?, ?, ?, ?)
    `, [
      nom,
      statut_actif !== undefined ? statut_actif : 1,
      fenetre_debut || '08:00:00',
      fenetre_fin || '19:00:00',
      texte_accueil || null
    ]);

    res.status(201).json({ message: 'Destination créée', id: result.insertId });
  } catch (error) {
    console.error('Erreur createDestination :', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

async function updateDestination(req, res) {
  try {
    const { id } = req.params;
    const { nom, statut_actif, fenetre_debut, fenetre_fin, texte_accueil } = req.body;

    const [result] = await pool.query(`
      UPDATE destination SET
        nom = ?, statut_actif = ?, fenetre_debut = ?, fenetre_fin = ?, texte_accueil = ?
      WHERE id = ?
    `, [nom, statut_actif, fenetre_debut, fenetre_fin, texte_accueil, id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Destination non trouvée' });
    }

    res.json({ message: 'Destination mise à jour' });
  } catch (error) {
    console.error('Erreur updateDestination :', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

module.exports = {
  getAllDestinations,
  getDestinationById,
  createDestination,
  updateDestination
};