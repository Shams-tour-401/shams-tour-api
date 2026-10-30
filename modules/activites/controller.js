// modules/activites/controller.js
const { pool } = require('../../config/db');

// GET /api/activites - Liste toutes les activités
async function getAllActivites(req, res) {
  try {
    // 1. Récupérer toutes les activités
    const [activites] = await pool.query(`
      SELECT a.*, l.nom AS lieu_nom
      FROM activite a
      JOIN lieu l ON a.lieu_id = l.id
      WHERE a.statut_actif = 1
      ORDER BY a.nom
    `);

    // 2. Pour chaque activité, récupérer toutes ses photos
    for (const act of activites) {
      const [photos] = await pool.query(
        'SELECT fichier FROM photo WHERE activite_id = ?', 
        [act.id]
      );
      
      // 👇 MODIFICATION ICI : On utilise directement l'URL Cloudinary stockée en base
      act.photos_urls = photos.map(p => p.fichier);
    }

    res.json(activites);
  } catch (error) {
    console.error('Erreur getAllActivites :', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

// GET /api/activites/:id - Détail d'une activité
async function getActiviteById(req, res) {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(`
      SELECT a.*, l.nom AS lieu_nom
      FROM activite a
      JOIN lieu l ON a.lieu_id = l.id
      WHERE a.id = ?
    `, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Activité non trouvée' });
    }

    const [tarifs] = await pool.query(
      'SELECT * FROM tarif WHERE activite_id = ?',
      [id]
    );

    res.json({ ...rows[0], tarifs });
  } catch (error) {
    console.error('Erreur getActiviteById :', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

// POST /api/activites - Créer une activité
async function createActivite(req, res) {
  try {
    const {
      nom, description, categorie, lieu_id, duree_min,
      creneaux, plage_debut, plage_fin,
      age_min, age_max, effectif_min, effectif_max,
      dependance_meteo, inclus, non_inclus
    } = req.body;

    if (!nom || !lieu_id || !duree_min) {
      return res.status(400).json({ error: 'Champs obligatoires manquants' });
    }

    const [result] = await pool.query(`
      INSERT INTO activite (
        nom, description, categorie, lieu_id, duree_min,
        creneaux, plage_debut, plage_fin,
        age_min, age_max, effectif_min, effectif_max,
        dependance_meteo, inclus, non_inclus, statut_actif
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `, [
      nom, description, categorie, lieu_id, duree_min,
      creneaux, plage_debut, plage_fin,
      age_min || 0, age_max || null, effectif_min || 1, effectif_max || 12,
      dependance_meteo || 0, inclus, non_inclus
    ]);

    res.status(201).json({ 
      message: 'Activité créée', 
      id: result.insertId 
    });
  } catch (error) {
    console.error('Erreur createActivite :', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

// PUT /api/activites/:id - Modifier une activité
async function updateActivite(req, res) {
  try {
    const { id } = req.params;
    const {
      nom, description, categorie, lieu_id, duree_min,
      creneaux, plage_debut, plage_fin,
      age_min, age_max, effectif_min, effectif_max,
      dependance_meteo, inclus, non_inclus
    } = req.body;

    const [result] = await pool.query(`
      UPDATE activite SET
        nom = ?, description = ?, categorie = ?, lieu_id = ?, duree_min = ?,
        creneaux = ?, plage_debut = ?, plage_fin = ?,
        age_min = ?, age_max = ?, effectif_min = ?, effectif_max = ?,
        dependance_meteo = ?, inclus = ?, non_inclus = ?
      WHERE id = ?
    `, [
      nom, description, categorie, lieu_id, duree_min,
      creneaux, plage_debut, plage_fin,
      age_min || 0, age_max || null, effectif_min || 1, effectif_max || 12,
      dependance_meteo || 0, inclus, non_inclus, id
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Activité non trouvée' });
    }

    res.json({ message: 'Activité mise à jour' });
  } catch (error) {
    console.error('Erreur updateActivite :', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

// DELETE /api/activites/:id - Désactiver une activité
async function desactiverActivite(req, res) {
  try {
    const { id } = req.params;

    await pool.query(
      'UPDATE activite SET statut_actif = 0 WHERE id = ?',
      [id]
    );

    await pool.query(`
      UPDATE circuit c
      SET c.statut = 'a_reviser'
      WHERE c.id IN (
        SELECT DISTINCT jc.circuit_id
        FROM jour_circuit jc
        JOIN element_jour ej ON ej.jour_circuit_id = jc.id
        WHERE ej.activite_id = ?
      )
    `, [id]);

    res.json({ message: 'Activité désactivée' });
  } catch (error) {
    console.error('Erreur desactiverActivite :', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

module.exports = { 
  getAllActivites, 
  getActiviteById,
  createActivite,
  updateActivite,
  desactiverActivite
};