// modules/trajets/controller.js
const { pool } = require('../../config/db');

async function getAllTrajets(req, res) {
  try {
    const [rows] = await pool.query(`
      SELECT t.*,
             ld.nom AS lieu_depart_nom,
             la.nom AS lieu_arrivee_nom
      FROM trajet t
      JOIN lieu ld ON t.lieu_depart_id = ld.id
      JOIN lieu la ON t.lieu_arrivee_id = la.id
      ORDER BY ld.nom, la.nom
    `);
    res.json(rows);
  } catch (error) {
    console.error('Erreur getAllTrajets :', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

async function createTrajet(req, res) {
  try {
    const { lieu_depart_id, lieu_arrivee_id, duree_min, type_vehicule } = req.body;

    if (!lieu_depart_id || !lieu_arrivee_id || !duree_min) {
      return res.status(400).json({ error: 'Champs obligatoires manquants' });
    }

    if (lieu_depart_id === lieu_arrivee_id) {
      return res.status(400).json({ error: 'Les lieux doivent être différents' });
    }

    const [result] = await pool.query(`
      INSERT INTO trajet (lieu_depart_id, lieu_arrivee_id, duree_min, type_vehicule)
      VALUES (?, ?, ?, ?)
    `, [lieu_depart_id, lieu_arrivee_id, duree_min, type_vehicule || null]);

    res.status(201).json({ message: 'Trajet créé', id: result.insertId });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Ce trajet existe déjà' });
    }
    console.error('Erreur createTrajet :', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

async function updateTrajet(req, res) {
  try {
    const { id } = req.params;
    const { duree_min, type_vehicule } = req.body;

    const [result] = await pool.query(`
      UPDATE trajet SET duree_min = ?, type_vehicule = ?
      WHERE id = ?
    `, [duree_min, type_vehicule || null, id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Trajet non trouvé' });
    }

    res.json({ message: 'Trajet mis à jour' });
  } catch (error) {
    console.error('Erreur updateTrajet :', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

async function deleteTrajet(req, res) {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM trajet WHERE id = ?', [id]);
    res.json({ message: 'Trajet supprimé' });
  } catch (error) {
    console.error('Erreur deleteTrajet :', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

module.exports = { getAllTrajets, createTrajet, updateTrajet, deleteTrajet };