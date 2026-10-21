// modules/lieux/controller.js
const { pool } = require('../../config/db');

async function getAllLieux(req, res) {
  try {
    const [rows] = await pool.query(`
      SELECT l.*, d.nom AS destination_nom,
        (SELECT COUNT(*) FROM activite a WHERE a.lieu_id = l.id AND a.statut_actif = 1) AS nb_activites
      FROM lieu l
      JOIN destination d ON l.destination_id = d.id
      ORDER BY d.nom, l.nom
    `);
    res.json(rows);
  } catch (error) {
    console.error('Erreur getAllLieux :', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

async function getLieuById(req, res) {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(`
      SELECT l.*, d.nom AS destination_nom
      FROM lieu l
      JOIN destination d ON l.destination_id = d.id
      WHERE l.id = ?
    `, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Lieu non trouvé' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Erreur getLieuById :', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

async function createLieu(req, res) {
  try {
    const { nom, destination_id, type, adresse } = req.body;

    if (!nom || !destination_id) {
      return res.status(400).json({ error: 'Nom et destination obligatoires' });
    }

    const [result] = await pool.query(`
      INSERT INTO lieu (nom, destination_id, type, adresse)
      VALUES (?, ?, ?, ?)
    `, [nom, destination_id, type || 'site', adresse || null]);

    res.status(201).json({ message: 'Lieu créé', id: result.insertId });
  } catch (error) {
    console.error('Erreur createLieu :', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

async function updateLieu(req, res) {
  try {
    const { id } = req.params;
    const { nom, destination_id, type, adresse } = req.body;

    const [result] = await pool.query(`
      UPDATE lieu SET nom = ?, destination_id = ?, type = ?, adresse = ?
      WHERE id = ?
    `, [nom, destination_id, type, adresse, id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Lieu non trouvé' });
    }

    res.json({ message: 'Lieu mis à jour' });
  } catch (error) {
    console.error('Erreur updateLieu :', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

module.exports = { getAllLieux, getLieuById, createLieu, updateLieu };