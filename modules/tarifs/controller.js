// modules/tarifs/controller.js
const { pool } = require('../../config/db');

// GET /api/tarifs - Liste tous les tarifs
async function getAllTarifs(req, res) {
  try {
    const [rows] = await pool.query(`
      SELECT t.*, a.nom AS activite_nom
      FROM tarif t
      LEFT JOIN activite a ON t.activite_id = a.id
      ORDER BY a.nom, t.unite
    `);
    res.json(rows);
  } catch (error) {
    console.error('Erreur getAllTarifs :', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

// GET /api/tarifs/activite/:activiteId - Tarifs d'une activité
async function getTarifsByActivite(req, res) {
  try {
    const { activiteId } = req.params;
    const [rows] = await pool.query(`
      SELECT * FROM tarif
      WHERE activite_id = ?
      ORDER BY unite, tranche_age_min
    `, [activiteId]);
    res.json(rows);
  } catch (error) {
    console.error('Erreur getTarifsByActivite :', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

// POST /api/tarifs - Créer un tarif
async function createTarif(req, res) {
  try {
    const {
      activite_id, prestataire_id, unite,
      tranche_age_min, tranche_age_max,
      prix_vente, cout,
      periode_debut, periode_fin,
      statut
    } = req.body;

    if (!unite || !prix_vente || !periode_debut || !periode_fin) {
      return res.status(400).json({ error: 'Champs obligatoires manquants' });
    }

    // Vérifier les chevauchements de période (RT-02)
    if (activite_id) {
      const [chevauchements] = await pool.query(`
        SELECT id FROM tarif
        WHERE activite_id = ?
          AND unite = ?
          AND (
            (periode_debut <= ? AND periode_fin >= ?)
            OR (periode_debut <= ? AND periode_fin >= ?)
            OR (periode_debut >= ? AND periode_fin <= ?)
          )
      `, [activite_id, unite, periode_debut, periode_debut, periode_fin, periode_fin, periode_debut, periode_fin]);

      if (chevauchements.length > 0) {
        return res.status(400).json({ 
          error: 'Un tarif de même unité existe déjà sur cette période' 
        });
      }
    }

    const [result] = await pool.query(`
      INSERT INTO tarif (
        activite_id, prestataire_id, unite,
        tranche_age_min, tranche_age_max,
        prix_vente, cout,
        periode_debut, periode_fin,
        statut, derniere_verification
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURDATE())
    `, [
      activite_id || null, prestataire_id || null, unite,
      tranche_age_min || null, tranche_age_max || null,
      prix_vente, cout || null,
      periode_debut, periode_fin,
      statut || 'confirme'
    ]);

    res.status(201).json({ 
      message: 'Tarif créé', 
      id: result.insertId 
    });
  } catch (error) {
    console.error('Erreur createTarif :', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

// PUT /api/tarifs/:id - Modifier un tarif
async function updateTarif(req, res) {
  try {
    const { id } = req.params;
    const {
      unite, tranche_age_min, tranche_age_max,
      prix_vente, cout,
      periode_debut, periode_fin,
      statut
    } = req.body;

    const [result] = await pool.query(`
      UPDATE tarif SET
        unite = ?, tranche_age_min = ?, tranche_age_max = ?,
        prix_vente = ?, cout = ?,
        periode_debut = ?, periode_fin = ?,
        statut = ?, derniere_verification = CURDATE()
      WHERE id = ?
    `, [
      unite, tranche_age_min || null, tranche_age_max || null,
      prix_vente, cout || null,
      periode_debut, periode_fin,
      statut || 'confirme', id
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Tarif non trouvé' });
    }

    res.json({ message: 'Tarif mis à jour' });
  } catch (error) {
    console.error('Erreur updateTarif :', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

// DELETE /api/tarifs/:id - Supprimer un tarif
async function deleteTarif(req, res) {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM tarif WHERE id = ?', [id]);
    res.json({ message: 'Tarif supprimé' });
  } catch (error) {
    console.error('Erreur deleteTarif :', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

// PUT /api/tarifs/:id/verifier - Marquer comme vérifié
async function verifierTarif(req, res) {
  try {
    const { id } = req.params;
    await pool.query(
      'UPDATE tarif SET derniere_verification = CURDATE(), statut = "confirme" WHERE id = ?',
      [id]
    );
    res.json({ message: 'Tarif marqué comme vérifié' });
  } catch (error) {
    console.error('Erreur verifierTarif :', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

module.exports = {
  getAllTarifs,
  getTarifsByActivite,
  createTarif,
  updateTarif,
  deleteTarif,
  verifierTarif
};