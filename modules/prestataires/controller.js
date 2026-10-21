// modules/prestataires/controller.js
const { pool } = require('../../config/db');

// GET /api/prestataires - Liste tous les prestataires
async function getAllPrestataires(req, res) {
  try {
    const [rows] = await pool.query(`
      SELECT p.*,
        (SELECT COUNT(*) FROM dependance d WHERE d.prestataire_lie_id = p.id) AS nb_dependances
      FROM prestataire p
      ORDER BY p.nom
    `);
    res.json(rows);
  } catch (error) {
    console.error('Erreur getAllPrestataires :', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

// GET /api/prestataires/:id - Détail d'un prestataire
async function getPrestataireById(req, res) {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(
      'SELECT * FROM prestataire WHERE id = ?',
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Prestataire non trouvé' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Erreur getPrestataireById :', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

// POST /api/prestataires - Créer un prestataire
async function createPrestataire(req, res) {
  try {
    const { nom, telephones, notes, statut } = req.body;

    if (!nom) {
      return res.status(400).json({ error: 'Le nom est obligatoire' });
    }

    const [result] = await pool.query(`
      INSERT INTO prestataire (nom, telephones, notes, statut)
      VALUES (?, ?, ?, ?)
    `, [
      nom,
      telephones || null,
      notes || null,
      statut || 'actif'
    ]);

    res.status(201).json({
      message: 'Prestataire créé',
      id: result.insertId
    });
  } catch (error) {
    console.error('Erreur createPrestataire :', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

// PUT /api/prestataires/:id - Modifier un prestataire
async function updatePrestataire(req, res) {
  try {
    const { id } = req.params;
    const { nom, telephones, notes, statut } = req.body;

    const [result] = await pool.query(`
      UPDATE prestataire SET
        nom = ?, telephones = ?, notes = ?, statut = ?
      WHERE id = ?
    `, [nom, telephones, notes, statut, id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Prestataire non trouvé' });
    }

    res.json({ message: 'Prestataire mis à jour' });
  } catch (error) {
    console.error('Erreur updatePrestataire :', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

// DELETE /api/prestataires/:id - Désactiver un prestataire
async function desactiverPrestataire(req, res) {
  try {
    const { id } = req.params;

    await pool.query(
      'UPDATE prestataire SET statut = "inactif" WHERE id = ?',
      [id]
    );

    res.json({ message: 'Prestataire désactivé' });
  } catch (error) {
    console.error('Erreur desactiverPrestataire :', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

module.exports = {
  getAllPrestataires,
  getPrestataireById,
  createPrestataire,
  updatePrestataire,
  desactiverPrestataire
};