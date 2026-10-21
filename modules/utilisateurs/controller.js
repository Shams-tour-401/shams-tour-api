// modules/utilisateurs/controller.js
const { pool } = require('../../config/db');
const bcrypt = require('bcryptjs');

// GET /api/utilisateurs
async function getAllUtilisateurs(req, res) {
  try {
    const [rows] = await pool.query(`
      SELECT id, identifiant, nom_complet, role, statut, derniere_connexion, date_creation
      FROM utilisateur
      ORDER BY role, nom_complet
    `);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

// POST /api/utilisateurs
async function createUtilisateur(req, res) {
  try {
    const { identifiant, mot_de_passe, nom_complet, role } = req.body;

    if (!identifiant || !mot_de_passe || !nom_complet || !role) {
      return res.status(400).json({ error: 'Champs obligatoires manquants' });
    }

    const hash = await bcrypt.hash(mot_de_passe, 10);

    const [result] = await pool.query(`
      INSERT INTO utilisateur (identifiant, mot_de_passe_hash, nom_complet, role, statut)
      VALUES (?, ?, ?, ?, 'actif')
    `, [identifiant, hash, nom_complet, role]);

    res.status(201).json({ message: 'Utilisateur créé', id: result.insertId });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Cet identifiant existe déjà' });
    }
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

// PUT /api/utilisateurs/:id/statut
async function changerStatutUtilisateur(req, res) {
  try {
    const { id } = req.params;
    const { statut } = req.body;

    await pool.query('UPDATE utilisateur SET statut = ? WHERE id = ?', [statut, id]);
    res.json({ message: 'Statut mis à jour' });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

module.exports = { getAllUtilisateurs, createUtilisateur, changerStatutUtilisateur };